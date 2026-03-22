/**
 * 🔔 ウォレット通知サービス
 *
 * ウォレット関連のリアルタイム通知を管理
 */

import { createLogger } from '@libark/core-shared';
import { prisma } from '@libark/db';

import { GraphQLContext } from '../graphql/context.js';

const logger = createLogger({ name: 'wallet-notification-service' });

export interface WalletNotificationData {
  userId: string;
  type:
    | 'WALLET_DEPOSIT_COMPLETED'
    | 'WALLET_WITHDRAWAL_COMPLETED'
    | 'WALLET_WITHDRAWAL_FAILED'
    | 'P2P_TRADE_CREATED'
    | 'P2P_TRADE_MATCHED'
    | 'P2P_PAYMENT_SENT'
    | 'P2P_TRADE_COMPLETED'
    | 'P2P_TRADE_CANCELLED'
    | 'P2P_TRADE_TIMEOUT'
    | 'P2P_DISPUTE_CREATED'
    | 'P2P_DISPUTE_RESOLVED';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class WalletNotificationService {
  private static instance: WalletNotificationService;
  private context: GraphQLContext | null = null;

  private constructor() {}

  static getInstance(): WalletNotificationService {
    if (!WalletNotificationService.instance) {
      WalletNotificationService.instance = new WalletNotificationService();
    }
    return WalletNotificationService.instance;
  }

  /**
   * GraphQLコンテキストを設定
   */
  setContext(context: GraphQLContext) {
    this.context = context;
  }

  /**
   * 入金完了通知
   */
  async notifyDepositCompleted(
    userId: string,
    depositRequestId: string,
    amount: number,
    currency: string
  ) {
    try {
      // データベースに通知を保存
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'WALLET_DEPOSIT_COMPLETED',
          content: `${amount.toFixed(8)} ${currency}の入金が完了しました`,
        },
      });

      // リアルタイム通知を送信
      await this.sendRealtimeNotification(userId, notification);

      // ウォレット残高更新通知
      await this.notifyWalletBalanceUpdated(userId);

      logger.info(`入金完了通知を送信しました`, {
        userId,
        depositRequestId,
        amount,
        currency,
      });
    } catch (error) {
      logger.error('入金完了通知の送信に失敗しました:', error);
    }
  }

  /**
   * 出金完了通知
   */
  async notifyWithdrawalCompleted(
    userId: string,
    withdrawalRequestId: string,
    amount: number,
    currency: string,
    txHash?: string
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'WALLET_WITHDRAWAL_COMPLETED',
          content: `${amount.toFixed(8)} ${currency}の出金が完了しました`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);
      await this.notifyWalletBalanceUpdated(userId);

      logger.info(`出金完了通知を送信しました`, {
        userId,
        withdrawalRequestId,
        amount,
        currency,
        txHash,
      });
    } catch (error) {
      logger.error('出金完了通知の送信に失敗しました:', error);
    }
  }

  /**
   * 出金失敗通知
   */
  async notifyWithdrawalFailed(
    userId: string,
    withdrawalRequestId: string,
    amount: number,
    currency: string,
    reason: string
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'WALLET_WITHDRAWAL_FAILED',
          content: `${amount.toFixed(8)} ${currency}の出金に失敗しました: ${reason}`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`出金失敗通知を送信しました`, {
        userId,
        withdrawalRequestId,
        amount,
        currency,
        reason,
      });
    } catch (error) {
      logger.error('出金失敗通知の送信に失敗しました:', error);
    }
  }

  /**
   * ウォレット残高更新通知
   */
  async notifyWalletBalanceUpdated(userId: string) {
    if (!this.context?.redisPubSub) {
      logger.warn('Redis PubSub not available for wallet balance notification');
      return;
    }

    try {
      // 最新のウォレット情報を取得
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (wallet) {
        const channel = `wallet_balance_updated:${userId}`;
        await this.context.redisPubSub.publish(channel, {
          type: 'walletBalanceUpdated',
          timestamp: new Date().toISOString(),
          walletBalanceUpdated: {
            ...wallet,
            balanceUsd: parseFloat(wallet.balanceUsd.toString()),
          },
        });

        logger.info(`ウォレット残高更新通知を送信しました`, { userId, balance: wallet.balanceUsd });
      }
    } catch (error) {
      logger.error('ウォレット残高更新通知の送信に失敗しました:', error);
    }
  }

  /**
   * ウォレット取引追加通知
   */
  async notifyWalletTransactionAdded(userId: string, transactionId: string) {
    if (!this.context?.redisPubSub) {
      logger.warn('Redis PubSub not available for wallet transaction notification');
      return;
    }

    try {
      const transaction = await prisma.walletTransaction.findUnique({
        where: { id: transactionId },
        include: {
          paymentRequest: true,
        },
      });

      if (transaction) {
        const channel = `wallet_transaction_added:${userId}`;
        await this.context.redisPubSub.publish(channel, {
          type: 'walletTransactionAdded',
          timestamp: new Date().toISOString(),
          walletTransactionAdded: {
            ...transaction,
            amountUsd: parseFloat(transaction.amountUsd.toString()),
            currencyAmount: (transaction as unknown as { currencyAmount?: { toString(): string } })
              .currencyAmount
              ? parseFloat(
                  (
                    transaction as unknown as { currencyAmount: { toString(): string } }
                  ).currencyAmount.toString()
                )
              : null,
            expectedAmount: (transaction as unknown as { expectedAmount?: { toString(): string } })
              .expectedAmount
              ? parseFloat(
                  (
                    transaction as unknown as { expectedAmount: { toString(): string } }
                  ).expectedAmount.toString()
                )
              : null,
            exchangeRate: (transaction as unknown as { exchangeRate?: { toString(): string } })
              .exchangeRate
              ? parseFloat(
                  (
                    transaction as unknown as { exchangeRate: { toString(): string } }
                  ).exchangeRate.toString()
                )
              : null,
            metadata: transaction.metadata ? JSON.stringify(transaction.metadata) : null,
          },
        });

        logger.info(`ウォレット取引追加通知を送信しました`, { userId, transactionId });
      }
    } catch (error) {
      logger.error('ウォレット取引追加通知の送信に失敗しました:', error);
    }
  }

  /**
   * 入金申請更新通知
   */
  async notifyDepositRequestUpdated(userId: string, depositRequestId: string) {
    if (!this.context?.redisPubSub) {
      logger.warn('Redis PubSub not available for deposit request notification');
      return;
    }

    try {
      const depositRequest = await prisma.depositRequest.findUnique({
        where: { id: depositRequestId },
        // 付随データは不要（通知ペイロードで主要数値のみ送る）
      });

      if (depositRequest) {
        const channel = `deposit_request_updated:${userId}`;
        await this.context.redisPubSub.publish(channel, {
          type: 'depositRequestUpdated',
          timestamp: new Date().toISOString(),
          depositRequestUpdated: {
            ...depositRequest,
            requestedUsdAmount: parseFloat(depositRequest.requestedUsdAmount.toString()),
            expectedCryptoAmount: parseFloat(depositRequest.expectedCryptoAmount.toString()),
            exchangeRate: parseFloat(depositRequest.exchangeRate.toString()),
          },
        });

        logger.info(`入金申請更新通知を送信しました`, { userId, depositRequestId });
      }
    } catch (error) {
      logger.error('入金申請更新通知の送信に失敗しました:', error);
    }
  }

  /**
   * 出金申請更新通知
   */
  async notifyWithdrawalRequestUpdated(userId: string, withdrawalRequestId: string) {
    if (!this.context?.redisPubSub) {
      logger.warn('Redis PubSub not available for withdrawal request notification');
      return;
    }

    try {
      const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
        where: { id: withdrawalRequestId },
        // 付随データは不要（通知ペイロードで主要数値のみ送る）
      });

      if (withdrawalRequest) {
        const channel = `withdrawal_request_updated:${userId}`;
        await this.context.redisPubSub.publish(channel, {
          type: 'withdrawalRequestUpdated',
          timestamp: new Date().toISOString(),
          withdrawalRequestUpdated: {
            ...withdrawalRequest,
            amount: parseFloat(withdrawalRequest.amount.toString()),
            amountUsd: parseFloat(withdrawalRequest.amountUsd.toString()),
          },
        });

        logger.info(`出金申請更新通知を送信しました`, { userId, withdrawalRequestId });
      }
    } catch (error) {
      logger.error('出金申請更新通知の送信に失敗しました:', error);
    }
  }

  /**
   * リアルタイム通知を送信
   */
  private async sendRealtimeNotification(userId: string, notification: unknown) {
    if (!this.context?.redisPubSub) {
      logger.warn('Redis PubSub not available for realtime notification');
      return;
    }

    try {
      const channel = `notification_added:${userId}`;
      await this.context.redisPubSub.publish(channel, {
        type: 'notificationAdded',
        timestamp: new Date().toISOString(),
        notificationAdded: notification,
      });
    } catch (error) {
      logger.error('リアルタイム通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P取引作成通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param amountUsd 金額（USD）
   * @param fiatCurrency 法定通貨
   * @param fiatAmount 法定通貨金額
   */
  async notifyP2PTradeCreated(
    userId: string,
    tradeId: string,
    amountUsd: number,
    fiatCurrency: string,
    fiatAmount: number
  ): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'P2P_TRADE_CREATED',
          content: `$${amountUsd} USD（${fiatAmount} ${fiatCurrency}）の入金リクエストを作成しました`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P取引作成通知を送信しました`, {
        userId,
        tradeId,
        amountUsd,
        fiatCurrency,
        fiatAmount,
      });
    } catch (error) {
      logger.error('P2P取引作成通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P取引マッチング通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param sellerName 売り手名
   */
  async notifyP2PTradeMatched(userId: string, tradeId: string, sellerName: string): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'P2P_TRADE_MATCHED',
          content: `${sellerName}があなたの取引を承認しました。支払いを完了してください`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P取引マッチング通知を送信しました`, {
        userId,
        tradeId,
        sellerName,
      });
    } catch (error) {
      logger.error('P2P取引マッチング通知の送信に失敗しました:', error);
    }
  }

  /**
   * 支払い送信通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param buyerName 買い手名
   */
  async notifyP2PPaymentSent(userId: string, tradeId: string, buyerName: string): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'P2P_PAYMENT_SENT',
          content: `${buyerName}が支払いを完了しました。受領を確認してください`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`支払い送信通知を送信しました`, {
        userId,
        tradeId,
        buyerName,
      });
    } catch (error) {
      logger.error('支払い送信通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P取引完了通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param amountUsd 金額（USD）
   */
  async notifyP2PTradeCompleted(userId: string, tradeId: string, amountUsd: number): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'P2P_TRADE_COMPLETED',
          content: `$${amountUsd} USDがP2P残高に入金されました`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P取引完了通知を送信しました`, {
        userId,
        tradeId,
        amountUsd,
      });
    } catch (error) {
      logger.error('P2P取引完了通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P取引キャンセル通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param reason キャンセル理由
   */
  async notifyP2PTradeCancelled(userId: string, tradeId: string, reason?: string): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'P2P_TRADE_CANCELLED',
          content: reason || '取引がキャンセルされました',
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P取引キャンセル通知を送信しました`, {
        userId,
        tradeId,
        reason,
      });
    } catch (error) {
      logger.error('P2P取引キャンセル通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P取引タイムアウト通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   */
  /**
   * P2P取引タイムアウト通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   */
  async notifyP2PTradeTimeout(userId: string, tradeId: string): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'P2P_TRADE_TIMEOUT',
          content: '取引期限が切れました。新しい取引を作成してください',
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P取引タイムアウト通知を送信しました`, {
        userId,
        tradeId,
      });
    } catch (error) {
      logger.error('P2P取引タイムアウト通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P紛争作成通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param isInitiator 紛争を提起した本人かどうか
   */
  async notifyP2PDisputeCreated(userId: string, tradeId: string, isInitiator: boolean): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'POST_PROCESSING_COMPLETED' as const, // Placeholder until P2P_DISPUTE_CREATED is added to schema
          content: isInitiator
            ? '紛争報告を受け付けました。管理者の確認をお待ちください。'
            : '取引に対して紛争が報告されました。管理者が確認中です。',
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P紛争作成通知を送信しました`, {
        userId,
        tradeId,
        isInitiator,
      });
    } catch (error) {
      logger.error('P2P紛争作成通知の送信に失敗しました:', error);
    }
  }

  /**
   * P2P紛争解決通知を送信する
   * @param userId ユーザーID
   * @param tradeId 取引ID
   * @param result 解決結果
   */
  async notifyP2PDisputeResolved(userId: string, tradeId: string, result: string): Promise<void> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'POST_PROCESSING_COMPLETED' as const, // Placeholder until P2P_DISPUTE_RESOLVED is added to schema
          content: `紛争が解決されました。結果を確認してください。`,
        },
      });

      await this.sendRealtimeNotification(userId, notification);

      logger.info(`P2P紛争解決通知を送信しました`, {
        userId,
        tradeId,
        result,
      });
    } catch (error) {
      logger.error('P2P紛争解決通知の送信に失敗しました:', error);
    }
  }
}
