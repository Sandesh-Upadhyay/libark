import { Worker, Job, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@libark/db';
import { RedisPubSubManager, type PubSubNotificationData } from '@libark/redis-client';
import { NETWORK_CONSTANTS } from '@libark/core-shared';
import { QueueName } from '@libark/queues';
import { type NotificationTypeValue } from '@libark/core-shared';

import { NOTIFICATION_CONFIG, WORKER_SPECIFIC_CONSTANTS } from '../config/workerConfig.js';

/**
 * ワーカー共通設定
 */
export interface WorkerConfig {
  concurrency?: number;
  stalledInterval?: number;
  maxStalledCount?: number;
  retryProcessDelay?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

/**
 * デフォルトワーカー設定（統一設定を使用）
 */
function getDefaultWorkerConfig(): WorkerConfig {
  return {
    concurrency: 5, // 同時実行数
    stalledInterval: 30000, // 30秒
    maxStalledCount: 3, // 最大スタール回数
    retryProcessDelay: 5000, // 5秒
  };
}

/**
 * ワーカー基底クラス
 *
 * 全ワーカーの共通機能を提供：
 * - Redis接続管理
 * - Prisma接続管理
 * - WebSocket通知管理
 * - 共通エラーハンドリング
 * - 共通イベントハンドラー
 */
export abstract class BaseWorker<T = Record<string, unknown>> {
  protected worker: Worker;
  protected redisPubSub: RedisPubSubManager;
  protected workerName: string;

  constructor(queueName: QueueName, workerName: string, config: WorkerConfig = {}) {
    this.workerName = workerName;
    this.redisPubSub = RedisPubSubManager.getInstance();

    const defaultConfig = getDefaultWorkerConfig();
    const mergedConfig = { ...defaultConfig, ...config };

    // Redis接続インスタンスを作成
    const redisConnection = new IORedis({
      host: 'redis',
      port: NETWORK_CONSTANTS.REDIS_DEFAULT_PORT,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    type QueueConnection = NonNullable<WorkerOptions['connection']>;
    const workerOptions: WorkerOptions = {
      connection: redisConnection as unknown as QueueConnection,
      concurrency: mergedConfig.concurrency,
      stalledInterval: mergedConfig.stalledInterval,
      maxStalledCount: mergedConfig.maxStalledCount,
    };

    // リミッター設定があれば追加
    if (mergedConfig.limiter) {
      workerOptions.limiter = mergedConfig.limiter;
    }

    this.worker = new Worker(queueName, this.processJob.bind(this), workerOptions);
    this.setupCommonEventHandlers();

    console.log(`${this.workerName}を開始しました`);
  }

  /**
   * 抽象メソッド：各ワーカーで実装する処理ロジック
   */
  protected abstract processJob(job: Job<T>): Promise<unknown>;

  /**
   * 共通イベントハンドラーの設定
   */
  private setupCommonEventHandlers(): void {
    this.worker.on('completed', (job: Job) => {
      console.log(`✅ ${this.workerName} ジョブ完了: ${job.id}`);
      this.onJobCompleted?.(job);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`❌ ${this.workerName} ジョブ失敗: ${job?.id}`, err);
      this.onJobFailed?.(job, err);
    });

    this.worker.on('error', (err: Error) => {
      console.error(`🚨 ${this.workerName} ワーカーエラー:`, err);
      this.onWorkerError?.(err);
    });

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`⏸️ ${this.workerName} ジョブ停止: ${jobId}`);
      this.onJobStalled?.(jobId);
    });
  }

  /**
   * オプション：ジョブ完了時のカスタムハンドラー
   */
  protected onJobCompleted?(job: Job): void;

  /**
   * オプション：ジョブ失敗時のカスタムハンドラー
   */
  protected onJobFailed?(job: Job | undefined, err: Error): void;

  /**
   * オプション：ワーカーエラー時のカスタムハンドラー
   */
  protected onWorkerError?(err: Error): void;

  /**
   * オプション：ジョブ停止時のカスタムハンドラー
   */
  protected onJobStalled?(jobId: string): void;

  /**
   * GraphQL通知送信の共通メソッド（GraphQLサブスクリプション専用）
   */
  protected async sendGraphQLNotification(
    userId: string,
    data: Omit<PubSubNotificationData, 'timestamp'> & { type: string }
  ): Promise<void> {
    try {
      const notificationData: PubSubNotificationData = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      await this.redisPubSub.publishGraphQLNotification(userId, notificationData);
      console.log(`📤 GraphQL通知送信: ${this.workerName}`, data.type);
    } catch (error) {
      console.error(`❌ GraphQL通知送信エラー: ${this.workerName}`, error);
    }
  }

  /**
   * エラー通知送信の共通メソッド
   */
  protected async sendErrorNotification(
    userId: string,
    errorType: string,
    errorMessage: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    const notificationData = {
      type: errorType,
      userId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    await this.sendGraphQLNotification(userId, notificationData);
  }

  /**
   * ユーザー情報取得の共通メソッド
   */
  protected async getUserInfo(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImageId: true,
      },
    });
  }

  /**
   * 重複通知チェックの共通メソッド
   */
  protected async checkDuplicateNotification(
    userId: string,
    type: string,
    actorId: string,
    referenceId: string,
    timeWindowMinutes: number = NOTIFICATION_CONFIG.duplicateCheckWindowMinutes
  ): Promise<boolean> {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type: type as NotificationTypeValue,
        actorId,
        referenceId,
        createdAt: {
          gte: new Date(
            Date.now() -
              timeWindowMinutes *
                WORKER_SPECIFIC_CONSTANTS.SECONDS_PER_MINUTE *
                WORKER_SPECIFIC_CONSTANTS.MILLISECONDS_PER_SECOND
          ),
        },
      },
    });

    return !!recentNotification;
  }

  /**
   * 通知作成の共通メソッド
   */
  protected async createNotification(
    userId: string,
    type: string,
    actorId: string,
    referenceId: string,
    content: string
  ) {
    return await prisma.notification.create({
      data: {
        userId,
        type: type as NotificationTypeValue,
        actorId,
        referenceId,
        content,
      },
    });
  }

  /**
   * ワーカー停止の共通メソッド
   */
  async close(): Promise<void> {
    console.log(`🛑 ${this.workerName}を停止中...`);
    await this.worker.close();
    console.log(`✅ ${this.workerName}を停止しました`);
  }
}
