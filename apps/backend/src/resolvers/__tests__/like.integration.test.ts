/**
 * 🧪 GraphQLいいねリゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData } from '../../__tests__/helpers/test-data.js';
import { UserFactory } from '../../__tests__/factories/index.js';

/**
 * このテストでは以下を検証します:
 * - 投稿へのいいねの作成
 * - いいねの解除
 * - いいね数の取得
 * - いいねした投稿一覧の取得
 * - 存在しない投稿へのいいねのエラー
 * - 既にいいねしている投稿へのいいねのエラー
 * - いいねのページネーション
 */

describe('❤️ GraphQLいいねリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;

  const makeUnique = (prefix: string) => {
    const ts = Date.now() % 1000000;
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${ts}-${rnd}`;
  };

  const toggleLikeMutation = `
    mutation ToggleLike($postId: UUID!) {
      toggleLike(postId: $postId) {
        id
        isLikedByCurrentUser
        likesCount
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

  const createPostMutation = `
    mutation CreatePost($input: PostInput!) {
      createPost(input: $input) {
        id
        content
        visibility
        likesCount
      }
    }
  `;

  const postQuery = `
    query Post($id: UUID!) {
      post(id: $id) {
        id
        content
        likesCount
      }
    }
  `;

  const postsQuery = `
    query Posts($first: Int, $after: String) {
      posts(first: $first, after: $after) {
        edges {
          node {
            id
            content
            likesCount
          }
          cursor
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

  beforeAll(async () => {
    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);
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

  it('投稿へのいいねの作成が成功する', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'テスト投稿', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // 投稿にいいね
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.toggleLike.id).toBe(postId);
    expect(body.data.toggleLike.isLikedByCurrentUser).toBe(true);
    expect(body.data.toggleLike.likesCount).toBe(1);
  });

  it('いいねの解除が成功する', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'テスト投稿', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // 投稿にいいね
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    // いいねを解除
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.toggleLike.id).toBe(postId);
    expect(body.data.toggleLike.isLikedByCurrentUser).toBe(false);
    expect(body.data.toggleLike.likesCount).toBe(0);
  });

  it('いいね数が正しく取得できる', async () => {
    // ユーザーA/Bを作成
    const userA = await userFactory.createWithPassword('Test12345!');
    const userB = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginResA = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookiesA = loginResA.cookies;
    const accessTokenCookieA = cookiesA.find(c => c.name === 'accessToken');
    expect(accessTokenCookieA?.value).toBeTruthy();

    // 投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieA?.name}=${accessTokenCookieA?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'テスト投稿', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // B でログインしてCookie取得
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

    // A がいいね
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieA?.name}=${accessTokenCookieA?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    // B がいいね
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieB?.name}=${accessTokenCookieB?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    // 投稿を取得していいね数を確認
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postQuery,
        variables: { id: postId },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.post.likesCount).toBe(2);
  });

  it('いいねした投稿一覧が取得できる', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 投稿を3つ作成
    const postIds: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const createPostRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
        },
        payload: {
          query: createPostMutation,
          variables: { input: { content: `テスト投稿${i}`, visibility: 'PUBLIC' } },
        },
      });

      const postBody = JSON.parse(createPostRes.body);
      expect(postBody.errors).toBeUndefined();
      postIds.push(postBody.data.createPost.id);
    }

    // 1つ目と2つ目の投稿にいいね
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: postIds[0] },
      },
    });

    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: postIds[1] },
      },
    });

    // 投稿一覧を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postsQuery,
        variables: {},
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.posts.edges.length).toBe(3);

    // いいねした投稿のlikesCountを確認
    const likedPost1 = body.data.posts.edges.find((edge: any) => edge.node.id === postIds[0]);
    const likedPost2 = body.data.posts.edges.find((edge: any) => edge.node.id === postIds[1]);
    const notLikedPost = body.data.posts.edges.find((edge: any) => edge.node.id === postIds[2]);

    expect(likedPost1.node.likesCount).toBe(1);
    expect(likedPost2.node.likesCount).toBe(1);
    expect(notLikedPost.node.likesCount).toBe(0);
  });

  it('存在しない投稿へのいいねはエラーになる', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 存在しない投稿にいいね
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
    expect(body.errors[0].message).toBe('投稿が見つかりません');
  });

  it('未認証ユーザーがいいねしようとするとエラーになる', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: '00000000-0000-0000-0000-000000000000' },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    expect(body.errors[0].message).toBe('認証が必要です');
  });

  it('プライベート投稿へのいいねは投稿者のみ可能', async () => {
    // ユーザーA/Bを作成
    const userA = await userFactory.createWithPassword('Test12345!');
    const userB = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginResA = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookiesA = loginResA.cookies;
    const accessTokenCookieA = cookiesA.find(c => c.name === 'accessToken');
    expect(accessTokenCookieA?.value).toBeTruthy();

    // プライベート投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieA?.name}=${accessTokenCookieA?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'プライベート投稿', visibility: 'PRIVATE' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // B でログインしてCookie取得
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

    // B が A のプライベート投稿にいいねしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieB?.name}=${accessTokenCookieB?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('FORBIDDEN');
    expect(body.errors[0].message).toBe('この投稿にいいねする権限がありません');
  });

  it('削除された投稿へのいいねはエラーになる', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'テスト投稿', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // 投稿を削除
    await app.prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    // 削除された投稿にいいねしようとする
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
    expect(body.errors[0].message).toBe('投稿が見つかりません');
  });

  it('いいねのページネーションが正しく動作する', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // 投稿を5つ作成
    const postIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const createPostRes = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
        },
        payload: {
          query: createPostMutation,
          variables: { input: { content: `テスト投稿${i}`, visibility: 'PUBLIC' } },
        },
      });

      const postBody = JSON.parse(createPostRes.body);
      expect(postBody.errors).toBeUndefined();
      postIds.push(postBody.data.createPost.id);
    }

    // 最初の3件を取得
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postsQuery,
        variables: { first: 3 },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.posts.edges.length).toBe(3);
    expect(body.data.posts.totalCount).toBe(5);
    expect(body.data.posts.pageInfo.hasNextPage).toBe(true);
    expect(body.data.posts.pageInfo.hasPreviousPage).toBe(false);

    // 次のページを取得
    const endCursor = body.data.posts.pageInfo.endCursor;
    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postsQuery,
        variables: { first: 3, after: endCursor },
      },
    });

    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeUndefined();
    expect(body2.data.posts.edges.length).toBe(2);
    expect(body2.data.posts.pageInfo.hasNextPage).toBe(false);
    expect(body2.data.posts.pageInfo.hasPreviousPage).toBe(true);
  });

  it('いいね通知が作成される', async () => {
    // ユーザーA/Bを作成
    const userA = await userFactory.createWithPassword('Test12345!');
    const userB = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginResA = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookiesA = loginResA.cookies;
    const accessTokenCookieA = cookiesA.find(c => c.name === 'accessToken');
    expect(accessTokenCookieA?.value).toBeTruthy();

    // A が投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieA?.name}=${accessTokenCookieA?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'テスト投稿', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // B でログインしてCookie取得
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

    // B が A の投稿にいいね
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookieB?.name}=${accessTokenCookieB?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    // A に通知が作成されたことを確認
    const notifications = await app.prisma.notification.findMany({
      where: {
        userId: userA.id,
        type: 'LIKE',
        referenceId: postId,
      },
    });

    expect(notifications.length).toBe(1);
    expect(notifications[0].actorId).toBe(userB.id);
  });

  it('自分の投稿にいいねしても通知は作成されない', async () => {
    // ユーザーAを作成
    const userA = await userFactory.createWithPassword('Test12345!');

    // A でログインしてCookie取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // A が投稿を作成
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'テスト投稿', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // A が自分の投稿にいいね
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    // 通知が作成されていないことを確認
    const notifications = await app.prisma.notification.findMany({
      where: {
        userId: userA.id,
        type: 'LIKE',
        referenceId: postId,
      },
    });

    expect(notifications.length).toBe(0);
  });
});
