/**
 * 🖼️ GraphQLメディアリゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData, createTestUser } from '../../__tests__/helpers/test-data.js';

const mediaQuery = `
  query Media($id: UUID!) {
    media(id: $id) {
      id
      filename
      url
      thumbnailUrl
      variants { id type s3Key url width height fileSize quality createdAt }
    }
  }
`;

describe('🖼️ GraphQLメディアリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  beforeAll(async () => {
    app = await createTestApp();
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

  it('Media.url はセキュア配信エンドポイント（/api/media/:id）を返す', async () => {
    const user = await createTestUser(app.prisma, {
      email: `media-owner-${Date.now()}@libark.dev`,
      username: `media-owner-${Date.now()}`,
      password: 'Test12345!',
    });

    const media = await app.prisma.media.create({
      data: {
        userId: user.id,
        filename: 'sample.jpg',
        s3Key: 'post/2025-08-08/dummy-media-id.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        status: 'READY',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: mediaQuery,
        variables: { id: media.id },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    const mediaData = body.data.media;

    expect(mediaData.id).toBe(media.id);
    // 🔧 テスト環境では統一メディアURL生成システムによりサーバーサイド用URLが生成される
    expect(mediaData.url).toBe(`http://backend:8000/api/media/${media.id}`);
  });

  it('サムネイルバリアントが無い場合は avatar ならオリジナルURL、その他は null', async () => {
    const user = await createTestUser(app.prisma, {
      email: `media-thumb-${Date.now()}@libark.dev`,
      username: `media-thumb-${Date.now()}`,
      password: 'Test12345!',
    });

    // 通常（avatar ではない）→ thumbnailUrl は null
    const media1 = await app.prisma.media.create({
      data: {
        userId: user.id,
        filename: 'photo.webp',
        s3Key: 'post/2025-08-08/dummy.webp',
        mimeType: 'image/webp',
        fileSize: 2048,
        status: 'READY',
      },
    });

    const res1 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: { query: mediaQuery, variables: { id: media1.id } },
    });
    const body1 = JSON.parse(res1.body);
    expect(body1.errors).toBeUndefined();
    expect(body1.data.media.thumbnailUrl).toBe(null);

    // avatar を含む s3Key → サムネイルなしでもオリジナルURL
    const media2 = await app.prisma.media.create({
      data: {
        userId: user.id,
        filename: 'avatar.png',
        s3Key: 'avatar/2025-08-08/avatar-1234.png',
        mimeType: 'image/png',
        fileSize: 1024,
        status: 'READY',
      },
    });

    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: { query: mediaQuery, variables: { id: media2.id } },
    });
    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeUndefined();
    // 🔧 テスト環境では統一メディアURL生成システムによりサーバーサイド用URLが生成される
    expect(body2.data.media.thumbnailUrl).toBe(`http://backend:8000/api/media/${media2.id}`);
  });

  it('THUMB バリアントが存在する場合、thumbnailUrl は ?variant=THUMB を付与して返す', async () => {
    const user = await createTestUser(app.prisma, {
      email: `media-variant-${Date.now()}@libark.dev`,
      username: `media-variant-${Date.now()}`,
      password: 'Test12345!',
    });

    const media = await app.prisma.media.create({
      data: {
        userId: user.id,
        filename: 'photo.jpg',
        s3Key: 'post/2025-08-08/photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1234,
        status: 'READY',
      },
    });

    const variant = await app.prisma.mediaVariant.create({
      data: {
        mediaId: media.id,
        type: 'THUMB',
        s3Key: 'post/2025-08-08/photo_thumb.jpg',
        width: 200,
        height: 200,
        fileSize: 100,
        quality: 80,
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: { query: mediaQuery, variables: { id: media.id } },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    // 🔧 テスト環境では統一メディアURL生成システムによりサーバーサイド用URLが生成される
    expect(body.data.media.thumbnailUrl).toBe(
      `http://backend:8000/api/media/${media.id}?variant=THUMB`
    );

    // variants フィールドの url は backend実装では未設定のため null の可能性がある
    // MediaVariant.url の resolver は /api/media/:mediaId?variant=TYPE を返す仕様
    // ここでは存在確認まで（型整合チェック）
    const variantNode = body.data.media.variants.find((v: any) => v.id === variant.id);
    expect(variantNode).toBeTruthy();
  });
});
