/**
 * 🧪 いいねキャッシュ統合テスト
 *
 * 目的: サーバーのキャッシュ挙動を検証する統合テスト
 *
 * テスト観点:
 * 1. timeline を叩く（"いいね前"レスポンスが生成される）
 * 2. toggleLike mutation 実行
 * 3. 30秒以内に timeline を再度叩く
 * 4. isLikedByCurrentUser が true のままであること（古いレスポンスが返らない）
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../helpers/test-data.js';

describe('Like Cache Integration', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let testUser: any;
  let testPost: any;
  let authToken: string;

  // ユニークなテストユーザーデータを生成
  const generateTestUserData = () => {
    const timestamp = Date.now() % 1000000;
    const randomId = Math.random().toString(36).substring(2, 8);
    return {
      email: `like-cache-${timestamp}-${randomId}@libark.dev`,
      username: `likecache-${timestamp}-${randomId}`,
      password: 'LikeCacheTest123!',
      displayName: 'Like Cache Test User',
    };
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // テストデータをクリーンアップ
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();

    // テストユーザーを作成
    const userData = generateTestUserData();
    testUser = await createTestUser(app.prisma, userData);

    // テスト投稿を作成
    testPost = await app.prisma.post.create({
      data: {
        content: 'Test post for like cache integration',
        visibility: 'PUBLIC',
        userId: testUser.id,
        isDeleted: false,
        isProcessing: false,
      },
    });

    // ログインしてトークンを取得
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              success
              accessToken
            }
          }
        `,
        variables: {
          input: {
            email: testUser.email,
            password: userData.password,
          },
        },
      },
      headers: {
        'content-type': 'application/json',
      },
    });

    const loginResult = JSON.parse(loginResponse.body);
    authToken = loginResult.data.login.accessToken;
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  describe('timeline query cache invalidation', () => {
    it('should not cache timeline for authenticated users - isLikedByCurrentUser updates correctly', async () => {
      const timelineQuery = `
        query Timeline($type: TimelineType!, $first: Int!) {
          timeline(type: $type, first: $first) {
            edges {
              node {
                id
                isLikedByCurrentUser
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
            timelineType
          }
        }
      `;

      // 1. timeline クエリを実行（いいね前）
      const response1 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: timelineQuery,
          variables: {
            type: 'ALL',
            first: 10,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const result1 = JSON.parse(response1.body);
      expect(result1.errors).toBeUndefined();
      expect(result1.data.timeline.edges).toHaveLength(1);
      expect(result1.data.timeline.edges[0].node.id).toBe(testPost.id);
      expect(result1.data.timeline.edges[0].node.isLikedByCurrentUser).toBe(false);

      // 2. toggleLike mutation を実行
      const toggleLikeMutation = `
        mutation ToggleLike($postId: UUID!) {
          toggleLike(postId: $postId) {
            id
            isLikedByCurrentUser
            likesCount
          }
        }
      `;

      const toggleResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: toggleLikeMutation,
          variables: { postId: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const toggleResult = JSON.parse(toggleResponse.body);
      expect(toggleResult.errors).toBeUndefined();
      expect(toggleResult.data.toggleLike.isLikedByCurrentUser).toBe(true);

      // 3. 30秒以内に timeline クエリを再度実行
      await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機

      const response2 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: timelineQuery,
          variables: {
            type: 'ALL',
            first: 10,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      // 4. isLikedByCurrentUser が true であることを確認
      const result2 = JSON.parse(response2.body);
      expect(result2.errors).toBeUndefined();
      expect(result2.data.timeline.edges).toHaveLength(1);
      expect(result2.data.timeline.edges[0].node.id).toBe(testPost.id);
      expect(result2.data.timeline.edges[0].node.isLikedByCurrentUser).toBe(true);
    });

    it.skip('should update isLikedByCurrentUser correctly after unlike', async () => {
      const timelineQuery = `
        query Timeline($type: TimelineType!, $first: Int!) {
          timeline(type: $type, first: $first) {
            edges {
              node {
                id
                isLikedByCurrentUser
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
            timelineType
          }
        }
      `;

      // いいねを作成
      const toggleLikeMutation = `
        mutation ToggleLike($postId: UUID!) {
          toggleLike(postId: $postId) {
            id
            isLikedByCurrentUser
          }
        }
      `;

      console.log('🔍 [Test] Before like - testPost.id:', testPost.id);

      const likeResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: toggleLikeMutation,
          variables: { postId: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const likeResult = JSON.parse(likeResponse.body);
      expect(likeResult.errors).toBeUndefined();
      expect(likeResult.data.toggleLike.isLikedByCurrentUser).toBe(true);

      // 1. timeline クエリを実行（いいね後）
      const response1 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: timelineQuery,
          variables: {
            type: 'ALL',
            first: 10,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const result1 = JSON.parse(response1.body);
      expect(result1.data.timeline.edges[0].node.isLikedByCurrentUser).toBe(true);

      // 2. toggleLike mutation を実行（いいね解除）
      console.log('🔍 [Test] Before unlike - testPost.id:', testPost.id);

      const unlikeResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: toggleLikeMutation,
          variables: { postId: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const unlikeResult = JSON.parse(unlikeResponse.body);
      expect(unlikeResult.errors).toBeUndefined();
      expect(unlikeResult.data.toggleLike.isLikedByCurrentUser).toBe(false);

      // 3. 30秒以内に timeline クエリを再度実行
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: timelineQuery,
          variables: {
            type: 'ALL',
            first: 10,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      // 4. isLikedByCurrentUser が false であることを確認
      const result2 = JSON.parse(response2.body);
      expect(result2.data.timeline.edges[0].node.isLikedByCurrentUser).toBe(false);
    });
  });

  describe('posts query cache invalidation', () => {
    it('should not cache posts for authenticated users - isLikedByCurrentUser updates correctly', async () => {
      const postQuery = `
        query Post($id: UUID!) {
          post(id: $id) {
            id
            content
            isLikedByCurrentUser
            likesCount
          }
        }
      `;

      // 1. post クエリを実行（いいね前）
      const response1 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: postQuery,
          variables: { id: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const result1 = JSON.parse(response1.body);
      expect(result1.errors).toBeUndefined();
      expect(result1.data.post.id).toBe(testPost.id);
      expect(result1.data.post.isLikedByCurrentUser).toBe(false);

      // 2. toggleLike mutation を実行
      const toggleLikeMutation = `
        mutation ToggleLike($postId: UUID!) {
          toggleLike(postId: $postId) {
            id
            isLikedByCurrentUser
            likesCount
          }
        }
      `;

      await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: toggleLikeMutation,
          variables: { postId: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      // 3. 30秒以内に post クエリを再度実行
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: postQuery,
          variables: { id: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      // 4. isLikedByCurrentUser が true であることを確認
      const result2 = JSON.parse(response2.body);
      expect(result2.errors).toBeUndefined();
      expect(result2.data.post.id).toBe(testPost.id);
      expect(result2.data.post.isLikedByCurrentUser).toBe(true);
    });

    it.skip('should update isLikedByCurrentUser correctly after unlike', async () => {
      const postQuery = `
        query Post($id: UUID!) {
          post(id: $id) {
            id
            content
            isLikedByCurrentUser
          }
        }
      `;

      // いいねを作成
      const toggleLikeMutation = `
        mutation ToggleLike($postId: UUID!) {
          toggleLike(postId: $postId) {
            id
            isLikedByCurrentUser
          }
        }
      `;

      console.log('🔍 [Test] Before like - testPost.id:', testPost.id);

      await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: toggleLikeMutation,
          variables: { postId: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      // 1. post クエリを実行（いいね後）
      const response1 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: postQuery,
          variables: { id: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const result1 = JSON.parse(response1.body);
      expect(result1.data.post.isLikedByCurrentUser).toBe(true);

      // 2. toggleLike mutation を実行（いいね解除）
      console.log('🔍 [Test] Before unlike - testPost.id:', testPost.id);

      const unlikeResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: toggleLikeMutation,
          variables: { postId: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      const unlikeResult = JSON.parse(unlikeResponse.body);
      expect(unlikeResult.errors).toBeUndefined();
      expect(unlikeResult.data.toggleLike.isLikedByCurrentUser).toBe(false);

      // 3. 30秒以内に post クエリを再度実行
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: postQuery,
          variables: { id: testPost.id },
        },
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${authToken}`,
        },
      });

      // 4. isLikedByCurrentUser が false であることを確認
      const result2 = JSON.parse(response2.body);
      expect(result2.data.post.isLikedByCurrentUser).toBe(false);
    });
  });

  describe('anonymous user cache behavior', () => {
    it('should return isLikedByCurrentUser as false for anonymous users', async () => {
      const timelineQuery = `
        query Timeline($type: TimelineType!, $first: Int!) {
          timeline(type: $type, first: $first) {
            edges {
              node {
                id
                isLikedByCurrentUser
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
            timelineType
          }
        }
      `;

      // 匿名ユーザーで timeline クエリを実行
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: timelineQuery,
          variables: {
            type: 'ALL',
            first: 10,
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.timeline.edges).toHaveLength(1);
      expect(result.data.timeline.edges[0].node.id).toBe(testPost.id);
      expect(result.data.timeline.edges[0].node.isLikedByCurrentUser).toBe(false);
    });
  });
});
