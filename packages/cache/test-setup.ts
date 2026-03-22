/**
 * 🧪 Cache Package テストセットアップ
 * 統一テストシステム - Cache Package専用設定
 */

import { vi } from 'vitest';

// 🎯 Cache Package固有のモック設定
beforeAll(() => {
  // Redis関連のモック
  vi.mock('redis', () => ({
    createClient: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      flushAll: vi.fn(),
      ping: vi.fn().mockResolvedValue('PONG'),
      isReady: true,
      on: vi.fn(),
      off: vi.fn(),
    })),
  }));

  // IORedis関連のモック
  vi.mock('ioredis', () => ({
    default: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      flushall: vi.fn(),
      ping: vi.fn().mockResolvedValue('PONG'),
      status: 'ready',
      on: vi.fn(),
      off: vi.fn(),
    })),
  }));
});

// 🧹 各テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
});

// 🎯 Cache Package固有の環境変数設定
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.CACHE_TTL = '3600'; // 1時間
process.env.CACHE_PREFIX = 'libark:test:';

console.log('🧪 Cache Package テストセットアップ完了');
