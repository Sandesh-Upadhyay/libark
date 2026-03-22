/**
 * 🧪 GraphQLフォローリゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../../__tests__/helpers/test-data.js';

/**
 * このテストでは以下を検証します:
 * - フォローの作成
 * - フォローの解除
 * - フォロワー一覧の取得
 * - フォロー中の一覧の取得
 * - 自分自身をフォローしようとする場合のエラー
 * - 既にフォローしているユーザーをフォローしようとする場合のエラー
 * - フォローのページネーション
 * - フォローのフィルタリング
 */

describe('👥 GraphQLフォローリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  const makeUnique = (prefix: string) => {
    const ts = Date.now() % 1000000;
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${ts}-${rnd}`;
  };

  const followMutation = `
    mutation FollowUser($userId: UUID!) {
      followUser(userId: $userId) {
        success
        message
        follow {
          id
          follower { id username }
          following { id username }
          createdAt
        }
      }
    }
  `;

  const unfollowMutation = `
    mutation UnfollowUser($userId: UUID!) {
      unfollowUser(userId: $userId) {
        success
        message
      }
    }
  `;

  const followersQuery = `
    query Followers($userId: UUID!, $first: Int, $after: String) {
      followers(userId: $userId, first: $first, after: $after) {
        edges {
          node { id username displayName }
          cursor
          followedAt
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `;

  const followingQuery = `
    query Following($userId: UUID!, $first: Int, $after: String) {
      following(userId: $userId, first: $first, after: $after) {
        edges {
          node { id username displayName }
          cursor
          followedAt
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `;

  const isFollowingQuery = `
    query IsFollowing($userId: UUID!) {
      isFollowing(userId: $userId)
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

  it('フォローの作成が成功する', async () => {
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

    // A が B をフォロー
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: followMutation,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.followUser.success).toBe(true);
    expect(body.data.followUser.message).toBe('フォローしました');
    expect(body.data.followUser.follow.follower.id).toBe(a.id);
    expect(body.data.followUser.follow.following.id).toBe(b.id);
  });

  it('フォローの解除が成功する', async () => {
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

    // A が B のフォローを解除
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: unfollowMutation,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.unfollowUser.success).toBe(true);
    expect(body.data.unfollowUser.message).toBe('フォローを解除しました');

    // フォロー関係が削除されたことを確認
    const follow = await app.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: a.id, followingId: b.id },
      },
    });
    expect(follow).toBeNull();
  });

  it('フォロワー一覧が取得できる', async () => {
    // ユーザーA/B/Cを作成
    const userA = makeUnique('user-a');
    const userB = makeUnique('user-b');
    const userC = makeUnique('user-c');

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

    const c = await createTestUser(app.prisma, {
      email: `${userC}@libark.dev`,
      username: userC,
      password: 'Test12345!',
    });

    // B と C が A をフォロー
    await app.prisma.follow.create({
      data: { followerId: b.id, followingId: a.id },
    });
    await app.prisma.follow.create({
      data: { followerId: c.id, followingId: a.id },
    });

    // A のフォロワー一覧を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followersQuery,
        variables: { userId: a.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.followers.edges.length).toBe(2);
    expect(body.data.followers.totalCount).toBe(2);
    expect(body.data.followers.pageInfo.hasNextPage).toBe(false);
    expect(body.data.followers.pageInfo.hasPreviousPage).toBe(false);
  });

  it('フォロー中一覧が取得できる', async () => {
    // ユーザーA/B/Cを作成
    const userA = makeUnique('user-a');
    const userB = makeUnique('user-b');
    const userC = makeUnique('user-c');

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

    const c = await createTestUser(app.prisma, {
      email: `${userC}@libark.dev`,
      username: userC,
      password: 'Test12345!',
    });

    // A が B と C をフォロー
    await app.prisma.follow.create({
      data: { followerId: a.id, followingId: b.id },
    });
    await app.prisma.follow.create({
      data: { followerId: a.id, followingId: c.id },
    });

    // A のフォロー中一覧を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followingQuery,
        variables: { userId: a.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.following.edges.length).toBe(2);
    expect(body.data.following.totalCount).toBe(2);
    expect(body.data.following.pageInfo.hasNextPage).toBe(false);
    expect(body.data.following.pageInfo.hasPreviousPage).toBe(false);
  });

  it('自分自身をフォローしようとするとエラーになる', async () => {
    // ユーザーAを作成
    const userA = makeUnique('user-a');

    const a = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
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

    // A が自分自身をフォローしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: followMutation,
        variables: { userId: a.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('INVALID_OPERATION');
    expect(body.errors[0].message).toBe('自分自身をフォローすることはできません');
  });

  it('既にフォローしているユーザーをフォローしようとするとエラーになる', async () => {
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

    // A が再度 B をフォローしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: followMutation,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('ALREADY_FOLLOWING');
    expect(body.errors[0].message).toBe('既にフォローしています');
  });

  it('フォローのページネーションが正しく動作する', async () => {
    // ユーザーAと複数のフォロワーを作成
    const userA = makeUnique('user-a');

    const a = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    // 5人のフォロワーを作成
    const followers = [];
    for (let i = 1; i <= 5; i++) {
      const follower = await createTestUser(app.prisma, {
        email: `follower${i}-${userA}@libark.dev`,
        username: `follower${i}-${userA}`,
        password: 'Test12345!',
      });
      followers.push(follower);

      // A をフォロー
      await app.prisma.follow.create({
        data: { followerId: follower.id, followingId: a.id },
      });
    }

    // 最初の3件を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followersQuery,
        variables: { userId: a.id, first: 3 },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.followers.edges.length).toBe(3);
    expect(body.data.followers.totalCount).toBe(5);
    expect(body.data.followers.pageInfo.hasNextPage).toBe(true);
    expect(body.data.followers.pageInfo.hasPreviousPage).toBe(false);

    // 次のページを取得
    const endCursor = body.data.followers.pageInfo.endCursor;
    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followersQuery,
        variables: { userId: a.id, first: 3, after: endCursor },
      },
    });

    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeUndefined();
    expect(body2.data.followers.edges.length).toBe(2);
    expect(body2.data.followers.pageInfo.hasNextPage).toBe(false);
    expect(body2.data.followers.pageInfo.hasPreviousPage).toBe(true);
  });

  it('フォローのフィルタリングが正しく動作する', async () => {
    // ユーザーA/B/Cを作成
    const userA = makeUnique('user-a');
    const userB = makeUnique('user-b');
    const userC = makeUnique('user-c');

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

    const c = await createTestUser(app.prisma, {
      email: `${userC}@libark.dev`,
      username: userC,
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

    // A が B をフォローしていることを確認
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: isFollowingQuery,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.isFollowing).toBe(true);

    // A が C をフォローしていないことを確認
    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: isFollowingQuery,
        variables: { userId: c.id },
      },
    });

    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeUndefined();
    expect(body2.data.isFollowing).toBe(false);
  });

  it('未認証ユーザーがフォローしようとするとエラーになる', async () => {
    // ユーザーBを作成
    const userB = makeUnique('user-b');

    const b = await createTestUser(app.prisma, {
      email: `${userB}@libark.dev`,
      username: userB,
      password: 'Test12345!',
    });

    // 未認証でフォローしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followMutation,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    expect(body.errors[0].message).toBe('認証が必要です');
  });

  it('存在しないユーザーをフォローしようとするとエラーになる', async () => {
    // ユーザーAを作成
    const userA = makeUnique('user-a');

    const _a = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
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

    // 存在しないユーザーをフォローしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: followMutation,
        variables: { userId: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('USER_NOT_FOUND');
    expect(body.errors[0].message).toBe('フォロー対象のユーザーが見つかりません');
  });

  it('非アクティブユーザーをフォローしようとするとエラーになる', async () => {
    // ユーザーA/Bを作成
    const userA = makeUnique('user-a');
    const userB = makeUnique('user-b');

    const _a = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    const b = await createTestUser(app.prisma, {
      email: `${userB}@libark.dev`,
      username: userB,
      password: 'Test12345!',
      isActive: false,
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

    // A が非アクティブな B をフォローしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: followMutation,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('USER_INACTIVE');
    expect(body.errors[0].message).toBe('このユーザーはアクティブではありません');
  });

  it('フォローしていないユーザーのフォローを解除しようとするとエラーになる', async () => {
    // ユーザーA/Bを作成
    const userA = makeUnique('user-a');
    const userB = makeUnique('user-b');

    const _a = await createTestUser(app.prisma, {
      email: `${userA}@libark.dev`,
      username: userA,
      password: 'Test12345!',
    });

    const b = await createTestUser(app.prisma, {
      email: `${userB}@libark.dev`,
      username: userB,
      password: 'Test12345!',
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

    // A が B をフォローしていない状態で解除しようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: unfollowMutation,
        variables: { userId: b.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('NOT_FOLLOWING');
    expect(body.errors[0].message).toBe('フォローしていません');
  });

  it('存在しないユーザーのフォロワー一覧を取得しようとするとエラーになる', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followersQuery,
        variables: { userId: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('USER_NOT_FOUND');
    expect(body.errors[0].message).toBe('ユーザーが見つかりません');
  });

  it('存在しないユーザーのフォロー中一覧を取得しようとするとエラーになる', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: followingQuery,
        variables: { userId: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('USER_NOT_FOUND');
    expect(body.errors[0].message).toBe('ユーザーが見つかりません');
  });
});
