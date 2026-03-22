import { Queue, QueueEvents } from 'bullmq';
import { RedisConnectionManager } from '@libark/redis-client';

// キュー名の定義
export enum QueueName {
  MEDIA_PROCESSING = 'media-processing',
  BLUR_PROCESSING = 'blur-processing',
  S3_EVENTS = 's3-events',
  MEDIA_CLEANUP = 'media-cleanup',
  P2P_TRADE_TIMEOUT = 'p2p-trade-timeout',
}

// ジョブデータの型定義

export interface S3EventJobData {
  eventName: string;
  bucketName: string;
  objectKey: string;
  objectSize: number;
  userMetadata: Record<string, string>;
}

export interface MediaCleanupJobData {
  type: 'stalled_processing_cleanup' | 'failed_upload_cleanup' | 'orphaned_objects_cleanup';
  maxAge?: number; // 削除対象の最大経過時間（分）
  batchSize?: number; // 一度に処理するレコード数
}

export interface P2PTradeTimeoutJobData {
  type: 'check_expired_trades';
  batchSize?: number;
}

export interface BlurJobData {
  mediaId: string;
  postId?: string;
  userId: string;
  reason: 'post_paid' | 'media_paid'; // Paid化の理由
}

// キューのインスタンスを保持するマップ
const queues = new Map<QueueName, Queue>();
const queueEvents = new Map<QueueName, QueueEvents>();

// Redis接続マネージャーのインスタンス
const redisManager = RedisConnectionManager.getInstance();
type QueueConnection = NonNullable<ConstructorParameters<typeof Queue>[1]>['connection'];

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: {
    age: 300000, // 5分
    count: 100,
  },
  removeOnFail: { age: 86400000 }, // 24時間
} as const;

// キュー別の設定
const QUEUE_SPECIFIC_OPTIONS: Partial<Record<QueueName, Record<string, unknown>>> = {
  [QueueName.S3_EVENTS]: {
    attempts: 5, // S3イベントは重要なので多めにリトライ
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
  [QueueName.MEDIA_PROCESSING]: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 10000, // 画像処理は時間がかかるので長めの間隔
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 20 },
  },
  [QueueName.BLUR_PROCESSING]: {
    attempts: 2, // ブラー処理は軽いので少なめ
    backoff: {
      type: 'fixed' as const,
      delay: 3000,
    },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 10 },
  },
  [QueueName.MEDIA_CLEANUP]: {
    attempts: 2, // クリーンアップは失敗してもそれほど問題ない
    backoff: {
      type: 'fixed' as const,
      delay: 30000,
    },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 10 },
  },
  [QueueName.P2P_TRADE_TIMEOUT]: {
    attempts: 2, // タイムアウト処理は失敗してもそれほど問題ない
    backoff: {
      type: 'fixed' as const,
      delay: 30000,
    },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 10 },
  },
};

/**
 * 指定したキューを取得または作成する
 */
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    // キュー固有の設定を取得
    const queueOptions = QUEUE_SPECIFIC_OPTIONS[name] || DEFAULT_JOB_OPTIONS;

    const queue = new Queue(name, {
      connection: redisManager.getBullMQClient('client') as unknown as QueueConnection,
      defaultJobOptions: queueOptions,
    });

    const events = new QueueEvents(name, {
      connection: redisManager.getBullMQClient('bclient') as unknown as QueueConnection,
    });

    // エラーハンドリングを追加
    queue.on('error', error => {
      console.error(`Queue ${name} error:`, error);
    });

    events.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} in queue ${name} failed:`, failedReason);
    });

    events.on('stalled', ({ jobId }) => {
      console.warn(`Job ${jobId} in queue ${name} stalled`);
    });

    queues.set(name, queue);
    queueEvents.set(name, events);
  }

  return queues.get(name)!;
}

/**
 * 指定したキューのイベントを取得する
 */
export function getQueueEvents(name: QueueName): QueueEvents {
  if (!queueEvents.has(name)) {
    getQueue(name);
  }
  return queueEvents.get(name)!;
}

/**
 * すべてのキューを閉じる
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const [, queue] of queues.entries()) {
    closePromises.push(queue.close());
  }

  for (const [, events] of queueEvents.entries()) {
    closePromises.push(events.close());
  }

  await Promise.all(closePromises);

  queues.clear();
  queueEvents.clear();
}
