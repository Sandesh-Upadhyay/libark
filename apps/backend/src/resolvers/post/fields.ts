/**
 * 📝 投稿フィールドリゾルバー
 *
 * Post型のフィールドリゾルバー（計算フィールドやリレーション）
 */

import { counterManager } from '@libark/redis-client';

import type { GraphQLContext } from '../../graphql/context.js';
import type { PostParent } from '../../types/resolvers.js';

export const postFields = {
  /**
   * 投稿の処理状態（楽観的更新対応）
   */
  isProcessing: async (parent: PostParent) => {
    // Prismaから直接取得（データベースの値を返す）
    return parent.isProcessing ?? false;
  },

  /**
   * 投稿のいいね数（Redis高速取得 + 欠落時オンデマンド同期）
   */
  likesCount: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    // 1. Redisから取得
    const stats = await counterManager.getPostStats(parent.id);

    // 2. キーが存在し、数値が正常ならそのまま返す
    if (stats !== null && stats.likes >= 0) {
      return stats.likes;
    }

    // 3. データ欠落（null）または異常値の場合：再同期
    const lockKey = `recount:likes:${parent.id}`;
    const gotLock = await counterManager.acquireLock(lockKey, 5);

    if (gotLock) {
      try {
        // DBから正確な件数を取得
        const count = await context.prisma.like.count({
          where: { postId: parent.id },
        });

        // Redisを更新（既存の統計があれば引き継ぐ）
        await counterManager.setPostStats(parent.id, {
          likes: count,
          comments: stats?.comments ?? 0,
          views: stats?.views ?? 0,
          shares: stats?.shares ?? 0,
        });

        context.fastify.log.info(
          `🔄 [FieldResolver] likesCountをDBから再同期完了: postId=${parent.id}, count=${count}`
        );
        return count;
      } finally {
        await counterManager.releaseLock(lockKey);
      }
    } else {
      // ロックが取れない場合は他で処理中。UX優先でDBから直接取得して返す
      return await context.prisma.like.count({
        where: { postId: parent.id },
      });
    }
  },

  /**
   * 投稿のコメント数（Redis高速取得 + 欠落時オンデマンド同期）
   */
  commentsCount: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    // 1. Redisから取得
    const stats = await counterManager.getPostStats(parent.id);

    // 2. キーが存在し、数値が正常ならそのまま返す
    if (stats !== null && stats.comments >= 0) {
      return stats.comments;
    }

    // 3. データ欠落（null）または異常値の場合：再同期
    const lockKey = `recount:comments:${parent.id}`;
    const gotLock = await counterManager.acquireLock(lockKey, 5);

    if (gotLock) {
      try {
        // DBから正確な件数を取得（削除済みは除外）
        const count = await context.prisma.comment.count({
          where: {
            postId: parent.id,
            isDeleted: false,
          },
        });

        // Redisを更新
        await counterManager.setPostStats(parent.id, {
          likes: stats?.likes ?? 0,
          comments: count,
          views: stats?.views ?? 0,
          shares: stats?.shares ?? 0,
        });

        context.fastify.log.info(
          `🔄 [FieldResolver] commentsCountをDBから再同期完了: postId=${parent.id}, count=${count}`
        );
        return count;
      } finally {
        await counterManager.releaseLock(lockKey);
      }
    } else {
      return await context.prisma.comment.count({
        where: {
          postId: parent.id,
          isDeleted: false,
        },
      });
    }
  },

  /**
   * 投稿のビュー数（Redis高速取得）
   */
  viewsCount: async (parent: PostParent) => {
    const stats = await counterManager.getPostStats(parent.id);
    return stats?.views ?? 0;
  },

  /**
   * 現在のユーザーがいいねしているか（DataLoaderでN+1問題を解決）
   */
  isLikedByCurrentUser: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    // DataLoaderを使用してバッチ取得
    return await context.dataloaders.postLikeLoader.load(parent.id);
  },

  /**
   * 現在のユーザーが投稿を購入済みかどうか（DataLoaderでN+1問題を解決）
   */
  isPurchasedByCurrentUser: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    if (!context.user) {
      return false;
    }

    // 自分の投稿の場合は常にtrue
    if (parent.userId === context.user.id) {
      return true;
    }

    // Paid投稿でない場合は常にtrue
    if (parent.visibility !== 'PAID') {
      return true;
    }

    // DataLoaderを使用してバッチ取得
    return await context.dataloaders.postPurchaseLoader.load(parent.id);
  },

  /**
   * 投稿の購入記録一覧
   */
  purchases: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    return await context.prisma.postPurchase.findMany({
      where: { postId: parent.id },
      include: {
        user: true,
      },
      orderBy: { purchasedAt: 'desc' },
    });
  },

  /**
   * 投稿のメディア一覧
   */
  media: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    return await context.prisma.media.findMany({
      where: { postId: parent.id },
      include: {
        variants: {
          select: {
            id: true,
            type: true,
            s3Key: true,
            width: true,
            height: true,
            fileSize: true,
            quality: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * 投稿のいいね一覧
   */
  likes: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    return await context.prisma.like.findMany({
      where: { postId: parent.id },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * 投稿のコメント一覧
   */
  comments: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    return await context.prisma.comment.findMany({
      where: {
        postId: parent.id,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * 投稿者情報
   */
  user: async (parent: PostParent, _args: unknown, context: GraphQLContext) => {
    // If user is already loaded (included in parent), return it
    if (parent.user) {
      return parent.user;
    }
    // Otherwise fetch from DB
    return await context.prisma.user.findUnique({
      where: { id: parent.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImageId: true,
      },
    });
  },
};
