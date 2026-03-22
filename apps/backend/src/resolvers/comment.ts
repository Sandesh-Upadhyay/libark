/**
 * 💬 コメントGraphQLリゾルバー
 *
 * 既存tRPCコメントロジックをGraphQLに移植
 */

import { GraphQLError } from 'graphql';
// 🚫 commentProcessingQueue は削除されました（プリサインドS3システムに移行済み）
import { PAGINATION_CONSTANTS } from '@libark/core-shared';
import { counterManager } from '@libark/redis-client';

import { GraphQLContext } from '../graphql/context.js';
import type { CommentParent } from '../types/resolvers.js';

// サブスクリプションペイロード型
interface CommentAddedPayload {
  type: string;
  comment?: unknown;
  id?: string;
  content?: string;
  postId?: string;
}

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

export interface CommentCreateInput {
  postId: string;
  content: string;
}

export interface CommentsArgs {
  postId: string;
  first?: number;
  after?: string;
  includeProcessing?: boolean;
}

export const commentResolvers = {
  Query: {
    /**
     * コメント詳細取得
     */
    comment: async (
      _parent: unknown,
      { id, includeProcessing }: { id: string; includeProcessing?: boolean },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const comment = await context.prisma.comment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageId: true,
            },
          },
          post: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!comment || comment.isDeleted) {
        throw new GraphQLError('コメントが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // 処理中のコメントは、includeProcessingフラグがtrueでコメント作成者本人の場合のみ取得可能
      if (comment.isProcessing) {
        if (!includeProcessing || !context.user || context.user.id !== comment.userId) {
          throw new GraphQLError('コメントが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
      }

      return comment;
    },

    /**
     * 投稿のコメント一覧取得
     */
    comments: async (_parent: unknown, args: CommentsArgs, context: GraphQLContext) => {
      const {
        postId,
        first = PAGINATION_CONSTANTS.COMMENT_PAGE_SIZE,
        after,
        includeProcessing = false,
      } = args;

      // 投稿の存在確認とアクセス権限チェック
      const post = await context.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new GraphQLError('投稿が見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // プライベート投稿の権限チェック
      if (post.visibility === 'PRIVATE' && (!context.user || post.userId !== context.user.id)) {
        throw new GraphQLError('この投稿のコメントを閲覧する権限がありません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const where: Record<string, unknown> = {
        postId,
        isDeleted: false,
      };

      // 処理中のコメントを含めるかどうか
      if (!includeProcessing) {
        where.isProcessing = false;
      }

      let skip = 0;
      if (after) {
        const cursorComment = await context.prisma.comment.findUnique({
          where: { id: after },
          select: { createdAt: true, id: true },
        });
        if (cursorComment) {
          const countBeforeCursor = await context.prisma.comment.count({
            where: {
              ...where,
              OR: [
                { createdAt: { lt: cursorComment.createdAt } },
                {
                  createdAt: { equals: cursorComment.createdAt },
                  id: { lte: after },
                },
              ],
            },
          });
          skip = countBeforeCursor;
        }
      }

      const comments = await context.prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageId: true,
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip,
        take: first,
      });

      return comments;
    },
  },

  Mutation: {
    /**
     * コメント作成
     */
    createComment: async (
      _parent: unknown,
      { input }: { input: CommentCreateInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { postId, content } = input;

      if (!content || content.trim().length === 0) {
        throw new GraphQLError('コメント内容は必須です', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (content.length > 1000) {
        throw new GraphQLError('コメント内容は1000文字以内で入力してください', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const post = await context.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new GraphQLError('投稿が見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // プライベート投稿の権限チェック
      if (post.visibility === 'PRIVATE' && post.userId !== context.user.id) {
        throw new GraphQLError('この投稿にコメントする権限がありません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // コメント作成（処理中状態）
      const comment = await context.prisma.comment.create({
        data: {
          userId: context.user.id,
          postId,
          content,
          isProcessing: true, // 処理中フラグを設定
          isDeleted: false, // 明示的にfalseを設定
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImageId: true,
            },
          },
          post: {
            select: {
              id: true,
            },
          },
        },
      });

      // 🚫 コメント処理キューは削除されました（プリサインドS3システムに移行済み）
      // プリサインドS3では統計更新も即座に実行（投稿と同じパターン）
      try {
        // コメントを即座に完了状態に更新 + 統計更新を並列実行
        await Promise.all([
          context.prisma.comment.update({
            where: { id: comment.id },
            data: { isProcessing: false },
          }),
          // 投稿と同じパターンで統計更新
          counterManager.incrementPostStat(postId, 'comments'),
          counterManager.incrementUserStat(post.userId, 'commentsReceived'),
          counterManager.incrementGlobalStat('totalComments'),
        ]);

        context.fastify.log.info(
          `✅ コメント処理完了（即座）: commentId=${comment.id}, postId=${postId}`
        );
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ コメント処理エラー:');

        // 処理に失敗した場合はコメントを削除
        await context.prisma.comment.delete({
          where: { id: comment.id },
        });

        throw new GraphQLError('コメントの処理に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }

      // GraphQLサブスクリプション通知を送信
      if (context.redisPubSub) {
        try {
          // 投稿のコメント追加通知
          await context.redisPubSub.publish(`comment_added:${postId}`, {
            type: 'comment_added',
            comment,
            timestamp: new Date().toISOString(),
          });

          context.fastify.log.info(
            {
              commentId: comment.id,
              postId,
              userId: context.user!.id,
            },
            '📡 [GraphQL] コメント追加サブスクリプション通知送信:'
          );
        } catch (error) {
          context.fastify.log.error(
            { err: error },
            '❌ [GraphQL] コメント追加サブスクリプション通知エラー:'
          );
        }
      }

      context.fastify.log.info(
        `✅ コメント作成完了（処理中）: commentId=${comment.id}, isProcessing=${comment.isProcessing}`
      );

      // 処理中のコメントデータを返却（フロントエンドでは表示しない）
      return comment;
    },

    /**
     * コメント削除（論理削除）
     */
    deleteComment: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // コメントの存在確認と所有者チェック
      const existingComment = await context.prisma.comment.findUnique({
        where: { id },
      });

      if (!existingComment || existingComment.isDeleted) {
        throw new GraphQLError('コメントが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existingComment.userId !== context.user.id) {
        throw new GraphQLError('このコメントを削除する権限がありません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // 論理削除 + Redis統計更新（投稿と同じパターン）
      await Promise.all([
        context.prisma.comment.update({
          where: { id },
          data: {
            isDeleted: true,
            updatedAt: new Date(),
          },
        }),
        // 投稿と同じパターンで統計更新
        counterManager.decrementPostStat(existingComment.postId, 'comments'),
        counterManager.decrementUserStat(existingComment.userId, 'commentsReceived'),
        counterManager.decrementGlobalStat('totalComments'),
        // コメントキャッシュも削除（将来的にコメント専用キャッシュが実装された場合）
        // distributedCache.deleteComment(id), // 現在は未実装
      ]);

      return true;
    },

    /**
     * コメントいいねトグル
     */
    toggleCommentLike: async (
      _parent: unknown,
      { commentId }: { commentId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // いいね機能が有効かチェック
      const isLikeFeatureEnabled = await checkSiteFeatureEnabled(context, 'POST_LIKE');
      if (!isLikeFeatureEnabled) {
        throw new GraphQLError('いいね機能は現在無効になっています', {
          extensions: { code: 'FEATURE_DISABLED' },
        });
      }

      // コメントの存在確認
      const comment = await context.prisma.comment.findUnique({
        where: { id: commentId },
        include: { user: true },
      });

      if (!comment || comment.isDeleted) {
        throw new GraphQLError('コメントが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // 既存のいいねを確認
      const existingLike = await context.prisma.like.findUnique({
        where: {
          userId_commentId: {
            userId: context.user.id,
            commentId,
          },
        },
      });

      if (existingLike) {
        // いいねを削除
        await Promise.all([
          context.prisma.like.delete({
            where: { id: existingLike.id },
          }),
          counterManager.decrementCommentStat(commentId, 'likes'),
        ]);
      } else {
        // いいねを追加
        await Promise.all([
          context.prisma.like.create({
            data: {
              userId: context.user.id,
              commentId,
            },
          }),
          counterManager.incrementCommentStat(commentId, 'likes'),
        ]);
      }

      // 更新されたコメントを返す
      return await context.prisma.comment.findUnique({
        where: { id: commentId },
        include: { user: true, post: true },
      });
    },
  },

  Comment: {
    /**
     * コメントの投稿
     */
    post: async (parent: CommentParent, _args: unknown, context: GraphQLContext) => {
      return await context.prisma.post.findUnique({
        where: { id: parent.postId },
      });
    },

    /**
     * コメントのユーザー
     */
    user: async (parent: CommentParent, _args: unknown, context: GraphQLContext) => {
      return await context.prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    /**
     * コメントのいいね数（Redis高速取得）
     */
    likesCount: async (parent: CommentParent) => {
      const stats = await counterManager.getCommentStats(parent.id);
      return stats.likes;
    },

    /**
     * 現在のユーザーがコメントにいいねしているか（DataLoaderでN+1問題を解決）
     */
    isLikedByCurrentUser: async (
      parent: CommentParent,
      _args: unknown,
      context: GraphQLContext
    ) => {
      // DataLoaderを使用してバッチ取得
      return await context.dataloaders.commentLikeLoader.load(parent.id);
    },
  },

  Subscription: {
    /**
     * コメント追加サブスクリプション
     */
    commentAdded: {
      subscribe: async (_parent: unknown, args: { postId: string }, context: GraphQLContext) => {
        if (!context.redisPubSub) {
          throw new GraphQLError('PubSub not available');
        }

        // 特定投稿のコメント追加チャンネルを購読
        const channel = `comment_added:${args.postId}`;

        context.fastify.log.info(`📡 [GraphQL] コメント追加サブスクリプション開始: ${channel}`);
        return context.redisPubSub.asyncIterator([channel]);
      },
      resolve: (payload: CommentAddedPayload, _args: unknown, context: GraphQLContext) => {
        context.fastify.log.info(
          {
            hasPayload: !!payload,
            payloadType: typeof payload,
          },
          '📨 [GraphQL] コメント追加サブスクリプション受信:'
        );

        // コメント追加タイプのメッセージのみ処理
        if (payload && payload.type === 'comment_added' && payload.comment) {
          return payload.comment;
        }

        // 直接コメントオブジェクトが送信された場合
        if (payload && payload.id && payload.content && payload.postId) {
          return payload;
        }

        return null;
      },
    },
  },
};
