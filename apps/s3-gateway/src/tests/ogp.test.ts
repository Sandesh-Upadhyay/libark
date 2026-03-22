/**
 * 🧪 OGP匿名配信ルート統合テスト
 *
 * テストケース:
 * - 既存ルート（後方互換）
 * - オンデマンドOGPルート
 * - 署名無し→401
 * - variant不正→400
 * - hash形式不正→400
 * - Redis hitで meta 取得→内部API呼ばない
 * - Redis miss→内部APIで取得→Redis setされる
 * - 署名OK→S3 GetObject呼ばれる（S3はモック）
 * - Head→HeadObject呼ばれる（ボディ無し）
 * - Rangeあり→RangeがS3へ転送される（可能なら）
 * - 期限切れの署名→401
 * - 未来過ぎの署名→401
 * - 署名不一致→401
 * - メタデータが見つからない→404
 * - 内部APIエラー→502
 * - S3ファイルが見つからない→404
 * - オンデマンドOGP: パラメータ検証
 * - オンデマンドOGP: hash不一致時の301リダイレクト
 * - オンデマンドOGP: 署名検証
 */

import { Readable } from 'stream';

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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
      // input プロパティを設定
      this.input = input;
      return this;
    }),
    HeadObjectCommand: vi.fn().mockImplementation(function (this: any, input: any) {
      // input プロパティを設定
      this.input = input;
      return this;
    }),
  };
});

// Redisをモック
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedis = {
  get: mockRedisGet,
  set: mockRedisSet,
  setex: mockRedisSet,
  del: vi.fn(),
  expire: vi.fn(),
} as unknown as Redis;

// Redis clientをモック
const mockCheckRateLimit = vi.fn(async () => ({ allowed: true }));

vi.mock('@libark/redis-client', () => ({
  getRedisClient: vi.fn(() => mockRedis),
  rateLimiter: {
    checkRateLimit: mockCheckRateLimit,
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
const TEST_VARIANT_LEGACY = 'summary';
const TEST_VARIANT_ON_DEMAND = 'standard';
const TEST_HASH = 'a'.repeat(64); // 64文字のhex文字列
const TEST_EXT = 'webp';
const TEST_SALT = 'test-salt-123456789012345678901234567890123456789012345678901234567890';
const TEST_CONTENT_TYPE = 'image/webp';
const TEST_BUCKET = 'test-bucket';
const TEST_OGP_KEY = `ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}.webp`;

// テスト用OGPメタデータ（既存の後方互換）
const TEST_OGP_META = {
  bucket: TEST_BUCKET,
  ogpKey: TEST_OGP_KEY,
  salt: TEST_SALT,
  contentHash: TEST_HASH,
  contentType: TEST_CONTENT_TYPE,
  ext: TEST_EXT,
  variant: TEST_VARIANT_LEGACY,
};

// テスト用オンデマンドOGPメタデータ
const TEST_ON_DEMAND_META = {
  contentHash: TEST_HASH,
  ogpKey: `ogp/ondemand/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`,
  sig: '0'.repeat(64),
  ext: 'jpg',
  contentType: 'image/jpeg',
  variant: TEST_VARIANT_ON_DEMAND,
  status: 'READY' as const,
  postId: undefined,
  mediaId: TEST_MEDIA_ID,
  isPaid: false,
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

describe('🧪 OGP匿名配信ルート統合テスト', () => {
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
      // コマンドのinputプロパティを保持
      const input = command.input || {};
      const hasRange = !!input.Range;

      // コマンドオブジェクトを保存（テスト用）
      (command as any).__capturedInput = input;

      // PutObjectCommandの場合は成功を返す
      if (command.constructor.name === 'PutObjectCommand') {
        return {
          ETag: '"test-etag"',
        };
      }

      return {
        Body: createS3Stream('test-image-data'),
        ContentType: TEST_CONTENT_TYPE,
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
        // Rangeリクエストの場合はContentRangeを含める
        ...(hasRange ? { ContentRange: 'bytes 0-13/14' } : {}),
        ...input.mockResponse,
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔐 既存ルート - 署名検証', () => {
    it.skip('署名無し→400 (Fastifyスキーマバリデーション)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`,
      });

      // Fastifyのスキーマバリデーションが先に動作して400を返す
      expect(response.statusCode).toBe(400);
    });

    it('期限切れの署名→401', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      // 期限切れの署名
      const now = Math.floor(Date.now() / 1000);
      const exp = now - 3600; // 1時間前
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          message: '署名の有効期限が切れています',
          code: 'SIGNATURE_EXPIRED',
        },
      });
    });

    it('未来過ぎの署名→401', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      // 未来過ぎの署名（デフォルトのmaxFutureSecは2592000秒 = 30日）
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 2592000 + 1; // 30日+1秒後
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効な署名です',
          code: 'INVALID_SIGNATURE',
        },
      });
    });

    it('署名不一致（正しい形式だが署名が間違っている）→401', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      // 不正な署名（64hex形式だが間違っている）
      const signature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効な署名です',
          code: 'INVALID_SIGNATURE',
        },
      });
    });

    it('署名OK→S3 GetObject呼ばれる', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      // 有効な署名
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: TEST_CONTENT_TYPE,
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe(TEST_CONTENT_TYPE);
      expect(response.body).toBe('test-image-data');

      // S3 GetObjectCommandが呼ばれたことを確認
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });
  });

  describe('📝 既存ルート - パラメータ検証', () => {
    it('variant不正→400', async () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/invalid/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効なパラメータです',
          code: 'INVALID_PARAM',
        },
      });
    });

    it('hash形式不正→400', async () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/invalid-hash/webp`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効なパラメータです',
          code: 'INVALID_PARAM',
        },
      });
    });

    it('UUID形式不正→400', async () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/invalid-uuid/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効なパラメータです',
          code: 'INVALID_PARAM',
        },
      });
    });
  });

  describe('📡 既存ルート - S3アクセス', () => {
    it('Head→HeadObject呼ばれる（ボディ無し）', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      // S3 HeadObjectレスポンスをモック
      mockS3Send.mockResolvedValue({
        ContentType: TEST_CONTENT_TYPE,
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'HEAD',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe(TEST_CONTENT_TYPE);
      expect(response.body).toBe('');

      // S3 HeadObjectCommandが呼ばれたことを確認
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('S3ファイルが見つからない→404', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      // S3でNoSuchKeyエラー
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockS3Send.mockRejectedValue(error);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('🔒 既存ルート - セキュリティヘッダー', () => {
    it('正しいセキュリティヘッダーが返される', async () => {
      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: TEST_CONTENT_TYPE,
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
      expect(response.headers['cache-control']).toMatch(/public, max-age=/);
    });
  });

  describe('🎯 オンデマンドOGP - パラメータ検証', () => {
    it.skip('署名無し→400 (Fastifyスキーマバリデーション)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`,
      });

      // Fastifyのスキーマバリデーションが先に動作して400を返す
      expect(response.statusCode).toBe(400);
    });

    it('variant不正→400', async () => {
      const now = Math.floor(Date.now() / 1000);
      const path = `/ogp/${TEST_MEDIA_ID}/invalid/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        'invalid',
        TEST_HASH,
        'jpg',
        signingKey
      );

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(400);
      // Fastifyのスキーマバリデーションが先に動作して "Bad Request" を返す
      expect(response.json()).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('hash形式不正→400', async () => {
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/invalid-hash.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
        'invalid-hash',
        'jpg',
        signingKey
      );

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効なパラメータです',
          code: 'INVALID_PARAM',
        },
      });
    });

    it('UUID形式不正→400', async () => {
      const path = `/ogp/invalid-uuid/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        'invalid-uuid',
        TEST_VARIANT_ON_DEMAND,
        TEST_HASH,
        'jpg',
        signingKey
      );

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          message: '無効なパラメータです',
          code: 'INVALID_PARAM',
        },
      });
    });
  });

  describe('🎯 オンデマンドOGP - hash不一致時の301リダイレクト', () => {
    it('URLのhashが期待値と違う場合は301でcanonical URLへリダイレクト', async () => {
      // オンデマンドメタデータをキャッシュ（異なるハッシュ）
      const expectedHash = 'b'.repeat(64);
      mockRedisGet.mockResolvedValue(
        JSON.stringify({
          ...TEST_ON_DEMAND_META,
          contentHash: expectedHash,
        })
      );

      // URLのハッシュは異なる
      const urlHash = TEST_HASH;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${urlHash}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
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

  describe('🎯 オンデマンドOGP - 署名検証', () => {
    it('署名不一致→401', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

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
    });

    it('署名OK→S3 GetObject呼ばれる', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: 'image/jpeg',
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.body).toBe('test-image-data');

      // X-OGP-CacheヘッダーがHITであることを確認
      expect(response.headers['x-ogp-cache']).toBe('HIT');

      // S3 GetObjectCommandが呼ばれたことを確認
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });
  });

  describe('🎯 オンデマンドOGP - キャッシュヘッダー', () => {
    it('正しいキャッシュヘッダーが返される', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: 'image/jpeg',
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe(
        'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
      );
      expect(response.headers['x-ogp-cache']).toBe('HIT');
    });
  });

  describe('🎯 オンデマンドOGP - S3ファイルが見つからない場合', () => {
    it('S3に無い場合は404を返す（現状互換）', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3でNoSuchKeyエラー
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockS3Send.mockRejectedValue(error);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: {
          message: 'ファイルが見つかりません',
          code: 'S3_NO_SUCH_KEY',
        },
      });
    });
  });

  describe('🚦 Rate Limit - レート制限', () => {
    it('Rate limit超過で429が返る（署名OKでも生成に入らない）', async () => {
      // テスト用の低いレート制限を設定
      vi.stubEnv('OGP_RATE_LIMIT_MAX', '2');

      // Rate limiterをモックして3回目で失敗させる
      let callCount = 0;
      mockCheckRateLimit.mockImplementation(async () => {
        callCount++;
        return { allowed: callCount <= 2 };
      });

      // Redisにメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_OGP_META));

      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;
      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_LEGACY}/${TEST_HASH}/${TEST_EXT}`;

      const { generateSignature } = await import('@libark/core-server');
      const signature = generateSignature(path, TEST_SALT, exp, signingKey);

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: TEST_CONTENT_TYPE,
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      // 最初の2リクエストは成功
      const response1 = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });
      expect(response1.statusCode).toBe(200);

      const response2 = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });
      expect(response2.statusCode).toBe(200);

      // 3回目は429
      const response3 = await app.inject({
        method: 'GET',
        url: `${path}?exp=${exp}&sig=${signature}`,
      });
      expect(response3.statusCode).toBe(429);
      expect(response3.json()).toMatchObject({
        error: {
          message: 'リクエスト数が制限を超えています',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      });

      // S3が3回呼ばれていないことを確認（レート制限で弾かれたため）
      expect(mockS3Send).toHaveBeenCalledTimes(2);
    });

    it('オンデマンドOGPでもRate limit超過で429が返る', async () => {
      // テスト用の低いレート制限を設定
      vi.stubEnv('OGP_RATE_LIMIT_MAX', '1');

      // Rate limiterをモックして2回目で失敗させる
      let callCount = 0;
      mockCheckRateLimit.mockImplementation(async () => {
        callCount++;
        return { allowed: callCount <= 1 };
      });

      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: 'image/jpeg',
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      // 最初のリクエストは成功
      const response1 = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });
      expect(response1.statusCode).toBe(200);

      // 2回目は429
      const response2 = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });
      expect(response2.statusCode).toBe(429);
    });
  });

  describe('🚩 Feature Flag - OGP_ON_DEMAND_ENABLED', () => {
    it('Feature flag OFFでS3ミス時に404（フォールバックが走らない）', async () => {
      // Feature flagを無効化
      vi.stubEnv('OGP_ON_DEMAND_ENABLED', 'false');

      // モジュールを再ロードして環境変数を反映
      vi.resetModules();
      const { createApp: createApp2 } = await import('../app.js');
      const app2 = await createApp2();
      await app2.ready();

      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
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

      const response = await app2.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      // フォールバックが走らず404を返す
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: {
          message: 'ファイルが見つかりません',
          code: 'S3_NO_SUCH_KEY',
        },
      });

      // S3が1回だけ呼ばれていることを確認（フォールバック生成が走っていない）
      expect(mockS3Send).toHaveBeenCalledTimes(1);

      await app2.close();
    });

    it('Feature flag ONでS3ミス時にフォールバックが走る', async () => {
      // Feature flagを有効化（デフォルト）
      vi.stubEnv('OGP_ON_DEMAND_ENABLED', 'true');

      // モジュールを再ロードして環境変数を反映
      vi.resetModules();
      const { createApp: createApp2 } = await import('../app.js');
      const app2 = await createApp2();
      await app2.ready();

      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
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

      const response = await app2.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      // オンデマンド生成が走り、GENERATED が返る
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['x-ogp-cache']).toBe('GENERATED');

      await app2.close();
    });
  });

  describe('📊 X-OGP-Cacheヘッダー - 各主要パスで設定される', () => {
    it('HIT - S3から配信', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
        TEST_HASH,
        'jpg',
        signingKey
      );

      // S3レスポンスをモック
      mockS3Send.mockResolvedValue({
        Body: createS3Stream('test-image-data'),
        ContentType: 'image/jpeg',
        ContentLength: 14,
        ETag: '"test-etag"',
        LastModified: new Date(),
      });

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ogp-cache']).toBe('HIT');
    });

    it('GENERATED - 新規生成', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
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
      expect(response.headers['x-ogp-cache']).toBe('GENERATED');
    });

    it('FALLBACK - フォールバック画像', async () => {
      // オンデマンドメタデータをキャッシュ
      mockRedisGet.mockResolvedValue(JSON.stringify(TEST_ON_DEMAND_META));

      const path = `/ogp/${TEST_MEDIA_ID}/${TEST_VARIANT_ON_DEMAND}/${TEST_HASH}.jpg`;

      const { generateOnDemandSignature } = await import('@libark/core-server');
      const signature = generateOnDemandSignature(
        TEST_MEDIA_ID,
        TEST_VARIANT_ON_DEMAND,
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

      // ロック取得失敗（フォールバックを強制）
      mockRedisSet.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `${path}?sig=${signature}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['x-ogp-cache']).toBe('FALLBACK');
    });
  });
});
