import { prisma, type Prisma, type PrismaClient } from '@libark/db';
import { logger } from '@libark/core-shared';
import { RedisPubSubManager, counterManager } from '@libark/redis-client';

import { encryptPaymentDetailsObject } from '../utils/encryption';

import { WalletNotificationService } from './WalletNotificationService';

// 分布ロックキー
const OFFER_LOCK_KEY = 'p2p_offer_lock:';
const OFFER_LOCK_TTL = 30; // 30秒

// 固定為替レート（API障害時のフォールバック）
const _FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  JPY: 150.0,
  USD: 1.0,
  EUR: 0.92,
};

export interface ExchangeRate {
  currency: string;
  rate: number;
  timestamp: number;
}

export interface OfferMatchResult {
  offerId: string;
  sellerId: string;
  exchangeRate: number;
  fiatAmount: number;
}

export class P2PTradeService {
  private notificationService: WalletNotificationService;
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.notificationService = WalletNotificationService.getInstance();
    if (!prisma) {
      throw new Error('PrismaClient is required');
    }
    this.prisma = prisma;
  }

  /**
   * P2P取引更新イベントをパブリッシュする
   * @param trade 取引データ
   */
  async publishTradeUpdate(trade: {
    id: string;
    buyerId: string;
    sellerId?: string | null;
    status: string;
  }): Promise<void> {
    try {
      const pubsub = RedisPubSubManager.getInstance();

      // 買い手に通知
      if (trade.buyerId) {
        await pubsub.publish(`p2p_trade_updated:${trade.buyerId}`, {
          type: 'P2P_TRADE_UPDATED',
          timestamp: new Date().toISOString(),
          data: {
            tradeId: trade.id,
            status: trade.status,
            trade,
          },
        });
      }

      // 売り手に通知
      if (trade.sellerId && trade.sellerId !== trade.buyerId) {
        await pubsub.publish(`p2p_trade_updated:${trade.sellerId}`, {
          type: 'P2P_TRADE_UPDATED',
          timestamp: new Date().toISOString(),
          data: {
            tradeId: trade.id,
            status: trade.status,
            trade,
          },
        });
      }

      logger.info('[P2PTradeService] Trade update published:', trade.id, trade.status);
    } catch (error) {
      logger.error('[P2PTradeService] Failed to publish trade update:', error);
      // エラーは握りつぶす（通知失敗は取引フローを止めない）
    }
  }

  /**
   * 為替レートを取得する（キャッシュ付き）
   * @param currency 通貨コード（JPY, USD, EUR等）
   * @returns 為替レート
   */
  async getExchangeRate(currency: string): Promise<number> {
    // ExchangeRateServiceからレートを取得
    const { exchangeRateService } = await import('./ExchangeRateService.js');
    return exchangeRateService.getRate(currency);
  }

  /**
   * 最適なオファーをマッチングする
   * @param amountUsd USD金額
   * @param fiatCurrency 法定通貨
   * @param paymentMethod 支払い方法（オプション）
   * @returns マッチング結果
   */
  async matchOffer(
    amountUsd: number,
    fiatCurrency: string,
    paymentMethod?: string
  ): Promise<OfferMatchResult | null> {
    // 分散ロックを取得
    const lockKey = `${OFFER_LOCK_KEY}${fiatCurrency}:${amountUsd}`;
    const lockAcquired = await counterManager.acquireLock(lockKey, OFFER_LOCK_TTL);
    if (!lockAcquired) {
      logger.warn(
        '[P2PTradeService] Failed to acquire lock for matchOffer, proceeding without lock'
      );
    }

    const offers = await this.prisma.p2POffer.findMany({
      where: {
        isActive: true,
        fiatCurrency,
        minAmountUsd: { lte: amountUsd },
        maxAmountUsd: { gte: amountUsd },
        ...(paymentMethod && {
          paymentMethods: {
            has: paymentMethod as string,
          },
        }),
      },
      include: {
        seller: true,
      },
    });
    if (offers.length === 0) {
      return null;
    }

    // マージンが最も低いオファーを選択
    const bestOffer = (offers as any[]).reduce((best: any, current: any) => {
      return Number(current.exchangeRateMargin) < Number(best.exchangeRateMargin) ? current : best;
    }, offers[0]);
    const exchangeRate = await this.getExchangeRate(fiatCurrency);
    const baseRate = exchangeRate * (1 + Number(bestOffer.exchangeRateMargin) / 100);
    const fiatAmount = amountUsd * baseRate;

    return {
      offerId: bestOffer.id,
      sellerId: bestOffer.sellerId,
      exchangeRate: baseRate,
      fiatAmount,
    };
  }

  /**
   * 取引リクエストを作成する
   * @param buyerId 買い手ID
   * @param amountUsd USD金額
   * @param fiatCurrency 法定通貨
   * @param paymentMethod 支払い方法
   * @param offerId オファーID（オプション）
   * @returns 作成された取引リクエスト
   */
  async createTradeRequest(
    buyerId: string,
    amountUsd: number,
    fiatCurrency: string,
    paymentMethod?: string,
    offerId?: string
  ) {
    // offerIdが提供されている場合は、オファーを検証
    if (offerId) {
      const offer = await this.prisma.p2POffer.findUnique({
        where: { id: offerId },
      });

      if (!offer || !offer.isActive) {
        throw new Error('オファーが見つからないか、非アクティブです');
      }

      if (amountUsd < Number(offer.minAmountUsd) || amountUsd > Number(offer.maxAmountUsd)) {
        throw new Error('金額が範囲外です');
      }

      // ロックキーをofferIdに統一
      const lockKey = `p2p_offer_lock:${offerId}`;

      // 分散ロックを取得
      const lockAcquired = await counterManager.acquireLock(lockKey, OFFER_LOCK_TTL);
      if (!lockAcquired) {
        throw new Error('オファーが現在使用中です。しばらくしてから再試行してください。');
      }

      try {
        // レート計算
        const baseExchangeRate = await this.getExchangeRate(offer.fiatCurrency);
        const appliedRate = baseExchangeRate * (1 + Number(offer.exchangeRateMargin) / 100);
        const fiatAmount = amountUsd * appliedRate;

        // 取引リクエストを作成
        const tradeRequest = await this.prisma.p2PTradeRequest.create({
          data: {
            buyerId,
            sellerId: offer.sellerId,
            amountUsd,
            fiatCurrency: offer.fiatCurrency,
            fiatAmount,
            exchangeRate: appliedRate,
            paymentMethod: offer.paymentMethod,
            offerId: offer.id,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後
          },
          include: {
            buyer: true,
            seller: true,
          },
        });

        // イベントをパブリッシュ
        await this.publishTradeUpdate(tradeRequest as any);

        // 通知を送信
        await this.notificationService.notifyP2PTradeCreated(
          buyerId,
          tradeRequest.id,
          amountUsd,
          offer.fiatCurrency,
          amountUsd * Number(offer.exchangeRateMargin)
        );

        return tradeRequest;
      } catch (error) {
        // ロック取得後にエラーが発生した場合もロックは自動的にTTLで解放される
        throw error;
      }
    }

    // 旧ロジック（互換性維持のため残す）
    const matchResult = await this.matchOffer(amountUsd, fiatCurrency, paymentMethod);
    if (!matchResult) {
      throw new Error('利用可能なオファーが見つかりません');
    }

    // 取引リクエストを作成
    const tradeRequest = await this.prisma.p2PTradeRequest.create({
      data: {
        buyerId,
        sellerId: matchResult.sellerId,
        amountUsd,
        fiatCurrency,
        fiatAmount: matchResult.fiatAmount,
        exchangeRate: matchResult.exchangeRate,
        paymentMethod: paymentMethod as any,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    // イベントをパブリッシュ
    await this.publishTradeUpdate(tradeRequest as any);

    // 通知を送信
    await this.notificationService.notifyP2PTradeCreated(
      buyerId,
      tradeRequest.id,
      amountUsd,
      fiatCurrency,
      matchResult.fiatAmount
    );

    return tradeRequest;
  }

  /**
   * 取引をキャンセルする
   * @param tradeId 取引ID
   * @param userId ユーザーID
   * @returns キャンセルされた取引
   */
  async cancelTradeRequest(tradeId: string, userId: string) {
    const trade = await this.prisma.p2PTradeRequest.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      throw new Error('取引が見つかりません');
    }

    // 権限チェック
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new Error('この取引をキャンセルする権限がありません');
    }

    // キャンセル可能なステータスか確認
    if (!['PENDING', 'MATCHED'].includes(trade.status) && trade.status !== 'PAYMENT_SENT') {
      throw new Error('この取引はキャンセルできません');
    }

    // エスクローが存在する場合は解放
    if (trade.escrowAmount && trade.sellerId) {
      await this.cancelEscrow(trade.sellerId, Number(trade.escrowAmount), tradeId);
    }

    const updatedTrade = await this.prisma.p2PTradeRequest.update({
      where: { id: tradeId },
      data: { status: 'CANCELLED' },
      include: {
        buyer: true,
        seller: true,
      },
    });

    // イベントをパブリッシュ
    await this.publishTradeUpdate(updatedTrade as any);

    // 通知を送信
    await this.notificationService.notifyP2PTradeCancelled(
      userId,
      updatedTrade.id,
      '取引がキャンセルされました'
    );

    return updatedTrade;
  }

  /**
   * 支払い完了をマークする
   * @param tradeId 取引ID
   * @param userId ユーザーID
   * @returns 更新された取引
   */
  async markPaymentSent(tradeId: string, userId: string) {
    const trade = await this.prisma.p2PTradeRequest.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      throw new Error('取引が見つかりません');
    }

    // 権限チェック（買い手のみ）
    if (trade.buyerId !== userId) {
      throw new Error('この操作は買い手のみ可能です');
    }

    // ステータス遷移の検証
    if (trade.status !== 'MATCHED') {
      throw new Error('オファーが承認されていません');
    }

    const updatedTrade = await this.prisma.p2PTradeRequest.update({
      where: { id: tradeId },
      data: { status: 'PAYMENT_SENT' },
      include: {
        buyer: true,
        seller: true,
      },
    });

    // イベントをパブリッシュ
    await this.publishTradeUpdate(updatedTrade as any);

    // 通知を送信
    if (trade.sellerId) {
      await this.notificationService.notifyP2PPaymentSent(
        trade.sellerId,
        updatedTrade.id,
        updatedTrade.buyer?.username ?? '買い手'
      );
    }

    return updatedTrade;
  }

  /**
   * オファーを承認する
   * @param tradeId 取引ID
   * @param sellerId 売り手ID
   * @param paymentDetails 支払い詳細情報
   * @returns 更新された取引
   */
  async acceptTradeRequest(tradeId: string, sellerId: string, paymentDetails: Record<string, any>) {
    // 取引リクエストを取得
    const tradeRequest = await this.prisma.p2PTradeRequest.findUnique({
      where: { id: tradeId },
      include: { p2pOffer: true },
    });

    if (!tradeRequest) {
      throw new Error('取引が見つかりません');
    }

    if (tradeRequest.sellerId !== sellerId) {
      throw new Error('認証されていません');
    }

    if (tradeRequest.status !== 'PENDING') {
      throw new Error('取引リクエストは保留状態ではありません');
    }

    // オファーがアクティブか確認
    // Note: Prisma 7.x でリレーションが空配列として返される場合があるため、
    // offerId経由で直接オファーを取得する
    if (tradeRequest.offerId) {
      const offer = await this.prisma.p2POffer.findUnique({
        where: { id: tradeRequest.offerId },
      });
      if (offer && !offer.isActive) {
        throw new Error('オファーは非アクティブです');
      }
    }

    // 支払い詳細を暗号化
    const encryptedDetails = encryptPaymentDetailsObject(paymentDetails);

    // エスクローを作成
    await this.createEscrow(sellerId, Number(tradeRequest.amountUsd), tradeId);

    const updatedTrade = await this.prisma.p2PTradeRequest.update({
      where: { id: tradeId },
      data: {
        status: 'MATCHED',
        paymentDetails: encryptedDetails,
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    // イベントをパブリッシュ
    await this.publishTradeUpdate(updatedTrade as any);

    // 通知を送信
    await this.notificationService.notifyP2PTradeMatched(
      tradeRequest.buyerId,
      updatedTrade.id,
      updatedTrade.seller?.username ?? '売り手'
    );

    return updatedTrade;
  }

  /**
   * 支払い受領を確認する
   * @param tradeId 取引ID
   * @param sellerId 売り手ID
   * @returns 更新された取引
   */
  async confirmPaymentReceived(tradeId: string, sellerId: string) {
    const trade = await this.prisma.p2PTradeRequest.findUnique({
      where: { id: tradeId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!trade) {
      throw new Error('取引が見つかりません');
    }

    // 権限チェック（売り手のみ）
    if (trade.sellerId !== sellerId) {
      throw new Error('この操作は売り手のみ可能です');
    }

    // ステータス遷移の検証
    if (trade.status !== 'PAYMENT_SENT') {
      throw new Error('支払いが完了していません');
    }

    // エスクローを解放
    if (trade.amountUsd && trade.buyerId && trade.sellerId) {
      await this.releaseEscrow(trade.buyerId, trade.sellerId, Number(trade.amountUsd), tradeId);
    }

    const updatedTrade = await this.prisma.p2PTradeRequest.update({
      where: { id: tradeId },
      data: {
        status: 'CONFIRMED',
        completedAt: new Date(),
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    // イベントをパブリッシュ
    await this.publishTradeUpdate(updatedTrade as any);

    // 通知を送信
    if (trade.buyerId) {
      await this.notificationService.notifyP2PTradeCompleted(
        trade.buyerId,
        updatedTrade.id,
        Number(trade.amountUsd)
      );
    }

    return updatedTrade;
  }

  /**
   * 期限切れの取引をキャンセルする
   * @returns キャンセルされた取引の数
   */
  async cancelExpiredTrades(): Promise<number> {
    const now = new Date();

    // 期限切れの取引を取得
    const expiredTrades = await this.prisma.p2PTradeRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'MATCHED', 'PAYMENT_SENT'],
        },
        expiresAt: {
          lt: now,
        },
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    // 取引をキャンセル
    const result = await this.prisma.p2PTradeRequest.updateMany({
      where: {
        status: {
          in: ['PENDING', 'MATCHED', 'PAYMENT_SENT'],
        },
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // 期限切れの取引に対して通知を送信
    for (const trade of expiredTrades) {
      await this.publishTradeUpdate(trade as any);

      if (trade.buyerId) {
        await this.notificationService.notifyP2PTradeTimeout(trade.buyerId, trade.id);
      }
      if (trade.sellerId && trade.sellerId !== trade.buyerId) {
        await this.notificationService.notifyP2PTradeTimeout(trade.sellerId, trade.id);
      }
    }

    return result.count;
  }

  /**
   * エスクローを作成する（売り手のP2P残高からロック）
   * @param sellerId 売り手ID
   * @param amount ロックする金額（USD）
   * @param tradeId 取引ID
   */
  async createEscrow(sellerId: string, amount: number, tradeId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 売り手のウォレットを取得
      const wallet = await tx.wallet.findUnique({
        where: { userId: sellerId },
      });

      if (!wallet) {
        throw new Error('ウォレットが見つかりません');
      }

      // P2P残高が十分か確認
      if (Number(wallet.p2pBalanceUsd) < amount) {
        throw new Error('P2P残高が不足しています');
      }

      // P2P残高からロック（p2pBalanceUsd減算 + p2pLockedUsd増加）
      await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          p2pBalanceUsd: {
            decrement: amount,
          },
          p2pLockedUsd: {
            increment: amount,
          },
        },
      });

      // エスクロートランザクションを作成
      await tx.walletTransaction.create({
        data: {
          userId: sellerId,
          type: 'TRANSFER',
          amountUsd: -amount,
          balanceType: 'P2P',
          description: `P2P取引エスクロー: ${tradeId}`,
          metadata: {
            tradeId,
          },
        },
      });
    });
  }

  /**
   * エスクローを解放する（売り手のロックを解除し、買い手のP2P残高に入金）
   * @param buyerId 買い手ID
   * @param sellerId 売り手ID
   * @param amount 入金する金額（USD）
   * @param tradeId 取引ID
   */
  async releaseEscrow(
    buyerId: string,
    sellerId: string,
    amount: number,
    tradeId: string
  ): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 売り手のウォレットを取得
      const sellerWallet = await tx.wallet.findUnique({
        where: { userId: sellerId },
      });

      if (!sellerWallet) {
        throw new Error('売り手のウォレットが見つかりません');
      }

      // 売り手のロック残高が十分か確認
      if (Number(sellerWallet.p2pLockedUsd) < amount) {
        throw new Error('ロック残高が不足しています');
      }

      // 売り手のロック残高を減算
      await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          p2pLockedUsd: {
            decrement: amount,
          },
        },
      });

      // 買い手のウォレットを取得または作成
      let buyerWallet = await tx.wallet.findUnique({
        where: { userId: buyerId },
      });

      if (!buyerWallet) {
        buyerWallet = await tx.wallet.create({
          data: {
            userId: buyerId,
            p2pBalanceUsd: amount,
            p2pLockedUsd: 0,
            balanceUsd: 0,
          },
        });
      } else {
        await tx.wallet.update({
          where: { userId: buyerId },
          data: {
            p2pBalanceUsd: {
              increment: amount,
            },
          },
        });
      }

      // 売り手のロック解除トランザクションを作成
      await tx.walletTransaction.create({
        data: {
          userId: sellerId,
          type: 'TRANSFER',
          amountUsd: -amount,
          balanceType: 'P2P',
          description: `P2P取引エスクロー解放: ${tradeId}`,
          metadata: {
            tradeId,
          },
        },
      });

      // 買い手の入金トランザクションを作成
      await tx.walletTransaction.create({
        data: {
          userId: buyerId,
          type: 'RECEIVE',
          amountUsd: amount,
          balanceType: 'P2P',
          description: `P2P入金: ${tradeId}`,
          metadata: {
            tradeId,
          },
        },
      });
    });
  }

  /**
   * エスクローをキャンセルする（売り手のロック残高を解放し、P2P残高に返金）
   * @param sellerId 売り手ID
   * @param amount 返金する金額（USD）
   * @param tradeId 取引ID
   */
  async cancelEscrow(sellerId: string, amount: number, tradeId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 売り手のウォレットを取得
      const wallet = await tx.wallet.findUnique({
        where: { userId: sellerId },
      });

      if (!wallet) {
        throw new Error('ウォレットが見つかりません');
      }

      // ロック残高が十分か確認
      if (Number(wallet.p2pLockedUsd) < amount) {
        throw new Error('ロック残高が不足しています');
      }

      // ロック残高を減算 + P2P残高に返金
      await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          p2pLockedUsd: {
            decrement: amount,
          },
          p2pBalanceUsd: {
            increment: amount,
          },
        },
      });

      // 返金トランザクションを作成
      await tx.walletTransaction.create({
        data: {
          userId: sellerId,
          type: 'RECEIVE',
          amountUsd: amount,
          balanceType: 'P2P',
          description: `P2P取引キャンセル返金: ${tradeId}`,
          metadata: {
            tradeId,
          },
        },
      });
    });
  }
}

export const p2pTradeService = new P2PTradeService(prisma);
