/**
 * ⏰ MediaCleanupScheduler - メディアクリーンアップスケジューラー
 *
 * 機能:
 * - 定期的なメディアクリーンアップジョブの投入
 * - cron式による柔軟なスケジューリング
 * - 重複実行の防止
 */

import { getQueue, QueueName, type MediaCleanupJobData } from '@libark/queues';
import { logger } from '@libark/core-shared';
import cron from 'node-cron';

// ================================
// 型定義
// ================================

export interface CleanupScheduleConfig {
  stalledProcessingCleanup: {
    enabled: boolean;
    schedule: string; // cron式
    maxAge: number; // 分
    batchSize: number;
  };
  failedUploadCleanup: {
    enabled: boolean;
    schedule: string;
    maxAge: number;
    batchSize: number;
  };
  orphanedObjectsCleanup: {
    enabled: boolean;
    schedule: string;
    batchSize: number;
  };
}

// ================================
// MediaCleanupScheduler
// ================================

export class MediaCleanupScheduler {
  private config: CleanupScheduleConfig;
  private scheduledTasks: Map<string, any> = new Map();
  private isRunning = false;

  constructor(config?: Partial<CleanupScheduleConfig>) {
    this.config = {
      stalledProcessingCleanup: {
        enabled: true,
        schedule: '0 */30 * * * *', // 30分ごと
        maxAge: 60, // 1時間
        batchSize: 100,
      },
      failedUploadCleanup: {
        enabled: true,
        schedule: '0 0 */6 * * *', // 6時間ごと
        maxAge: 1440, // 24時間
        batchSize: 50,
      },
      orphanedObjectsCleanup: {
        enabled: true,
        schedule: '0 0 2 * * *', // 毎日午前2時
        batchSize: 200,
      },
      ...config,
    };
  }

  /**
   * スケジューラーを開始
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('MediaCleanupScheduler is already running');
      return;
    }

    try {
      // PROCESSINGが長時間続いているレコードのクリーンアップ
      if (this.config.stalledProcessingCleanup.enabled) {
        const pendingTask = cron.schedule(this.config.stalledProcessingCleanup.schedule, () =>
          this.scheduleStalledProcessingCleanup()
        );
        this.scheduledTasks.set('stalledProcessingCleanup', pendingTask);
        pendingTask.start();
      }

      // 失敗したアップロードクリーンアップのスケジュール
      if (this.config.failedUploadCleanup.enabled) {
        const failedTask = cron.schedule(this.config.failedUploadCleanup.schedule, () =>
          this.scheduleFailedUploadCleanup()
        );
        this.scheduledTasks.set('failedUploadCleanup', failedTask);
        failedTask.start();
      }

      // 孤立オブジェクトクリーンアップのスケジュール
      if (this.config.orphanedObjectsCleanup.enabled) {
        const orphanedTask = cron.schedule(this.config.orphanedObjectsCleanup.schedule, () =>
          this.scheduleOrphanedObjectsCleanup()
        );
        this.scheduledTasks.set('orphanedObjectsCleanup', orphanedTask);
        orphanedTask.start();
      }

      this.isRunning = true;
      logger.info('MediaCleanupScheduler started successfully', {
        stalledProcessingEnabled: this.config.stalledProcessingCleanup.enabled,
        failedUploadEnabled: this.config.failedUploadCleanup.enabled,
        orphanedObjectsEnabled: this.config.orphanedObjectsCleanup.enabled,
      });
    } catch (error) {
      logger.error('Failed to start MediaCleanupScheduler', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * スケジューラーを停止
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    try {
      for (const [name, task] of this.scheduledTasks.entries()) {
        task.stop();
        logger.debug('Stopped cleanup task', { name });
      }

      this.scheduledTasks.clear();
      this.isRunning = false;
      logger.info('MediaCleanupScheduler stopped successfully');
    } catch (error) {
      logger.error('Failed to stop MediaCleanupScheduler', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * PROCESSINGが長時間続いているレコードのクリーンアップジョブをスケジュール
   */
  private async scheduleStalledProcessingCleanup(): Promise<void> {
    try {
      const cleanupQueue = getQueue(QueueName.MEDIA_CLEANUP);
      const jobData: MediaCleanupJobData = {
        type: 'stalled_processing_cleanup',
        maxAge: this.config.stalledProcessingCleanup.maxAge,
        batchSize: this.config.stalledProcessingCleanup.batchSize,
      };

      await cleanupQueue.add('stalled-processing-cleanup', jobData, {
        priority: 5,
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      logger.info('Scheduled stalled processing cleanup job', {
        maxAge: this.config.stalledProcessingCleanup.maxAge,
        batchSize: this.config.stalledProcessingCleanup.batchSize,
      });
    } catch (error) {
      logger.error('Failed to schedule stalled processing cleanup', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 失敗したアップロードクリーンアップジョブをスケジュール
   */
  private async scheduleFailedUploadCleanup(): Promise<void> {
    try {
      const cleanupQueue = getQueue(QueueName.MEDIA_CLEANUP);
      const jobData: MediaCleanupJobData = {
        type: 'failed_upload_cleanup',
        maxAge: this.config.failedUploadCleanup.maxAge,
        batchSize: this.config.failedUploadCleanup.batchSize,
      };

      await cleanupQueue.add('failed-upload-cleanup', jobData, {
        priority: 3,
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      logger.info('Scheduled failed upload cleanup job', {
        maxAge: this.config.failedUploadCleanup.maxAge,
        batchSize: this.config.failedUploadCleanup.batchSize,
      });
    } catch (error) {
      logger.error('Failed to schedule failed upload cleanup', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 孤立オブジェクトクリーンアップジョブをスケジュール
   */
  private async scheduleOrphanedObjectsCleanup(): Promise<void> {
    try {
      const cleanupQueue = getQueue(QueueName.MEDIA_CLEANUP);
      const jobData: MediaCleanupJobData = {
        type: 'orphaned_objects_cleanup',
        batchSize: this.config.orphanedObjectsCleanup.batchSize,
      };

      await cleanupQueue.add('orphaned-objects-cleanup', jobData, {
        priority: 1,
        removeOnComplete: 5,
        removeOnFail: 3,
      });

      logger.info('Scheduled orphaned objects cleanup job', {
        batchSize: this.config.orphanedObjectsCleanup.batchSize,
      });
    } catch (error) {
      logger.error('Failed to schedule orphaned objects cleanup', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 手動でクリーンアップジョブを実行
   */
  async runManualCleanup(
    type: 'stalled_processing_cleanup' | 'failed_upload_cleanup' | 'orphaned_objects_cleanup'
  ): Promise<void> {
    try {
      const cleanupQueue = getQueue(QueueName.MEDIA_CLEANUP);
      let jobData: MediaCleanupJobData;

      switch (type) {
        case 'stalled_processing_cleanup':
          jobData = {
            type,
            maxAge: this.config.stalledProcessingCleanup.maxAge,
            batchSize: this.config.stalledProcessingCleanup.batchSize,
          };
          break;
        case 'failed_upload_cleanup':
          jobData = {
            type,
            maxAge: this.config.failedUploadCleanup.maxAge,
            batchSize: this.config.failedUploadCleanup.batchSize,
          };
          break;
        case 'orphaned_objects_cleanup':
          jobData = {
            type,
            batchSize: this.config.orphanedObjectsCleanup.batchSize,
          };
          break;
      }

      await cleanupQueue.add(`manual-${type}`, jobData, {
        priority: 10, // 手動実行は高優先度
        removeOnComplete: 5,
        removeOnFail: 3,
      });

      logger.info('Manual cleanup job scheduled', { type });
    } catch (error) {
      logger.error('Failed to schedule manual cleanup', {
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
