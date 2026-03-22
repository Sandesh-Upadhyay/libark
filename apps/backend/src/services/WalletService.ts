/**
 * 🏦 WalletService
 *
 * ウォレット関連のビジネスロジックを担当するサービスクラス
 */

import { PrismaClient, Prisma, BalanceType } from '@libark/db';
import { createLogger } from '@libark/core-shared';
import { GraphQLError } from 'graphql';

import { exchangeRateService } from './ExchangeRateService.js';

const logger = createLogger({ name: 'wallet-service' });

// 暗号通貨フォールバックレート（APIから取得できない場合）
const CRYPTO_FALLBACK_RATES: Record<string, number> = {
  BTC: 45000,
  ETH: 3000,
  USDT: 1,
  BNB: 300,
  XRP: 0.5,
};

export interface CreateDepositRequestParams {
  userId: string;
  requestedUsdAmount: number;
  currency: string;
  network: string;
  userWalletAddress: string;
}

export interface CreateWithdrawalRequestParams {
  userId: string;
  currency: string;
  amount: number;
  destinationAddress: string;
  memo?: string;
  network: string;
}

export interface TransferBalanceParams {
  userId: string;
  fromBalanceType: BalanceType;
  toBalanceType: BalanceType;
  amountUsd: number;
  description?: string;
}

export class WalletService {
  constructor(private prisma: PrismaClient) {}

  /**
   * ユーザーのウォレットを取得、存在しない場合は作成
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balanceUsd: 0,
          salesBalanceUsd: 0,
          p2pBalanceUsd: 0,
          p2pLockedUsd: 0,
        },
      });
      logger.info(`新しいウォレットを作成しました: ${wallet.id}`, { userId });
    }

    return wallet;
  }

  /**
   * 入金申請を作成
   */
  async createDepositRequest(params: CreateDepositRequestParams) {
    const { userId, requestedUsdAmount, currency, network, userWalletAddress } = params;

    // ExchangeRateServiceから暗号通貨レートを取得（フォールバック付き）
    let exchangeRate: number;
    try {
      exchangeRate = await exchangeRateService.getRate(currency);
    } catch {
      // 暗号通貨の場合はフォールバックレートを使用
      exchangeRate = CRYPTO_FALLBACK_RATES[currency] || 1;
      logger.warn(`暗号通貨レート取得失敗、フォールバック使用: ${currency}=${exchangeRate}`);
    }
    const expectedCryptoAmount = requestedUsdAmount / exchangeRate;

    // モック入金アドレス生成
    const depositAddress = `mock_${currency}_${network}_address_${Date.now()}`;

    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 入金申請作成
      const depositRequest = await tx.depositRequest.create({
        data: {
          userId,
          requestedUsdAmount,
          currency,
          network,
          expectedCryptoAmount,
          exchangeRate,
          ourDepositAddress: depositAddress,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // ユーザーウォレット登録/更新
      await tx.userWallet.upsert({
        where: {
          userId_address_currency_network: {
            userId,
            address: userWalletAddress,
            currency,
            network,
          },
        },
        update: { isActive: true },
        create: {
          userId,
          walletName: `${currency} Wallet`,
          currency,
          network,
          address: userWalletAddress,
          isActive: true,
        },
      });

      return depositRequest;
    });
  }

  /**
   * 出金申請を作成
   */
  async createWithdrawalRequest(params: CreateWithdrawalRequestParams) {
    const { userId, currency, amount, destinationAddress, memo, network } = params;

    const wallet = await this.getOrCreateWallet(userId);

    // ExchangeRateServiceから暗号通貨レートを取得（フォールバック付き）
    let exchangeRate: number;
    try {
      exchangeRate = await exchangeRateService.getRate(currency);
    } catch {
      // 暗号通貨の場合はフォールバックレートを使用
      exchangeRate = CRYPTO_FALLBACK_RATES[currency] || 1;
      logger.warn(`暗号通貨レート取得失敗、フォールバック使用: ${currency}=${exchangeRate}`);
    }
    const amountUsd = amount * exchangeRate;

    if (Number(wallet.balanceUsd) < amountUsd) {
      throw new GraphQLError('残高が不足しています');
    }

    return await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        currency,
        amount,
        amountUsd,
        destinationAddress,
        memo,
        network,
      },
    });
  }

  /**
   * 残高間移動
   */
  async transferBalance(params: TransferBalanceParams) {
    const { userId, fromBalanceType, toBalanceType, amountUsd, description } = params;

    if (fromBalanceType === toBalanceType) {
      throw new GraphQLError('同じ残高種別間の移動はできません');
    }

    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new GraphQLError('ウォレットが見つかりません');

      // 残高チェック
      let currentBalance: number;
      switch (fromBalanceType) {
        case 'WALLET':
          currentBalance = Number(wallet.balanceUsd);
          break;
        case 'SALES':
          currentBalance = Number(wallet.salesBalanceUsd);
          break;
        case 'P2P':
          currentBalance = Number(wallet.p2pBalanceUsd);
          break;
        default:
          throw new GraphQLError('無効な残高種別です');
      }

      if (currentBalance < amountUsd) {
        throw new GraphQLError('残高が不足しています');
      }

      // 残高更新
      const updateData: Record<string, { decrement: number } | { increment: number }> = {};
      const decrementKey = this.getWalletBalanceKey(fromBalanceType);
      const incrementKey = this.getWalletBalanceKey(toBalanceType);

      updateData[decrementKey] = { decrement: amountUsd };
      updateData[incrementKey] = { increment: amountUsd };

      await tx.wallet.update({
        where: { userId },
        data: updateData,
      });

      // トランザクション記録
      const commonDesc = description || `${fromBalanceType}から${toBalanceType}への移動`;

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'TRANSFER',
          balanceType: fromBalanceType,
          amountUsd: -amountUsd, // 出金として記録
          description: commonDesc,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'TRANSFER',
          balanceType: toBalanceType,
          amountUsd: amountUsd, // 入金として記録
          description: commonDesc,
        },
      });

      return transaction;
    });
  }

  private getWalletBalanceKey(type: BalanceType): string {
    switch (type) {
      case 'WALLET':
        return 'balanceUsd';
      case 'SALES':
        return 'salesBalanceUsd';
      case 'P2P':
        return 'p2pBalanceUsd';
      default:
        throw new Error(`Unknown balance type: ${type}`);
    }
  }
}
