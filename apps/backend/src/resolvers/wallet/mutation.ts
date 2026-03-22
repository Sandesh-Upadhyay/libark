import { GraphQLError } from 'graphql';
import { createLogger } from '@libark/core-shared';

import { GraphQLContext } from '../../graphql/context.js';
import { WalletService } from '../../services/WalletService.js';

import { checkSiteFeatureEnabled } from './utils.js';

const logger = createLogger({ name: 'wallet-mutation' });

export interface CreateDepositRequestInput {
  requestedUsdAmount: number;
  currency: string;
  network: string;
  userWalletAddress: string;
}

export interface CreateWithdrawalRequestInput {
  currency: string;
  amount: number;
  destinationAddress: string;
  memo?: string;
  network: string;
}

export interface RegisterUserWalletInput {
  walletName: string;
  currency: string;
  network: string;
  address: string;
}

export const walletMutations = {
  /**
   * 入金申請作成
   */
  createDepositRequest: async (
    _parent: unknown,
    { input }: { input: CreateDepositRequestInput },
    context: GraphQLContext
  ) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    const isEnabled = await checkSiteFeatureEnabled(context, 'WALLET_DEPOSIT');
    if (!isEnabled)
      throw new GraphQLError('ウォレット入金機能は現在無効になっています', {
        extensions: { code: 'FEATURE_DISABLED' },
      });

    try {
      const walletService = new WalletService(context.prisma);
      const depositRequest = await walletService.createDepositRequest({
        userId: context.user.id,
        requestedUsdAmount: input.requestedUsdAmount,
        currency: input.currency,
        network: input.network,
        userWalletAddress: input.userWalletAddress,
      });

      return {
        ...depositRequest,
        requestedUsdAmount: parseFloat(depositRequest.requestedUsdAmount?.toString() || '0'),
        expectedCryptoAmount: parseFloat(depositRequest.expectedCryptoAmount?.toString() || '0'),
        exchangeRate: parseFloat(depositRequest.exchangeRate?.toString() || '0'),
      };
    } catch (error) {
      logger.error('入金申請作成エラー:', error);
      throw new GraphQLError('入金申請の作成に失敗しました');
    }
  },

  /**
   * 出金申請作成
   */
  createWithdrawalRequest: async (
    _parent: unknown,
    { input }: { input: CreateWithdrawalRequestInput },
    context: GraphQLContext
  ) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    const isEnabled = await checkSiteFeatureEnabled(context, 'WALLET_WITHDRAW');
    if (!isEnabled)
      throw new GraphQLError('ウォレット出金機能は現在無効になっています', {
        extensions: { code: 'FEATURE_DISABLED' },
      });

    try {
      const walletService = new WalletService(context.prisma);
      const withdrawalRequest = await walletService.createWithdrawalRequest({
        userId: context.user.id,
        currency: input.currency,
        amount: input.amount,
        destinationAddress: input.destinationAddress,
        memo: input.memo,
        network: input.network,
      });

      return {
        ...withdrawalRequest,
        amount: parseFloat(withdrawalRequest.amount?.toString() || '0'),
        amountUsd: parseFloat(withdrawalRequest.amountUsd?.toString() || '0'),
      };
    } catch (error) {
      logger.error('出金申請作成エラー:', error);
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError('出金申請の作成に失敗しました');
    }
  },

  /**
   * ユーザーウォレット登録
   */
  registerUserWallet: async (
    _parent: unknown,
    { input }: { input: RegisterUserWalletInput },
    context: GraphQLContext
  ) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    try {
      return await context.prisma.userWallet.create({
        data: {
          userId: context.user.id,
          walletName: input.walletName,
          currency: input.currency,
          network: input.network,
          address: input.address,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('ユーザーウォレット登録エラー:', error);
      throw new GraphQLError('ユーザーウォレットの登録に失敗しました');
    }
  },

  /**
   * 残高間移動
   */
  transferBalance: async (
    _parent: unknown,
    {
      input,
    }: {
      input: {
        fromBalanceType: string;
        toBalanceType: string;
        amountUsd: number;
        description?: string;
      };
    },
    context: GraphQLContext
  ) => {
    if (!context.user)
      throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    // 権限チェック
    if (input.fromBalanceType === 'SALES') {
      const hasSeller = await context.prisma.userPermissionOverride.findFirst({
        where: {
          userId: context.user.id,
          permission: { name: { in: ['CONTENT_SELLER', 'ADMIN_PANEL', 'MANAGE_USERS'] } },
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!hasSeller) throw new GraphQLError('売上残高の操作にはCONTENT_SELLER権限が必要です');
    }

    if (input.fromBalanceType === 'P2P') {
      const hasP2P = await context.prisma.userPermissionOverride.findFirst({
        where: {
          userId: context.user.id,
          permission: { name: { in: ['P2P_TRADER', 'ADMIN_PANEL', 'MANAGE_USERS'] } },
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!hasP2P) throw new GraphQLError('P2P残高の操作にはP2P_TRADER権限が必要です');
    }

    try {
      const walletService = new WalletService(context.prisma);
      const result = await walletService.transferBalance({
        userId: context.user.id,
        fromBalanceType: input.fromBalanceType as 'WALLET' | 'SALES' | 'P2P',
        toBalanceType: input.toBalanceType as 'WALLET' | 'SALES' | 'P2P',
        amountUsd: input.amountUsd,
        description: input.description,
      });

      return {
        ...result,
        amountUsd: parseFloat(result.amountUsd.toString()),
      };
    } catch (error) {
      logger.error('残高移動エラー:', error);
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError('残高移動に失敗しました');
    }
  },
};
