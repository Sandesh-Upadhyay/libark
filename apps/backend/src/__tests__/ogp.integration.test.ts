/**
 * 🧪 OGP匿名配信バックエンド統合テスト
 *
 * テストケース:
 * - 内部API `/internal/ogp-meta/:mediaId` が正しくメタデータを返す
 * - 認証失敗→401
 * - メタデータが見つからない→404
 * - GraphQL resolver `Media.ogpUrl` が正しいURLを返す
 * - GraphQL resolver `Media.ogpUrls` が複数のvariantを返す
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { createTestUser, cleanupTestData } from './helpers/test-data.js';

// テスト用環境変数を設定
process.env.OGP_SIGNING_KEY = 'test-signing-key-12345678901234567890';
process.env.OGP_SIGNATURE_EXPIRES_IN = '1209600'; // 14日
process.env.OGP_INTERNAL_API_TOKEN = 'test-internal-token';
process.env.PUBLIC_URL = 'http://localhost:8000';

describe('🧪 OGP匿名配信バックエンド統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient };
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // テストデータをクリーンアップ
    await cleanupTestData(app.prisma);

    // テストユーザーを作成
    const user = await createTestUser(app.prisma, {
      email: `ogp-test-${Date.now()}@libark.dev`,
      username: `ogp-test-${Date.now()}`,
      password: 'Test12345!',
    });
    userId = user.id;
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
  });

  describe('📡 内部API `/internal/ogp-meta/:mediaId`', () => {
    it('正しくメタデータを返す', async () => {
      // メディアを作成
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // OGP公開メディアを作成
      await app.prisma.ogpPublicMedia.create({
        data: {
          mediaId: media.id,
          variant: 'SUMMARY',
          contentHash: 'a'.repeat(64),
          bucket: 'test-bucket',
          backendId: 'test-backend',
          ogpKey: `ogp/${media.id}/summary.jpg`,
          salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
          ext: 'jpg',
          contentType: 'image/jpeg',
        },
      });

      // 内部APIを呼び出し
      const response = await app.inject({
        method: 'GET',
        url: `/internal/ogp-meta/${media.id}`,
        headers: {
          'X-Internal-Token': 'test-internal-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        bucket: 'test-bucket',
        ogpKey: `ogp/${media.id}/summary.jpg`,
        salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
        contentHash: 'a'.repeat(64),
        contentType: 'image/jpeg',
        ext: 'jpg',
        variant: 'SUMMARY',
      });
    });

    it('認証失敗→401', async () => {
      // メディアを作成
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // 内部APIを呼び出し（認証トークンなし）
      const response = await app.inject({
        method: 'GET',
        url: `/internal/ogp-meta/${media.id}`,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          message: '認証が必要です',
          code: 'UNAUTHORIZED',
        },
      });
    });

    it('認証失敗（無効なトークン）→401', async () => {
      // メディアを作成
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // 内部APIを呼び出し（無効なトークン）
      const response = await app.inject({
        method: 'GET',
        url: `/internal/ogp-meta/${media.id}`,
        headers: {
          'X-Internal-Token': 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          message: '認証が必要です',
          code: 'UNAUTHORIZED',
        },
      });
    });

    it('メタデータが見つからない→404', async () => {
      // 存在しないメディアID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // 内部APIを呼び出し
      const response = await app.inject({
        method: 'GET',
        url: `/internal/ogp-meta/${nonExistentId}`,
        headers: {
          'X-Internal-Token': 'test-internal-token',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: {
          message: 'メディアが見つかりません',
          code: 'MEDIA_NOT_FOUND',
        },
      });
    });

    it('OGP公開メディアが存在しない→200でonDemandメタを返す', async () => {
      // メディアを作成（OGP公開メディアは作成しない）
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // 内部APIを呼び出し
      const response = await app.inject({
        method: 'GET',
        url: `/internal/ogp-meta/${media.id}`,
        headers: {
          'X-Internal-Token': 'test-internal-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();

      // onDemandメタが存在することを確認
      expect(result).toHaveProperty('onDemand');
      expect(result.onDemand).toHaveProperty('standard');
      expect(result.onDemand).toHaveProperty('teaser');

      // 既存フィールドは空文字列であることを確認
      expect(result.bucket).toBe('');
      expect(result.ogpKey).toBe('');
      expect(result.salt).toBe('');
      expect(result.contentHash).toBe('');
      expect(result.contentType).toBe('');
      expect(result.ext).toBe('');
      expect(result.variant).toBe('');
    });

    describe('🚀 オンデマンドOGPメタ拡張', () => {
      it('OgpPublicMediaなしでもonDemandメタを返す（status=MISSING）', async () => {
        // メディアを作成（OGP公開メディアは作成しない）
        const media = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // 内部APIを呼び出し
        const response = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();

        // onDemandメタが存在することを確認
        expect(result).toHaveProperty('onDemand');
        expect(result.onDemand).toHaveProperty('standard');
        expect(result.onDemand).toHaveProperty('teaser');

        // standard variantの確認
        expect(result.onDemand.standard).toMatchObject({
          contentHash: expect.any(String),
          ogpKey: expect.stringMatching(
            new RegExp(`^ogp/ondemand/${media.id}/standard/[a-f0-9]{64}\\.jpg$`)
          ),
          sig: expect.stringMatching(/^[a-f0-9]{64}$/),
          ext: 'jpg',
          contentType: 'image/jpeg',
          variant: 'standard',
          status: 'MISSING',
          mediaId: media.id,
          isPaid: false,
        });

        // teaser variantの確認
        expect(result.onDemand.teaser).toMatchObject({
          contentHash: expect.any(String),
          ogpKey: expect.stringMatching(
            new RegExp(`^ogp/ondemand/${media.id}/teaser/[a-f0-9]{64}\\.jpg$`)
          ),
          sig: expect.stringMatching(/^[a-f0-9]{64}$/),
          ext: 'jpg',
          contentType: 'image/jpeg',
          variant: 'teaser',
          status: 'MISSING',
          mediaId: media.id,
          isPaid: false,
        });

        // contentHashが64文字のhexであることを確認
        expect(result.onDemand.standard.contentHash).toMatch(/^[a-f0-9]{64}$/);
        expect(result.onDemand.teaser.contentHash).toMatch(/^[a-f0-9]{64}$/);
      });

      it('OgpPublicMediaあり（contentHash一致）ならstatus=READY', async () => {
        // メディアを作成
        const media = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // まず内部APIを呼び出してcontentHashを取得
        const initialResponse = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        const initialResult = initialResponse.json();
        const standardContentHash = initialResult.onDemand.standard.contentHash;
        const teaserContentHash = initialResult.onDemand.teaser.contentHash;

        // OgpPublicMediaを作成（contentHashを一致させる）
        await app.prisma.ogpPublicMedia.createMany({
          data: [
            {
              mediaId: media.id,
              variant: 'standard',
              contentHash: standardContentHash,
              bucket: 'test-bucket',
              backendId: 'test-backend',
              ogpKey: `ogp/ondemand/${media.id}/standard/${standardContentHash}.jpg`,
              salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
              ext: 'jpg',
              contentType: 'image/jpeg',
            },
            {
              mediaId: media.id,
              variant: 'teaser',
              contentHash: teaserContentHash,
              bucket: 'test-bucket',
              backendId: 'test-backend',
              ogpKey: `ogp/ondemand/${media.id}/teaser/${teaserContentHash}.jpg`,
              salt: 'test-salt-123456789012345678901234567890123456789012345678901234567891',
              ext: 'jpg',
              contentType: 'image/jpeg',
            },
          ],
        });

        // 内部APIを再度呼び出し
        const response = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();

        // statusがREADYになっていることを確認
        expect(result.onDemand.standard.status).toBe('READY');
        expect(result.onDemand.teaser.status).toBe('READY');

        // contentHashが変わっていないことを確認
        expect(result.onDemand.standard.contentHash).toBe(standardContentHash);
        expect(result.onDemand.teaser.contentHash).toBe(teaserContentHash);
      });

      it('contentHashが決定論である（同一入力→同一hash）', async () => {
        // 同じメディアを複数回作成
        const media1 = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        const media2 = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // 内部APIを呼び出し
        const response1 = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media1.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        const response2 = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media2.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        const result1 = response1.json();
        const result2 = response2.json();

        // 同じvariantのcontentHashは異なること（mediaIdが異なるため）
        expect(result1.onDemand.standard.contentHash).not.toBe(
          result2.onDemand.standard.contentHash
        );
        expect(result1.onDemand.teaser.contentHash).not.toBe(result2.onDemand.teaser.contentHash);

        // 同じmediaIdに対しては、同じvariantは常に同じcontentHashを返す
        const response1Again = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media1.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        const result1Again = response1Again.json();

        expect(result1.onDemand.standard.contentHash).toBe(
          result1Again.onDemand.standard.contentHash
        );
        expect(result1.onDemand.teaser.contentHash).toBe(result1Again.onDemand.teaser.contentHash);
      });

      it('Paid投稿の場合isPaid=true', async () => {
        // テスト開始前に古いPostデータをクリア
        await app.prisma.post.deleteMany({
          where: { userId },
        });

        // 投稿を作成
        const post = await app.prisma.post.create({
          data: {
            userId,
            content: 'Test paid post',
            visibility: 'PAID',
            price: 100,
          },
        });

        // メディアを作成
        const media = await app.prisma.media.create({
          data: {
            userId,
            postId: post.id,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // Prismaのリレーションキャッシュバグを回避するために、Prisma接続を再確立
        await app.prisma.$disconnect();
        await app.prisma.$connect();

        // 内部APIを呼び出し
        const response = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();

        // isPaidがtrueであることを確認
        expect(result.onDemand.standard.isPaid).toBe(true);
        expect(result.onDemand.teaser.isPaid).toBe(true);
      });

      it('既存OgpPublicMediaがある場合も後方互換を保つ', async () => {
        // メディアを作成
        const media = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // 既存のOGP公開メディアを作成
        await app.prisma.ogpPublicMedia.create({
          data: {
            mediaId: media.id,
            variant: 'SUMMARY',
            contentHash: 'a'.repeat(64),
            bucket: 'test-bucket',
            backendId: 'test-backend',
            ogpKey: `ogp/${media.id}/summary.jpg`,
            salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
            ext: 'jpg',
            contentType: 'image/jpeg',
          },
        });

        // 内部APIを呼び出し
        const response = await app.inject({
          method: 'GET',
          url: `/internal/ogp-meta/${media.id}`,
          headers: {
            'X-Internal-Token': 'test-internal-token',
          },
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();

        // 既存フィールドが維持されていることを確認
        expect(result).toMatchObject({
          bucket: 'test-bucket',
          ogpKey: `ogp/${media.id}/summary.jpg`,
          salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
          contentHash: 'a'.repeat(64),
          contentType: 'image/jpeg',
          ext: 'jpg',
          variant: 'SUMMARY',
        });

        // onDemandメタも追加されていることを確認
        expect(result).toHaveProperty('onDemand');
        expect(result.onDemand).toHaveProperty('standard');
        expect(result.onDemand).toHaveProperty('teaser');
      });
    });
  });

  describe('🔗 GraphQL resolver `Media.ogpUrl`', () => {
    it('正しいURLを返す', async () => {
      // メディアを作成
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // OGP公開メディアを作成
      await app.prisma.ogpPublicMedia.create({
        data: {
          mediaId: media.id,
          variant: 'SUMMARY',
          contentHash: 'a'.repeat(64),
          bucket: 'test-bucket',
          backendId: 'test-backend',
          ogpKey: `ogp/${media.id}/summary.jpg`,
          salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
          ext: 'jpg',
          contentType: 'image/jpeg',
        },
      });

      // GraphQLクエリを実行
      const query = `
        query Media($id: UUID!) {
          media(id: $id) {
            id
            ogpUrl(variant: "summary")
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        payload: {
          query,
          variables: { id: media.id },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.data.media.ogpUrl).not.toBeNull();
      expect(result.data.media.ogpUrl).toMatch(
        /^http:\/\/localhost:8000\/ogp\/[^/]+\/summary\/[a-f0-9]{64}\.jpg\?exp=\d+&sig=[a-f0-9]{64}$/
      );
    });

    it('OGPメタデータが見つからない→null', async () => {
      // メディアを作成（OGP公開メディアは作成しない）
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // GraphQLクエリを実行
      const query = `
        query Media($id: UUID!) {
          media(id: $id) {
            id
            ogpUrl(variant: "summary")
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        payload: {
          query,
          variables: { id: media.id },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.data.media.ogpUrl).toBeNull();
    });

    it('OGP_SIGNING_KEYが設定されていない→null', async () => {
      // 環境変数を一時的に削除
      const originalSigningKey = process.env.OGP_SIGNING_KEY;
      delete process.env.OGP_SIGNING_KEY;

      try {
        // メディアを作成
        const media = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // OGP公開メディアを作成
        await app.prisma.ogpPublicMedia.create({
          data: {
            mediaId: media.id,
            variant: 'SUMMARY',
            contentHash: 'a'.repeat(64),
            bucket: 'test-bucket',
            backendId: 'test-backend',
            ogpKey: `ogp/${media.id}/summary.jpg`,
            salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
            ext: 'jpg',
            contentType: 'image/jpeg',
          },
        });

        // GraphQLクエリを実行
        const query = `
          query Media($id: UUID!) {
            media(id: $id) {
              id
              ogpUrl(variant: "summary")
            }
          }
        `;

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { 'content-type': 'application/json' },
          payload: {
            query,
            variables: { id: media.id },
          },
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();
        expect(result.data.media.ogpUrl).toBeNull();
      } finally {
        // 環境変数を復元
        process.env.OGP_SIGNING_KEY = originalSigningKey;
      }
    });
  });

  describe('🔗 GraphQL resolver `Media.ogpUrls`', () => {
    it('複数のvariantを返す', async () => {
      // メディアを作成
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // 複数のOGP公開メディアを作成
      await app.prisma.ogpPublicMedia.createMany({
        data: [
          {
            mediaId: media.id,
            variant: 'SUMMARY',
            contentHash: 'a'.repeat(64),
            bucket: 'test-bucket',
            backendId: 'test-backend',
            ogpKey: `ogp/${media.id}/summary.jpg`,
            salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
            ext: 'jpg',
            contentType: 'image/jpeg',
          },
          {
            mediaId: media.id,
            variant: 'LARGE',
            contentHash: 'b'.repeat(64),
            bucket: 'test-bucket',
            backendId: 'test-backend',
            ogpKey: `ogp/${media.id}/large.jpg`,
            salt: 'test-salt-123456789012345678901234567890123456789012345678901234567891',
            ext: 'jpg',
            contentType: 'image/jpeg',
          },
        ],
      });

      // GraphQLクエリを実行
      const query = `
        query Media($id: UUID!) {
          media(id: $id) {
            id
            ogpUrls {
              summary
              large
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        payload: {
          query,
          variables: { id: media.id },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.data.media.ogpUrls).toHaveProperty('summary');
      expect(result.data.media.ogpUrls).toHaveProperty('large');
      expect(result.data.media.ogpUrls.summary).toMatch(
        /^http:\/\/localhost:8000\/ogp\/[^/]+\/summary\/[a-f0-9]{64}\.jpg\?exp=\d+&sig=[a-f0-9]{64}$/
      );
      expect(result.data.media.ogpUrls.large).toMatch(
        /^http:\/\/localhost:8000\/ogp\/[^/]+\/large\/[a-f0-9]{64}\.jpg\?exp=\d+&sig=[a-f0-9]{64}$/
      );
    });

    it('OGPメタデータが見つからない→空オブジェクト', async () => {
      // メディアを作成（OGP公開メディアは作成しない）
      const media = await app.prisma.media.create({
        data: {
          userId,
          filename: 'test-image.jpg',
          s3Key: 'post/2025-01-01/test-image.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'READY',
        },
      });

      // GraphQLクエリを実行
      const query = `
        query Media($id: UUID!) {
          media(id: $id) {
            id
            ogpUrls {
              summary
              large
            }
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        payload: {
          query,
          variables: { id: media.id },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.data.media.ogpUrls).toEqual({ summary: null, large: null });
    });

    it('OGP_SIGNING_KEYが設定されていない→空オブジェクト', async () => {
      // 環境変数を一時的に削除
      const originalSigningKey = process.env.OGP_SIGNING_KEY;
      delete process.env.OGP_SIGNING_KEY;

      try {
        // メディアを作成
        const media = await app.prisma.media.create({
          data: {
            userId,
            filename: 'test-image.jpg',
            s3Key: 'post/2025-01-01/test-image.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            status: 'READY',
          },
        });

        // 複数のOGP公開メディアを作成
        await app.prisma.ogpPublicMedia.createMany({
          data: [
            {
              mediaId: media.id,
              variant: 'SUMMARY',
              contentHash: 'a'.repeat(64),
              bucket: 'test-bucket',
              backendId: 'test-backend',
              ogpKey: `ogp/${media.id}/summary.jpg`,
              salt: 'test-salt-123456789012345678901234567890123456789012345678901234567890',
              ext: 'jpg',
              contentType: 'image/jpeg',
            },
            {
              mediaId: media.id,
              variant: 'LARGE',
              contentHash: 'b'.repeat(64),
              bucket: 'test-bucket',
              backendId: 'test-backend',
              ogpKey: `ogp/${media.id}/large.jpg`,
              salt: 'test-salt-123456789012345678901234567890123456789012345678901234567891',
              ext: 'jpg',
              contentType: 'image/jpeg',
            },
          ],
        });

        // GraphQLクエリを実行
        const query = `
          query Media($id: UUID!) {
            media(id: $id) {
              id
              ogpUrls {
                summary
                large
              }
            }
          }
        `;

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { 'content-type': 'application/json' },
          payload: {
            query,
            variables: { id: media.id },
          },
        });

        expect(response.statusCode).toBe(200);
        const result = response.json();
        expect(result.data.media.ogpUrls).toEqual({ summary: null, large: null });
      } finally {
        // 環境変数を復元
        process.env.OGP_SIGNING_KEY = originalSigningKey;
      }
    });
  });
});
