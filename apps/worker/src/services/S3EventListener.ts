/**
 * 🎧 S3EventListener - S3イベント通知リスナー
 *
 * 機能:
 * - Redisチャンネルからの S3イベント通知を受信
 * - S3EventWorkerにジョブを投入
 * - イベントフィルタリング（オリジナルファイルのみ）
 */

import { RedisConnectionManager } from '@libark/redis-client';
import { getQueue, QueueName, type S3EventJobData } from '@libark/queues';
import { logger } from '@libark/core-shared';

// ================================
// 型定義
// ================================

export interface S3NotificationEvent {
  Records: Array<{
    eventVersion: string;
    eventSource: string;
    eventTime: string;
    eventName: string;
    userIdentity: {
      principalId: string;
    };
    requestParameters: {
      sourceIPAddress: string;
    };
    responseElements: {
      'x-amz-request-id': string;
      'x-amz-id-2': string;
    };
    s3: {
      s3SchemaVersion: string;
      configurationId: string;
      bucket: {
        name: string;
        ownerIdentity: {
          principalId: string;
        };
        arn: string;
      };
      object: {
        key: string;
        size: number;
        eTag: string;
        sequencer: string;
      };
    };
  }>;
}

// ================================
// S3EventListener
// ================================

export class S3EventListener {
  private redisManager: RedisConnectionManager;
  private subscriber: any;
  private isListening = false;

  constructor() {
    this.redisManager = RedisConnectionManager.getInstance();
  }

  /**
   * S3イベントリスナーを開始
   */
  async start(): Promise<void> {
    if (this.isListening) {
      logger.warn('S3EventListener is already listening');
      return;
    }

    try {
      this.subscriber = this.redisManager.getPubSubClient();

      // S3イベント通知チャンネルを購読
      await this.subscriber.subscribe('s3:events');

      this.subscriber.on('message', this.handleS3Event.bind(this));

      this.isListening = true;
      logger.info('S3EventListener started successfully');
    } catch (error) {
      logger.error('Failed to start S3EventListener', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * S3イベントリスナーを停止
   */
  async stop(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      if (this.subscriber) {
        await this.subscriber.unsubscribe('s3:events');
        this.subscriber.removeAllListeners('message');
      }

      this.isListening = false;
      logger.info('S3EventListener stopped successfully');
    } catch (error) {
      logger.error('Failed to stop S3EventListener', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * S3イベント処理
   */
  private async handleS3Event(channel: string, message: string): Promise<void> {
    if (channel !== 's3:events') {
      return;
    }

    try {
      const notification: S3NotificationEvent = JSON.parse(message);

      for (const record of notification.Records) {
        await this.processS3Record(record);
      }
    } catch (error) {
      logger.error('Failed to process S3 event', {
        channel,
        message: message.substring(0, 200), // ログサイズ制限
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * S3レコード処理
   */
  private async processS3Record(record: S3NotificationEvent['Records'][0]): Promise<void> {
    const { eventName, s3 } = record;
    const { bucket, object } = s3;

    // オリジナルファイルのアップロードイベントのみ処理
    if (!eventName.startsWith('s3:ObjectCreated:') || !object.key.includes('-orig.')) {
      logger.debug('Skipping non-original file event', {
        eventName,
        objectKey: object.key,
      });
      return;
    }

    try {
      // S3オブジェクトからメタデータを取得（模擬）
      // 実際の実装では、S3 HeadObject APIを呼び出してメタデータを取得
      const userMetadata = await this.extractUserMetadata(object.key);

      // S3EventWorkerにジョブを投入
      const s3EventQueue = getQueue(QueueName.S3_EVENTS);
      const jobData: S3EventJobData = {
        eventName,
        bucketName: bucket.name,
        objectKey: object.key,
        objectSize: object.size,
        userMetadata,
      };

      await s3EventQueue.add('process-s3-event', jobData, {
        priority: 10, // 高優先度
        removeOnComplete: 50,
        removeOnFail: 10,
      });

      logger.info('S3 event queued successfully', {
        eventName,
        bucketName: bucket.name,
        objectKey: object.key,
        objectSize: object.size,
      });
    } catch (error) {
      logger.error('Failed to queue S3 event', {
        eventName,
        objectKey: object.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * オブジェクトキーからユーザーメタデータを抽出
   * 実際の実装では S3 HeadObject API を使用
   */
  private async extractUserMetadata(objectKey: string): Promise<Record<string, string>> {
    // オブジェクトキーから mediaId を抽出
    // フォーマット: post/2025-07-12/mediaId-orig.ext または mediaId-orig.ext
    const mediaIdMatch = objectKey.match(/([a-f0-9-]{36})-orig\./);
    if (!mediaIdMatch) {
      throw new Error(`Invalid object key format: ${objectKey}`);
    }

    const mediaId = mediaIdMatch[1];

    // 実際の実装では、S3 HeadObject API でメタデータを取得
    // ここでは模擬的にmediaIdのみ返す
    return {
      mediaid: mediaId,
    };
  }
}
