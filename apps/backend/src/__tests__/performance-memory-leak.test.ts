/**
 * 💾 メモリリーク検出テスト
 *
 * 長時間実行時、複数のリクエスト処理後、大量データ処理後などのメモリ使用量を測定し、メモリリークを検出します
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import type { PrismaClient } from '@libark/db/server';
import type { MemoryUsage } from 'node:memory_usage';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { describeIfPerf, scaledCount } from './helpers/perf-test-utils.js';

// メモリ使用量の閾値（MB）
const MEMORY_THRESHOLDS = {
  BASELINE: 100, // ベースラインメモリ使用量
  INCREASE_THRESHOLD: 50, // メモリ増加の閾値
  LEAK_THRESHOLD: 100, // メモリリークの閾値
  GC_THRESHOLD: 0, // ガベージコレクション後のメモリ減少の閾値（0以上であればOK）
};

const PERF_USER_COUNT = scaledCount(5);
const PERF_POST_COUNT = scaledCount(20);

/**
 * メモリ使用量を取得するヘルパー関数
 */
function getMemoryUsage(): MemoryUsage {
  return process.memoryUsage();
}

/**
 * メモリ使用量をMBに変換するヘルパー関数
 */
function toMB(bytes: number): number {
  return bytes / 1024 / 1024;
}

/**
 * メモリ使用量の差分を計算するヘルパー関数
 */
function getMemoryDiff(before: MemoryUsage, after: MemoryUsage): number {
  return toMB(after.heapUsed) - toMB(before.heapUsed);
}

/**
 * ガベージコレクションを強制実行するヘルパー関数
 */
function forceGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  }
}

describeIfPerf('💾 メモリリーク検出テスト', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  const testUsers: any[] = [];
  const testPosts: any[] = [];

  beforeAll(async () => {
    // テストアプリの初期化
    app = await createTestApp();
    prisma = app.prisma;
    redis = app.redis;

    // テストユーザーの作成
    for (let i = 0; i < PERF_USER_COUNT; i++) {
      const hashedPassword = await bcrypt.hash(`Password${i}!`, 10);
      const user = await prisma.user.create({
        data: {
          id: `20000000-0000-4000-8000-00000000000${i}`,
          email: `mem-leak-test-${i}@libark.dev`,
          username: `memleaktest${i}`,
          passwordHash: hashedPassword,
          displayName: `Memory Leak Test User ${i}`,
          isActive: true,
          isVerified: true,
        },
      });
      testUsers.push(user);
    }

    // テスト投稿の作成
    for (let i = 0; i < PERF_POST_COUNT; i++) {
      const post = await prisma.post.create({
        data: {
          id: `30000000-0000-4000-8000-00000000000${i}`,
          userId: testUsers[i % testUsers.length].id,
          content: `Memory leak test post ${i}`,
          visibility: 'PUBLIC',
        },
      });
      testPosts.push(post);
    }
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await prisma.post.deleteMany({
      where: {
        id: {
          in: testPosts.map(p => p.id),
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: testUsers.map(u => u.id),
        },
      },
    });

    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // Redisのクリーンアップ
    await redis.flushdb();
  });

  afterEach(async () => {
    // Redisのクリーンアップ
    await redis.flushdb();
  });

  describe('⏰ 長時間実行時のメモリ使用量測定', () => {
    it('長時間実行してもメモリ使用量が急激に増加しない', async () => {
      const iterations = scaledCount(100);
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 繰り返し処理を実行
      for (let i = 0; i < iterations; i++) {
        // 投稿を取得
        await prisma.post.findMany({ take: 10 });

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 10回ごとにガベージコレクションを強制実行
        if (i % 10 === 0) {
          forceGarbageCollection();
        }
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認（急激な増加がない）
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });

    it.skip('定期的なガベージコレクションでメモリが解放される', async () => {
      const iterations = scaledCount(50);
      const memoryBeforeGC: number[] = [];
      const memoryAfterGC: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // メモリを使用する処理
        await prisma.post.findMany({ take: 10 });
        await redis.set(`test-key-${i}`, `test-value-${i}`);

        // GC前のメモリ使用量を記録
        const beforeGC = getMemoryUsage();
        memoryBeforeGC.push(toMB(beforeGC.heapUsed));

        // ガベージコレクションを強制実行
        forceGarbageCollection();

        // GC後のメモリ使用量を記録
        const afterGC = getMemoryUsage();
        memoryAfterGC.push(toMB(afterGC.heapUsed));
      }

      // GC後にメモリが減少していることを確認
      const avgBeforeGC = memoryBeforeGC.reduce((a, b) => a + b, 0) / memoryBeforeGC.length;
      const avgAfterGC = memoryAfterGC.reduce((a, b) => a + b, 0) / memoryAfterGC.length;

      expect(avgBeforeGC - avgAfterGC).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🔄 複数のリクエスト処理後のメモリ使用量測定', () => {
    it('複数のGraphQLリクエストを処理してもメモリリークが発生しない', async () => {
      const requestCount = scaledCount(100);
      const memorySnapshots: number[] = [];

      const query = `
        query GetPosts($first: Int!) {
          posts(first: $first) {
            edges {
              node {
                id
                content
                user {
                  id
                  username
                  displayName
                }
              }
            }
          }
        }
      `;

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 複数のリクエストを処理
      for (let i = 0; i < requestCount; i++) {
        await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query,
            variables: { first: 10 },
          },
        });

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 10回ごとにガベージコレクションを強制実行
        if (i % 10 === 0) {
          forceGarbageCollection();
        }
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });

    it('複数のミューテーションを処理してもメモリリークが発生しない', async () => {
      const mutationCount = scaledCount(50);
      const memorySnapshots: number[] = [];

      const mutation = `
        mutation CreatePost($content: String!) {
          createPost(input: { content: $content }) {
            id
            content
            createdAt
          }
        }
      `;

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 複数のミューテーションを処理
      for (let i = 0; i < mutationCount; i++) {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: mutation,
            variables: { content: `Memory leak test post ${i}` },
          },
        });

        // 作成した投稿を削除
        const result = JSON.parse(response.payload);
        if (result.data?.createPost?.id) {
          await prisma.post.delete({
            where: { id: result.data.createPost.id },
          });
        }

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 5回ごとにガベージコレクションを強制実行
        if (i % 5 === 0) {
          forceGarbageCollection();
        }
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });
  });

  describe('📊 大量データ処理後のメモリ使用量測定', () => {
    it('大量のデータを処理してもメモリリークが発生しない', async () => {
      const dataCount = scaledCount(500);
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 大量の投稿を作成
      for (let i = 0; i < dataCount; i++) {
        await prisma.post.create({
          data: {
            id: `bulk-post-${i}`,
            userId: testUsers[i % testUsers.length].id,
            content: `Bulk test post ${i}`,
            visibility: 'PUBLIC',
          },
        });

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 50回ごとにガベージコレクションを強制実行
        if (i % 50 === 0) {
          forceGarbageCollection();
        }
      }

      // 大量の投稿を取得
      await prisma.post.findMany({
        where: {
          id: {
            startsWith: 'bulk-post-',
          },
        },
        take: dataCount,
      });

      // メモリ使用量を記録
      const afterQueryMemory = getMemoryUsage();
      memorySnapshots.push(toMB(afterQueryMemory.heapUsed));

      // クリーンアップ
      await prisma.post.deleteMany({
        where: {
          id: {
            startsWith: 'bulk-post-',
          },
        },
      });

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD * 2);
    });
  });

  describe('💾 キャッシュのメモリ使用量測定', () => {
    it('大量のキャッシュ操作でもメモリリークが発生しない', async () => {
      const cacheCount = 1000;
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 大量のキャッシュを書き込み
      for (let i = 0; i < cacheCount; i++) {
        await redis.set(`cache-key-${i}`, `cache-value-${i}`);

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 100回ごとにガベージコレクションを強制実行
        if (i % 100 === 0) {
          forceGarbageCollection();
        }
      }

      // 大量のキャッシュを読み込み
      for (let i = 0; i < cacheCount; i++) {
        await redis.get(`cache-key-${i}`);
      }

      // メモリ使用量を記録
      const afterReadMemory = getMemoryUsage();
      memorySnapshots.push(toMB(afterReadMemory.heapUsed));

      // クリーンアップ
      for (let i = 0; i < cacheCount; i++) {
        await redis.del(`cache-key-${i}`);
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });
  });

  describe('👤 セッションのメモリ使用量測定', () => {
    it('複数のセッションを作成してもメモリリークが発生しない', async () => {
      const sessionCount = 100;
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 複数のセッションを作成
      for (let i = 0; i < sessionCount; i++) {
        await redis.set(
          `session-${i}`,
          JSON.stringify({ userId: testUsers[i % testUsers.length].id })
        );

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 10回ごとにガベージコレクションを強制実行
        if (i % 10 === 0) {
          forceGarbageCollection();
        }
      }

      // クリーンアップ
      for (let i = 0; i < sessionCount; i++) {
        await redis.del(`session-${i}`);
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });
  });

  describe('📡 GraphQLサブスクリプションのメモリ使用量測定', () => {
    it('サブスクリプション接続を管理してもメモリリークが発生しない', async () => {
      const subscriptionCount = 10;
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // サブスクリプション接続をシミュレート
      for (let i = 0; i < subscriptionCount; i++) {
        // サブスクリプションチャンネルを作成
        await redis.set(
          `subscription-${i}`,
          JSON.stringify({ postId: testPosts[i % testPosts.length].id })
        );

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // ガベージコレクションを強制実行
        forceGarbageCollection();
      }

      // クリーンアップ
      for (let i = 0; i < subscriptionCount; i++) {
        await redis.del(`subscription-${i}`);
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });
  });

  describe('🗄️ データベース接続プールのメモリ使用量測定', () => {
    it('データベース接続プールを管理してもメモリリークが発生しない', async () => {
      const queryCount = scaledCount(100);
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 複数のクエリを実行
      for (let i = 0; i < queryCount; i++) {
        await prisma.post.findMany({ take: 10 });
        await prisma.user.findMany({ take: 10 });

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // 10回ごとにガベージコレクションを強制実行
        if (i % 10 === 0) {
          forceGarbageCollection();
        }
      }

      // 最終メモリ使用量を記録
      const finalMemory = getMemoryUsage();
      const memoryIncrease = getMemoryDiff(initialMemory, finalMemory);

      // メモリ増加が閾値内であることを確認
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariance = maxMemory - minMemory;

      expect(memoryVariance).toBeLessThan(MEMORY_THRESHOLDS.LEAK_THRESHOLD);
    });
  });

  describe('🔍 メモリリークの検出', () => {
    it('メモリ使用量の傾向を監視してリークを検出する', async () => {
      const iterations = scaledCount(50);
      const memorySnapshots: number[] = [];

      // 初期メモリ使用量を記録
      const initialMemory = getMemoryUsage();
      memorySnapshots.push(toMB(initialMemory.heapUsed));

      // 繰り返し処理を実行
      for (let i = 0; i < iterations; i++) {
        // メモリを使用する処理
        await prisma.post.findMany({ take: 10 });
        await redis.set(`test-key-${i}`, `test-value-${i}`);

        // メモリ使用量を記録
        const memory = getMemoryUsage();
        memorySnapshots.push(toMB(memory.heapUsed));

        // ガベージコレクションを強制実行
        forceGarbageCollection();
      }

      // メモリ使用量の傾向を分析
      const firstHalf = memorySnapshots.slice(0, Math.floor(iterations / 2));
      const secondHalf = memorySnapshots.slice(Math.floor(iterations / 2));

      const avgFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const memoryTrend = avgSecondHalf - avgFirstHalf;

      // メモリ使用量の傾向が閾値内であることを確認
      expect(memoryTrend).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // クリーンアップ
      for (let i = 0; i < iterations; i++) {
        await redis.del(`test-key-${i}`);
      }
    });
  });

  describe('♻️ ガベージコレクションの監視', () => {
    it.skip('ガベージコレクションが正常に動作している', async () => {
      const iterations = scaledCount(20);
      const memoryBeforeGC: number[] = [];
      const memoryAfterGC: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // メモリを使用する処理
        await prisma.post.findMany({ take: 10 });
        await redis.set(`gc-test-key-${i}`, `gc-test-value-${i}`);

        // GC前のメモリ使用量を記録
        const beforeGC = getMemoryUsage();
        memoryBeforeGC.push(toMB(beforeGC.heapUsed));

        // ガベージコレクションを強制実行
        forceGarbageCollection();

        // GC後のメモリ使用量を記録
        const afterGC = getMemoryUsage();
        memoryAfterGC.push(toMB(afterGC.heapUsed));
      }

      // GC後にメモリが減少していることを確認
      const avgBeforeGC = memoryBeforeGC.reduce((a, b) => a + b, 0) / memoryBeforeGC.length;
      const avgAfterGC = memoryAfterGC.reduce((a, b) => a + b, 0) / memoryAfterGC.length;

      expect(avgBeforeGC - avgAfterGC).toBeGreaterThanOrEqual(0);

      // クリーンアップ
      for (let i = 0; i < iterations; i++) {
        await redis.del(`gc-test-key-${i}`);
      }
    });
  });

  describe('📏 メモリ使用量の閾値チェック', () => {
    it('すべての主要操作がメモリ閾値を満たしている', async () => {
      const memoryMetrics: { [key: string]: number } = {};

      // 初期メモリ使用量
      const initialMemory = getMemoryUsage();
      memoryMetrics.initial = toMB(initialMemory.heapUsed);

      // GraphQLクエリ
      const query = `
        query GetPosts($first: Int!) {
          posts(first: $first) {
            edges {
              node {
                id
                content
              }
            }
          }
        }
      `;

      for (let i = 0; i < 10; i++) {
        await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query,
            variables: { first: 10 },
          },
        });
      }

      const afterGraphQLMemory = getMemoryUsage();
      memoryMetrics.graphql = toMB(afterGraphQLMemory.heapUsed) - memoryMetrics.initial;

      // データベースクエリ
      for (let i = 0; i < 10; i++) {
        await prisma.post.findMany({ take: 10 });
      }

      const afterDBMemory = getMemoryUsage();
      memoryMetrics.database = toMB(afterDBMemory.heapUsed) - memoryMetrics.initial;

      // キャッシュ操作
      for (let i = 0; i < 10; i++) {
        await redis.set(`test-key-${i}`, `test-value-${i}`);
        await redis.get(`test-key-${i}`);
      }

      const afterCacheMemory = getMemoryUsage();
      memoryMetrics.cache = toMB(afterCacheMemory.heapUsed) - memoryMetrics.initial;

      // ガベージコレクション
      forceGarbageCollection();

      const afterGCMemory = getMemoryUsage();
      memoryMetrics.gc = toMB(afterGCMemory.heapUsed) - memoryMetrics.initial;

      // すべてのメトリクスが閾値内であることを確認
      expect(memoryMetrics.graphql).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);
      expect(memoryMetrics.database).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);
      expect(memoryMetrics.cache).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);
      expect(memoryMetrics.gc).toBeLessThan(MEMORY_THRESHOLDS.INCREASE_THRESHOLD);

      // クリーンアップ
      for (let i = 0; i < 10; i++) {
        await redis.del(`test-key-${i}`);
      }
    });
  });
});
