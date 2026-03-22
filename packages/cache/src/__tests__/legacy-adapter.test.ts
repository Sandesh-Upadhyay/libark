/**
 * 🧪 レガシーRedisDistributedCache互換アダプターテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { LegacyRedisCacheAdapter } from '../adapters/legacy-redis-cache.js';
import { setCacheConfig, resetCacheConfig } from '../config/index.js';
import type { UnifiedCacheConfig } from '../config/types.js';
import type {
  CacheableUserProfile,
  CacheablePost,
  CacheableFeed,
} from '../adapters/legacy-redis-cache.js';

// テスト開始前にグローバル設定をリセット
resetCacheConfig();

// テスト用設定
const testConfig: UnifiedCacheConfig = {
  enabled: true,
  memory: {
    enabled: true,
    maxSize: 1024 * 1024, // 1MB
    defaultTTL: 60,
  },
  redis: {
    enabled: false, // テストではRedisを無効化
    defaultTTL: 300,
    keyPrefix: 'test:cache',
    compression: {
      enabled: false,
      threshold: 1024,
      level: 6,
    },
  },
  categoryTTLs: {
    user: 3600,
    post: 1800,
    feed: 900,
    media: 86400,
    search: 300,
    session: 7200,
    graphql: 300,
    api: 600,
    config: 3600,
    temp: 60,
  },
  metrics: {
    enabled: true,
    updateInterval: 60,
    detailed: false,
  },
  logging: {
    level: 'silent',
    operations: false,
    performance: false,
  },
  development: {
    enabled: true,
    debug: false,
    testMode: true,
  },
};

describe('LegacyRedisCacheAdapter', () => {
  let adapter: LegacyRedisCacheAdapter;

  beforeEach(() => {
    // テスト用設定を先に設定してからアダプターを作成
    resetCacheConfig();
    setCacheConfig(testConfig);
    adapter = new LegacyRedisCacheAdapter({ config: testConfig });
  });

  afterEach(() => {
    resetCacheConfig();
  });

  describe('基本操作（レガシー互換）', () => {
    it('set/get操作が動作する', async () => {
      const testData = { id: '123', name: 'Test User' };

      await adapter.set('user', 'test-key', testData);
      const result = await adapter.get('user', 'test-key');

      expect(result).toEqual(testData);
    });

    it('delete操作が動作する', async () => {
      const testData = { id: '123', name: 'Test User' };

      await adapter.set('user', 'test-key', testData);
      await adapter.delete('user', 'test-key');

      const result = await adapter.get('user', 'test-key');
      expect(result).toBeNull();
    });
  });

  describe('ユーザープロフィールキャッシュ', () => {
    it('ユーザープロフィールの設定と取得ができる', async () => {
      const userProfile: CacheableUserProfile = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        profileImageId: null,
        bio: 'Test bio',
        isVerified: false,
        role: 'user',
      };

      await adapter.setUserProfile('user123', userProfile);
      const result = await adapter.getUserProfile('user123');

      expect(result).toEqual(userProfile);
    });

    it('ユーザープロフィールの削除ができる', async () => {
      const userProfile: CacheableUserProfile = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        isVerified: false,
        role: 'user',
      };

      await adapter.setUserProfile('user123', userProfile);
      await adapter.deleteUserProfile('user123');

      const result = await adapter.getUserProfile('user123');
      expect(result).toBeNull();
    });
  });

  describe('投稿キャッシュ', () => {
    it('投稿の設定と取得ができる', async () => {
      const post: CacheablePost = {
        id: 'post123',
        content: 'Test post content',
        authorId: 'user123',
        visibility: 'public',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        mediaIds: [],
        likesCount: 0,
        commentsCount: 0,
      };

      await adapter.setPost('post123', post);
      const result = await adapter.getPost('post123');

      expect(result).toEqual(post);
    });

    it('投稿の削除ができる', async () => {
      const post: CacheablePost = {
        id: 'post123',
        content: 'Test post content',
        authorId: 'user123',
        visibility: 'public',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        likesCount: 0,
        commentsCount: 0,
      };

      await adapter.setPost('post123', post);
      await adapter.deletePost('post123');

      const result = await adapter.getPost('post123');
      expect(result).toBeNull();
    });
  });

  describe('フィードキャッシュ', () => {
    it('フィードの設定と取得ができる', async () => {
      const feed: CacheableFeed = {
        posts: [],
        hasNextPage: false,
        endCursor: undefined,
        totalCount: 0,
      };

      await adapter.setFeed('user123', feed, 'timeline');
      const result = await adapter.getFeed('user123', 'timeline');

      expect(result).toEqual(feed);
    });

    it('フィードの削除ができる', async () => {
      const feed: CacheableFeed = {
        posts: [],
        hasNextPage: false,
        totalCount: 0,
      };

      await adapter.setFeed('user123', feed, 'timeline');
      await adapter.deleteFeed('user123', 'timeline');

      const result = await adapter.getFeed('user123', 'timeline');
      expect(result).toBeNull();
    });
  });

  describe('統計情報', () => {
    it('統計情報が取得できる', async () => {
      const initialStats = adapter.getStats();
      expect(initialStats).toHaveProperty('hits');
      expect(initialStats).toHaveProperty('misses');
      expect(initialStats).toHaveProperty('sets');
      expect(initialStats).toHaveProperty('deletes');
      expect(initialStats).toHaveProperty('totalKeys');
      expect(initialStats).toHaveProperty('hitRate');
    });
  });

  describe('全キャッシュクリア', () => {
    it('全キャッシュのクリアができる', async () => {
      await adapter.set('user', 'key1', { id: '1' });
      await adapter.set('post', 'key2', { id: '2' });

      await adapter.clearAll();

      const result1 = await adapter.get('user', 'key1');
      const result2 = await adapter.get('post', 'key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});
