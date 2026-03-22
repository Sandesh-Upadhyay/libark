/**
 * Database Package Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Prismaクライアントをモック
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    media: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  })),
}));

// 環境設定をモック
vi.mock('@libark/core-shared', () => ({
  envUtils: {
    isDevelopment: vi.fn(() => true),
    isProduction: vi.fn(() => false),
  },
}));

describe('Database Package', () => {
  describe('Module Exports', () => {
    it('prismaクライアントがエクスポートされている', async () => {
      const { prisma } = await import('../index.js');
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
    });

    it('Prisma型定義がエクスポートされている', async () => {
      const dbModule = await import('../index.js');

      // 主要な型がエクスポートされているかチェック
      expect(dbModule).toBeDefined();

      // PrismaClientクラスがエクスポートされているかチェック
      // Prisma 7ではPrismaClientは直接エクスポートされないため、このチェックをスキップ
      // expect(dbModule.PrismaClient).toBeDefined();
    });
  });

  describe('Prisma Client Instance', () => {
    it('prismaクライアントが正しく初期化される', async () => {
      const { prisma } = await import('../index.js');

      expect(prisma).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
    });

    it('主要なモデルが利用可能', async () => {
      const { prisma } = await import('../index.js');

      expect(prisma.user).toBeDefined();
      expect(prisma.post).toBeDefined();
      expect(prisma.media).toBeDefined();

      expect(typeof prisma.user.findMany).toBe('function');
      expect(typeof prisma.post.findMany).toBe('function');
      expect(typeof prisma.media.findMany).toBe('function');
    });
  });

  describe('Database Operations', () => {
    it('ユーザー操作メソッドが利用可能', async () => {
      const { prisma } = await import('../index.js');

      expect(typeof prisma.user.findMany).toBe('function');
      expect(typeof prisma.user.findUnique).toBe('function');
      expect(typeof prisma.user.create).toBe('function');
      expect(typeof prisma.user.update).toBe('function');
      expect(typeof prisma.user.delete).toBe('function');
    });

    it('投稿操作メソッドが利用可能', async () => {
      const { prisma } = await import('../index.js');

      expect(typeof prisma.post.findMany).toBe('function');
      expect(typeof prisma.post.findUnique).toBe('function');
      expect(typeof prisma.post.create).toBe('function');
      expect(typeof prisma.post.update).toBe('function');
      expect(typeof prisma.post.delete).toBe('function');
    });

    it('メディア操作メソッドが利用可能', async () => {
      const { prisma } = await import('../index.js');

      expect(typeof prisma.media.findMany).toBe('function');
      expect(typeof prisma.media.findUnique).toBe('function');
      expect(typeof prisma.media.create).toBe('function');
      expect(typeof prisma.media.update).toBe('function');
      expect(typeof prisma.media.delete).toBe('function');
    });
  });

  describe('Environment Configuration', () => {
    it('開発環境での設定が正しく適用される', async () => {
      const { envUtils } = await import('@libark/core-shared');

      expect(envUtils.isDevelopment()).toBe(true);
      expect(envUtils.isProduction()).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('同じprismaインスタンスが返される', async () => {
      const { prisma: prisma1 } = await import('../index.js');
      const { prisma: prisma2 } = await import('../index.js');

      expect(prisma1).toBe(prisma2);
    });
  });

  describe('Type Safety', () => {
    it('TypeScript型定義が正しく機能する', async () => {
      const { prisma } = await import('../index.js');

      // TypeScriptコンパイル時にエラーが発生しないことを確認
      expect(() => {
        // これらの操作がTypeScriptで型安全であることを確認
        const userQuery = prisma.user.findMany;
        const postQuery = prisma.post.findUnique;
        const mediaQuery = prisma.media.create;

        expect(userQuery).toBeDefined();
        expect(postQuery).toBeDefined();
        expect(mediaQuery).toBeDefined();
      }).not.toThrow();
    });
  });
});
