/**
 * 🔍 共通バリデーション関数
 *
 * 投稿関連の共通バリデーションロジックを集約
 */

import { GraphQLError } from 'graphql';

import type { GraphQLContext } from '../graphql/context.js';

/**
 * 投稿の所有権を確認する
 */
export async function verifyPostOwnership(
  context: GraphQLContext,
  postId: string
): Promise<{ id: string; userId: string; isDeleted: boolean }> {
  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const post = await context.prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, isDeleted: true },
  });

  if (!post || post.isDeleted) {
    throw new GraphQLError('投稿が見つかりません', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (post.userId !== context.user.id) {
    throw new GraphQLError('この投稿を編集する権限がありません', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return post;
}

/**
 * Paid投稿の価格を検証する
 */
export function validatePaidPostPrice(visibility: string, price?: number | null): void {
  if (visibility === 'PAID') {
    if (!price || price <= 0) {
      throw new GraphQLError('Paid投稿には有効な価格が必要です', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
  } else if (price) {
    throw new GraphQLError('Paid以外の投稿に価格は設定できません', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

/**
 * 投稿作成時のコンテンツ検証
 */
export function validatePostContent(content?: string, mediaIds?: string[]): void {
  if (!content && (!mediaIds || mediaIds.length === 0)) {
    throw new GraphQLError('テキストまたは画像が必要です', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

/**
 * メディアの所有権を確認する
 */
export async function verifyMediaOwnership(
  context: GraphQLContext,
  mediaIds: string[]
): Promise<void> {
  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const mediaCount = await context.prisma.media.count({
    where: {
      id: { in: mediaIds },
      userId: context.user.id,
      postId: null,
    },
  });

  if (mediaCount !== mediaIds.length) {
    throw new GraphQLError('指定されたメディアが見つからないか、権限がありません', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * 投稿の可視性とアクセス権限を確認する
 */
export async function validatePostAccess(
  post: { id: string; visibility: string; userId: string; isProcessing?: boolean },
  context: GraphQLContext,
  includeProcessing = false
): Promise<void> {
  // 処理中の投稿は、includeProcessingフラグがtrueで投稿者本人の場合のみ取得可能
  if (post.isProcessing) {
    if (!includeProcessing || !context.user || context.user.id !== post.userId) {
      throw new GraphQLError('投稿が見つかりません', {
        extensions: { code: 'NOT_FOUND' },
      });
    }
  }

  // プライベート投稿または有料投稿の場合、フォロワーチェックを行う
  if ((post.visibility === 'PRIVATE' || post.visibility === 'PAID') && context.user) {
    // 投稿者本人は常にアクセス可能
    if (context.user.id === post.userId) {
      return;
    }

    const follow = await context.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: context.user.id,
          followingId: post.userId,
        },
      },
    });

    if (!follow) {
      throw new GraphQLError('この投稿にアクセスする権限がありません', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
  } else if (post.visibility === 'PRIVATE' && !context.user) {
    throw new GraphQLError('この投稿にアクセスする権限がありません', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
