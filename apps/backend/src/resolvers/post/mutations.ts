/**
 * 📝 投稿ミューテーションリゾルバー
 */

import { GraphQLError } from 'graphql';

import type { GraphQLContext } from '../../graphql/context.js';
import type {
  PostCreateInput,
  PostUpdateInput,
  PurchasePostInput,
  UpdatePostToPaidInput,
} from '../../types/resolvers.js';
import { createPost } from '../../services/createPost.js';
import { updatePost, deletePost, updatePostToPaid } from '../../services/postService.js';

export const postMutations = {
  /**
   * 投稿作成
   */
  createPost: async (
    _parent: unknown,
    { input }: { input: PostCreateInput },
    context: GraphQLContext
  ) => {
    return await createPost(context, input);
  },

  /**
   * 投稿更新
   */
  updatePost: async (
    _parent: unknown,
    { id, input }: { id: string; input: PostUpdateInput },
    context: GraphQLContext
  ) => {
    return await updatePost(context, id, input);
  },

  /**
   * 投稿削除
   */
  deletePost: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
    return await deletePost(context, id);
  },

  /**
   * 投稿購入
   */
  purchasePost: async (
    _parent: unknown,
    { input }: { input: PurchasePostInput },
    context: GraphQLContext
  ) => {
    const prisma = context.prisma;
    if (!prisma) {
      throw new GraphQLError('Prisma client not found in context');
    }

    if (!context.user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { postId } = input;

    // 1. 投稿の存在確認
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post || post.isDeleted) {
      throw new GraphQLError('投稿が見つかりません');
    }
    if (post.visibility !== 'PAID') {
      throw new GraphQLError('この投稿は有料投稿ではありません');
    }
    if (post.userId === context.user.id) {
      throw new GraphQLError('自分の投稿は購入できません');
    }
    if (!post.price) {
      throw new GraphQLError('価格が設定されていません');
    }

    const cleanPrice = Number(post.price);

    // 2. 既存購入確認
    const existingPurchase = await prisma.postPurchase.findUnique({
      where: {
        userId_postId: {
          userId: context.user.id,
          postId,
        },
      },
    });

    if (existingPurchase && existingPurchase.isActive) {
      throw new GraphQLError('この投稿は既に購入済みです');
    }

    // 3. 決済トランザクション
    const purchase = await prisma.$transaction(async tx => {
      const buyerWallet = await tx.wallet.findUnique({
        where: { userId: context.user!.id },
      });

      if (!buyerWallet || Number(buyerWallet.balanceUsd) < cleanPrice) {
        throw new GraphQLError('残高が不足しています', {
          extensions: { code: 'INSUFFICIENT_FUNDS' },
        });
      }

      // 購入者の残高を減少
      await tx.wallet.update({
        where: { userId: context.user!.id },
        data: { balanceUsd: Number(buyerWallet.balanceUsd) - cleanPrice },
      });

      // 販売者の売上残高を増加
      const currentSellerWallet = await tx.wallet.findUnique({
        where: { userId: post.userId },
      });

      if (currentSellerWallet) {
        await tx.wallet.update({
          where: { userId: post.userId },
          data: { salesBalanceUsd: Number(currentSellerWallet.salesBalanceUsd || 0) + cleanPrice },
        });
      } else {
        await tx.wallet.create({
          data: {
            userId: post.userId,
            balanceUsd: 0.0,
            salesBalanceUsd: cleanPrice,
            p2pBalanceUsd: 0.0,
            p2pLockedUsd: 0.0,
          },
        });
      }

      // 購入者のトランザクション記録
      await tx.walletTransaction.create({
        data: {
          userId: context.user!.id,
          type: 'PAYMENT',
          balanceType: 'WALLET',
          amountUsd: -cleanPrice,
          description: `購入: ${postId}`,
        },
      });

      // 販売者のトランザクション記録
      await tx.walletTransaction.create({
        data: {
          userId: post.userId,
          type: 'RECEIVE',
          balanceType: 'SALES',
          amountUsd: cleanPrice,
          description: `売上: ${postId}`,
        },
      });

      // 購入記録作成
      return await tx.postPurchase.create({
        data: {
          userId: context.user!.id,
          postId,
          price: cleanPrice,
          isActive: true,
        },
        include: {
          user: true,
          post: { include: { user: true } },
        },
      });
    });

    return {
      ...purchase,
      price: Number(purchase.price),
    };
  },

  /**
   * 投稿をPaid化
   */
  updatePostToPaid: async (
    _parent: unknown,
    { input }: { input: UpdatePostToPaidInput },
    context: GraphQLContext
  ) => {
    const { postId, price } = input;
    return await updatePostToPaid(context, postId, price);
  },
};
