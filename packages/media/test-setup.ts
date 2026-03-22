/**
 * 🧪 Media Package テストセットアップ
 * 統一テストシステム - Media Package専用設定
 */

import { vi, beforeAll, afterEach } from 'vitest';

// 🎯 Media Package固有のモック設定
beforeAll(() => {
  // S3関連のモック
  vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
    GetObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  }));

  // Sharp（画像処理）のモック
  vi.mock('sharp', () => ({
    default: vi.fn().mockImplementation(() => ({
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      png: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      metadata: vi.fn().mockResolvedValue({
        width: 800,
        height: 600,
        format: 'jpeg',
      }),
    })),
  }));

  // ファイルシステムのモック
  vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
  }));
});

// 🧹 各テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
});

// 🎯 Media Package固有の環境変数設定
process.env.S3_GATEWAY_URL = 'http://localhost:8080';
process.env.MEDIA_UPLOAD_MAX_SIZE = '52428800'; // 50MB
process.env.SUPPORTED_IMAGE_FORMATS = 'jpeg,jpg,png,webp,gif';
process.env.SUPPORTED_VIDEO_FORMATS = 'mp4,webm,mov';
process.env.MEDIA_CACHE_TTL = '3600'; // 1時間

console.log('🧪 Media Package テストセットアップ完了');
