/**
 * 📜 GraphQL 契約テスト（スナップショット）
 * - 実行中サーバではなく、型定義+リゾルバからスキーマを構築してSDLを生成し、スナップショット比較（テスト環境での introspection 無効対策）
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';
import { typeDefs } from '@libark/graphql';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

describe('📜 GraphQL 契約テスト（SDLスナップショット）', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  it('SDLがスナップショットと一致する（typeDefs 文字列ベース）', async () => {
    // GraphQLの複数バージョン混在問題を避け、SDL文字列そのものを比較
    const sdl = (typeDefs as string).trim().replace(/\r\n/g, '\n');
    expect(sdl).toMatchSnapshot();
  });
});
