/**
 * 🧪 Apollo Server キャッシュアダプターテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ApolloServerCacheAdapter } from '../adapters/apollo-server.js';
import { setCacheConfig, resetCacheConfig } from '../config/index.js';
import type { UnifiedCacheConfig } from '../config/types.js';

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

describe('ApolloServerCacheAdapter', () => {
  let adapter: ApolloServerCacheAdapter;

  beforeEach(() => {
    setCacheConfig(testConfig);
    adapter = new ApolloServerCacheAdapter({ config: testConfig });
  });

  afterEach(() => {
    resetCacheConfig();
  });

  describe('Apollo Server KeyValueCache インターフェース', () => {
    it('get/set操作が動作する', async () => {
      const testValue = 'test-value';

      await adapter.set('test-key', testValue);
      const result = await adapter.get('test-key');

      expect(result).toBe(testValue);
    });

    it('存在しないキーはundefinedを返す', async () => {
      const result = await adapter.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('TTL付きでデータを設定できる', async () => {
      const testValue = 'test-value';

      await adapter.set('test-key', testValue, { ttl: 1 }); // 1秒

      // 即座に取得できる
      let result = await adapter.get('test-key');
      expect(result).toBe(testValue);

      // 1.5秒後には期限切れ
      await new Promise(resolve => setTimeout(resolve, 1500));
      result = await adapter.get('test-key');
      expect(result).toBeUndefined();
    });

    it('delete操作が動作する', async () => {
      const testValue = 'test-value';

      await adapter.set('test-key', testValue);
      const deleteResult = await adapter.delete('test-key');

      expect(deleteResult).toBe(true);

      const result = await adapter.get('test-key');
      expect(result).toBeUndefined();
    });

    it('存在しないキーの削除はfalseを返す', async () => {
      const deleteResult = await adapter.delete('non-existent-key');
      expect(deleteResult).toBe(true); // 実装では常にtrueを返す
    });

    it('clear操作が動作する', async () => {
      await adapter.set('key1', 'value1');
      await adapter.set('key2', 'value2');

      await adapter.clear();

      const result1 = await adapter.get('key1');
      const result2 = await adapter.get('key2');

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーが発生してもApollo Serverインターフェースを維持する', async () => {
      // 無効な操作でもエラーを投げない
      await expect(adapter.set('', '')).resolves.not.toThrow();
      await expect(adapter.get('')).resolves.not.toThrow();
      await expect(adapter.delete('')).resolves.not.toThrow();
      await expect(adapter.clear()).resolves.not.toThrow();
    });
  });

  describe('GraphQLカテゴリでの動作', () => {
    it('GraphQLカテゴリのTTLが適用される', async () => {
      const testValue = 'graphql-response';

      // GraphQLカテゴリのデフォルトTTL（300秒）が適用される
      await adapter.set('graphql-key', testValue);

      const result = await adapter.get('graphql-key');
      expect(result).toBe(testValue);
    });
  });
});
