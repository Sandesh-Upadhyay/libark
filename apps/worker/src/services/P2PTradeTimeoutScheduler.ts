/**
 * ⏰ P2PTradeTimeoutScheduler - P2P取引タイムアウトスケジューラー
 *
 * 機能:
 * - 定期的なP2P取引タイムアウトチェックジョブの投入
 * - cron式による柔軟なスケジューリング
 * - 重複実行の防止
 */

import { getQueue, QueueName, type P2PTradeTimeoutJobData } from '@libark/queues';
import { logger } from '@libark/core-shared';
import cron from 'node-cron';

// ================================
// 型定義
// ================================

export interface TimeoutScheduleConfig {
  checkExpiredTrades: {
    enabled: boolean;
    schedule: string; // cron式
    batchSize: number;
  };
}

// ================================
// P2PTradeTimeoutScheduler
// ================================

export class P2PTradeTimeoutScheduler {
  private config: TimeoutScheduleConfig;
  private scheduledTasks: Map<string, any> = new Map();
  private isRunning = false;

  constructor(config?: Partial<TimeoutScheduleConfig>) {
    this.config = {
      checkExpiredTrades: {
        enabled: true,
        schedule: '0 */5 * * * *', // 5分ごと
        batchSize: 50,
      },
      ...config,
    };
  }

  /**
   * スケジューラーを開始
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('P2PTradeTimeoutScheduler is already running');
      return;
    }

    try {
      // 期限切れ取引チェックのスケジュール
      if (this.config.checkExpiredTrades.enabled) {
        const timeoutTask = cron.schedule(this.config.checkExpiredTrades.schedule, () =>
          this.scheduleExpiredTradesCheck()
        );
        this.scheduledTasks.set('checkExpiredTrades', timeoutTask);
        timeoutTask.start();
      }

      this.isRunning = true;
      logger.info('P2PTradeTimeoutScheduler started successfully', {
        checkExpiredEnabled: this.config.checkExpiredTrades.enabled,
        schedule: this.config.checkExpiredTrades.schedule,
      });
    } catch (error) {
      logger.error('Failed to start P2PTradeTimeoutScheduler', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * スケジューラーを停止
   */
  stop(): void {
    logger.info('Stopping P2PTradeTimeoutScheduler...');

    for (const [name, task] of this.scheduledTasks) {
      try {
        task.stop();
        logger.info(`Stopped scheduled task: ${name}`);
      } catch (error) {
        logger.error(`Failed to stop scheduled task: ${name}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.scheduledTasks.clear();
    this.isRunning = false;

    logger.info('P2PTradeTimeoutScheduler stopped');
  }

  /**
   * 期限切れ取引チェックジョブをスケジュール
   */
  private async scheduleExpiredTradesCheck(): Promise<void> {
    try {
      const timeoutQueue = getQueue(QueueName.P2P_TRADE_TIMEOUT);
      const jobData: P2PTradeTimeoutJobData = {
        type: 'check_expired_trades',
        batchSize: this.config.checkExpiredTrades.batchSize,
      };

      await timeoutQueue.add('check-expired-trades', jobData, {
        priority: 5,
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      logger.info('Scheduled expired trades check job', {
        batchSize: this.config.checkExpiredTrades.batchSize,
      });
    } catch (error) {
      logger.error('Failed to schedule expired trades check', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 手動でタイムアウトチェックを実行
   */
  async runManualTimeoutCheck(): Promise<void> {
    try {
      const timeoutQueue = getQueue(QueueName.P2P_TRADE_TIMEOUT);
      const jobData: P2PTradeTimeoutJobData = {
        type: 'check_expired_trades',
        batchSize: this.config.checkExpiredTrades.batchSize,
      };

      await timeoutQueue.add('manual-check-expired-trades', jobData, {
        priority: 10, // 手動実行は高優先度
        removeOnComplete: 5,
        removeOnFail: 3,
      });

      logger.info('Manual timeout check job scheduled');
    } catch (error) {
      logger.error('Failed to schedule manual timeout check', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
