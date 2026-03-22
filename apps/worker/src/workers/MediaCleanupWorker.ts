/**
 * 🗑️ MediaCleanupWorker - メディアクリーンアップワーカー
 *
 * 機能:
 * - 長時間PROCESSINGのレコードの削除
 * - 失敗したアップロードのクリーンアップ
 * - 孤立したS3オブジェクトの削除
 * - 定期実行によるガーベジコレクション
 */

import { Job } from 'bullmq';
import { prisma } from '@libark/db';
import { logger } from '@libark/core-shared';
import { QueueName } from '@libark/queues';

import { getMediaClient } from '../config/media-client.js';

import { BaseWorker } from './BaseWorker.js';

// ================================
// 型定義
// ================================

export interface MediaCleanupJobData {
  type: 'stalled_processing_cleanup' | 'failed_upload_cleanup' | 'orphaned_objects_cleanup';
  maxAge?: number; // 削除対象の最大経過時間（分）
  batchSize?: number; // 一度に処理するレコード数
}

// ================================
// MediaCleanupWorker
// ================================

export class MediaCleanupWorker extends BaseWorker<MediaCleanupJobData> {
  constructor() {
    super(QueueName.MEDIA_CLEANUP, 'MediaCleanupWorker', {
      concurrency: 1, // クリーンアップは並列実行しない
    });
  }

  /**
   * 🎯 メディアクリーンアップのメインロジック
   */
  protected async processJob(job: Job<MediaCleanupJobData>): Promise<void> {
    const { type, maxAge = 60, batchSize = 100 } = job.data;

    logger.info('Starting media cleanup', {
      jobId: job.id,
      type,
      maxAge,
      batchSize,
    });

    try {
      switch (type) {
        case 'stalled_processing_cleanup':
          await this.cleanupStalledProcessing(maxAge, batchSize);
          break;
        case 'failed_upload_cleanup':
          await this.cleanupFailedUploads(maxAge, batchSize);
          break;
        case 'orphaned_objects_cleanup':
          await this.cleanupOrphanedObjects(batchSize);
          break;
        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }

      logger.info('Media cleanup completed successfully', {
        jobId: job.id,
        type,
      });
    } catch (error) {
      logger.error('Media cleanup failed', {
        jobId: job.id,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 長時間PROCESSINGのレコードをクリーンアップ
   */
  private async cleanupStalledProcessing(maxAgeMinutes: number, batchSize: number): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const stalledProcessing = await prisma.media.findMany({
      where: {
        status: 'PROCESSING',
        createdAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        filename: true,
        createdAt: true,
      },
      take: batchSize,
    });

    if (stalledProcessing.length === 0) {
      logger.info('No stalled processing records to cleanup');
      return;
    }

    const mediaIds = stalledProcessing.map((media: { id: string }) => media.id);

    // データベースから削除
    const deleteResult = await prisma.media.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    });

    logger.info('Cleaned up stalled processing records', {
      deletedCount: deleteResult.count,
      maxAge: maxAgeMinutes,
      cutoffTime,
    });
  }

  /**
   * 失敗したアップロードのクリーンアップ
   */
  private async cleanupFailedUploads(maxAgeMinutes: number, batchSize: number): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const failedUploads = await prisma.media.findMany({
      where: {
        status: 'FAILED',
        updatedAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        filename: true,
        updatedAt: true,
      },
      take: batchSize,
    });

    if (failedUploads.length === 0) {
      logger.info('No failed uploads to cleanup');
      return;
    }

    // 関連するS3オブジェクトを削除
    await this.deleteS3Objects(failedUploads.map((media: { id: string }) => media.id));

    // データベースから削除
    const mediaIds = failedUploads.map((media: { id: string }) => media.id);
    const deleteResult = await prisma.media.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    });

    logger.info('Cleaned up failed uploads', {
      deletedCount: deleteResult.count,
      maxAge: maxAgeMinutes,
      cutoffTime,
    });
  }

  /**
   * 孤立したS3オブジェクトのクリーンアップ
   */
  private async cleanupOrphanedObjects(batchSize: number): Promise<void> {
    const mediaClient = getMediaClient();

    try {
      // S3 Gateway統合版では、孤立オブジェクトのクリーンアップは
      // S3 Gateway側で処理されるため、ここでは簡略化
      logger.info('Orphaned objects cleanup is handled by S3 Gateway', {
        batchSize,
      });
      return;
    } catch (error) {
      logger.error('Failed to cleanup orphaned objects', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 指定されたメディアIDに関連するS3オブジェクトを削除
   */
  private async deleteS3Objects(mediaIds: string[]): Promise<void> {
    const mediaClient = getMediaClient();

    // S3 Gateway統合版では、ファイル削除はS3 Gateway側で処理される
    logger.info('S3 objects deletion is handled by S3 Gateway', {
      mediaIds,
      count: mediaIds.length,
    });
  }
}
