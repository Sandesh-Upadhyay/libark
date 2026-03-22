/**
 * 🎯 S3EventWorker - S3イベント通知処理ワーカー
 *
 * 機能:
 * - S3オブジェクト作成イベントを受信
 * - メディアレコードのステータス更新（PROCESSING）
 * - メタデータ取得・保存
 * - バリアント生成ジョブの投入
 */

import { Job } from 'bullmq';
import { prisma } from '@libark/db';
import { logger, normalizeMediaType } from '@libark/core-shared';
import { QueueName, getQueue } from '@libark/queues';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { RedisPubSubManager } from '@libark/redis-client';

import { getMediaClient } from '../config/media-client.js';

import { BaseWorker } from './BaseWorker.js';
// getWorkerLimits削除済み - 固定値を使用

// ================================
// 型定義
// ================================

export interface S3EventData {
  eventName: string;
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
      size: number;
    };
  };
  userMetadata?: {
    userid?: string;
    originalname?: string;
    mediatype?: string;
    mediaid?: string;
    uploadedat?: string;
  };
}

export interface S3EventJobData {
  eventName: string;
  bucketName: string;
  objectKey: string;
  objectSize: number;
  userMetadata: Record<string, string>;
}

// ================================
// S3EventWorker
// ================================

export class S3EventWorker extends BaseWorker<S3EventJobData> {
  private pubsub: RedisPubSubManager;

  constructor() {
    console.log('🔍 [S3EventWorker] QueueName.S3_EVENTS:', QueueName.S3_EVENTS);
    // 固定設定を使用
    super(QueueName.S3_EVENTS, 'S3EventWorker', {
      concurrency: 3, // S3イベント処理の同時実行数
      stalledInterval: 30000, // 30秒
      maxStalledCount: 3, // 最大スタール回数
      retryProcessDelay: 5000, // 5秒
    });
    this.pubsub = RedisPubSubManager.getInstance();
  }

  /**
   * 🎯 S3イベント処理のメインロジック
   */
  protected async processJob(job: Job<S3EventJobData>): Promise<void> {
    const { eventName, bucketName, objectKey, objectSize, userMetadata } = job.data;

    logger.info('Processing S3 event', {
      jobId: job.id,
      eventName,
      bucketName,
      objectKey,
      objectSize,
      userMetadata,
    });

    try {
      // オリジナルファイルのアップロードイベントのみ処理
      if (!eventName.startsWith('s3:ObjectCreated:') || !objectKey.includes('-orig.')) {
        logger.info('Skipping non-original file event', { objectKey, eventName });
        return;
      }

      // メタデータからmediaIdを取得
      const mediaId = userMetadata.mediaid;
      if (!mediaId) {
        throw new Error(`MediaId not found in metadata for object: ${objectKey}`);
      }

      // メディアレコードを取得
      const media = await this.getMediaRecord(mediaId);
      if (!media) {
        throw new Error(`Media record not found: ${mediaId}`);
      }

      // S3からメタデータを取得（念のため）
      const objectMetadata = await this.getObjectMetadata(objectKey);

      // メディアレコードを更新（READY状態に）
      await this.updateMediaRecord(mediaId, {
        status: 'READY',
        fileSize: objectSize,
        // メタデータから画像サイズを取得できる場合は更新
        ...(objectMetadata.width && { width: objectMetadata.width }),
        ...(objectMetadata.height && { height: objectMetadata.height }),
      });

      // リアルタイム通知を送信
      await this.publishUploadProgress(mediaId, {
        mediaId,
        status: 'PROCESSING',
        progress: 50, // アップロード完了は50%
        message: 'アップロード完了。画像処理を開始します。',
      });

      // バリアント生成ジョブを投入
      await this.queueVariantGeneration(mediaId, media.userId, media.type);

      logger.info('S3 event processed successfully', {
        jobId: job.id,
        mediaId,
        objectKey,
      });
    } catch (error) {
      logger.error('S3 event processing failed', {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
        eventName,
        objectKey,
      });
      throw error;
    }
  }

  /**
   * メディアレコード取得
   */
  private async getMediaRecord(mediaId: string) {
    return await prisma.media.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        userId: true,
        status: true,
        type: true,
        filename: true,
        mimeType: true,
      },
    });
  }

  /**
   * S3オブジェクトのメタデータ取得
   */
  private async getObjectMetadata(objectKey: string) {
    const mediaClient = getMediaClient();

    try {
      const command = new HeadObjectCommand({
        Bucket: mediaClient.config.bucket,
        Key: objectKey,
      });

      const response = (await (
        mediaClient as { s3Client: { send: (command: unknown) => Promise<unknown> } }
      ).s3Client.send(command)) as {
        ContentType?: string;
        ContentLength?: number;
        LastModified?: Date;
        Metadata?: Record<string, string>;
      };

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata || {},
        // 画像の場合、メタデータから幅・高さを取得できる場合がある
        width: response.Metadata?.width ? parseInt(response.Metadata.width) : undefined,
        height: response.Metadata?.height ? parseInt(response.Metadata.height) : undefined,
      };
    } catch (error) {
      logger.warn('Failed to get object metadata', {
        objectKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  /**
   * メディアレコード更新
   */
  private async updateMediaRecord(
    mediaId: string,
    data: {
      status: 'PROCESSING' | 'READY' | 'FAILED';
      fileSize?: number;
      width?: number;
      height?: number;
    }
  ) {
    await prisma.media.update({
      where: { id: mediaId },
      data,
    });
  }

  /**
   * バリアント生成ジョブを投入
   */
  private async queueVariantGeneration(mediaId: string, userId: string, mediaType: string) {
    const normalizedType = normalizeMediaType(mediaType);

    // ステータスをPROCESSINGに更新
    await this.updateMediaRecord(mediaId, {
      status: 'PROCESSING',
    });

    // MediaProcessingWorkerにジョブを投入
    const mediaProcessingQueue = getQueue(QueueName.MEDIA_PROCESSING);
    await mediaProcessingQueue.add('process-media', {
      mediaId,
      userId,
      mediaType: normalizedType,
    });

    logger.info('Variant generation job queued', {
      mediaId,
      userId,
      mediaType: normalizedType,
    });
  }

  /**
   * アップロード進捗通知を送信
   */
  private async publishUploadProgress(
    mediaId: string,
    data: {
      mediaId: string;
      status: string;
      progress: number;
      message: string;
    }
  ) {
    try {
      await this.pubsub.publish(`UPLOAD_PROGRESS_${mediaId}`, {
        type: 'UPLOAD_PROGRESS',
        timestamp: new Date().toISOString(),
        mediaId,
        uploadProgress: data,
      });
    } catch (error) {
      logger.warn('Failed to publish upload progress', {
        mediaId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
