/**
 * 🔔 通知GraphQLリゾルバー
 *
 * 既存tRPC通知ロジックをGraphQLに移植
 */

import { randomUUID } from 'node:crypto';

import { GraphQLError } from 'graphql';
import { PAGINATION_CONSTANTS, envUtils } from '@libark/core-shared';

import { GraphQLContext, requireAuthentication } from '../graphql/context.js';

export interface NotificationsArgs {
  first?: number;
  after?: string;
  isRead?: boolean;
  type?:
    | 'LIKE'
    | 'COMMENT'
    | 'FOLLOW'
    | 'POST_COMPLETED'
    | 'AVATAR_COMPLETED'
    | 'MEDIA_COMPLETED'
    | 'SYSTEM';
}

export const notificationResolvers = {
  Query: {
    /**
     * 通知一覧取得
     */
    notifications: async (_: unknown, args: NotificationsArgs, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { first = PAGINATION_CONSTANTS.NOTIFICATION_PAGE_SIZE, after, isRead, type } = args;

      const where: Record<string, unknown> = {
        userId: context.user.id,
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      // カーソルベースページネーション
      if (after) {
        where.id = { lt: after };
      }

      const notifications = await context.prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: first,
      });

      return notifications;
    },

    /**
     * 未読通知数取得
     */
    unreadNotificationsCount: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        return 0;
      }

      const count = await context.prisma.notification.count({
        where: {
          userId: context.user.id,
          isRead: false,
        },
      });

      return count;
    },
  },

  Mutation: {
    /**
     * 通知を既読にマーク
     */
    markNotificationAsRead: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // 通知の存在確認と所有者チェック
      const notification = await context.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new GraphQLError('通知が見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (notification.userId !== context.user.id) {
        throw new GraphQLError('この通知を更新する権限がありません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // 既読にマーク
      const updatedNotification = await context.prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      // 通知カウント更新を送信
      if (context.redisPubSub) {
        const unreadCount = await context.prisma.notification.count({
          where: {
            userId: context.user.id,
            isRead: false,
          },
        });

        const countChannel = `notification_count:${context.user.id}`;
        await context.redisPubSub.publish(countChannel, {
          type: 'notification_count_updated',
          userId: context.user.id,
          unreadCount,
          timestamp: new Date().toISOString(),
        });
        context.fastify.log.info(
          `📡 [GraphQL] 通知カウント更新配信: ${countChannel} -> ${unreadCount}`
        );
      }

      return updatedNotification;
    },

    /**
     * 複数の通知を既読にマーク
     */
    markNotificationsAsRead: async (
      _parent: unknown,
      { ids }: { ids: string[] },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // 通知の存在確認と所有者チェック
      const notifications = await context.prisma.notification.findMany({
        where: {
          id: { in: ids },
          userId: context.user.id,
        },
      });

      if (notifications.length !== ids.length) {
        throw new GraphQLError('一部の通知が見つからないか、権限がありません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // 既読にマーク
      // UpdateMany回避策
      await Promise.all(
        ids.map(id =>
          context.prisma.notification.update({
            where: { id },
             data: {
              isRead: true,
              readAt: new Date(),
            },
          })
        )
      );

      const updatedNotifications = { count: ids.length };

      // 更新された通知を取得
      const result = await context.prisma.notification.findMany({
        where: {
          id: { in: ids },
        },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      // 通知カウント更新を送信
      if (context.redisPubSub && updatedNotifications.count > 0) {
        const unreadCount = await context.prisma.notification.count({
          where: {
            userId: context.user.id,
            isRead: false,
          },
        });

        const countChannel = `notification_count:${context.user.id}`;
        await context.redisPubSub.publish(countChannel, {
          type: 'notification_count_updated',
          userId: context.user.id,
          unreadCount,
          timestamp: new Date().toISOString(),
        });
        context.fastify.log.info(
          `📡 [GraphQL] 通知カウント更新配信: ${countChannel} -> ${unreadCount}`
        );
      }

      return result;
    },

    /**
     * 全ての通知を既読にマーク
     */
    markAllNotificationsAsRead: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // updateManyが機能しない環境のための回避策
      const unreadNotifications = await context.prisma.notification.findMany({
        where: {
          userId: context.user.id,
          isRead: false,
        },
        select: { id: true }
      });

      if (unreadNotifications.length === 0) {
        return 0; // 更新不要
      }

      // トランザクションの代わりにPromise.allを使用（テスト環境の互換性のため）
      await Promise.all(
        unreadNotifications.map((n: { id: string }) =>
          context.prisma.notification.update({
            where: { id: n.id },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          })
        )
      );

      const result = { count: unreadNotifications.length };

      // 通知カウント更新を送信（全て既読にした場合は0になる）
      if (context.redisPubSub && result.count > 0) {
        const countChannel = `notification_count:${context.user.id}`;
        await context.redisPubSub.publish(countChannel, {
          type: 'notification_count_updated',
          userId: context.user.id,
          unreadCount: 0, // 全て既読にしたので0
          timestamp: new Date().toISOString(),
        });
        context.fastify.log.info(
          `📡 [GraphQL] 全既読後の通知カウント更新配信: ${countChannel} -> 0`
        );
      }

      return result.count;
    },

    /**
     * テスト用通知作成（開発環境のみ）
     */
    createTestNotification: async (
      _parent: unknown,
      { userId, message }: { userId: string; message: string },
      context: GraphQLContext
    ) => {
      if (!envUtils.isDevelopment()) {
        throw new GraphQLError('この機能は開発環境でのみ利用可能です');
      }

      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // 通知を作成（テスト用はAVATAR_PROCESSING_COMPLETEDに変更）
      const notification = await context.prisma.notification.create({
        data: {
          userId,
          type: 'AVATAR_PROCESSING_COMPLETED',
          content: message || 'GraphQLサブスクリプションのテスト通知です',
          isRead: false,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      // Redis PubSubで通知を配信
      if (context.redisPubSub) {
        const channel = `notification:${userId}`;
        await context.redisPubSub.publish(channel, {
          type: 'notification_added',
          userId,
          notification,
          timestamp: new Date().toISOString(),
        });
        context.fastify.log.info(`📡 [GraphQL] テスト通知配信: ${channel}`);
      }

      return notification;
    },
  },

  Notification: {
    /**
     * 通知のユーザー
     */
    user: async (parent: { userId: string }, _args: unknown, context: GraphQLContext) => {
      return await context.prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },

    /**
     * 通知のアクター（通知を発生させたユーザー）
     */
    actor: async (parent: { actorId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.actorId) {
        return null;
      }

      return await context.prisma.user.findUnique({
        where: { id: parent.actorId },
      });
    },
  },

  Subscription: {
    /**
     * 通知追加サブスクリプション
     */
    notificationAdded: {
      subscribe: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
        // 認証チェック（ユーザーID一致確認込み）
        const user = await requireAuthentication(context, args.userId);

        if (!context.redisPubSub) {
          throw new GraphQLError('PubSub not available');
        }

        // Redis PubSubでユーザー固有の通知チャンネルを購読
        const channel = `notification:${args.userId}`;

        context.fastify.log.info({
          userId: args.userId,
          authenticatedUserId: user.id,
          channel,
        }, '📡 [GraphQL] 通知サブスクリプション開始:');

        // デバッグ用：購読開始をログ出力
        const iterator = context.redisPubSub!.asyncIterator([channel]);
        context.fastify.log.info(`✅ [GraphQL] AsyncIterator作成完了: ${channel}`);

        return iterator;
      },
      resolve: (payload: unknown, _args: unknown, context: GraphQLContext) => {
        context.fastify.log.info({
          hasPayload: !!payload,
          payloadType: typeof payload,
          payloadKeys: payload ? Object.keys(payload as object) : [],
          fullPayload: payload,
        }, '📨 [GraphQL] 通知サブスクリプション受信:');

        // 通知追加タイプのメッセージのみ処理
        const payloadObj = payload as {
          type?: string;
          notification?: unknown;
          id?: string;
          content?: unknown;
          userId?: string;
        };
        if (payloadObj && payloadObj.type === 'notification_added' && payloadObj.notification) {
          return payloadObj.notification;
        }

        // 直接通知オブジェクトが送信された場合（id、type、contentが必須）
        if (
          payloadObj &&
          payloadObj.id &&
          payloadObj.type &&
          payloadObj.content &&
          payloadObj.userId
        ) {
          return payloadObj;
        }

        // post_completed通知は削除済み
        // 理由: Postは即座に処理されるため、処理完了通知は不要

        // アバター完了通知の場合は、通知オブジェクトを生成
        if (payloadObj && payloadObj.type === 'avatar_completed') {
          const avatarPayload = payloadObj as {
            mediaId?: string;
            userId?: string;
            timestamp?: string;
          };
          context.fastify.log.info({
            mediaId: avatarPayload.mediaId,
            userId: avatarPayload.userId,
            timestamp: avatarPayload.timestamp,
            fullPayload: payloadObj,
          }, '🖼️ [GraphQL] アバター完了通知を処理:');

          const notification = {
            id: randomUUID(), // 有効なUUIDを生成
            type: 'AVATAR_PROCESSING_COMPLETED',
            content: 'プロフィール画像が更新されました',
            isRead: false,
            createdAt: avatarPayload.timestamp || new Date().toISOString(),
            userId: avatarPayload.userId,
            referenceId: avatarPayload.mediaId,
            user: null, // リゾルバーで解決
            actor: null,
          };

          context.fastify.log.info({ notification }, '✅ [GraphQL] アバター完了通知生成完了:');
          return notification;
        }

        // コメント完了通知の場合は、通知オブジェクトを生成
        if (payloadObj && payloadObj.type === 'comment_completed') {
          const commentPayload = payloadObj as {
            commentId?: string;
            timestamp?: string;
            userId?: string;
          };
          context.fastify.log.info(
            `💬 [GraphQL] コメント完了通知を処理: ${commentPayload.commentId}`
          );
          return {
            id: randomUUID(), // 有効なUUIDを生成
            type: 'COMMENT_PROCESSING_COMPLETED',
            content: 'コメントの処理が完了しました',
            isRead: false,
            createdAt: commentPayload.timestamp || new Date().toISOString(),
            userId: commentPayload.userId,
            referenceId: commentPayload.commentId,
            user: null, // リゾルバーで解決
            actor: null,
          };
        }

        // 無効なデータの場合はnullを返す（スキーマがnullableなので安全）
        context.fastify.log.warn({ payload }, '⚠️ [GraphQL] 無効な通知データ（null返却）:');
        return null;
      },
    },

    /**
     * 通知カウント更新サブスクリプション
     */
    notificationCountUpdated: {
      subscribe: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
        // 認証チェック（ユーザーID一致確認込み）
        const user = await requireAuthentication(context, args.userId);

        if (!context.redisPubSub) {
          throw new GraphQLError('PubSub not available');
        }

        // Redis PubSubでユーザー固有の通知カウントチャンネルを購読
        const channel = `notification_count:${args.userId}`;

        context.fastify.log.info({
          userId: args.userId,
          authenticatedUserId: user.id,
          channel,
        }, '📡 [GraphQL] 通知カウントサブスクリプション開始:');
        return context.redisPubSub!.asyncIterator([channel]);
      },
      resolve: (payload: unknown, _args: unknown, context: GraphQLContext) => {
        context.fastify.log.info({ payload }, '📊 [GraphQL] 通知カウントサブスクリプション受信:');

        // Redis PubSubから受信したカウントデータを返す
        if (typeof payload === 'number') {
          return payload;
        }

        const countPayload = payload as { count?: number };
        if (countPayload && typeof countPayload.count === 'number') {
          return countPayload.count;
        }

        context.fastify.log.warn({ payload }, '⚠️ [GraphQL] 無効な通知カウントデータ:');
        return 0;
      },
    },
  },
};
