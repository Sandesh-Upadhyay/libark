/**
 * PUT /upload/:uploadId エンドポイント集成テスト
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import {
  UploadSessionManager,
  UploadTokenService,
  UploadSessionStatus,
} from '@libark/upload-session';
import { Redis } from 'ioredis';

import { createApp } from '../app.js';

// AWS SDKをモック
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    config: {
      region: 'auto',
      credentials: {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      },
    },
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  ListObjectsV2Command: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

// @aws-sdk/lib-storageをモック
// @aws-sdk/lib-storageをモック
vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn().mockImplementation((args) => ({
    done: vi.fn().mockImplementation(async () => {
      // ストリームを消費してsizeCheckStreamをトリガーする
      if (args.params && args.params.Body && typeof args.params.Body.on === 'function') {
        const stream = args.params.Body;
        await new Promise((resolve, reject) => {
          stream.on('data', () => {}); // データを流す
          stream.on('end', resolve);
          stream.on('error', reject);
          stream.resume();
        });
      }
      return {
        ETag: '"test-etag"',
        Location: 'https://test-bucket.s3.amazonaws.com/test-key',
      };
    }),
  })),
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
      presigned: {
        expiresIn: 3600,
      },
    },
    encryption: {
      enabled: false,
      algorithm: 'AES256',
      key: 'test-key',
    },
    jwt: {
      secret: 'test-jwt-secret',
    },
    logging: {
      level: 'info',
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

// S3クライアントサービスをモック
vi.mock('../services/s3-client.js', () => ({
  getS3ClientService: vi.fn(() => ({
    getClient: vi.fn(() => ({
      send: vi.fn(),
    })),
    getConfig: vi.fn(() => ({
      backend: {
        type: 'r2',
        region: 'auto',
        endpoint: 'https://test.r2.cloudflarestorage.com',
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
        bucket: 'test-bucket',
      },
    })),
  })),
}));

// Redisクライアントをモック
const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  ttl: vi.fn(),
  expire: vi.fn(),
};

// モックの実装を追加
const setupMockRedis = (initialSessionData: any) => {
  // 内部状態を保持するように変更
  let currentSessionData = { ...initialSessionData };

  mockRedis.get.mockImplementation(key => {
    if (key === 'upload:session:' + initialSessionData.uploadId) {
      return Promise.resolve(JSON.stringify(currentSessionData));
    }
    return Promise.resolve(null);
  });

  // setexで状態を更新するように変更
  mockRedis.setex.mockImplementation((key, ttl, value) => {
    if (key === 'upload:session:' + initialSessionData.uploadId) {
      currentSessionData = JSON.parse(value as string);
    }
    return Promise.resolve('OK');
  });

  // ttlが常に600を返すように設定
  mockRedis.ttl.mockImplementation(() => Promise.resolve(600));
};

vi.mock('@libark/redis-client', () => ({
  getRedisClient: vi.fn(() => mockRedis as unknown as Redis),
}));

// テスト用環境変数を設定
vi.stubEnv('S3_ACCESS_KEY', 'test-access-key');
vi.stubEnv('S3_SECRET_KEY', 'test-secret-key');
vi.stubEnv('S3_BACKEND_ACCESS_KEY', 'test-backend-access-key');
vi.stubEnv('S3_BACKEND_SECRET_KEY', 'test-backend-secret-key');
vi.stubEnv('S3_BUCKET', 'test-bucket');
vi.stubEnv('S3_BACKEND_TYPE', 'r2');
vi.stubEnv('S3_BACKEND_REGION', 'auto');
vi.stubEnv('S3_BACKEND_ENDPOINT', 'https://test.r2.cloudflarestorage.com');
vi.stubEnv('S3_GATEWAY_ENCRYPTION_ENABLED', 'false');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret');

describe('PUT /upload/:uploadId', () => {
  let app: FastifyInstance;
  let tokenService: UploadTokenService;
  let sessionManager: UploadSessionManager;

  const testUploadId = 'test-upload-id-123';
  const testUserId = 'test-user-id-456';
  const testContentType = 'image/jpeg';
  const testFilename = 'test-image.jpg';
  const testS3Key = 'uploads/test-user-id-456/test-upload-id-123/test-image.jpg';
  const testMaxBytes = 10 * 1024 * 1024; // 10MB

  beforeAll(async () => {
    try {
      app = await createApp();
      await app.ready();

      // テスト用のトークンサービスとセッションマネージャーを初期化
      tokenService = new UploadTokenService('test-jwt-secret');
      sessionManager = new UploadSessionManager(mockRedis as unknown as Redis);
    } catch (error) {
      console.error('Failed to create app:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('認証チェック', () => {
    it('認証ヘッダーがない場合401を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('AUTHORIZATION_REQUIRED');
    });

    it('無効なトークンの場合401を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: 'Bearer invalid-token',
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('TOKEN_INVALID');
    });

    it('uploadIdが一致しない場合403を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      // テスト用のセッションを作成
      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      // 異なるuploadIdでトークンを生成
      const token = tokenService.generateToken('different-upload-id', testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('UPLOAD_ID_MISMATCH');
    });
  });

  describe('セッションチェック', () => {
    it('セッションが存在しない場合404を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();
      mockRedis.get.mockResolvedValueOnce(null);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('セッションの所有者でない場合403を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: 'different-user-id',
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('SESSION_OWNER_MISMATCH');
    });

    it('TTL切れの場合404を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      // Redisセッションを削除（TTL切れをシミュレート）
      mockRedis.get.mockResolvedValueOnce(null);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('状態遷移チェック', () => {
    it('CREATED状態で正常にアップロードできる', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const testBuffer = Buffer.from('test file content');
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });

    it('UPLOADING状態で409エラー（ロック期限内）', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.UPLOADING,
        lockUntil: new Date(Date.now() + 120000), // 2分後
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_STATE');
    });

    it('ロック期限切れで再PUT許可', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.UPLOADING,
        lockUntil: new Date(Date.now() - 60000), // 1分前
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const testBuffer = Buffer.from('test file content');
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });

    it('UPLOADED状態で409エラー', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.UPLOADED,
        receivedBytes: 1024,
        etag: 'test-etag',
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_STATE');
    });

    it('COMPLETED状態で409エラー', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.COMPLETED,
        receivedBytes: 1024,
        etag: 'test-etag',
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_STATE');
    });
  });

  describe('Content-Type検証', () => {
    it('Content-Typeヘッダーがない場合415を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(415);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('CONTENT_TYPE_REQUIRED');
    });

    it('Content-Typeが一致しない場合415を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'image/png',
        },
      });

      expect(response.statusCode).toBe(415);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('CONTENT_TYPE_MISMATCH');
    });
  });

  describe('Strict Size Check', () => {
    it('maxBytes超過で413エラー', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: 1024, // 1KB
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      // 2048バイトのファイル（maxBytes超過）
      const testBuffer = Buffer.alloc(2048, 'a');
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(413);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('正常なサイズで正常にアップロード', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: 1024, // 1KB
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      // 512バイトのファイル（maxBytes以下）
      const testBuffer = Buffer.alloc(512, 'a');
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });
  });

  describe('正常系', () => {
    it('正常にアップロードが成功し204を返す', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const testBuffer = Buffer.from('test file content');
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });

    it('RedisセッションがUPLOADEDに更新される', async () => {
      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const testBuffer = Buffer.from('test file content');
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');

      // Redis.setexが2回呼ばれていることを確認（UPLOADINGとUPLOADED）
      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
    });

    it('receivedBytesとetagが正しく記録される', async () => {
      // モックをリセット
      mockRedis.get.mockReset();
      mockRedis.setex.mockReset();
      mockRedis.ttl.mockReset();

      const sessionData = {
        uploadId: testUploadId,
        userId: testUserId,
        kind: 'POST',
        filename: testFilename,
        contentType: testContentType,
        declaredBytes: 1024,
        maxBytes: testMaxBytes,
        s3Key: testS3Key,
        status: UploadSessionStatus.CREATED,
        createdAt: new Date(),
      };
      setupMockRedis(sessionData);
      // setupMockRedisで設定済みのため、追加のモック設定は不要

      const token = tokenService.generateToken(testUploadId, testUserId, testContentType);

      const testContent = 'test file content';
      const testBuffer = Buffer.from(testContent);
      const response = await app.inject({
        method: 'PUT',
        url: `/upload/${testUploadId}`,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': testContentType,
        },
        payload: testBuffer,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');

      // UPLOADED状態への更新を確認
      const uploadedSessionCall = mockRedis.setex.mock.calls[1];
      const uploadedSessionData = JSON.parse(uploadedSessionCall[2]);
      expect(uploadedSessionData.status).toBe('UPLOADED');
      expect(uploadedSessionData.receivedBytes).toBe(testBuffer.length);
      expect(uploadedSessionData.etag).toBe('"test-etag"');
    });
  });
});
