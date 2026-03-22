/**
 * 💰 投稿購入フィールドリゾルバー
 *
 * PostPurchase型のフィールドリゾルバー（リレーション）
 */

import type { PostPurchase } from '@libark/db';

import type { GraphQLContext } from '../../graphql/context.js';

export const postPurchaseFields = {
  /**
   * 購入者情報
   */
  user: async (parent: PostPurchase, _args: unknown, context: GraphQLContext) => {
    return await context.prisma.user.findUnique({
      where: { id: parent.userId },
    });
  },

  /**
   * 購入対象投稿
   */
  post: async (parent: PostPurchase, _args: unknown, context: GraphQLContext) => {
    return await context.prisma.post.findUnique({
      where: { id: parent.postId },
      include: {
        user: true,
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
  },
};
