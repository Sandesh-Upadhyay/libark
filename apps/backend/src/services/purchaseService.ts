/**
 * 💰 投稿購入サービス
 *
 * 投稿購入関連のビジネスロジックを集集約
 */

import { GraphQLError } from 'graphql';
import { Prisma } from '@libark/db';

import type { GraphQLContext } from '../graphql/context.js';
import type { PurchasePostInput } from '../types/resolvers.js';

/**
 * 投稿購入サービス
 */
export async function purchasePost(context: GraphQLContext, input: PurchasePostInput) {
  if (!context?.prisma) {
    throw new GraphQLError('内部エラー: Prismaクライアントがコンテキストに存在しません', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const { postId } = input;

  // 投稿の存在確認とPaid状態確認
  const post = await validatePurchasablePost(context, postId);

  // 既存の購入確認
  await validateNoDuplicatePurchase(context, postId);

  const price = post.price!;

  // トランザクションで決済処理を実行
  const purchase = await context.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. 購入者のウォレット残高を確認
    const buyerWallet = await tx.wallet.findUnique({
      where: { userId: context.user!.id },
    });

    if (!buyerWallet || Number(buyerWallet.balanceUsd) < Number(price)) {
      throw new GraphQLError('ウォレットの残高が不足しています', {
        extensions: { code: 'INSUFFICIENT_FUNDS' },
      });
    }

    // 2. 購入者の残高を減らす (WALLET残高)
    await tx.wallet.update({
      where: { userId: context.user!.id },
      data: {
        balanceUsd: { decrement: price },
      },
    });

    // 3. 売り手の残高を増やす (SALES残高)
    await tx.wallet.upsert({
      where: { userId: post.userId },
      update: {
        salesBalanceUsd: { increment: price },
      },
      create: {
        userId: post.userId,
        balanceUsd: 0,
        salesBalanceUsd: price,
        p2pBalanceUsd: 0,
        p2pLockedUsd: 0,
      },
    });

    // 4. 購入者の取引履歴を作成
    await tx.walletTransaction.create({
      data: {
        userId: context.user!.id,
        type: 'PAYMENT',
        balanceType: 'WALLET',
        amountUsd: -Number(price),
        description: `有料投稿の購入: ${post.id}`,
      },
    });

    // 5. 売り手の取引履歴を作成
    await tx.walletTransaction.create({
      data: {
        userId: post.userId,
        type: 'RECEIVE',
        balanceType: 'SALES',
        amountUsd: Number(price),
        description: `投稿の売上: ${post.id}`,
      },
    });

    // 6. 購入記録作成
    return await tx.postPurchase.create({
      data: {
        userId: context.user!.id,
        postId,
        price: price,
        isActive: true,
      },
      include: {
        user: true,
        post: {
          include: {
            user: true,
          },
        },
      },
    });
  });

  context.fastify.log.info(
    {
      purchaseId: purchase.id,
      userId: context.user.id,
      postId,
      price: post.price,
    },
    '💰 [PurchasePost] 投稿購入完了:'
  );

  return purchase;
}

/**
 * 購入可能な投稿かどうかを検証
 */
async function validatePurchasablePost(context: GraphQLContext, postId: string) {
  // context.prisma が存在することを確実にする
  if (!context.prisma) {
    throw new Error('Prisma instance not found in context (validatePurchasablePost)');
  }

  const post = await context.prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: true,
    },
  });

  if (!post || post.isDeleted) {
    throw new GraphQLError('投稿が見つかりません', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (post.visibility !== 'PAID') {
    throw new GraphQLError('この投稿は有料投稿ではありません', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (post.userId === context.user!.id) {
    throw new GraphQLError('自分の投稿は購入できません', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (!post.price) {
    throw new GraphQLError('投稿の価格が設定されていません', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return post;
}

/**
 * 重複購入がないかを検証
 */
async function validateNoDuplicatePurchase(context: GraphQLContext, postId: string): Promise<void> {
  if (!context.prisma) {
    throw new Error('Prisma instance not found in context (validateNoDuplicatePurchase)');
  }

  const existingPurchase = await context.prisma.postPurchase.findUnique({
    where: {
      userId_postId: {
        userId: context.user!.id,
        postId,
      },
    },
  });

  if (existingPurchase && existingPurchase.isActive) {
    throw new GraphQLError('この投稿は既に購入済みです', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}
