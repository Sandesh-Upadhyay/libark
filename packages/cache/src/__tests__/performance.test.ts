/**
 * 🚀 統一キャッシュシステム パフォーマンステスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { UnifiedCacheManager } from '../cache-manager.js';
import { setCacheConfig, resetCacheConfig } from '../config/index.js';
import type { UnifiedCacheConfig } from '../config/types.js';

// テスト開始前にグローバル設定をリセット
resetCacheConfig();

// テスト用設定
const testConfig: UnifiedCacheConfig = {
  enabled: true,
  memory: {
    enabled: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    defaultTTL: 300,
  },
  redis: {
    enabled: false, // パフォーマンステストではRedisを無効化
    defaultTTL: 3600,
    keyPrefix: 'perf:cache',
    compression: {
      enabled: true,
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
    detailed: true,
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

describe('パフォーマンステスト', () => {
  let cacheManager: UnifiedCacheManager;

  beforeEach(() => {
    setCacheConfig(testConfig);
    cacheManager = new UnifiedCacheManager({ config: testConfig });
  });

  afterEach(async () => {
    await cacheManager.dispose();
    resetCacheConfig();
  });

  describe('大量データ処理', () => {
    it('1000件のデータ設定が高速に処理される', async () => {
      const startTime = Date.now();
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 1000; i++) {
        const data = {
          id: `user${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          data: 'x'.repeat(100), // 100文字のダミーデータ
        };
        promises.push(cacheManager.set('user', `user${i}`, data));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`1000件設定: ${duration}ms (${(duration / 1000).toFixed(2)}ms/件)`);
      expect(duration).toBeLessThan(5000); // 5秒以内
    });

    it('1000件のデータ取得が高速に処理される', async () => {
      // 事前にデータを設定
      const setupPromises: Promise<void>[] = [];
      for (let i = 0; i < 1000; i++) {
        const data = {
          id: `user${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
        };
        setupPromises.push(cacheManager.set('user', `user${i}`, data));
      }
      await Promise.all(setupPromises);

      // 取得パフォーマンステスト
      const startTime = Date.now();
      const promises: Promise<unknown>[] = [];

      for (let i = 0; i < 1000; i++) {
        promises.push(cacheManager.get('user', `user${i}`));
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`1000件取得: ${duration}ms (${(duration / 1000).toFixed(2)}ms/件)`);
      expect(duration).toBeLessThan(2000); // 2秒以内
      expect(results.filter(r => r !== null)).toHaveLength(1000);
    });

    it('混合操作（設定・取得・削除）が効率的に処理される', async () => {
      const startTime = Date.now();
      const promises: Promise<unknown>[] = [];

      for (let i = 0; i < 500; i++) {
        // 設定
        const data = { id: `item${i}`, value: Math.random() };
        promises.push(cacheManager.set('temp', `item${i}`, data));

        // 取得
        promises.push(cacheManager.get('temp', `item${i}`));

        // 削除（一部のみ）
        if (i % 10 === 0) {
          promises.push(cacheManager.delete('temp', `item${i}`));
        }
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`混合操作: ${duration}ms`);
      expect(duration).toBeLessThan(3000); // 3秒以内
    });
  });

  describe('メモリ効率性', () => {
    it('大きなデータでもメモリ制限内で動作する', async () => {
      const largeData = {
        id: 'large-object',
        content: 'x'.repeat(1024 * 100), // 100KB
        metadata: Array.from({ length: 1000 }, (_, i) => ({
          key: `key${i}`,
          value: `value${i}`,
        })),
      };

      // 複数の大きなオブジェクトを設定
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          cacheManager.set('media', `large${i}`, {
            ...largeData,
            id: `large-object-${i}`,
          })
        );
      }

      await Promise.all(promises);

      // 統計情報を確認
      const stats = cacheManager.getStats();
      expect(stats.sets).toBe(50);

      // データが正しく取得できることを確認
      const result = await cacheManager.get('media', 'large0');
      expect(result).toBeDefined();
      expect(result?.id).toBe('large-object-0');
    });
  });

  describe('同時実行性能', () => {
    it('同時アクセスが正しく処理される', async () => {
      const concurrentOperations = 100;
      const startTime = Date.now();

      // 同時に複数の操作を実行
      const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const key = `concurrent${i}`;
        const data = { id: i, timestamp: Date.now() };

        // 設定
        await cacheManager.set('temp', key, data);

        // 取得
        const result = await cacheManager.get('temp', key);
        expect(result).toEqual(data);

        // 削除
        await cacheManager.delete('temp', key);

        // 削除確認
        const deletedResult = await cacheManager.get('temp', key);
        expect(deletedResult).toBeNull();

        return i;
      });

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`同時実行${concurrentOperations}件: ${duration}ms`);
      expect(results).toHaveLength(concurrentOperations);
      expect(duration).toBeLessThan(5000); // 5秒以内
    });
  });

  describe('ヒット率最適化', () => {
    it('頻繁にアクセスされるデータのヒット率が高い', async () => {
      const hotKeys = ['hot1', 'hot2', 'hot3'];
      const coldKeys = Array.from({ length: 100 }, (_, i) => `cold${i}`);

      // ホットデータを設定
      for (const key of hotKeys) {
        await cacheManager.set('user', key, { id: key, type: 'hot' });
      }

      // コールドデータを設定
      for (const key of coldKeys) {
        await cacheManager.set('user', key, { id: key, type: 'cold' });
      }

      // ホットデータに頻繁にアクセス
      for (let i = 0; i < 1000; i++) {
        const hotKey = hotKeys[i % hotKeys.length];
        await cacheManager.get('user', hotKey);
      }

      // コールドデータに少しアクセス
      for (let i = 0; i < 50; i++) {
        const coldKey = coldKeys[i % coldKeys.length];
        await cacheManager.get('user', coldKey);
      }

      const stats = cacheManager.getStats();
      console.log(`ヒット率: ${stats.hitRate.toFixed(2)}%`);

      // ヒット率が90%以上であることを期待
      expect(stats.hitRate).toBeGreaterThan(90);
    });
  });
});
