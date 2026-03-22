/**
 * 📦 GraphQL DataLoader
 *
 * N+1問題を解決するためのDataLoader実装
 * 複数のリクエストをバッチ処理してDBクエリを最適化
 */

import DataLoader from 'dataloader';
import type { PrismaClient as PrismaClientType } from '@libark/db';

/**
 * Postのいいね状態をバッチ取得するDataLoader
 *
 * 複数のPostに対して、現在のユーザーがいいねしているかを一括で取得
 */
export function createPostLikeDataLoader(prisma: PrismaClientType, userId: string | undefined) {
  return new DataLoader<string, boolean>(async postIds => {
    // 未認証の場合はすべてfalseを返す
    if (!userId) {
      return postIds.map(() => false);
    }

    // バッチクエリで一括取得
    const likes = await prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds as string[] },
      },
    });

    // postIdをキーにしたマップを作成
    const likeMap = new Map<string, boolean>();
    for (const like of likes) {
      if (like.postId) {
        likeMap.set(like.postId, true);
      }
    }

    // 順序を維持して結果を返す
    return postIds.map(postId => likeMap.get(postId as string) ?? false);
  });
}

/**
 * Commentのいいね状態をバッチ取得するDataLoader
 *
 * 複数のCommentに対して、現在のユーザーがいいねしているかを一括で取得
 */
export function createCommentLikeDataLoader(prisma: PrismaClientType, userId: string | undefined) {
  return new DataLoader<string, boolean>(async commentIds => {
    // 未認証の場合はすべてfalseを返す
    if (!userId) {
      return commentIds.map(() => false);
    }

    // バッチクエリで一括取得
    const likes = await prisma.like.findMany({
      where: {
        userId,
        commentId: { in: commentIds as string[] },
      },
    });

    // commentIdをキーにしたマップを作成
    const likeMap = new Map<string, boolean>();
    for (const like of likes) {
      if (like.commentId) {
        likeMap.set(like.commentId, true);
      }
    }

    // 順序を維持して結果を返す
    return commentIds.map(commentId => likeMap.get(commentId as string) ?? false);
  });
}

/**
 * PostPurchaseの購入状態をバッチ取得するDataLoader
 *
 * 複数のPostに対して、現在のユーザーが購入しているかを一括で取得
 */
export function createPostPurchaseDataLoader(prisma: PrismaClientType, userId: string | undefined) {
  return new DataLoader<string, boolean>(async postIds => {
    // 未認証の場合はすべてfalseを返す
    if (!userId) {
      return postIds.map(() => false);
    }

    // バッチクエリで一括取得
    const purchases = await prisma.postPurchase.findMany({
      where: {
        userId,
        postId: { in: postIds as string[] },
        isActive: true,
      },
    });

    // postIdをキーにしたマップを作成
    const purchaseMap = new Map<string, boolean>();
    for (const purchase of purchases) {
      purchaseMap.set(purchase.postId, true);
    }

    // 順序を維持して結果を返す
    return postIds.map(postId => purchaseMap.get(postId as string) ?? false);
  });
}
