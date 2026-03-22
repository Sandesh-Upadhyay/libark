/**
 * 🧪 DB Package テストセットアップ
 * 統一テストシステム - DB Package専用設定
 */

import { vi } from 'vitest';

// 🎯 DB Package固有のモック設定
beforeAll(() => {
  // Prisma Clientのモック
  vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),

      // モデルのモック
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      post: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      comment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      media: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      notification: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    })),
  }));

  // PostgreSQL関連のモック
  vi.mock('pg', () => ({
    Client: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      end: vi.fn().mockResolvedValue(undefined),
      query: vi.fn(),
    })),
    Pool: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue({
        query: vi.fn(),
        release: vi.fn(),
      }),
      end: vi.fn().mockResolvedValue(undefined),
      query: vi.fn(),
    })),
  }));
});

// 🧹 各テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
});

// 🎯 DB Package固有の環境変数設定
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.POSTGRES_DB = 'test_db';
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';

console.log('🧪 DB Package テストセットアップ完了');
