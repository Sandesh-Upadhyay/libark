/**
 * 📝 投稿サービス
 *
 * 投稿関連の共通ビジネスロジックを集約
 */

import { GraphQLError } from 'graphql';
import { counterManager } from '@libark/redis-client';
import { getDefaultCacheManager } from '@libark/cache';

import type { GraphQLContext } from '../graphql/context.js';
import type { PostUpdateInput } from '../types/resolvers.js';
import { verifyPostOwnership } from '../utils/validators.js';

/**
 * 投稿更新サービス
 */
export async function updatePost(context: GraphQLContext, id: string, input: PostUpdateInput) {
  // 投稿の所有者チェック
  await verifyPostOwnership(context, id);

  // 投稿更新
  const updatedPost = await context.prisma.post.update({
    where: { id },
    data: {
      ...input,
      updatedAt: new Date(),
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

  // 統一キャッシュシステムでキャッシュを無効化
  const cacheManager = getDefaultCacheManager();
  await cacheManager.delete('post', id);
  await cacheManager.delete('feed', `user:${updatedPost.userId}`);

  return updatedPost;
}

/**
 * 投稿削除サービス（論理削除）
 */
export async function deletePost(context: GraphQLContext, id: string) {
  // 投稿の所有者チェック
  await verifyPostOwnership(context, id);

  // 論理削除 + Redis統計更新
  const cacheManager = getDefaultCacheManager();
  const [deletedPost] = await Promise.all([
    context.prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
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
        media: {
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
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    counterManager.decrementUserStat(context.user!.id, 'postsCount'),
    counterManager.decrementGlobalStat('totalPosts'),
    cacheManager.delete('post', id),
  ]);

  return deletedPost;
}

/**
 * 投稿をPaid化するサービス
 */
export async function updatePostToPaid(context: GraphQLContext, postId: string, price: number) {
  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  if (price <= 0) {
    throw new GraphQLError('有効な価格を設定してください', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  // 投稿の存在確認と所有権確認
  const post = await context.prisma.post.findUnique({
    where: { id: postId },
    include: {
      media: true,
    },
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

  if (post.visibility === 'PAID') {
    throw new GraphQLError('この投稿は既にPaid投稿です', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  // 投稿をPaid化
  const updatedPost = await context.prisma.post.update({
    where: { id: postId },
    data: {
      visibility: 'PAID',
      price,
      paidAt: new Date(),
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
      media: {
        include: {
          variants: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  // ブラーバリアント生成キューに投入
  await processBlurGeneration(context, updatedPost, postId);

  context.fastify.log.info(
    {
      postId,
      userId: context.user.id,
      price,
      mediaCount: updatedPost.media?.length || 0,
    },
    '💰 [UpdatePostToPaid] 投稿Paid化完了:'
  );

  return updatedPost;
}

/**
 * ブラーバリアント生成処理
 */
async function processBlurGeneration(
  context: GraphQLContext,
  post: { media: Array<{ id: string }> } | { media?: undefined },
  postId: string
): Promise<void> {
  if (post.media && post.media.length > 0) {
    const { getQueue, QueueName } = await import('@libark/queues');
    const blurQueue = getQueue(QueueName.BLUR_PROCESSING);

    for (const media of post.media) {
      await blurQueue.add(
        'generate-blur',
        {
          mediaId: media.id,
          postId,
          userId: context.user!.id,
          reason: 'post_paid' as const,
        },
        {
          priority: 15, // ブラー処理は最優先
        }
      );

      context.fastify.log.info(
        {
          mediaId: media.id,
          postId,
        },
        '🎯 [UpdatePostToPaid] ブラー処理ジョブ追加:'
      );
    }
  }
}
