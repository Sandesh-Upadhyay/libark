/**
 * Queues Package Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// BullMQをモック
const mockQueue = {
  add: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
};

const mockQueueEvents = {
  close: vi.fn(),
  on: vi.fn(),
};

vi.mock('bullmq', () => ({
  Queue: vi.fn(() => mockQueue),
  QueueEvents: vi.fn(() => mockQueueEvents),
}));

// Redis接続マネージャーをモック
const mockRedisManager = {
  getBullMQClient: vi.fn(() => ({})),
};

vi.mock('@libark/redis-client', () => ({
  RedisConnectionManager: {
    getInstance: vi.fn(() => mockRedisManager),
  },
}));

describe('Queues Package', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // テスト後にキューをクリーンアップ
    const { closeAllQueues } = await import('../index.js');
    await closeAllQueues();
  });

  describe('QueueName Enum', () => {
    it('キュー名が正しく定義されている', async () => {
      const { QueueName } = await import('../index.js');

      expect(QueueName.MEDIA_PROCESSING).toBe('media-processing');
      expect(QueueName.BLUR_PROCESSING).toBe('blur-processing');
      expect(QueueName.S3_EVENTS).toBe('s3-events');
      expect(QueueName.MEDIA_CLEANUP).toBe('media-cleanup');
    });
  });

  describe('getQueue', () => {
    it('新しいキューを作成する', async () => {
      const { getQueue, QueueName } = await import('../index.js');
      const { Queue } = await import('bullmq');

      const queue = getQueue(QueueName.MEDIA_PROCESSING);

      expect(Queue).toHaveBeenCalledWith(
        QueueName.MEDIA_PROCESSING,
        expect.objectContaining({
          connection: expect.any(Object),
          defaultJobOptions: expect.any(Object),
        })
      );
      expect(queue).toBe(mockQueue);
    });

    it('同じキューを再利用する', async () => {
      const { getQueue, QueueName } = await import('../index.js');
      const { Queue } = await import('bullmq');

      const queue1 = getQueue(QueueName.MEDIA_PROCESSING);
      const queue2 = getQueue(QueueName.MEDIA_PROCESSING);

      expect(queue1).toBe(queue2);
      expect(Queue).toHaveBeenCalledTimes(1);
    });

    it('異なるキューは別々に作成される', async () => {
      const { getQueue, QueueName } = await import('../index.js');
      const { Queue } = await import('bullmq');

      const queue1 = getQueue(QueueName.MEDIA_PROCESSING);
      const queue2 = getQueue(QueueName.BLUR_PROCESSING);

      expect(queue1).toBe(mockQueue);
      expect(queue2).toBe(mockQueue);
      expect(Queue).toHaveBeenCalledTimes(2);
    });
  });

  describe('getQueueEvents', () => {
    it('キューイベントを取得する', async () => {
      const { getQueueEvents, QueueName } = await import('../index.js');
      const { QueueEvents } = await import('bullmq');

      const events = getQueueEvents(QueueName.MEDIA_PROCESSING);

      expect(QueueEvents).toHaveBeenCalledWith(
        QueueName.MEDIA_PROCESSING,
        expect.objectContaining({
          connection: expect.any(Object),
        })
      );
      expect(events).toBe(mockQueueEvents);
    });

    it('同じキューイベントを再利用する', async () => {
      const { getQueueEvents, QueueName } = await import('../index.js');
      const { QueueEvents } = await import('bullmq');

      const events1 = getQueueEvents(QueueName.MEDIA_PROCESSING);
      const events2 = getQueueEvents(QueueName.MEDIA_PROCESSING);

      expect(events1).toBe(events2);
      expect(QueueEvents).toHaveBeenCalledTimes(1);
    });
  });

  describe('closeAllQueues', () => {
    it.skip('すべてのキューとイベントを閉じる', async () => {
      const { getQueue, getQueueEvents, closeAllQueues, QueueName } = await import('../index.js');

      // キューとイベントを作成
      getQueue(QueueName.MEDIA_PROCESSING);
      getQueue(QueueName.BLUR_PROCESSING);
      getQueueEvents(QueueName.S3_EVENTS);

      await closeAllQueues();

      expect(mockQueue.close).toHaveBeenCalledTimes(3); // テストで2回 + afterEachで1回
      expect(mockQueueEvents.close).toHaveBeenCalledTimes(3); // getQueueEventsで1回 + getQueueで2回
    });
  });

  describe('Error Handling', () => {
    it('キューエラーハンドラーが設定される', async () => {
      const { getQueue, QueueName } = await import('../index.js');

      getQueue(QueueName.MEDIA_PROCESSING);

      expect(mockQueue.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('キューイベントエラーハンドラーが設定される', async () => {
      const { getQueue, QueueName } = await import('../index.js');

      getQueue(QueueName.MEDIA_PROCESSING);

      expect(mockQueueEvents.on).toHaveBeenCalledWith('failed', expect.any(Function));
      expect(mockQueueEvents.on).toHaveBeenCalledWith('stalled', expect.any(Function));
    });
  });

  describe('Type Definitions', () => {
    it('S3EventJobDataの型が正しく定義されている', async () => {
      const { QueueName } = await import('../index.js');

      // TypeScriptコンパイル時にエラーが発生しないことを確認
      const jobData: import('../index.js').S3EventJobData = {
        eventName: 'ObjectCreated:Put',
        bucketName: 'test-bucket',
        objectKey: 'test-object.jpg',
        objectSize: 1024,
        userMetadata: { userId: 'user-123' },
      };

      expect(jobData.eventName).toBe('ObjectCreated:Put');
      expect(jobData.bucketName).toBe('test-bucket');
      expect(jobData.objectKey).toBe('test-object.jpg');
      expect(jobData.objectSize).toBe(1024);
      expect(jobData.userMetadata.userId).toBe('user-123');
    });

    it('MediaCleanupJobDataの型が正しく定義されている', async () => {
      const jobData: import('../index.js').MediaCleanupJobData = {
        type: 'stalled_processing_cleanup',
        maxAge: 60,
        batchSize: 100,
      };

      expect(jobData.type).toBe('stalled_processing_cleanup');
      expect(jobData.maxAge).toBe(60);
      expect(jobData.batchSize).toBe(100);
    });

    it('BlurJobDataの型が正しく定義されている', async () => {
      const jobData: import('../index.js').BlurJobData = {
        mediaId: 'media-123',
        postId: 'post-456',
        userId: 'user-789',
        reason: 'post_paid',
      };

      expect(jobData.mediaId).toBe('media-123');
      expect(jobData.postId).toBe('post-456');
      expect(jobData.userId).toBe('user-789');
      expect(jobData.reason).toBe('post_paid');
    });
  });

  describe('Redis Connection', () => {
    it('Redis接続マネージャーが正しく使用される', async () => {
      const { getQueue, QueueName } = await import('../index.js');

      getQueue(QueueName.MEDIA_PROCESSING);

      expect(mockRedisManager.getBullMQClient).toHaveBeenCalledWith('client');
      expect(mockRedisManager.getBullMQClient).toHaveBeenCalledWith('bclient');
    });
  });
});
