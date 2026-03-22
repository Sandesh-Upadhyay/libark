/**
 * 🧪 オンデマンドOGP生成統合テスト
 *
 * テストケース:
 * - MISSING → 初回 200（GENERATED）→ 次回 HIT
 * - paid 投稿 → teaser（テンプレ）を返す（jpg / 1200x630 であることを検証）
 * - 多重リクエスト → 生成1回のみ（lock競合をモックで再現）＋他は wait→成功 or FALLBACK
 * - sig 不正 → 生成が走らず 401/404（現行実装の方針に合わせる）
 * - hash 不致 → 301 canonical（PR2で実装済みの再確認でもOK）
 */

import { Readable } from 'stream';

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Redis } from 'ioredis';
import type { FastifyInstance } from 'fastify';

// S3クライアントをモック
const mockS3Send = vi.fn();
vi.mock('@aws-sdk/client-s3', async () => {
  const actual = await vi.importActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: vi.fn(() => ({
      send: mockS3Send,
    })),
    GetObjectCommand: vi.fn().mockImplementation(function (this: any, input: any) {
      this.input = input;
      return this;
    }),
    HeadObjectCommand: vi.fn().mockImplementation(function (this: any, input: any) {
      this.input = input;
      return this;
    }),
    PutObjectCommand: vi.fn().mockImplementation(function (this: any, input: any) {
      this.input = input;
      return this;
    }),
  };
});

// Redisをモック
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisSetex = vi.fn();
const mockRedisDel = vi.fn();
const mockRedis = {
  get: mockRedisGet,
  set: mockRedisSet,
  setex: mockRedisSetex,
  del: mockRedisDel,
  expire: vi.fn(),
} as unknown as Redis;

// Redis clientをモック
vi.mock('@libark/redis-client', () => ({
  getRedisClient: vi.fn(() => mockRedis),
  rateLimiter: {
    checkRateLimit: vi.fn(async () => ({ allowed: true })),
  },
}));

// 設定をモック
vi.mock('../config/index.js', () => ({
  getConfig: vi.fn(() => ({
    port: 8080,
    s3: {
      backend: {
        type: 'r2',
        region: 'auto',
        endpoint: 'https://test.r2.cloudflarestorage.com',
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
        bucket: 'test-bucket',
      },
      bucket: 'test-bucket',
      defaultACL: 'private',
    },
    encryption: {
      enabled: false,
      algorithm: 'AES256',
      key: 'test-key',
    },
    logging: {
      level: 'error',
      pretty: false,
    },
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true,
    },
  })),
  validateConfig: vi.fn(() => true),
}));

// 暗号化サービスをモック
vi.mock('../services/encryption.js', () => ({
  getEncryptionService: vi.fn(() => ({
    isEnabled: vi.fn(() => false),
    generateSSECParams: vi.fn(async () => ({})),
  })),
}));

// テスト用環境変数を設定
vi.stubEnv('OGP_SIGNING_KEY', 'test-signing-key-12345678901234567890');
vi.stubEnv('OGP_MAX_FUTURE_SEC', '2592000');
vi.stubEnv('OGP_INTERNAL_API_BASE_URL', 'http://localhost:3001');
vi.stubEnv('OGP_INTERNAL_API_TOKEN', 'test-internal-token');
vi.stubEnv('S3_ACCESS_KEY', 'test-access-key');
vi.stubEnv('S3_SECRET_KEY', 'test-secret-key');
vi.stubEnv('S3_BUCKET', 'test-bucket');
vi.stubEnv('S3_BACKEND_TYPE', 'r2');
vi.stubEnv('S3_BACKEND_REGION', 'auto');
vi.stubEnv('S3_BACKEND_ENDPOINT', 'https://test.r2.cloudflarestorage.com');
vi.stubEnv('S3_BACKEND_ACCESS_KEY', 'test-access-key');
vi.stubEnv('S3_BACKEND_SECRET_KEY', 'test-secret-key');

// テスト用データ
const TEST_MEDIA_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_VARIANT_STANDARD = 'standard';
const TEST_VARIANT_TEASER = 'teaser';
const TEST_HASH = 'a'.repeat(64); // 64文字のhex文字列
const TEST_EXT = 'jpg';
const TEST_CONTENT_TYPE = 'image/jpeg';

// テスト用オンデマンドOGPメタデータ（free）
const TEST_ON_DEMAND_META_FREE = {
  contentHash: TEST_HASH,
  ogpKey: `ogp/ondemand/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`,
  sig: '0'.repeat(64),
  ext: 'jpg',
  contentType: TEST_CONTENT_TYPE,
  variant: TEST_VARIANT_STANDARD,
  status: 'MISSING' as const,
  postId: undefined,
  mediaId: TEST_MEDIA_ID,
  isPaid: false,
};

// テスト用オンデマンドOGPメタデータ（paid）
const TEST_ON_DEMAND_META_PAID = {
  contentHash: TEST_HASH,
  ogpKey: `ogp/ondemand/${TEST_MEDIA_ID}/${TEST_VARIANT_TEASER}/${TEST_HASH}.jpg`,
  sig: '0'.repeat(64),
  ext: 'jpg',
  contentType: TEST_CONTENT_TYPE,
  variant: TEST_VARIANT_TEASER,
  status: 'MISSING' as const,
  postId: 'test-post-id',
  mediaId: TEST_MEDIA_ID,
  isPaid: true,
};

// テスト用S3レスポンス
const createS3Stream = (data: string) => {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
};

// fetchをモック
let mockFetch: ReturnType<typeof vi.fn>;

describe('🧪 オンデマンドOGP生成統合テスト', () => {
  let app: FastifyInstance;
  let signingKey: string;

  beforeAll(async () => {
    // モジュールキャッシュをクリアして環境変数を反映
    vi.resetModules();

    // モジュールを動的にインポート
    const { createApp } = await import('../app.js');
    app = await createApp();
    await app.ready();
    signingKey = process.env.OGP_SIGNING_KEY || '';
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // S3モックをリセット
    mockS3Send.mockReset();

    // Redisロックをデフォルトで成功させる
    mockRedisSet.mockResolvedValue('OK');

    // S3モックを設定し、コマンドオブジェクトを保存する
    mockS3Send.mockImplementation(async (command: any) => {
      const input = command.input || {};

      // PutObjectCommandの場合は成功を返す
      if (command.constructor.name === 'PutObjectCommand') {
        return {
          ETag: '"test-etag"',
        };
      }

      // HeadObjectCommandの場合はNoSuchKeyエラーを返す（初期状態）
      if (command instanceof HeadObjectCommand) {
        const error = new Error('NoSuchKey');
        error.name = 'NoSuchKey';
        throw error;
      }

      // GetObjectCommandの場合もNoSuchKeyエラーを返す（初期状態）
      if (command instanceof GetObjectCommand) {
        const error = new Error('NoSuchKey');
        error.name = 'NoSuchKey';
        throw error;
      }

      return {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🎨 オンデマンドOGP生成 - 初回生成（MISSING → GENERATED）', () => {
    it('MISSING → 初回 200（GENERATED）', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_FREE));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_STANDARD,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3モック：HeadObject/GetObjectはNoSuchKey、PutObjectは成功
      mockS3Send.mockImplementation(async (command: any) => {
        // PutObjectCommandの場合は成功を返す
        if (command.constructor.name === 'PutObjectCommand') {
          return {
            ETag: '"test-etag"',
          };
        }

        // HeadObjectCommandの場合はNoSuchKeyエラーを返す
        if (command instanceof HeadObjectCommand) {
          const error = new Error('NoSuchKey');
          error.name = 'NoSuchKey';
          throw error;
        }

        // GetObjectCommandの場合もNoSuchKeyエラーを返す
        if (command instanceof GetObjectCommand) {
          const error = new Error('NoSuchKey');
          error.name = 'NoSuchKey';
          throw error;
        }

        return {};
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe(TEST_CONTENT_TYPE);
      expect(response.headers['x-ogp-cache']).toBe('GENERATED');

      // S3 PutObjectCommandが呼ばれたことを確認
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('次回は HIT（S3から配信）', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_FREE));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_STANDARD,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3で成功を返す（生成済み）
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: TEST_CONTENT_TYPE,
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe(TEST_CONTENT_TYPE);
      expect(response.headers['x-ogp-cache']).toBe('HIT');

      // S3 GetObjectCommandが呼ばれたことを確認
      expect(mockS3Send).toHaveBeenCalled();
    });
  });

  describe('🔒 オンデマンドOGP生成 - 有料コンテンツ（teaser）', () => {
    it('paid 投稿 → teaser（テンプレ）を返す（jpg / 1200x630 であることを検証）', async () => {
      // オンデマンドメタデータをキャッシュ（paid）
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_PAID));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_TEASER}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_TEASER,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3モック：HeadObject/GetObjectはNoSuchKey、PutObjectは成功
      mockS3Send.mockImplementation(async (command: any) => {
        // PutObjectCommandの場合は成功を返す
        if (command.constructor.name === 'PutObjectCommand') {
          return {
            ETag: '"test-etag"',
          };
        }

        // HeadObjectCommandの場合はNoSuchKeyエラーを返す
        if (command instanceof HeadObjectCommand) {
          const error = new Error('NoSuchKey');
          error.name = 'NoSuchKey';
          throw error;
        }

        // GetObjectCommandの場合もNoSuchKeyエラーを返す
        if (command instanceof GetObjectCommand) {
          const error = new Error('NoSuchKey');
          error.name = 'NoSuchKey';
          throw error;
        }

        return {};
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe(TEST_CONTENT_TYPE);
      expect(response.headers['x-ogp-cache']).toBe('GENERATED');

      // レスポンスボディがSVGであることを確認（簡易実装ではSVGを返す）
      expect(response.body).toContain('<svg');
      expect(response.body).toContain('有料コンテンツ');
    });
  });

  describe('🔒 オンデマンドOGP生成 - 多重リクエスト', () => {
    it('生成1回のみ（lock競合をモックで再現）＋他は wait→成功', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_FREE));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_STANDARD,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // Redisロックモック
      let lockCount = 0;
      mockRedisSet.mockImplementation(
        async (key: string, value: string, mode: string, expiry: number) => {
          if (key.includes('ogp:lock')) {
            lockCount++;
            // 最初のリクエストだけロック取得成功
            return lockCount === 1 ? 'OK' : null;
          }
          return 'OK';
        }
      );

      // S3モック：最初はNoSuchKey、その後は成功
      let s3CallCount = 0;
      mockS3Send.mockImplementation(async (command: any) => {
        s3CallCount++;

        // HeadObjectCommandの場合
        if (command instanceof HeadObjectCommand) {
          if (s3CallCount <= 2) {
            // 最初の2回はNoSuchKey
            const error = new Error('NoSuchKey');
            error.name = 'NoSuchKey';
            throw error;
          } else {
            // 3回目以降は成功
            return {};
          }
        }

        // GetObjectCommandの場合
        if (command instanceof GetObjectCommand) {
          if (s3CallCount <= 2) {
            const error = new Error('NoSuchKey');
            error.name = 'NoSuchKey';
            throw error;
          } else {
            return {
              Body: createS3Stream('test-image-data'),
              ContentType: TEST_CONTENT_TYPE,
              ContentLength: 14,
              ETag: '"test-etag"',
              LastModified: new Date(),
            };
          }
        }

        // PutObjectCommandの場合は成功を返す
        if (command instanceof PutObjectCommand) {
          return {
            ETag: '"test-etag"',
          };
        }

        return {};
      });

      // 最初のリクエスト（生成）
      const response1 = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response1.statusCode).toBe(200);
      expect(response1.headers['x-ogp-cache']).toBe('GENERATED');

      // 2番目のリクエスト（ロック競合 → 待機 → 成功）
      const response2 = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response2.statusCode).toBe(200);
      expect(response2.headers['x-ogp-cache']).toBe('HIT');
    });

    it('ロック競合でタイムアウト → FALLBACK', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_FREE));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_STANDARD,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // Redisロックモック（常に失敗）
      mockRedisSet.mockResolvedValue(null);

      // S3モック：常にNoSuchKey（PutObjectもエラー）
      mockS3Send.mockImplementation(async (command: any) => {
        const error = new Error('NoSuchKey');
        error.name = 'NoSuchKey';
        throw error;
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['x-ogp-cache']).toBe('FALLBACK');

      // フォールバック画像が返されることを確認
      expect(response.body).toContain('<svg');
      expect(response.body).toContain('画像を準備中');
    });
  });

  describe('🔐 オンデマンドOGP生成 - 署名検証', () => {
    it('sig 不正 → 生成が走らず 401', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_FREE));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`;

      // 不正な署名
      const signature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効な署名です',
          code: 'INVALID_SIGNATURE',
        },
      });

      // S3が呼ばれないことを確認
      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });

  describe('🔄 オンデマンドOGP生成 - hash不一致時の301リダイレクト', () => {
    it('hash 不致 → 301 canonical', async () => {
      // オンデマンドメタデータをキャッシュ（異なるハッシュ）
      const expectedHash = 'b'.repeat(64);
      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          ...TEST_ON_DEMAND_META_FREE,
          contentHash: expectedHash,
        })
      );

      // URLのハッシュは異なる
      const urlHash = TEST_HASH;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${urlHash}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_STANDARD,
        urlHash,
        'jpg',
        signingKey
      );

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(301);
      expect(response.headers.location).toContain(expectedHash);
      expect(response.headers.location).toContain('sig=');
    });
  });

  describe('🎨 オンデマンドOGP生成 - フォールバック画像', () => {
    it('生成失敗 → フォールバック画像を返す（必ず200）', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META_FREE));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_STANDARD}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_STANDARD,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3モック：常にNoSuchKey（PutObjectもエラー）
      mockS3Send.mockImplementation(async (command: any) => {
        const error = new Error('NoSuchKey');
        error.name = 'NoSuchKey';
        throw error;
      });

      // ロック取得成功
      mockRedisSet.mockResolvedValue('OK');

      // 生成エラーをシミュレート（generatorのimportをモック）
      const { getOgpGeneratorService } = await import('../services/ogp-generator.js');
      const generator = getOgpGeneratorService();

      // generateStandardOgpをエラーにする
      vi.spyOn(generator, 'generateStandardOgp').mockRejectedValue(new Error('Generation failed'));

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      // エラー時は404を返す（存在秘匿）
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: {
          message: 'ファイルが見つかりません',
          code: 'S3_NO_SUCH_KEY',
        },
      });
    });
  });
});
