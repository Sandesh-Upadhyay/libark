/**
 * 📝 投稿作成サービス
 *
 * 複雑な投稿作成ロジックをサービス層に分離
 */

import { GraphQLError } from 'graphql';
import { Prisma } from '@libark/db'; // Added
import { counterManager } from '@libark/redis-client';
import { PAGINATION_CONSTANTS } from '@libark/core-shared';

import type { GraphQLContext } from '../graphql/context.js';
import type { PostCreateInput } from '../types/resolvers.js';
import {
  validatePaidPostPrice,
  validatePostContent,
  verifyMediaOwnership,
} from '../utils/validators.js';

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

/**
 * 投稿作成サービス
 */
export async function createPost(context: GraphQLContext, input: PostCreateInput) {
  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // 投稿作成機能が有効かチェック
  const isPostCreateEnabled = await checkSiteFeatureEnabled(context, 'POST_CREATE');
  if (!isPostCreateEnabled) {
    throw new GraphQLError('投稿作成機能は現在無効になっています', {
      extensions: { code: 'FEATURE_DISABLED' },
    });
  }

  const { content, visibility = 'PUBLIC', mediaIds, price } = input;

  // バリデーション
  validatePaidPostPrice(visibility, price);
  validatePostContent(content, mediaIds);

  context.fastify.log.info({
    userId: context.user.id,
    content:
      content?.substring(0, PAGINATION_CONSTANTS.MAX_PAGE_SIZE) +
      (content && content.length > PAGINATION_CONSTANTS.MAX_PAGE_SIZE ? '...' : ''),
    visibility,
    price,
    mediaIds,
    mediaCount: mediaIds?.length || 0,
  }, '📝 [CreatePost] 投稿作成開始:');

  // メディアの所有権確認
  if (mediaIds && mediaIds.length > 0) {
    await verifyMediaOwnership(context, mediaIds);
  }

  // トランザクションで投稿作成とメディア紐づけ（処理中状態で作成）
  const post = await context.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 投稿作成（処理中状態）
    const post = await tx.post.create({
      data: {
        userId: context.user!.id,
        content: content || '',
        visibility,
        isProcessing: true, // 処理中フラグを設定
        price: visibility === 'PAID' ? price : null,
        paidAt: visibility === 'PAID' ? new Date() : null,
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
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // メディアを投稿に紐づけ
    if (mediaIds && mediaIds.length > 0) {
      context.fastify.log.info({
        postId: post.id,
        mediaIds,
        userId: context.user!.id,
      }, '🔗 [CreatePost] メディア関連付け開始:');

      const updateResult = await tx.media.updateMany({
        where: {
          id: { in: mediaIds },
          userId: context.user!.id,
        },
        data: {
          postId: post.id,
        },
      });

      context.fastify.log.info({
        postId: post.id,
        updatedCount: updateResult.count,
        expectedCount: mediaIds.length,
      }, '✅ [CreatePost] メディア関連付け完了:');

      if (updateResult.count !== mediaIds.length) {
        context.fastify.log.warn({
          expected: mediaIds.length,
          actual: updateResult.count,
          mediaIds,
        }, '⚠️ [CreatePost] メディア関連付け数が不一致:');
      }
    }

    return post;
  });

  // 投稿処理完了とサブスクリプション通知
  await finalizePost(context, post, mediaIds);

  context.fastify.log.info(`✅ 投稿作成完了: postId=${post.id}, isProcessing=${post.isProcessing}`);

  return post;
}

/**
 * 投稿処理の最終化（統計更新とサブスクリプション通知）
 */
async function finalizePost(
  context: GraphQLContext,
  post: { id: string },
  mediaIds?: string[]
): Promise<void> {
  try {
    const hasMedia = mediaIds && mediaIds.length > 0;

    // 投稿を即座に完了状態に更新
    await context.prisma.post.update({
      where: { id: post.id },
      data: { isProcessing: false },
    });

    // 統計更新を即座に実行
    await Promise.all([
      counterManager.incrementUserStat(context.user!.id, 'postsCount'),
      counterManager.incrementGlobalStat('totalPosts'),
    ]);

    context.fastify.log.info(`✅ 投稿処理完了（即座）: postId=${post.id}, hasMedia=${hasMedia}`);

    // GraphQLサブスクリプション通知を送信
    await sendPostAddedNotification(context, post);
  } catch (error) {
    context.fastify.log.error({ err: error }, '❌ 投稿処理エラー:');

    // 処理に失敗した場合は投稿を削除
    await context.prisma.post.delete({
      where: { id: post.id },
    });

    throw new GraphQLError('投稿の処理に失敗しました', {
      extensions: { code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * 投稿追加サブスクリプション通知を送信
 */
async function sendPostAddedNotification(context: unknown, post: { id: string }): Promise<void> {
  const contextObj = context as {
    redisPubSub?: { publish: (channel: string, data: unknown) => Promise<void> };
    fastify?: { log?: { info: (msg: string, data?: unknown) => void } };
    user?: { id: string };
  };
  if (contextObj.redisPubSub) {
    try {
      // 全体向け投稿追加通知
      await contextObj.redisPubSub.publish('post_added', {
        type: 'post_added',
        post,
        timestamp: new Date().toISOString(),
      });

      // contextObjの型定義の問題は残るが、今回はコアロジック優先
      // eslint-disable-next-line no-empty
    } catch {
      // Ignore errors in pub/sub
    }
  }
}
