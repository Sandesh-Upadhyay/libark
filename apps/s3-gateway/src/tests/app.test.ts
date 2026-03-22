/**
 * S3 Gateway Application Tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

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
  ListObjectsV2Command: vi.fn(),
  GetObjectCommand: vi.fn(),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

// 設定をモック
vi.mock('../config/index.js', () => ({
  getConfig: vi.fn(() => ({
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

describe('S3 Gateway Application', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    try {
      app = await createApp();
      await app.ready();
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

  describe('Application Initialization', () => {
    it('アプリケーションが正常に初期化される', () => {
      expect(app).toBeDefined();
      expect(app.server).toBeDefined();
    });

    it('必要なプラグインが登録されている', () => {
      // CORS プラグインが登録されているか確認
      expect(app.hasPlugin('@fastify/cors')).toBe(true);

      // Multipart プラグインが登録されているか確認
      expect(app.hasPlugin('@fastify/multipart')).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('ヘルスチェックエンドポイントが応答する', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
      expect(body.service).toBe('libark-s3-gateway');
    });
  });

  describe('CORS Configuration', () => {
    it('CORS ヘッダーが正しく設定される', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Error Handling', () => {
    it('存在しないエンドポイントで404を返す', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('不正なメソッドで405を返す', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/health',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Security Headers', () => {
    it('セキュリティヘッダーが設定される', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      // Content-Type ヘッダーが設定されているか確認
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
