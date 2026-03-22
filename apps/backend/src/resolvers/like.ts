/**
 * ❤️ いいねGraphQLリゾルバー
 *
 * 既存tRPCいいねロジックをGraphQLに移植
 */

import { GraphQLError } from 'graphql';
import { counterManager } from '@libark/redis-client';

import { GraphQLContext } from '../graphql/context.js';

/**
 * サイト機能の有効性をチェック
 */
async function checkSiteFeatureEnabled(
  context: GraphQLContext,
  featureName: string
): Promise<boolean> {
  try {
    const siteFeature = await context.prisma.siteFeatureSetting.findUnique({
      where: { featureName },
    });

    // 設定が存在しない場合はデフォルトで有効
    return siteFeature?.isEnabled ?? true;
  } catch (error) {
    context.fastify.log.error({ err: error }, 'サイト機能チェックエラー:');
    return true; // エラー時はデフォルトで有効
  }
}

export const likeResolvers = {
  Mutation: {
    /**
     * いいねトグル
     */
    toggleLike: async (
      _parent: unknown,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      // 🔍 デバッグログ
      context.fastify.log.info(
        {
          postId,
          user: context.user ? { id: context.user.id, username: context.user.username } : null,
        },
        '🔍 [Like] toggleLike 呼び出し:'
      );

      if (!context.user) {
        context.fastify.log.warn('🔐 [Like] 未認証ユーザーのいいね試行');
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // いいね機能が有効かチェック
      const isLikeFeatureEnabled = await checkSiteFeatureEnabled(context, 'POST_LIKE');
      context.fastify.log.info(
        {
          POST_LIKE: isLikeFeatureEnabled,
        },
        '🔍 [Like] 機能フラグチェック:'
      );

      if (!isLikeFeatureEnabled) {
        context.fastify.log.warn('⚠️ [Like] POST_LIKE機能が無効化されています');
        throw new GraphQLError('いいね機能は現在無効になっています', {
          extensions: { code: 'FEATURE_DISABLED' },
        });
      }

      // 投稿の存在確認とカウント取得を同時に行う
      const [post, existingLike] = await Promise.all([
        context.prisma.post.findUnique({
          where: { id: postId },
        }),
        context.prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: context.user.id,
              postId,
            },
          },
        }),
      ]);

      // Redisから現在のいいね数を取得（高性能）
      // const currentStats = await counterManager.getPostStats(postId);

      if (!post || post.isDeleted) {
        throw new GraphQLError('投稿が見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // プライベート投稿の権限チェック
      if (post.visibility === 'PRIVATE' && post.userId !== context.user.id) {
        throw new GraphQLError('この投稿にいいねする権限がありません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      let isLiked: boolean;
      let newLikeCount: number;

      if (existingLike) {
        // いいね削除（DB + Redis）
        await Promise.all([
          context.prisma.like.delete({
            where: {
              userId_postId: {
                userId: context.user.id,
                postId,
              },
            },
          }),
          counterManager.decrementPostStat(postId, 'likes'),
          counterManager.decrementUserStat(post.userId, 'likesReceived'),
        ]);

        isLiked = false;
        newLikeCount = await counterManager.incrementPostStat(postId, 'likes', 0); // 現在値取得

        // いいね削除時は通知も削除
        await context.prisma.notification.deleteMany({
          where: {
            userId: post.userId,
            type: 'LIKE',
            actorId: context.user.id,
            referenceId: postId,
          },
        });
      } else {
        // いいね作成（DB + Redis）
        await Promise.all([
          context.prisma.like.create({
            data: {
              userId: context.user.id,
              postId,
            },
          }),
          counterManager.incrementPostStat(postId, 'likes'),
          counterManager.incrementUserStat(post.userId, 'likesReceived'),
        ]);

        isLiked = true;
        newLikeCount = await counterManager.incrementPostStat(postId, 'likes', 0); // 現在値取得

        // 投稿者に通知を作成（自分の投稿でない場合）
        if (post.userId !== context.user.id) {
          const notification = await context.prisma.notification.create({
            data: {
              userId: post.userId,
              type: 'LIKE',
              actorId: context.user.id,
              referenceId: postId,
              content: `${context.user.displayName || context.user.username}があなたの投稿にいいねしました`,
            },
            include: {
              actor: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  profileImageId: true,
                },
              },
            },
          });

          // Redis PubSub通知を送信
          try {
            if (context.redisPubSub) {
              await context.redisPubSub!.publishGraphQLNotification(post.userId, {
                type: 'notification_added',
                notification: notification, // 通知オブジェクト全体を送信
                timestamp: new Date().toISOString(),
              });
            }
            context.fastify.log.info(
              {
                userId: post.userId,
                notificationId: notification.id,
                type: notification.type,
                actorName:
                  (notification as any).actor?.displayName || (notification as any).actor?.username,
              },
              '✅ [Like] いいね通知作成完了:'
            );
          } catch (error) {
            context.fastify.log.error({ err: error }, '❌ [Like] Redis PubSub通知送信エラー:');
          }
        }
      }

      // GraphQLサブスクリプション通知を送信
      if (context.redisPubSub) {
        try {
          // 投稿のいいねトグル通知
          const postData = {
            id: postId,
            isLikedByCurrentUser: isLiked,
            likesCount: newLikeCount,
          };

          await context.redisPubSub.publish(`like_toggled:${postId}`, {
            type: 'like_toggled',
            post: postData,
            timestamp: new Date().toISOString(),
          });

          context.fastify.log.info(
            {
              postId,
              userId: context.user!.id,
              isLiked,
              newLikeCount,
            },
            '📡 [GraphQL] いいねトグルサブスクリプション通知送信:'
          );
        } catch (error) {
          context.fastify.log.error(
            { err: error },
            '❌ [GraphQL] いいねトグルサブスクリプション通知エラー:'
          );
        }
      }

      // 楽観的更新用に最小限のデータのみ返す
      return {
        id: postId,
        isLikedByCurrentUser: isLiked,
        likesCount: newLikeCount,
      };
    },
  },

  Subscription: {
    /**
     * いいねトグルサブスクリプション
     */
    likeToggled: {
      subscribe: async (_: unknown, args: { postId: string }, context: GraphQLContext) => {
        if (!context.redisPubSub) {
          throw new Error('Redis PubSub not available');
        }

        // 特定投稿のいいねトグルチャンネルを購読
        const channel = `like_toggled:${args.postId}`;

        context.fastify.log.info(`📡 [GraphQL] いいねトグルサブスクリプション開始: ${channel}`);
        return context.redisPubSub.asyncIterator([channel]);
      },
      resolve: (payload: unknown, _args: unknown, context: GraphQLContext) => {
        context.fastify.log.info(
          {
            hasPayload: !!payload,
            payloadType: typeof payload,
          },
          '📨 [GraphQL] いいねトグルサブスクリプション受信:'
        );

        // いいねトグルタイプのメッセージのみ処理
        const payloadObj = payload as {
          type?: string;
          post?: unknown;
          id?: string;
          content?: unknown;
        };
        if (payloadObj && payloadObj.type === 'like_toggled' && payloadObj.post) {
          return payloadObj.post;
        }

        // 直接投稿オブジェクトが送信された場合
        if (payloadObj && payloadObj.id && payloadObj.content !== undefined) {
          return payloadObj;
        }

        return null;
      },
    },
  },
};
