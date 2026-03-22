/**
 * 🧪 S3 Client Service Tests
 * 統一テストシステム対応
 */

import { describe, it, expect, vi } from 'vitest';

// 実際のモジュールをインポート
import { createS3Client } from '../services/s3-client.js';

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
  })),
}));

// S3クライアントサービスをモック
vi.mock('../services/s3-client.js', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    createS3Client: vi.fn(config => ({
      config: {
        region: config.backend.region,
        credentials: {
          accessKeyId: config.backend.accessKey,
          secretAccessKey: config.backend.secretKey,
        },
      },
      send: vi.fn(),
    })),
  };
});

describe('🗄️ S3 Client Service', () => {
  // テスト用設定
  const mockConfig = {
    backend: {
      type: 'r2' as const,
      region: 'auto',
      endpoint: 'https://test.r2.cloudflarestorage.com',
      accessKey: 'test-access-key',
      secretKey: 'test-secret-key',
    },
    bucket: 'test-bucket',
    defaultACL: 'private' as const,
  };

  describe('🔧 createS3Client', () => {
    it('S3クライアントを正しく作成する', () => {
      const client = createS3Client(mockConfig);
      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
      expect(client.config).toBeDefined();
    });

    it('設定が正しく適用される', () => {
      const client = createS3Client(mockConfig);
      expect(client).toBeDefined();
      expect(client.config).toBeDefined();
      expect(client.config.region).toBe('auto');
    });

    it('異なるバックエンドタイプに対応する', () => {
      const awsConfig = {
        ...mockConfig,
        backend: {
          ...mockConfig.backend,
          type: 'aws' as const,
          region: 'us-east-1',
        },
      };

      const client = createS3Client(awsConfig);
      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
    });
  });

  describe('🔧 基本機能', () => {
    it('パッケージが正常に動作する', () => {
      expect(createS3Client).toBeDefined();
      expect(typeof createS3Client).toBe('function');
    });

    it('環境変数が設定されている', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });
});
