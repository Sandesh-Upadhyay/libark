/**
 * 🚨 P2P紛争リゾルバー
 *
 * 紛争の作成・解決処理
 * ※ 注意: このファイルはPrismaマイグレーション後に動作します
 */

import { prisma } from '@libark/db';
import { GraphQLError } from 'graphql';
import { createLogger } from '@libark/core-shared';

import { GraphQLContext, requireAuthentication } from '../graphql/context.js';
import { WalletNotificationService } from '../services/WalletNotificationService.js';
import { p2pTradeService } from '../services/P2PTradeService.js';

const logger = createLogger({ name: 'dispute-resolver' });

// 入力型定義
interface CreateP2PDisputeInput {
  tradeId: string;
  reason: string;
  evidence?: string;
}

interface ResolveP2PDisputeInput {
  disputeId: string;
  resolution: string;
  notes?: string;
}

export const disputeResolvers = {
  P2PDispute: {
    trade: async (parent: { tradeId: string }) =>
      prisma.p2PTradeRequest.findUnique({ where: { id: parent.tradeId } }),

    initiator: async (parent: { initiatorId: string }) =>
      prisma.user.findUnique({ where: { id: parent.initiatorId } }),

    resolver: async (parent: { resolvedBy?: string }) =>
      parent.resolvedBy ? prisma.user.findUnique({ where: { id: parent.resolvedBy } }) : null,
  },

  Query: {
    /**
     * 紛争詳細を取得
     */
    p2pDispute: async (_: unknown, args: { disputeId: string }, ctx: GraphQLContext) => {
      const user = await requireAuthentication(ctx);

      // @ts-ignore
      const dispute = await prisma.p2PDispute?.findUnique?.({
        where: { id: args.disputeId },
        include: {
          trade: true,
        },
      });

      if (!dispute) {
        return null;
      }

      // 当事者または管理者のみアクセス可能
      const trade = dispute.trade;
      const isParty = trade.buyerId === user.id || trade.sellerId === user.id;
      const isAdmin = await checkAdminPermission(user.id);

      if (!isParty && !isAdmin) {
        throw new GraphQLError('この紛争へのアクセス権限がありません');
      }

      return dispute;
    },

    /**
     * 自分の紛争一覧を取得
     */
    myP2PDisputes: async (_: unknown, _args: unknown, ctx: GraphQLContext) => {
      const user = await requireAuthentication(ctx);

      // @ts-ignore
      return (
        prisma.p2PDispute?.findMany?.({
          where: { initiatorId: user.id },
          orderBy: { createdAt: 'desc' },
        }) ?? []
      );
    },

    /**
     * 管理者用：全紛争一覧を取得
     */
    adminP2PDisputes: async (
      _: unknown,
      args: { status?: string; limit?: number; offset?: number },
      ctx: GraphQLContext
    ) => {
      const user = await requireAuthentication(ctx);
      const isAdmin = await checkAdminPermission(user.id);

      if (!isAdmin) {
        throw new GraphQLError('管理者権限が必要です');
      }

      // @ts-ignore
      return (
        prisma.p2PDispute?.findMany?.({
          where: args.status ? { status: args.status as any } : undefined,
          orderBy: { createdAt: 'desc' },
          take: args.limit || 50,
          skip: args.offset || 0,
          include: {
            trade: {
              include: {
                buyer: true,
                seller: true,
              },
            },
            initiator: true,
            resolver: true,
          },
        }) ?? []
      );
    },

    /**
     * 通貨一覧を取得
     */
    fiatCurrencies: async (_: unknown, args: { isActive?: boolean }) => {
      // @ts-ignore
      return (
        prisma.fiatCurrency?.findMany?.({
          where: args.isActive !== undefined ? { isActive: args.isActive } : undefined,
          orderBy: { code: 'asc' },
        }) ?? []
      );
    },

    /**
     * 買い手設定一覧を取得
     */
    myP2PBuyerPreferences: async (_: unknown, _args: unknown, ctx: GraphQLContext) => {
      const user = await requireAuthentication(ctx);

      // @ts-ignore
      return (
        prisma.p2PBuyerPreference?.findMany?.({
          where: { buyerId: user.id },
          orderBy: { createdAt: 'desc' },
        }) ?? []
      );
    },

    /**
     * リアルタイム為替レートを取得
     */
    currentExchangeRate: async (_: unknown, args: { currency: string }) => {
      // ExchangeRateServiceからインポートして使用
      const { exchangeRateService } = await import('../services/ExchangeRateService.js');
      return exchangeRateService.getRate(args.currency);
    },
  },

  Mutation: {
    /**
     * 紛争を作成
     */
    createP2PDispute: async (
      _: unknown,
      args: { input: CreateP2PDisputeInput },
      ctx: GraphQLContext
    ) => {
      const user = await requireAuthentication(ctx);
      const { tradeId, reason, evidence } = args.input;

      logger.info('Creating P2P dispute', { userId: user.id, tradeId });

      // 取引の存在確認
      const trade = await prisma.p2PTradeRequest.findUnique({
        where: { id: tradeId },
        include: {
          buyer: true,
          seller: true,
        },
      });

      if (!trade) {
        throw new GraphQLError('取引が見つかりません');
      }

      // 当事者確認
      if (trade.buyerId !== user.id && trade.sellerId !== user.id) {
        throw new GraphQLError('この取引に関与していません');
      }

      // ステータス確認（支払い済み状態でのみ紛争可能）
      if (trade.status !== 'PAYMENT_SENT') {
        throw new GraphQLError('紛争を作成できるのは支払い済みステータスの取引のみです');
      }

      // 既存の紛争確認
      const existingDispute = await prisma.p2PDispute.findUnique({
        where: { tradeId },
      });

      if (existingDispute) {
        throw new GraphQLError('この取引には既に紛争が存在します');
      }

      // トランザクションで紛争作成と取引ステータス更新
      const dispute = await prisma.$transaction(
        async (tx: import('@libark/db').Prisma.TransactionClient) => {
          // 紛争を作成
          const newDispute = await tx.p2PDispute.create({
            data: {
              tradeId,
              initiatorId: user.id,
              reason,
              evidence,
              status: 'OPEN',
            },
          });

          // 取引ステータスを更新
          await tx.p2PTradeRequest.update({
            where: { id: tradeId },
            data: { status: 'DISPUTED' },
          });

          return newDispute;
        }
      );

      // 通知送信
      // 通知送信
      const notificationService = WalletNotificationService.getInstance();
      const otherPartyId = trade.buyerId === user.id ? trade.sellerId : trade.buyerId;

      // 申立人へ通知
      await notificationService.notifyP2PDisputeCreated(user.id, tradeId, true);

      // 相手へ通知
      if (otherPartyId) {
        await notificationService.notifyP2PDisputeCreated(otherPartyId, tradeId, false);
      }

      // 取引更新イベントをパブリッシュ
      await p2pTradeService.publishTradeUpdate({
        ...trade,
        status: 'DISPUTED',
      } as any);

      logger.info('P2P dispute created', { disputeId: dispute.id, tradeId });

      return dispute;
    },

    /**
     * 紛争を解決（管理者のみ）
     */
    resolveP2PDispute: async (
      _: unknown,
      args: { input: ResolveP2PDisputeInput },
      ctx: GraphQLContext
    ) => {
      const user = await requireAuthentication(ctx);
      const { disputeId, resolution, notes } = args.input;

      logger.info('Resolving P2P dispute', { userId: user.id, disputeId, resolution });

      // 管理者権限確認
      const isAdmin = await checkAdminPermission(user.id);
      if (!isAdmin) {
        throw new GraphQLError('紛争を解決する権限がありません');
      }

      // 紛争の存在確認
      // @ts-ignore
      const dispute = await prisma.p2PDispute?.findUnique({
        where: { id: disputeId },
        include: {
          trade: true,
        },
      });

      if (!dispute) {
        throw new GraphQLError('紛争が見つかりません');
      }

      if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
        throw new GraphQLError('この紛争は既に解決されています');
      }

      // 解決処理
      const resolvedDispute = await prisma.$transaction(
        async (tx: import('@libark/db').Prisma.TransactionClient) => {
          // 紛争を解決
          const updated = await tx.p2PDispute.update({
            where: { id: disputeId },
            data: {
              status: resolution as any,
              resolution: notes,
              resolvedBy: user.id,
              resolvedAt: new Date(),
            },
          });

          // 取引ステータスを更新
          let tradeStatus: 'COMPLETED' | 'CANCELLED';
          if (resolution === 'RESOLVED_BUYER_WIN' || resolution === 'RESOLVED_SPLIT') {
            tradeStatus = 'COMPLETED';

            // 買い手勝利または分割の場合、エスクローを解放
            const trade = dispute.trade;
            if (trade.sellerId) {
              const amount =
                resolution === 'RESOLVED_SPLIT'
                  ? Number(trade.amountUsd) / 2
                  : Number(trade.amountUsd);

              await p2pTradeService.releaseEscrow(trade.buyerId, trade.sellerId, amount, trade.id);
            }
          } else {
            tradeStatus = 'CANCELLED';

            // 売り手勝利の場合、エスクローをキャンセル（売り手に返却）
            const trade = dispute.trade;
            if (trade.sellerId && trade.escrowAmount) {
              await p2pTradeService.cancelEscrow(
                trade.sellerId,
                Number(trade.escrowAmount),
                trade.id
              );
            }
          }

          await tx.p2PTradeRequest.update({
            where: { id: dispute.tradeId },
            data: {
              status: tradeStatus,
              completedAt: new Date(),
            },
          });

          return updated;
        }
      );

      logger.info('P2P dispute resolved', { disputeId, resolution });

      // 通知送信
      const notificationService = WalletNotificationService.getInstance();
      const tradeData = dispute.trade!; // 既にincludeされている

      // 買い手へ通知
      await notificationService.notifyP2PDisputeResolved(
        tradeData.buyerId,
        dispute.tradeId,
        resolution
      );

      // 売り手へ通知
      if (tradeData.sellerId) {
        await notificationService.notifyP2PDisputeResolved(
          tradeData.sellerId,
          dispute.tradeId,
          resolution
        );
      }

      return resolvedDispute;
    },

    /**
     * 買い手設定を更新
     */
    updateP2PBuyerPreference: async (
      _: unknown,
      args: {
        input: {
          paymentMethod: string;
          fiatCurrency: string;
          minAmountUsd: number;
          maxAmountUsd: number;
        };
      },
      ctx: GraphQLContext
    ) => {
      const user = await requireAuthentication(ctx);
      const { paymentMethod, fiatCurrency, minAmountUsd, maxAmountUsd } = args.input;

      // @ts-ignore
      return prisma.p2PBuyerPreference.upsert({
        where: {
          buyerId_paymentMethod_fiatCurrency: {
            buyerId: user.id,
            paymentMethod: paymentMethod as any,
            fiatCurrency,
          },
        },
        update: {
          minAmountUsd,
          maxAmountUsd,
        },
        create: {
          buyerId: user.id,
          paymentMethod: paymentMethod as any,
          fiatCurrency,
          minAmountUsd,
          maxAmountUsd,
        },
      });
    },

    /**
     * 買い手設定を削除
     */
    deleteP2PBuyerPreference: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const user = await requireAuthentication(ctx);

      // @ts-ignore
      const preference = await prisma.p2PBuyerPreference?.findUnique?.({
        where: { id: args.id },
      });

      if (!preference || preference.buyerId !== user.id) {
        throw new GraphQLError('設定が見つかりません');
      }

      // @ts-ignore
      await prisma.p2PBuyerPreference.delete({
        where: { id: args.id },
      });

      return true;
    },

    /**
     * 法定通貨を作成（管理者のみ）
     */
    createFiatCurrency: async (
      _: unknown,
      args: {
        input: {
          code: string;
          name: string;
          symbol: string;
          isActive?: boolean;
        };
      },
      ctx: GraphQLContext
    ) => {
      const user = await requireAuthentication(ctx);
      const isAdmin = await checkAdminPermission(user.id);

      if (!isAdmin) {
        throw new GraphQLError('管理者権限が必要です');
      }

      // @ts-ignore
      return prisma.fiatCurrency.create({
        data: {
          code: args.input.code,
          name: args.input.name,
          symbol: args.input.symbol,
          isActive: args.input.isActive !== undefined ? args.input.isActive : true,
        },
      });
    },

    /**
     * 法定通貨を更新（管理者のみ）
     */
    updateFiatCurrency: async (
      _: unknown,
      args: {
        input: {
          id: string;
          name?: string;
          symbol?: string;
          isActive?: boolean;
        };
      },
      ctx: GraphQLContext
    ) => {
      const user = await requireAuthentication(ctx);
      const isAdmin = await checkAdminPermission(user.id);

      if (!isAdmin) {
        throw new GraphQLError('管理者権限が必要です');
      }

      const { id, ...data } = args.input;

      // @ts-ignore
      return prisma.fiatCurrency.update({
        where: { id },
        data,
      });
    },
  },

  Subscription: {
    /**
     * 紛争更新を購読
     */
    p2pDisputeUpdated: {
      subscribe: async (_: unknown, args: { tradeId: string }, ctx: GraphQLContext) => {
        const redisPubSub = ctx.redisPubSub;
        if (!redisPubSub) {
          throw new GraphQLError('PubSub is not available');
        }

        return redisPubSub.asyncIterator([`p2p:dispute:${args.tradeId}`]);
      },
    },
  },
};

/**
 * 管理者権限をチェック
 */
async function checkAdminPermission(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) {
    return false;
  }

  return (
    user.role.name === 'ADMIN' ||
    user.role.permissions.some(
      (rp: { permission: { name: string } }) => rp.permission.name === 'ADMIN_PANEL'
    )
  );
}
