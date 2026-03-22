import { GraphQLError } from 'graphql';
import { createLogger } from '@libark/core-shared';

import { GraphQLContext } from '../../graphql/context.js';
import { WalletService } from '../../services/WalletService.js';

import { checkSiteFeatureEnabled } from './utils.js';

const logger = createLogger({ name: 'wallet-query' });

export const walletQueries = {
  /**
   * 現在のユーザーのウォレット取得
   */
  myWallet: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.user) {
      throw new GraphQLError('認証が必要です', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      const isWalletAccessEnabled = await checkSiteFeatureEnabled(context, 'WALLET_ACCESS');
      if (!isWalletAccessEnabled) {
        throw new GraphQLError('ウォレット機能は現在無効になっています', {
          extensions: { code: 'FEATURE_DISABLED' },
        });
      }

      const walletService = new WalletService(context.prisma);
      const wallet = await walletService.getOrCreateWallet(context.user.id);

      return {
        ...wallet,
        balanceUsd: parseFloat(wallet.balanceUsd?.toString() || '0'),
        salesBalanceUsd: parseFloat(wallet.salesBalanceUsd?.toString() || '0'),
        p2pBalanceUsd: parseFloat(wallet.p2pBalanceUsd?.toString() || '0'),
        p2pLockedUsd: parseFloat(wallet.p2pLockedUsd?.toString() || '0'),
      };
    } catch (error) {
      logger.error('ウォレット取得エラー:', error);
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError('ウォレット情報の取得に失敗しました');
    }
  },

  /**
   * ウォレット取引履歴取得
   */
  myWalletTransactions: async (
    _parent: unknown,
    { first = 20, after }: { first?: number; after?: string },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('認証が必要です', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      const transactions = await context.prisma.walletTransaction.findMany({
        where: { userId: context.user.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: first,
        skip: after ? 1 : 0,
        cursor: after ? { id: after } : undefined,
        include: {
          paymentRequest: {
            include: {
              provider: true,
            },
          },
        },
      });

      return transactions.map((transaction: any) => ({
        ...transaction,
        amountUsd: parseFloat(transaction.amountUsd?.toString() || '0'),
        metadata: transaction.metadata ? JSON.stringify(transaction.metadata) : null,
      }));
    } catch (error) {
      logger.error('取引履歴取得エラー:', error);
      throw new GraphQLError('取引履歴の取得に失敗しました');
    }
  },

  /**
   * ユーザーウォレット一覧取得
   */
  myUserWallets: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    try {
      return await context.prisma.userWallet.findMany({
        where: { userId: context.user.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('ユーザーウォレット取得エラー:', error);
      throw new GraphQLError('ユーザーウォレット情報の取得に失敗しました');
    }
  },

  /**
   * 入金申請一覧取得
   */
  myDepositRequests: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    try {
      const depositRequests = await context.prisma.depositRequest.findMany({
        where: { userId: context.user.id },
        orderBy: { createdAt: 'desc' },
      });

      return depositRequests.map((request: any) => ({
        ...request,
        requestedUsdAmount: parseFloat(request.requestedUsdAmount?.toString() || '0'),
        expectedCryptoAmount: parseFloat(request.expectedCryptoAmount?.toString() || '0'),
        exchangeRate: parseFloat(request.exchangeRate?.toString() || '0'),
      }));
    } catch (error) {
      logger.error('入金申請取得エラー:', error);
      throw new GraphQLError('入金申請情報の取得に失敗しました');
    }
  },

  /**
   * 出金申請一覧取得
   */
  myWithdrawalRequests: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    try {
      const withdrawalRequests = await context.prisma.withdrawalRequest.findMany({
        where: { userId: context.user.id },
        orderBy: { createdAt: 'desc' },
      });

      return withdrawalRequests.map((request: any) => ({
        ...request,
        amount: parseFloat(request.amount?.toString() || '0'),
        amountUsd: parseFloat(request.amountUsd?.toString() || '0'),
      }));
    } catch (error) {
      logger.error('出金申請取得エラー:', error);
      throw new GraphQLError('出金申請情報の取得に失敗しました');
    }
  },

  /**
   * 為替レート取得
   */
  getExchangeRate: async (_parent: unknown, { currency }: { currency: string }) => {
    try {
      const rates: Record<string, number> = { BTC: 45000, ETH: 3000, USDT: 1, BNB: 300 };
      return rates[currency] || 1;
    } catch (error) {
      logger.error('為替レート取得エラー:', error);
      throw new GraphQLError('為替レートの取得に失敗しました');
    }
  },

  /**
   * サポート通貨一覧取得
   */
  getSupportedCurrencies: async () => {
    return ['BTC', 'ETH', 'USDT', 'BNB'];
  },

  /**
   * 権限管理クエリ
   */
  myPermissions: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    try {
      const user = await context.prisma.user.findUnique({
        where: { id: context.user.id },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
          permissionOverrides: {
            include: {
              permission: true,
              grantedByUser: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      });

      if (!user) throw new GraphQLError('ユーザーが見つかりません');

      const rolePermissions =
        user.role?.permissions.map((rp: any) => ({
          id: rp.permission.id,
          userId: user.id,
          permissionId: rp.permission.id,
          isActive: true,
          grantedAt: user.createdAt,
          expiresAt: null,
          permission: rp.permission,
          grantedByUser: null,
        })) || [];

      const overridePermissions = user.permissionOverrides
        .filter((o: any) => o.allowed)
        .map((o: any) => ({
          id: o.id,
          userId: user.id,
          permissionId: o.permission.id,
          isActive: true,
          grantedAt: o.grantedAt,
          expiresAt: o.expiresAt,
          permission: o.permission,
          grantedByUser: o.grantedByUser,
        }));

      const all = [...rolePermissions, ...overridePermissions];
      return all.filter((p, i, s) => i === s.findIndex(p2 => p2.permissionId === p.permissionId));
    } catch (error) {
      logger.error('ユーザー権限取得エラー:', error);
      throw new GraphQLError('ユーザー権限の取得に失敗しました');
    }
  },

  allPermissions: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    const user = await context.prisma.user.findUnique({
      where: { id: context.user.id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissionOverrides: { include: { permission: true } },
      },
    });

    const hasAdmin =
      user?.role?.permissions.some((rp: any) =>
        ['ADMIN_PANEL', 'MANAGE_USERS'].includes(rp.permission.name)
      ) ||
      user?.permissionOverrides.some(
        (o: any) => ['ADMIN_PANEL', 'MANAGE_USERS'].includes(o.permission.name) && o.allowed
      );

    if (!hasAdmin)
      throw new GraphQLError('管理者権限が必要です', { extensions: { code: 'FORBIDDEN' } });

    try {
      return await context.prisma.permission.findMany({ orderBy: { name: 'asc' } });
    } catch (error) {
      logger.error('権限一覧取得エラー:', error);
      throw new GraphQLError('権限一覧の取得に失敗しました');
    }
  },

  userPermissions: async (_parent: unknown, args: { userId: string }, context: GraphQLContext) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    const admin = await context.prisma.user.findUnique({
      where: { id: context.user.id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissionOverrides: { include: { permission: true } },
      },
    });

    const hasAdmin =
      admin?.role?.permissions.some((rp: any) =>
        ['ADMIN_PANEL', 'MANAGE_USERS'].includes(rp.permission.name)
      ) ||
      admin?.permissionOverrides.some(
        (o: any) => ['ADMIN_PANEL', 'MANAGE_USERS'].includes(o.permission.name) && o.allowed
      );

    if (!hasAdmin)
      throw new GraphQLError('管理者権限が必要です', { extensions: { code: 'FORBIDDEN' } });

    try {
      const targetUser = await context.prisma.user.findUnique({
        where: { id: args.userId },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
          permissionOverrides: {
            include: {
              permission: true,
              grantedByUser: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      });

      if (!targetUser) throw new GraphQLError('ユーザーが見つかりません');

      const rolePermissions =
        targetUser.role?.permissions.map((rp: any) => ({
          id: rp.permission.id,
          userId: targetUser.id,
          permissionId: rp.permission.id,
          isActive: true,
          grantedAt: targetUser.createdAt,
          expiresAt: null,
          permission: rp.permission,
          grantedByUser: null,
        })) || [];

      const overridePermissions = targetUser.permissionOverrides
        .filter((o: any) => o.allowed)
        .map((o: any) => ({
          id: o.id,
          userId: targetUser.id,
          permissionId: o.permission.id,
          isActive: true,
          grantedAt: o.grantedAt,
          expiresAt: o.expiresAt,
          permission: o.permission,
          grantedByUser: o.grantedByUser,
        }));

      const all = [...rolePermissions, ...overridePermissions];
      return all.filter((p, i, s) => i === s.findIndex(p2 => p2.permissionId === p.permissionId));
    } catch (error) {
      logger.error('ユーザー権限取得エラー:', error);
      throw new GraphQLError('ユーザー権限の取得に失敗しました');
    }
  },

  myWalletTransactionsByBalance: async (
    _parent: unknown,
    args: { balanceType: string; first?: number; after?: string },
    context: GraphQLContext
  ) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    try {
      const transactions = await context.prisma.walletTransaction.findMany({
        where: {
          userId: context.user.id,
          balanceType: args.balanceType as 'WALLET' | 'SALES' | 'P2P',
        },
        take: args.first || 20,
        orderBy: { createdAt: 'desc' },
      });

      return transactions.map(
        (transaction: { amountUsd: { toString: () => string } } & Record<string, unknown>) => ({
          ...transaction,
          amountUsd: parseFloat(transaction.amountUsd?.toString() || '0'),
        })
      );
    } catch (error) {
      logger.error('ウォレット取引履歴取得エラー:', error);
      throw new GraphQLError('ウォレット取引履歴の取得に失敗しました');
    }
  },
};
