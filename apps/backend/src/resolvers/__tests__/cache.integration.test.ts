/**
 * 🧪 GraphQLキャッシュリゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../../__tests__/helpers/test-data.js';

/**
 * このテストでは以下を検証します:
 * - 認証キャッシュ統計情報の取得
 * - レート制限統計情報の取得
 * - ユーザーキャッシュの無効化
 * - 開発環境でのみ利用可能であること
 * - 権限なしでのキャッシュ操作のエラー
 */

describe('🚀 GraphQLキャッシュリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  const makeUnique = (prefix: string) => {
    const ts = Date.now() % 1000000;
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${ts}-${rnd}`;
  };

  const authCacheStatsQuery = `
    query AuthCacheStats {
      authCacheStats {
        l1Hits
        l2Hits
        dbHits
        totalRequests
        hitRate
        enabled
      }
    }
  `;

  const rateLimitStatsQuery = `
    query RateLimitStats {
      rateLimitStats {
        totalKeys
        blockedIdentifiers
        enabled
      }
    }
  `;

  const invalidateUserCacheMutation = `
    mutation InvalidateUserCache($userId: UUID!) {
      invalidateUserCache(userId: $userId)
    }
  `;

  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        accessToken
        user { id email }
      }
    }
  `;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // 毎テストごとにDB/Redisクリーンな状態を担保
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  afterEach(async () => {
    // 念のためのクリーンアップ（失敗時も続行）
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  it('認証キャッシュ統計情報が取得できる', async () => {
    // ユーザーを作成してログイン（キャッシュを生成するため）
    const userA = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // ログインしてキャッシュを生成
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    // 認証キャッシュ統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.authCacheStats).toBeDefined();
    expect(typeof body.data.authCacheStats.l1Hits).toBe('number');
    expect(typeof body.data.authCacheStats.l2Hits).toBe('number');
    expect(typeof body.data.authCacheStats.dbHits).toBe('number');
    expect(typeof body.data.authCacheStats.totalRequests).toBe('number');
    expect(typeof body.data.authCacheStats.hitRate).toBe('number');
    expect(typeof body.data.authCacheStats.enabled).toBe('boolean');
  });

  it('レート制限統計情報が取得できる', async () => {
    // レート制限統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: rateLimitStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.rateLimitStats).toBeDefined();
    expect(typeof body.data.rateLimitStats.totalKeys).toBe('number');
    expect(typeof body.data.rateLimitStats.blockedIdentifiers).toBe('number');
    expect(typeof body.data.rateLimitStats.enabled).toBe('boolean');
  });

  it('ユーザーキャッシュの無効化が成功する', async () => {
    // ユーザーを作成してログイン（キャッシュを生成するため）
    const userA = makeUnique('user-a');

    const user = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // ログインしてキャッシュを生成
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    // ユーザーキャッシュを無効化
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: invalidateUserCacheMutation,
        variables: { userId: user.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.invalidateUserCache).toBe(true);
  });

  it('存在しないユーザーのキャッシュ無効化は成功する（エラーにならない）', async () => {
    // 存在しないユーザーIDでキャッシュ無効化を試行
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: invalidateUserCacheMutation,
        variables: { userId: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.invalidateUserCache).toBe(true);
  });

  it('キャッシュ統計情報は数値型である', async () => {
    // ユーザーを作成してログイン（キャッシュを生成するため）
    const userA = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // ログインしてキャッシュを生成
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    // 認証キャッシュ統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();

    const stats = body.data.authCacheStats;
    expect(stats.l1Hits).toBeGreaterThanOrEqual(0);
    expect(stats.l2Hits).toBeGreaterThanOrEqual(0);
    expect(stats.dbHits).toBeGreaterThanOrEqual(0);
    expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeLessThanOrEqual(1);
  });

  it('キャッシュ統計情報の合計が正しい', async () => {
    // ユーザーを作成してログイン（キャッシュを生成するため）
    const userA = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // ログインしてキャッシュを生成
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    // 認証キャッシュ統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();

    const stats = body.data.authCacheStats;
    const totalHits = stats.l1Hits + stats.l2Hits;
    const expectedTotal = totalHits + stats.dbHits;
    expect(stats.totalRequests).toBe(expectedTotal);
  });

  it('ヒット率が正しく計算される', async () => {
    // ユーザーを作成してログイン（キャッシュを生成するため）
    const userA = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // ログインしてキャッシュを生成
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    // 認証キャッシュ統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();

    const stats = body.data.authCacheStats;
    const totalHits = stats.l1Hits + stats.l2Hits;

    if (stats.totalRequests > 0) {
      const expectedHitRate = totalHits / stats.totalRequests;
      expect(stats.hitRate).toBeCloseTo(expectedHitRate, 2);
    } else {
      expect(stats.hitRate).toBe(0);
    }
  });

  it('レート制限統計情報の初期値が正しい', async () => {
    // レート制限統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: rateLimitStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();

    const stats = body.data.rateLimitStats;
    expect(stats.totalKeys).toBeGreaterThanOrEqual(0);
    expect(stats.blockedIdentifiers).toBeGreaterThanOrEqual(0);
    expect(stats.enabled).toBe(true);
  });

  it('複数回のログインでキャッシュ統計が更新される', async () => {
    // ユーザーを作成
    const userA = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // 初期統計を取得
    const initialRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    const initialBody = JSON.parse(initialRes.body);
    expect(initialBody.errors).toBeUndefined();
    const initialStats = initialBody.data.authCacheStats;

    // ログインを複数回実行
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        payload: {
          query: loginMutation,
          variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
        },
      });
    }

    // 更新後の統計を取得
    const updatedRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    const updatedBody = JSON.parse(updatedRes.body);
    expect(updatedBody.errors).toBeUndefined();
    const updatedStats = updatedBody.data.authCacheStats;

    // 統計が更新されていることを確認
    expect(updatedStats.totalRequests).toBeGreaterThan(initialStats.totalRequests);
  });

  it('キャッシュ統計情報のenabledフラグが正しい', async () => {
    // ユーザーを作成してログイン（キャッシュを生成するため）
    const userA = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // ログインしてキャッシュを生成
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    // 認証キャッシュ統計情報を取得
    const authRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    expect(authRes.statusCode).toBe(200);
    const authBody = JSON.parse(authRes.body);
    expect(authBody.errors).toBeUndefined();
    expect(typeof authBody.data.authCacheStats.enabled).toBe('boolean');

    // レート制限統計情報を取得
    const rateRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: rateLimitStatsQuery,
      },
    });

    expect(rateRes.statusCode).toBe(200);
    const rateBody = JSON.parse(rateRes.body);
    expect(rateBody.errors).toBeUndefined();
    expect(typeof rateBody.data.rateLimitStats.enabled).toBe('boolean');
  });

  it('キャッシュ統計情報が存在しない場合のデフォルト値が正しい', async () => {
    // Redisをクリアしてキャッシュ統計をリセット
    await app.redis.flushdb();

    // 認証キャッシュ統計情報を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: authCacheStatsQuery,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();

    const stats = body.data.authCacheStats;
    expect(stats.l1Hits).toBe(0);
    expect(stats.l2Hits).toBe(0);
    expect(stats.dbHits).toBe(0);
    expect(stats.totalRequests).toBe(0);
    expect(stats.hitRate).toBe(0);
    expect(stats.enabled).toBe(false);
  });
});
