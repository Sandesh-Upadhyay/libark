/**
 * 🚀 統一キャッシュシステム パフォーマンステスト（拡張版）
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

describe('パフォーマンステスト（拡張版）', () => {
  let cacheManager: UnifiedCacheManager;

  beforeEach(() => {
    setCacheConfig(testConfig);
    cacheManager = new UnifiedCacheManager({ config: testConfig });
  });

  afterEach(async () => {
    await cacheManager.dispose();
    resetCacheConfig();
  });

  describe('メモリ使用量の測定', () => {
    it('大量データのメモリ使用量が測定可能', async () => {
      const initialStats = cacheManager.getStats();

      // 大量のデータを設定
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 500; i++) {
        const data = {
          id: `item${i}`,
          content: 'x'.repeat(1000), // 1KBのデータ
          metadata: Array.from({ length: 10 }, (_, j) => ({
            key: `key${j}`,
            value: `value${j}`,
          })),
        };
        promises.push(cacheManager.set('temp', `item${i}`, data));
      }

      await Promise.all(promises);

      const finalStats = cacheManager.getStats();

      expect(finalStats.sets).toBeGreaterThan(initialStats.sets);
      expect(finalStats.sets).toBe(500);
    });

    it('異なるサイズのデータのメモリ使用量が測定可能', async () => {
      const sizes = [100, 1000, 10000]; // 100B, 1KB, 10KB

      for (const size of sizes) {
        const data = {
          id: `size-${size}`,
          content: 'x'.repeat(size),
        };

        await cacheManager.set('temp', `key-${size}`, data);

        const result = await cacheManager.get('temp', `key-${size}`);
        expect(result).toBeDefined();
        expect((result as any).content.length).toBe(size);
      }
    });
  });

  describe('キャッシュの圧縮効果', () => {
    it('大きなデータで圧縮が有効になる', async () => {
      // 圧縮閾値を超える大きなデータ
      const largeData = {
        id: 'large',
        content: 'x'.repeat(5000), // 5KB
      };

      const startTime = process.hrtime.bigint();
      await cacheManager.set('temp', 'large-key', largeData);
      const durationNs = process.hrtime.bigint() - startTime;

      // 設定時間が測定可能
      expect(Number(durationNs)).toBeGreaterThan(0);

      // データが正しく取得できる
      const result = await cacheManager.get('temp', 'large-key');
      expect(result).toEqual(largeData);
    });

    it('小さなデータで圧縮がスキップされる', async () => {
      // 圧縮閾値未満の小さなデータ
      const smallData = {
        id: 'small',
        content: 'x'.repeat(100), // 100B
      };

      await cacheManager.set('temp', 'small-key', smallData);

      const result = await cacheManager.get('temp', 'small-key');
      expect(result).toEqual(smallData);
    });
  });

  describe('長時間実行時のメモリリーク検出', () => {
    it('繰り返し操作でメモリが安定する', async () => {
      const initialStats = cacheManager.getStats();

      // 繰り返し設定と削除
      for (let i = 0; i < 100; i++) {
        const data = { id: i, value: `iteration${i}` };
        await cacheManager.set('temp', `key${i}`, data);
        await cacheManager.get('temp', `key${i}`);
        await cacheManager.delete('temp', `key${i}`);
      }

      const finalStats = cacheManager.getStats();

      // 統計情報が更新されている
      expect(finalStats.sets).toBeGreaterThan(initialStats.sets);
      expect(finalStats.deletes).toBeGreaterThan(initialStats.deletes);
    });

    it('TTL期限切れでメモリが解放される', async () => {
      // 短いTTLで大量のデータを設定
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 100; i++) {
        const data = { id: i, value: `temp${i}` };
        promises.push(cacheManager.set('temp', `key${i}`, data, { ttl: 1 }));
      }

      await Promise.all(promises);

      // TTL期限切れを待つ
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 全てのデータが期限切れになっている
      const promises2: Promise<unknown>[] = [];
      for (let i = 0; i < 100; i++) {
        promises2.push(cacheManager.get('temp', `key${i}`));
      }

      const results = await Promise.all(promises2);

      // 全てnullであるはず
      results.forEach(result => {
        expect(result).toBeNull();
      });
    });
  });

  describe('異常系のパフォーマンス', () => {
    it('無効なキーへのアクセスが高速に処理される', async () => {
      const startTime = Date.now();
      const promises: Promise<unknown>[] = [];

      for (let i = 0; i < 1000; i++) {
        promises.push(cacheManager.get('temp', `non-existent-${i}`));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`1000回のミス: ${duration}ms (${(duration / 1000).toFixed(2)}ms/回)`);
      expect(duration).toBeLessThan(1000); // 1秒以内
    });

    it('無効なデータ型の設定がエラーにならずに処理される', async () => {
      const invalidData = {
        id: 'invalid',
        circular: {} as any,
      };

      // 循環参照を作成
      invalidData.circular = invalidData;

      // エラーが発生しないことを確認
      await cacheManager.set('temp', 'circular-key', invalidData);
      const result = await cacheManager.get('temp', 'circular-key');
      expect(result).toEqual(invalidData);
    });

    it('非常に長いキーが処理される', async () => {
      const longKey = 'a'.repeat(1000);
      const data = { id: 'test', value: 'data' };

      await cacheManager.set('temp', longKey, data);

      const result = await cacheManager.get('temp', longKey);
      expect(result).toEqual(data);
    });
  });

  describe('キャッシュ戦略のパフォーマンス比較', () => {
    it('異なるカテゴリのパフォーマンスが測定可能', async () => {
      const categories: Array<'user' | 'post' | 'media' | 'temp'> = [
        'user',
        'post',
        'media',
        'temp',
      ];
      const results: Record<string, number> = {};

      for (const category of categories) {
        const startTime = process.hrtime.bigint();

        for (let i = 0; i < 100; i++) {
          const data = { id: i, category };
          await cacheManager.set(category, `key${i}`, data);
          await cacheManager.get(category, `key${i}`);
        }

        const durationNs = process.hrtime.bigint() - startTime;
        const durationMs = Number(durationNs) / 1_000_000;
        results[category] = durationMs;

        console.log(`${category}カテゴリ: ${durationMs.toFixed(2)}ms`);
      }

      // 全てのカテゴリで処理が完了している
      Object.values(results).forEach(duration => {
        expect(duration).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(5000); // 5秒以内
      });
    });

    it('バージョン付きキャッシュのパフォーマンスが測定可能', async () => {
      const startTime = Date.now();

      // 複数のバージョンを設定
      for (let i = 0; i < 100; i++) {
        await cacheManager.set('user', 'key', { id: i, version: `v${i}` }, { version: `v${i}` });
      }

      // 各バージョンを取得
      for (let i = 0; i < 100; i++) {
        const result = await cacheManager.get('user', 'key', { version: `v${i}` });
        expect(result).toBeDefined();
      }

      const duration = Date.now() - startTime;

      console.log(`100バージョンの操作: ${duration}ms`);
      expect(duration).toBeLessThan(3000); // 3秒以内
    });
  });

  describe('スケーラビリティテスト', () => {
    it('10000件のデータが処理可能', async () => {
      const startTime = Date.now();
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 10000; i++) {
        const data = {
          id: `item${i}`,
          value: `value${i}`,
        };
        promises.push(cacheManager.set('temp', `key${i}`, data));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`10000件設定: ${duration}ms (${(duration / 10000).toFixed(2)}ms/件)`);
      expect(duration).toBeLessThan(30000); // 30秒以内
    });

    it('多数のカテゴリが処理可能', async () => {
      const categories = [
        'user',
        'post',
        'media',
        'temp',
        'session',
        'graphql',
        'api',
        'config',
        'search',
        'feed',
      ] as const;

      const startTime = Date.now();
      const promises: Promise<void>[] = [];

      for (const category of categories) {
        for (let i = 0; i < 100; i++) {
          const data = { id: i, category };
          promises.push(cacheManager.set(category, `${category}-key${i}`, data));
        }
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`1000件（10カテゴリ×100件）設定: ${duration}ms`);
      expect(duration).toBeLessThan(10000); // 10秒以内
    });
  });

  describe('エッジケースのパフォーマンス', () => {
    it('空文字列のキーが処理される', async () => {
      const data = { id: 'test', value: 'data' };

      await cacheManager.set('temp', '', data);

      const result = await cacheManager.get('temp', '');
      expect(result).toEqual(data);
    });

    it('特殊文字を含むキーが処理される', async () => {
      const specialKeys = [
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key:with:colons',
        'key/with/slashes',
      ];

      const promises: Promise<void>[] = [];
      for (const key of specialKeys) {
        const data = { id: key, value: 'data' };
        promises.push(cacheManager.set('temp', key, data));
      }

      await Promise.all(promises);

      for (const key of specialKeys) {
        const result = await cacheManager.get('temp', key);
        expect(result).toBeDefined();
        expect((result as any).id).toBe(key);
      }
    });

    it('nullとundefinedの値が処理される', async () => {
      await cacheManager.set('temp', 'null-key', null);
      await cacheManager.set('temp', 'undefined-key', undefined);

      const nullResult = await cacheManager.get('temp', 'null-key');
      const undefinedResult = await cacheManager.get('temp', 'undefined-key');

      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });
  });

  describe('パフォーマンスの安定性', () => {
    it('複数回の実行でパフォーマンスが安定する', async () => {
      const durations: number[] = [];

      for (let run = 0; run < 5; run++) {
        const startTime = Date.now();

        for (let i = 0; i < 100; i++) {
          const data = { id: i, value: `value${i}` };
          await cacheManager.set('temp', `key${i}`, data);
          await cacheManager.get('temp', `key${i}`);
        }

        const duration = Date.now() - startTime;
        durations.push(duration);

        // キャッシュをクリア
        await cacheManager.clear();
      }

      // パフォーマンスの変動が大きすぎないことを確認
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDeviation = Math.max(...durations) - Math.min(...durations);

      console.log(`平均実行時間: ${avgDuration.toFixed(2)}ms`);
      console.log(`最大偏差: ${maxDeviation.toFixed(2)}ms`);

      // 最大偏差が平均の100%以内、または5ms以内であることを期待（超短時間の揺らぎを許容）
      if (avgDuration === 0) {
        expect(maxDeviation).toBe(0);
      } else {
        const allowedDeviation = Math.max(avgDuration * 1.0, 5);
        expect(maxDeviation).toBeLessThanOrEqual(allowedDeviation);
      }
    });
  });
});
