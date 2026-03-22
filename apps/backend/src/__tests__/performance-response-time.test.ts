/**
 * ⏱️ レスポンスタイムアサーションテスト
 *
 * GraphQLクエリ、ミューテーション、データベースクエリ、キャッシュ操作などのレスポンスタイムを測定します
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { describeIfPerf, scaledCount } from './helpers/perf-test-utils.js';

// レスポンスタイムの閾値（ミリ秒）
const RESPONSE_TIME_THRESHOLDS = {
  GRAPHQL_QUERY: 500,
  GRAPHQL_MUTATION: 1000,
  DATABASE_QUERY: 100,
  CACHE_OPERATION: 50,
  API_ENDPOINT: 500,
  COMPLEX_QUERY: 2000,
  PAGINATION: 500,
  FILTERING: 500,
  CONCURRENT_REQUEST: 1000,
};

const PERF_USER_COUNT = scaledCount(5);
const PERF_POST_COUNT = scaledCount(20);

describeIfPerf('⏱️ レスポンスタイムアサーションテスト', () => {
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
          id: `00000000-0000-4000-8000-00000000000${i}`,
          email: `perf-test-${i}@libark.dev`,
          username: `perftest${i}`,
          passwordHash: hashedPassword,
          displayName: `Performance Test User ${i}`,
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
          id: `10000000-0000-4000-8000-00000000000${i}`,
          userId: testUsers[i % testUsers.length].id,
          content: `Performance test post ${i}`,
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

  describe('📊 GraphQLクエリのレスポンスタイム測定', () => {
    it('投稿詳細取得のレスポンスタイムが閾値内', async () => {
      const query = `
        query GetPost($id: UUID!) {
          post(id: $id) {
            id
            content
            user {
              id
              username
              displayName
            }
            createdAt
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { id: testPosts[0].id },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_QUERY);
    });

    it('投稿一覧取得のレスポンスタイムが閾値内', async () => {
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
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_QUERY);
    });

    it('ユーザー詳細取得のレスポンスタイムが閾値内', async () => {
      const query = `
        query GetUser($id: UUID!) {
          user(id: $id) {
            id
            username
            displayName
            bio
            createdAt
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { id: testUsers[0].id },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_QUERY);
    });
  });

  describe('🔄 GraphQLミューテーションのレスポンスタイム測定', () => {
    it.skip('投稿作成のレスポンスタイムが閾値内', async () => {
      // 認証が必要なためスキップ
      const mutation = `
        mutation CreatePost($content: String!) {
          createPost(input: { content: $content }) {
            id
            content
            createdAt
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { content: 'Performance test post' },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_MUTATION);

      // クリーンアップ
      if (result.data?.createPost?.id) {
        await prisma.post.delete({
          where: { id: result.data.createPost.id },
        });
      }
    });

    it.skip('いいね作成のレスポンスタイムが閾値内', async () => {
      // 認証が必要なためスキップ
      const mutation = `
        mutation CreateLike($postId: UUID!) {
          createLike(postId: $postId) {
            id
            postId
            userId
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { postId: testPosts[0].id },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_MUTATION);

      // クリーンアップ
      if (result.data?.createLike?.id) {
        await prisma.like.delete({
          where: { id: result.data.createLike.id },
        });
      }
    });

    it.skip('コメント作成のレスポンスタイムが閾値内', async () => {
      // 認証が必要なためスキップ
      const mutation = `
        mutation CreateComment($postId: UUID!, $content: String!) {
          createComment(input: { postId: $postId, content: $content }) {
            id
            content
            postId
            createdAt
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { postId: testPosts[0].id, content: 'Performance test comment' },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_MUTATION);

      // クリーンアップ
      if (result.data?.createComment?.id) {
        await prisma.comment.delete({
          where: { id: result.data.createComment.id },
        });
      }
    });
  });

  describe('🗄️ データベースクエリのレスポンスタイム測定', () => {
    it('単一レコード取得のレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const post = await prisma.post.findUnique({
        where: { id: testPosts[0].id },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(post).toBeDefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.DATABASE_QUERY);
    });

    it('複数レコード取得のレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const posts = await prisma.post.findMany({
        take: 10,
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(posts.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.DATABASE_QUERY);
    });

    it('リレーションを含むクエリのレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const post = await prisma.post.findUnique({
        where: { id: testPosts[0].id },
        include: {
          user: true,
          media: true,
          likes: true,
          comments: true,
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(post).toBeDefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.DATABASE_QUERY * 2);
    });

    it('集計クエリのレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const count = await prisma.post.count();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(count).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.DATABASE_QUERY);
    });
  });

  describe('💾 キャッシュ操作のレスポンスタイム測定', () => {
    it('キャッシュ書き込みのレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      await redis.set('test-key', 'test-value');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.CACHE_OPERATION);
    });

    it('キャッシュ読み込みのレスポンスタイムが閾値内', async () => {
      await redis.set('test-key', 'test-value');

      const startTime = Date.now();
      const value = await redis.get('test-key');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(value).toBe('test-value');
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.CACHE_OPERATION);
    });

    it('キャッシュ削除のレスポンスタイムが閾値内', async () => {
      await redis.set('test-key', 'test-value');

      const startTime = Date.now();
      await redis.del('test-key');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.CACHE_OPERATION);
    });

    it('キャッシュ一括操作のレスポンスタイムが閾値内', async () => {
      const keys = Array.from({ length: 10 }, (_, i) => `batch-key-${i}`);

      const startTime = Date.now();
      // msetの代わりに個別のsetを使用
      for (const key of keys) {
        await redis.set(key, 'test-value');
      }
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.CACHE_OPERATION * 2);
    });
  });

  describe('🌐 APIエンドポイントのレスポンスタイム測定', () => {
    it('GraphQLエンドポイントのレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query {
              __typename
            }
          `,
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.API_ENDPOINT);
    });
  });

  describe('🔍 複雑なクエリのレスポンスタイム測定', () => {
    it.skip('ネストされたクエリのレスポンスタイムが閾値内', async () => {
      // 複雑なクエリは認証が必要なためスキップ
      const query = `
        query GetComplexPost($id: UUID!) {
          post(id: $id) {
            id
            content
            user {
              id
              username
              displayName
              posts(first: 5) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
            media {
              id
              s3Key
              variants {
                id
                type
                s3Key
              }
            }
            comments(first: 5) {
              edges {
                node {
                  id
                  content
                  user {
                    id
                    username
                  }
                }
              }
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { id: testPosts[0].id },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.COMPLEX_QUERY);
    });

    it.skip('複数のリレーションを含むクエリのレスポンスタイムが閾値内', async () => {
      // 複雑なクエリは認証が必要なためスキップ
      const query = `
        query GetUsersWithPosts($first: Int!) {
          users(first: $first) {
            edges {
              node {
                id
                username
                displayName
                posts(first: 5) {
                  edges {
                    node {
                      id
                      content
                      media {
                        id
                        s3Key
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { first: 5 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.COMPLEX_QUERY);
    });
  });

  describe('📄 ページネーションのレスポンスタイム測定', () => {
    it('カーソルベースページネーションのレスポンスタイムが閾値内', async () => {
      const query = `
        query GetPaginatedPosts($first: Int!, $after: String) {
          posts(first: $first, after: $after) {
            edges {
              node {
                id
                content
                user {
                  id
                  username
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { first: 10, after: null },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.PAGINATION);
    });

    it('オフセットベースページネーションのレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const posts = await prisma.post.findMany({
        skip: 10,
        take: 10,
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(posts.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.PAGINATION);
    });
  });

  describe('🔎 フィルタリングのレスポンスタイム測定', () => {
    it('ユーザー検索のレスポンスタイムが閾値内', async () => {
      const query = `
        query SearchUsers($search: String!) {
          users(first: 10, search: $search) {
            edges {
              node {
                id
                username
                displayName
              }
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { search: 'perftest' },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.FILTERING);
    });

    it.skip('投稿フィルタリングのレスポンスタイムが閾値内', async () => {
      const query = `
        query FilterPosts($userId: UUID!) {
          posts(first: 10, userId: $userId) {
            edges {
              node {
                id
                content
                user {
                  id
                  username
                }
              }
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { userId: testUsers[0].id },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.FILTERING);
    });
  });

  describe('🚀 並行リクエストのレスポンスタイム測定', () => {
    it('複数のGraphQLクエリを並行実行した場合のレスポンスタイムが閾値内', async () => {
      const query1 = `
        query GetPost1($id: UUID!) {
          post(id: $id) {
            id
            content
          }
        }
      `;

      const query2 = `
        query GetPost2($id: UUID!) {
          post(id: $id) {
            id
            content
          }
        }
      `;

      const query3 = `
        query GetPost3($id: UUID!) {
          post(id: $id) {
            id
            content
          }
        }
      `;

      const startTime = Date.now();
      const promises = [
        app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: query1,
            variables: { id: testPosts[0].id },
          },
        }),
        app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: query2,
            variables: { id: testPosts[1].id },
          },
        }),
        app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: query3,
            variables: { id: testPosts[2].id },
          },
        }),
      ];

      await Promise.all(promises);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.CONCURRENT_REQUEST);
    });

    it('複数のデータベースクエリを並行実行した場合のレスポンスタイムが閾値内', async () => {
      const startTime = Date.now();
      const promises = [
        prisma.post.findMany({ take: 10 }),
        prisma.user.findMany({ take: 10 }),
        prisma.comment.findMany({ take: 10 }),
      ];

      await Promise.all(promises);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLDS.CONCURRENT_REQUEST);
    });
  });

  describe('✅ レスポンスタイムの閾値チェック', () => {
    it('すべての主要操作がパフォーマンス閾値を満たしている', async () => {
      const performanceMetrics: { [key: string]: number } = {};

      // GraphQLクエリ
      const query = `
        query GetPost($id: UUID!) {
          post(id: $id) {
            id
            content
          }
        }
      `;

      let startTime = Date.now();
      await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { id: testPosts[0].id },
        },
      });
      performanceMetrics.graphqlQuery = Date.now() - startTime;

      // データベースクエリ
      startTime = Date.now();
      await prisma.post.findUnique({ where: { id: testPosts[0].id } });
      performanceMetrics.databaseQuery = Date.now() - startTime;

      // キャッシュ操作
      startTime = Date.now();
      await redis.set('test-key', 'test-value');
      await redis.get('test-key');
      performanceMetrics.cacheOperation = Date.now() - startTime;

      // すべてのメトリクスが閾値内であることを確認
      expect(performanceMetrics.graphqlQuery).toBeLessThan(RESPONSE_TIME_THRESHOLDS.GRAPHQL_QUERY);
      expect(performanceMetrics.databaseQuery).toBeLessThan(
        RESPONSE_TIME_THRESHOLDS.DATABASE_QUERY
      );
      expect(performanceMetrics.cacheOperation).toBeLessThan(
        RESPONSE_TIME_THRESHOLDS.CACHE_OPERATION
      );
    });
  });
});
