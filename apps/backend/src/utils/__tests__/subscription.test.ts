import { describe, it, expect, vi } from 'vitest';
import DataLoader from 'dataloader';

import {
  createSubscription,
  createIdBasedSubscription,
  postAddedSubscription,
  postUpdatedSubscription,
  postProcessingCompletedSubscription,
  allPostsProcessingUpdatedSubscription,
} from '../subscription';
import type { GraphQLContext } from '../../graphql/context';

// モックのGraphQLContextを作成
const createMockContext = (): GraphQLContext => {
  const mockPubSub = {
    asyncIterator: vi.fn(),
  };

  return {
    prisma: {} as any,
    user: undefined,
    request: null as any,
    reply: null as any,
    fastify: {
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any,
    authService: {} as any,
    redisPubSub: mockPubSub as any,
    dataloaders: {
      postLikeLoader: new DataLoader<string, boolean>(async keys => keys.map(() => false)),
      commentLikeLoader: new DataLoader<string, boolean>(async keys => keys.map(() => false)),
      postPurchaseLoader: new DataLoader<string, boolean>(async keys => keys.map(() => false)),
    },
  };
};

describe('Subscription Utils', () => {
  describe('createSubscription', () => {
    it('should create a subscription with subscribe and resolve functions', () => {
      const subscription = createSubscription('test_channel', 'post');

      expect(subscription).toHaveProperty('subscribe');
      expect(subscription).toHaveProperty('resolve');
      expect(typeof subscription.subscribe).toBe('function');
      expect(typeof subscription.resolve).toBe('function');
    });

    it('should call asyncIterator with correct channel', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      const subscription = createSubscription('test_channel', 'post');
      await subscription.subscribe({}, {}, context);

      expect(mockAsyncIterator).toHaveBeenCalledWith(['test_channel']);
    });

    it('should throw error when Redis PubSub is not available', async () => {
      const context = createMockContext();
      (context.redisPubSub as any) = null;

      const subscription = createSubscription('test_channel', 'post');

      await expect(subscription.subscribe({}, {}, context)).rejects.toThrow(
        'Redis PubSub not available'
      );
    });

    it('should resolve payload with correct resolver key', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        type: 'POST_CREATED',
        post: { id: 'post-1', content: 'Test content' },
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toEqual({ id: 'post-1', content: 'Test content' });
    });

    it('should resolve payload with id and content', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        id: 'post-1',
        content: 'Test content',
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toEqual({ id: 'post-1', content: 'Test content' });
    });

    it('should return null for invalid payload', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {};

      const result = subscription.resolve(payload, {}, context);

      expect(result).toBeNull();
    });

    it('should log subscription start', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      const subscription = createSubscription('test_channel', 'post');
      await subscription.subscribe({}, {}, context);

      expect(context.fastify.log.info).toHaveBeenCalledWith(
        expect.stringContaining('サブスクリプション開始: test_channel')
      );
    });

    it('should log subscription receive', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        type: 'POST_CREATED',
        post: { id: 'post-1' },
      };

      subscription.resolve(payload, {}, context);

      expect(context.fastify.log.info).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'test_channel',
          hasPayload: true,
          payloadType: 'object',
        }),
        expect.stringContaining('[GraphQL] サブスクリプション受信:')
      );
    });
  });

  describe('createIdBasedSubscription', () => {
    it('should create a subscription with subscribe and resolve functions', () => {
      const subscription = createIdBasedSubscription('test_prefix', 'post');

      expect(subscription).toHaveProperty('subscribe');
      expect(subscription).toHaveProperty('resolve');
      expect(typeof subscription.subscribe).toBe('function');
      expect(typeof subscription.resolve).toBe('function');
    });

    it('should call asyncIterator with correct channel based on postId', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      const subscription = createIdBasedSubscription('test_prefix', 'post');
      await subscription.subscribe({}, { postId: 'post-123' }, context);

      expect(mockAsyncIterator).toHaveBeenCalledWith(['test_prefix:post-123']);
    });

    it('should throw error when Redis PubSub is not available', async () => {
      const context = createMockContext();
      (context.redisPubSub as any) = null;

      const subscription = createIdBasedSubscription('test_prefix', 'post');

      await expect(subscription.subscribe({}, { postId: 'post-123' }, context)).rejects.toThrow(
        'Redis PubSub not available'
      );
    });

    it('should resolve payload with correct resolver key', () => {
      const context = createMockContext();
      const subscription = createIdBasedSubscription('test_prefix', 'post');

      const payload = {
        type: 'POST_UPDATED',
        post: { id: 'post-1', content: 'Updated content' },
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toEqual({ id: 'post-1', content: 'Updated content' });
    });

    it('should resolve payload with id and content', () => {
      const context = createMockContext();
      const subscription = createIdBasedSubscription('test_prefix', 'post');

      const payload = {
        id: 'post-1',
        content: 'Updated content',
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toEqual({ id: 'post-1', content: 'Updated content' });
    });

    it('should return null for invalid payload', () => {
      const context = createMockContext();
      const subscription = createIdBasedSubscription('test_prefix', 'post');

      const payload = {};

      const result = subscription.resolve(payload, {}, context);

      expect(result).toBeNull();
    });

    it('should log ID-based subscription start', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      const subscription = createIdBasedSubscription('test_prefix', 'post');
      await subscription.subscribe({}, { postId: 'post-123' }, context);

      expect(context.fastify.log.info).toHaveBeenCalledWith(
        expect.stringContaining('ID基準サブスクリプション開始: test_prefix:post-123')
      );
    });

    it('should log ID-based subscription receive', () => {
      const context = createMockContext();
      const subscription = createIdBasedSubscription('test_prefix', 'post');

      const payload = {
        type: 'POST_UPDATED',
        post: { id: 'post-1' },
      };

      subscription.resolve(payload, {}, context);

      expect(context.fastify.log.info).toHaveBeenCalledWith(
        expect.objectContaining({
          hasPayload: true,
          payloadType: 'object',
        }),
        expect.stringContaining('[GraphQL] ID基準サブスクリプション受信:')
      );
    });
  });

  describe('Predefined subscriptions', () => {
    it('should create postAddedSubscription', () => {
      expect(postAddedSubscription).toHaveProperty('subscribe');
      expect(postAddedSubscription).toHaveProperty('resolve');
    });

    it('should create postUpdatedSubscription', () => {
      expect(postUpdatedSubscription).toHaveProperty('subscribe');
      expect(postUpdatedSubscription).toHaveProperty('resolve');
    });

    it('should create postProcessingCompletedSubscription', () => {
      expect(postProcessingCompletedSubscription).toHaveProperty('subscribe');
      expect(postProcessingCompletedSubscription).toHaveProperty('resolve');
    });

    it('should create allPostsProcessingUpdatedSubscription', () => {
      expect(allPostsProcessingUpdatedSubscription).toHaveProperty('subscribe');
      expect(allPostsProcessingUpdatedSubscription).toHaveProperty('resolve');
    });

    it('should use correct channel for postAddedSubscription', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      await postAddedSubscription.subscribe({}, {}, context);

      expect(mockAsyncIterator).toHaveBeenCalledWith(['post_added']);
    });

    it('should use correct channel for postUpdatedSubscription', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      await postUpdatedSubscription.subscribe({}, { postId: 'post-123' }, context);

      expect(mockAsyncIterator).toHaveBeenCalledWith(['post_updated:post-123']);
    });

    it('should use correct channel for postProcessingCompletedSubscription', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      await postProcessingCompletedSubscription.subscribe({}, { postId: 'post-123' }, context);

      expect(mockAsyncIterator).toHaveBeenCalledWith(['post_processing_completed:post-123']);
    });

    it('should use correct channel for allPostsProcessingUpdatedSubscription', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      await allPostsProcessingUpdatedSubscription.subscribe({}, {}, context);

      expect(mockAsyncIterator).toHaveBeenCalledWith(['all_posts_processing_updated']);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle payload without type', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        post: { id: 'post-1' },
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toBeNull();
    });

    it('should handle payload with type but without resolver key', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        type: 'POST_CREATED',
        content: 'Test',
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toBeNull();
    });

    it('should handle payload with id but without content', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        id: 'post-1',
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toBeNull();
    });

    it('should handle complex payload structure', () => {
      const context = createMockContext();
      const subscription = createSubscription('test_channel', 'post');

      const payload = {
        type: 'POST_CREATED',
        post: {
          id: 'post-1',
          content: 'Test content',
          author: { id: 'user-1', username: 'testuser' },
          media: [{ id: 'media-1', url: 'http://example.com/image.jpg' }],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          source: 'web',
        },
      };

      const result = subscription.resolve(payload, {}, context);

      expect(result).toEqual(payload.post);
    });

    it('should handle multiple subscriptions with different channels', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockReturnValue([]);
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      const sub1 = createSubscription('channel1', 'post');
      const sub2 = createSubscription('channel2', 'post');
      const sub3 = createIdBasedSubscription('prefix', 'post');

      await sub1.subscribe({}, {}, context);
      await sub2.subscribe({}, {}, context);
      await sub3.subscribe({}, { postId: 'post-123' }, context);

      expect(mockAsyncIterator).toHaveBeenCalledTimes(3);
      expect(mockAsyncIterator).toHaveBeenNthCalledWith(1, ['channel1']);
      expect(mockAsyncIterator).toHaveBeenNthCalledWith(2, ['channel2']);
      expect(mockAsyncIterator).toHaveBeenNthCalledWith(3, ['prefix:post-123']);
    });

    it('should handle resolver key parameter correctly', () => {
      const context = createMockContext();
      const subscription1 = createSubscription('test_channel', 'post');
      const subscription2 = createSubscription('test_channel', 'comment');

      const payload = {
        type: 'POST_CREATED',
        post: { id: 'post-1' },
        comment: { id: 'comment-1' },
      };

      const result1 = subscription1.resolve(payload, {}, context);
      const result2 = subscription2.resolve(payload, {}, context);

      expect(result1).toEqual({ id: 'post-1' });
      expect(result2).toEqual({ id: 'comment-1' });
    });

    it('should handle asyncIterator errors gracefully', async () => {
      const context = createMockContext();
      const mockAsyncIterator = vi.fn().mockImplementation(() => {
        throw new Error('Redis connection error');
      });
      (context.redisPubSub as any).asyncIterator = mockAsyncIterator;

      const subscription = createSubscription('test_channel', 'post');

      await expect(subscription.subscribe({}, {}, context)).rejects.toThrow(
        'Redis connection error'
      );
    });
  });
});
