/**
 * 🕐 P2PTradeTimeoutWorker - P2P取引タイムアウト処理ワーカー
 *
 * 機能:
 * - 期限切れのP2P取引をキャンセル
 * - エスクロー金額を売り手に返却
 * - 定期実行によるタイムアウトチェック
 */

import { Job } from 'bullmq';
import { prisma } from '@libark/db';
import { logger } from '@libark/core-shared';
import { QueueName } from '@libark/queues';

import { BaseWorker } from './BaseWorker.js';

// ================================
// 型定義
// ================================

export interface P2PTradeTimeoutJobData {
  type: 'check_expired_trades';
  batchSize?: number; // 一度に処理する取引数
}

// ================================
// P2PTradeTimeoutWorker
// ================================

export class P2PTradeTimeoutWorker extends BaseWorker<P2PTradeTimeoutJobData> {
  constructor() {
    super(QueueName.P2P_TRADE_TIMEOUT, 'P2PTradeTimeoutWorker', {
      concurrency: 1, // タイムアウト処理は並列実行しない
    });
  }

  /**
   * 🎯 タイムアウト処理のメインロジック
   */
  protected async processJob(job: Job<P2PTradeTimeoutJobData>): Promise<void> {
    const { type, batchSize = 50 } = job.data;

    logger.info('Starting P2P trade timeout processing', {
      jobId: job.id,
      type,
      batchSize,
    });

    try {
      switch (type) {
        case 'check_expired_trades':
          await this.checkExpiredTrades(batchSize);
          break;
        default:
          throw new Error(`Unknown timeout type: ${type}`);
      }

      logger.info('P2P trade timeout processing completed successfully', {
        jobId: job.id,
        type,
      });
    } catch (error) {
      logger.error('P2P trade timeout processing failed', {
        jobId: job.id,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 期限切れの取引をチェックしてキャンセル
   */
  private async checkExpiredTrades(batchSize: number): Promise<void> {
    const now = new Date();

    // 期限切れの取引を検索
    const expiredTrades = await prisma.p2PTradeRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'MATCHED', 'PAYMENT_SENT'],
        },
        expiresAt: {
          lt: now,
        },
      },
      take: batchSize,
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (expiredTrades.length === 0) {
      logger.info('No expired trades found');
      return;
    }

    logger.info(`Found ${expiredTrades.length} expired trades`);

    // 各取引をキャンセル
    for (const trade of expiredTrades) {
      try {
        await this.cancelTrade(trade);
        logger.info(`Cancelled trade: ${trade.id}`);
      } catch (error) {
        logger.error(`Failed to cancel trade: ${trade.id}`, error);
      }
    }
  }

  /**
   * 取引をキャンセル
   */
  private async cancelTrade(trade: {
    id: string;
    escrowAmount?: number | { toNumber?: () => number } | null;
    sellerId?: string | null;
  }): Promise<void> {
    await prisma.$transaction(async (tx: import('@libark/db').Prisma.TransactionClient) => {
      const escrowAmount =
        typeof trade.escrowAmount === 'number'
          ? trade.escrowAmount
          : trade.escrowAmount?.toNumber?.();

      // エスクローが存在する場合は解放
      if (escrowAmount && trade.sellerId) {
        await tx.wallet.update({
          where: { userId: trade.sellerId },
          data: {
            p2pBalanceUsd: {
              increment: escrowAmount,
            },
          },
        });

        // 返金トランザクションを作成
        await tx.walletTransaction.create({
          data: {
            userId: trade.sellerId,
            type: 'RECEIVE',
            amountUsd: escrowAmount,
            balanceType: 'P2P',
            description: `P2P取引タイムアウト返金: ${trade.id}`,
          },
        });
      }

      // 取引をキャンセル
      await tx.p2PTradeRequest.update({
        where: { id: trade.id },
        data: { status: 'CANCELLED' },
      });
    });

    // TODO: 通知を送信（WalletNotificationServiceを使用）
    // 現在はWorkerから直接通知サービスを呼び出せないため、実装をスキップ
  }
}
