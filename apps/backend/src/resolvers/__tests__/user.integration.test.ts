/**
 * 🧪 GraphQLユーザーリゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../../__tests__/helpers/test-data.js';

/**
 * このテストでは以下を検証します:
 * - userByUsername クエリでユーザー情報が取得できる
 * - User型の統計系フィールド（postsCount, followersCount, followingCount）が取得できる
 * - 認証有無に応じた isFollowing / isFollowedBy の挙動
 * - user クエリの NOT_FOUND エラー
 */

describe('👤 GraphQLユーザーリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  const makeUnique = (prefix: string) => {
    const ts = Date.now() % 1000000;
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${ts}-${rnd}`;
  };

  const userQueryByUsername = `
    query UserByUsername($username: String!) {
      userByUsername(username: $username) {
        id
        username
        email
        displayName
        isActive
        postsCount
        followersCount
        followingCount
        isFollowing
        isFollowedBy
      }
    }
  `;

  const userQueryById = `
    query User($id: UUID!) {
      user(id: $id) {
        id
        username
      }
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

  it('userByUsername で匿名ユーザーからは isFollowing/isFollowedBy が false になる', async () => {
    const uname = makeUnique('user-a');

    await createTestUser(app.prisma, {
      email: `${uname}@libark.dev`,
      username: uname,
      password: 'Test12345!',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: userQueryByUsername,
        variables: { username: uname },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.userByUsername.username).toBe(uname);
    // 匿名リクエストでは常に false
    expect(body.data.userByUsername.isFollowing).toBe(false);
    expect(body.data.userByUsername.isFollowedBy).toBe(false);
    // 統計系フィールドは数値で返る
    expect(typeof body.data.userByUsername.postsCount).toBe('number');
    expect(typeof body.data.userByUsername.followersCount).toBe('number');
    expect(typeof body.data.userByUsername.followingCount).toBe('number');
  });

  it('認証済みユーザーAからユーザーBを取得した場合、フォロー関係が反映される', async () => {
    // ユーザーA/Bを作成
    const userA = makeUnique('user-a');
    const userB = makeUnique('user-b');

    const a = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    const b = await createTestUser(app.prisma, {
      email: `${userB}@libark.dev`,
      username: userB,
      password: 'Test12345!',
    });

    // A が B をフォロー
    await app.prisma.follow.create({
      data: { followerId: a.id, followingId: b.id },
    });

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userA}@libark.dev`, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 認証済みリクエストで B を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: userQueryByUsername,
        variables: { username: userB },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.userByUsername.username).toBe(userB);
    // A視点で B は isFollowing=true, isFollowedBy=false
    expect(body.data.userByUsername.isFollowing).toBe(true);
    expect(body.data.userByUsername.isFollowedBy).toBe(false);

    // 逆関係も検証（BがAを取得）→ isFollowing=false, isFollowedBy=true
    // B でログインし直してCookie取得
    const loginResB = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: `${userB}@libark.dev`, password: 'Test12345!' } },
      },
    });
    const cookiesB = loginResB.cookies;
    const accessTokenCookieB = cookiesB.find(c => c.name === 'accessToken');
    expect(accessTokenCookieB?.value).toBeTruthy();

    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieB?.name}=${accessTokenCookieB?.value}`,
      },
      payload: {
        query: userQueryByUsername,
        variables: { username: userA },
      },
    });

    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeUndefined();
    expect(body2.data.userByUsername.username).toBe(userA);
    expect(body2.data.userByUsername.isFollowing).toBe(false);
    expect(body2.data.userByUsername.isFollowedBy).toBe(true);
  });

  it('存在しないIDを指定した user クエリは NOT_FOUND エラー', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: userQueryById,
        variables: { id: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
  });
});
