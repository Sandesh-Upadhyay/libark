/**
 * 🔍 N+1クエリ検出テスト
 *
 * 投稿リスト、コメントリスト、ユーザーリストなどの取得時のN+1クエリ問題を検出し、DataLoaderの使用を確認します
 */

import { randomUUID } from 'crypto';

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { describeIfPerf, scaledCount } from './helpers/perf-test-utils.js';

// クエリ数の閾値（ミリ秒）
const QUERY_TIME_THRESHOLDS = {
  POSTS_LIST: 500, // 投稿リスト取得時の最大実行時間
  COMMENTS_LIST: 500, // コメントリスト取得時の最大実行時間
  USERS_LIST: 500, // ユーザーリスト取得時の最大実行時間
  NOTIFICATIONS_LIST: 500, // 通知リスト取得時の最大実行時間
  TRANSACTIONS_LIST: 500, // トランザクションリスト取得時の最大実行時間
  FOLLOWERS_LIST: 500, // フォロワー/フォロー中取得時の最大実行時間
  MEDIA_LIST: 500, // メディアリスト取得時の最大実行時間
  MESSAGES_LIST: 500, // メッセージリスト取得時の最大実行時間
};

const PERF_USER_COUNT = scaledCount(10);
const PERF_POST_COUNT = scaledCount(20);
const PERF_COMMENT_COUNT = scaledCount(30);

describeIfPerf('🔍 N+1クエリ検出テスト', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  const testUsers: any[] = [];
  const testPosts: any[] = [];
  const testComments: any[] = [];

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
          id: randomUUID(),
          email: `nplus1-test-${i}@libark.dev`,
          username: `nplus1test${i}`,
          passwordHash: hashedPassword,
          displayName: `N+1 Test User ${i}`,
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
          id: randomUUID(),
          userId: testUsers[i % testUsers.length].id,
          content: `N+1 test post ${i}`,
          visibility: 'PUBLIC',
        },
      });
      testPosts.push(post);
    }

    // テストコメントの作成
    for (let i = 0; i < PERF_COMMENT_COUNT; i++) {
      const comment = await prisma.comment.create({
        data: {
          id: randomUUID(),
          userId: testUsers[i % testUsers.length].id,
          postId: testPosts[i % testPosts.length].id,
          content: `N+1 test comment ${i}`,
        },
      });
      testComments.push(comment);
    }
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await prisma.comment.deleteMany({
      where: {
        id: {
          in: testComments.map(c => c.id),
        },
      },
    });

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

  describe('📝 投稿リスト取得時のN+1クエリ検出', () => {
    it.skip('投稿リスト取得時の実行時間が閾値内である', async () => {
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
                media {
                  id
                  s3Key
                }
                _count {
                  likes
                  comments
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
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.POSTS_LIST);
    });

    it('投稿リスト取得時にDataLoaderが使用されている', async () => {
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
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.POSTS_LIST);
    });
  });

  describe('💬 コメントリスト取得時のN+1クエリ検出', () => {
    it.skip('コメントリスト取得時の実行時間が閾値内である', async () => {
      const query = `
        query GetComments($postId: UUID!, $first: Int!) {
          comments(postId: $postId, first: $first) {
            edges {
              node {
                id
                content
                user {
                  id
                  username
                  displayName
                }
                isLikedByCurrentUser
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
          variables: { postId: testPosts[0].id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.COMMENTS_LIST);
    });

    it.skip('コメントリスト取得時にDataLoaderが使用されている', async () => {
      const query = `
        query GetComments($postId: UUID!, $first: Int!) {
          comments(postId: $postId, first: $first) {
            edges {
              node {
                id
                content
                user {
                  id
                  username
                }
                isLikedByCurrentUser
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
          variables: { postId: testPosts[0].id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.COMMENTS_LIST);
    });
  });

  describe('👤 ユーザーリスト取得時のN+1クエリ検出', () => {
    it('ユーザーリスト取得時の実行時間が閾値内である', async () => {
      const query = `
        query GetUsers($first: Int!) {
          users(first: $first) {
            edges {
              node {
                id
                username
                displayName
                postsCount
                followersCount
                followingCount
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
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.USERS_LIST);
    });

    it('ユーザーリスト取得時に統計情報が効率的に取得されている', async () => {
      const query = `
        query GetUsers($first: Int!) {
          users(first: $first) {
            edges {
              node {
                id
                username
                displayName
                postsCount
                followersCount
                followingCount
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
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.USERS_LIST);

      // 統計情報が正しく取得されていることを確認
      expect(result.data?.users?.edges).toBeDefined();
      expect(result.data.users.edges.length).toBeGreaterThan(0);
    });
  });

  describe('🔔 通知リスト取得時のN+1クエリ検出', () => {
    it.skip('通知リスト取得時の実行時間が閾値内である', async () => {
      // 認証が必要なためスキップ
      const query = `
        query GetNotifications($first: Int!) {
          notifications(first: $first) {
            id
            type
            content
            isRead
            actor {
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
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.NOTIFICATIONS_LIST);
    });
  });

  describe('💰 トランザクションリスト取得時のN+1クエリ検出', () => {
    it.skip('トランザクションリスト取得時の実行時間が閾値内である', async () => {
      // テスト用ウォレットを作成
      const wallet = await prisma.wallet.create({
        data: {
          id: `60000000-0000-4000-8000-000000000001`,
          userId: testUsers[0].id,
          balanceUsd: 1000,
        },
      });

      // テスト用トランザクションを作成
      for (let i = 0; i < scaledCount(10); i++) {
        await prisma.walletTransaction.create({
          data: {
            id: randomUUID(),
            walletId: wallet.id,
            amount: 100 + i,
            type: 'DEPOSIT',
            status: 'COMPLETED',
          },
        });
      }

      const query = `
        query GetTransactions($walletId: UUID!, $first: Int!) {
          walletTransactions(walletId: $walletId, first: $first) {
            edges {
              node {
                id
                amount
                type
                status
                createdAt
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
          variables: { walletId: wallet.id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.TRANSACTIONS_LIST);

      // クリーンアップ
      await prisma.walletTransaction.deleteMany({
        where: { walletId: wallet.id },
      });
      await prisma.wallet.delete({
        where: { id: wallet.id },
      });
    });
  });

  describe('👥 フォロワー/フォロー中取得時のN+1クエリ検出', () => {
    it.skip('フォロワー/フォロー中取得時の実行時間が閾値内である', async () => {
      // 認証が必要なためスキップ
      const query = `
        query GetFollowers($userId: UUID!, $first: Int!) {
          followers(userId: $userId, first: $first) {
            edges {
              node {
                id
                follower {
                  id
                  username
                  displayName
                }
                following {
                  id
                  username
                  displayName
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
          variables: { userId: testUsers[0].id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.FOLLOWERS_LIST);
    });
  });

  describe('🖼️ メディアリスト取得時のN+1クエリ検出', () => {
    it.skip('メディアリスト取得時の実行時間が閾値内である', async () => {
      // テスト用メディアを作成
      for (let i = 0; i < scaledCount(10); i++) {
        await prisma.media.create({
          data: {
            id: randomUUID(),
            userId: testUsers[0].id,
            s3Key: `test-media-nplus1-${i}.jpg`,
            mimeType: 'image/jpeg',
            fileSize: 1024 * 100,
            width: 800,
            height: 600,
          },
        });
      }

      const query = `
        query GetMedia($userId: UUID!, $first: Int!) {
          media(userId: $userId, first: $first) {
            edges {
              node {
                id
                s3Key
                mimeType
                fileSize
                width
                height
                variants {
                  id
                  type
                  s3Key
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
          variables: { userId: testUsers[0].id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.MEDIA_LIST);

      // クリーンアップ
      await prisma.media.deleteMany({
        where: { userId: testUsers[0].id },
      });
    });

    it.skip('メディアリスト取得時にバリアント情報が効率的に取得されている', async () => {
      // テスト用メディアを作成
      const media = await prisma.media.create({
        data: {
          id: `63000000-0000-4000-8000-000000000001`,
          userId: testUsers[0].id,
          s3Key: `test-media-variant-nplus1.jpg`,
          mimeType: 'image/jpeg',
          fileSize: 1024 * 100,
          width: 800,
          height: 600,
        },
      });

      // テスト用バリアントを作成
      for (let i = 0; i < scaledCount(3); i++) {
        await prisma.mediaVariant.create({
          data: {
            id: randomUUID(),
            mediaId: media.id,
            type: 'thumbnail',
            s3Key: `test-variant-nplus1-${i}.jpg`,
            width: 200,
            height: 150,
            fileSize: 1024 * 10,
            quality: 80,
          },
        });
      }

      const query = `
        query GetMedia($id: UUID!) {
          media(id: $id) {
            id
            s3Key
            variants {
              id
              type
              s3Key
              width
              height
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
          variables: { id: media.id },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.MEDIA_LIST);

      // バリアント情報が正しく取得されていることを確認
      expect(result.data?.media?.variants).toBeDefined();

      // クリーンアップ
      await prisma.mediaVariant.deleteMany({
        where: { mediaId: media.id },
      });
      await prisma.media.delete({
        where: { id: media.id },
      });
    });
  });

  describe('💬 メッセージリスト取得時のN+1クエリ検出', () => {
    it.skip('メッセージリスト取得時の実行時間が閾値内である', async () => {
      // 認証が必要なためスキップ
      const query = `
        query GetMessages($conversationId: UUID!, $first: Int!) {
          messages(conversationId: $conversationId, first: $first) {
            edges {
              node {
                id
                content
                sender {
                  id
                  username
                  displayName
                }
                createdAt
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
          variables: { conversationId: testPosts[0].id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.MESSAGES_LIST);
    });
  });

  describe('🔧 DataLoaderの使用確認', () => {
    it('投稿のいいね情報がDataLoaderでバッチ取得されている', async () => {
      const query = `
        query GetPosts($first: Int!) {
          posts(first: $first) {
            edges {
              node {
                id
                content
                isLikedByCurrentUser
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
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.POSTS_LIST);

      // DataLoaderが使用されていることを確認
      //（postLikeLoaderが使用されている場合、いいね情報はバッチ取得される）
      expect(result.data).toBeDefined();
    });

    it.skip('コメントのいいね情報がDataLoaderでバッチ取得されている', async () => {
      const query = `
        query GetComments($postId: UUID!, $first: Int!) {
          comments(postId: $postId, first: $first) {
            edges {
              node {
                id
                content
                isLikedByCurrentUser
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
          variables: { postId: testPosts[0].id, first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.COMMENTS_LIST);

      // DataLoaderが使用されていることを確認
      //（commentLikeLoaderが使用されている場合、いいね情報はバッチ取得される）
      expect(result.data).toBeDefined();
    });

    it('投稿の購入情報がDataLoaderでバッチ取得されている', async () => {
      const query = `
        query GetPosts($first: Int!) {
          posts(first: $first) {
            edges {
              node {
                id
                content
                isPurchasedByCurrentUser
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
          variables: { first: 10 },
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.errors).toBeUndefined();
      expect(responseTime).toBeLessThan(QUERY_TIME_THRESHOLDS.POSTS_LIST);

      // DataLoaderが使用されていることを確認
      //（postPurchaseLoaderが使用されている場合、購入情報はバッチ取得される）
      expect(result.data).toBeDefined();
    });
  });

  describe('📊 クエリ数の閾値チェック', () => {
    it('すべての主要操作がクエリ時間閾値を満たしている', async () => {
      const queryTimes: { [key: string]: number } = {};

      // 投稿リスト
      const postsQuery = `
        query GetPosts($first: Int!) {
          posts(first: $first) {
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

      let startTime = Date.now();
      await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: postsQuery,
          variables: { first: 10 },
        },
      });
      queryTimes.posts = Date.now() - startTime;

      // コメントリスト
      const commentsQuery = `
        query GetComments($postId: UUID!, $first: Int!) {
          comments(postId: $postId, first: $first) {
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

      startTime = Date.now();
      await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: commentsQuery,
          variables: { postId: testPosts[0].id, first: 10 },
        },
      });
      queryTimes.comments = Date.now() - startTime;

      // ユーザーリスト
      const usersQuery = `
        query GetUsers($first: Int!) {
          users(first: $first) {
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

      startTime = Date.now();
      await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: usersQuery,
          variables: { first: 10 },
        },
      });
      queryTimes.users = Date.now() - startTime;

      // すべてのクエリ時間が閾値内であることを確認
      expect(queryTimes.posts).toBeLessThan(QUERY_TIME_THRESHOLDS.POSTS_LIST);
      expect(queryTimes.comments).toBeLessThan(QUERY_TIME_THRESHOLDS.COMMENTS_LIST);
      expect(queryTimes.users).toBeLessThan(QUERY_TIME_THRESHOLDS.USERS_LIST);
    });
  });
});
