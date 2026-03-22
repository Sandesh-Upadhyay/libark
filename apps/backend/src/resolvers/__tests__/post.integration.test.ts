/**
 * 🧪 GraphQL投稿リゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';
import { counterManager } from '@libark/redis-client';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData } from '../../__tests__/helpers/test-data.js';
import { UserFactory, PostFactory } from '../../__tests__/factories/index.js';

const postQuery = `
  query Post($id: UUID!) {
    post(id: $id) {
      id
      content
      isDeleted
      isProcessing
      createdAt
      user { id username displayName }
      likesCount
      commentsCount
      viewsCount
      media { id variants { id type s3Key width height fileSize quality createdAt } }
    }
  }
`;

const postsQuery = `
  query Posts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      edges {
        cursor
        node { id content createdAt }
      }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      totalCount
    }
  }
`;

describe('📝 GraphQL投稿リゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;
  let postFactory: PostFactory;

  beforeAll(async () => {
    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);
    postFactory = new PostFactory(app.prisma, userFactory);
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  it('post クエリで投稿詳細が取得でき、RedisカウンタのlikesCount等が反映される', async () => {
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.create({ userId: user.id });

    // Redis統計を設定
    await counterManager.incrementPostStat(post.id, 'likes', 3);
    await counterManager.incrementPostStat(post.id, 'comments', 5);
    await counterManager.incrementPostStat(post.id, 'views', 7);

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.post.id).toBe(post.id);
    expect(body.data.post.content).toBe(post.content);
    expect(body.data.post.isDeleted).toBe(false);
    expect(body.data.post.likesCount).toBe(3);
    expect(body.data.post.commentsCount).toBe(5);
    expect(body.data.post.viewsCount).toBe(7);
  });

  it('isDeleted=true の投稿は NOT_FOUND エラーになる', async () => {
    const user = await userFactory.createWithPassword('Test12345!');
    const deletedPost = await postFactory.createDeleted({ userId: user.id });

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postQuery,
        variables: { id: deletedPost.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
  });

  it('posts クエリでページネーション（cursor based）が機能する', async () => {
    const user = await userFactory.createWithPassword('Test12345!');

    // createdAt 降順になるように時間差で作成
    const p1 = await postFactory.createPublic({
      userId: user.id,
      content: 'P1',
      createdAt: new Date(Date.now() - 3000),
    });
    const p2 = await postFactory.createPublic({
      userId: user.id,
      content: 'P2',
      createdAt: new Date(Date.now() - 2000),
    });
    const p3 = await postFactory.createPublic({
      userId: user.id,
      content: 'P3',
      createdAt: new Date(Date.now() - 1000),
    });

    // 1ページ目（2件）
    const res1 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postsQuery,
        variables: { first: 2 },
      },
    });

    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.body);
    expect(body1.errors).toBeUndefined();
    expect(body1.data.posts.edges.length).toBe(2);
    expect(body1.data.posts.pageInfo.hasNextPage).toBe(true);

    const endCursor = body1.data.posts.pageInfo.endCursor as string;
    expect(typeof endCursor).toBe('string');

    // 2ページ目（残り1件）
    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: postsQuery,
        variables: { first: 2, after: endCursor },
      },
    });

    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeUndefined();
    expect(body2.data.posts.edges.length).toBe(1);
    expect(body2.data.posts.pageInfo.hasNextPage).toBe(false);

    // 取得されたIDの集合チェック（重複なし）
    const ids = [
      ...body1.data.posts.edges.map((e: any) => e.node.id),
      ...body2.data.posts.edges.map((e: any) => e.node.id),
    ];
    const idSet = new Set(ids);
    expect(idSet.size).toBe(3);
    expect(idSet.has(p1.id) || idSet.has(p2.id) || idSet.has(p3.id)).toBe(true);
  });
});
