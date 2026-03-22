/**
 * 🧪 Core Shared Package テストセットアップ
 * 統一テストシステム - Core Shared Package専用設定
 */

import { vi } from 'vitest';

// 🎯 Core Shared Package固有のモック設定
beforeAll(() => {
  // 暗号化関連のモック
  vi.mock('crypto', () => ({
    randomBytes: vi.fn().mockReturnValue(Buffer.from('mock-random-bytes')),
    createHash: vi.fn().mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('mock-hash'),
    })),
    createHmac: vi.fn().mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('mock-hmac'),
    })),
    createCipher: vi.fn(),
    createDecipher: vi.fn(),
  }));

  // JWT関連のモック
  vi.mock('jsonwebtoken', () => ({
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ userId: 'test-user-id' }),
    decode: vi.fn().mockReturnValue({ userId: 'test-user-id' }),
  }));

  // bcrypt関連のモック
  vi.mock('bcrypt', () => ({
    hash: vi.fn().mockResolvedValue('mock-hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
    genSalt: vi.fn().mockResolvedValue('mock-salt'),
  }));

  // UUID関連のモック
  vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('mock-uuid-v4'),
    v1: vi.fn().mockReturnValue('mock-uuid-v1'),
  }));

  // Date関連のモック（必要に応じて）
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

// 🧹 各テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
});

// 🧹 全テスト後のクリーンアップ
afterAll(() => {
  vi.useRealTimers();
});

// 🎯 Core Shared Package固有の環境変数設定
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';

console.log('🧪 Core Shared Package テストセットアップ完了');
