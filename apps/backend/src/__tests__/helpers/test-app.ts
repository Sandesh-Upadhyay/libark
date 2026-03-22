/**
 * 🧪 テスト用Fastifyアプリケーション作成ヘルパー
 */

import Fastify, { FastifyInstance } from 'fastify';
import { prisma as prismaClient } from '@libark/db/server';
import type { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import cookie from '@fastify/cookie';

import authPlugin from '../../plugins/auth.js';
import { initializeGraphQL } from '../../graphql/index.js';
import { internalOgpRoutes } from '../../routes/internal-ogp.js';

/**
 * テスト用Fastifyアプリケーション作成
 */
export interface CreateTestAppOptions {
  initializeGraphQL?: boolean;
}
export async function createTestApp(
  options: CreateTestAppOptions = {}
): Promise<FastifyInstance & { prisma: PrismaClient; redis: Redis }> {
  const app = Fastify({
    logger: false as const, // テスト時はログを無効化
  });

  // Prismaクライアント初期化
  const prisma = prismaClient;

  // Prisma クライアントを強制的に再初期化（OgpPublicMediaモデルを認識させるため）
  await prisma.$connect();

  // デバッグ: ogpPublicMedia が存在するか確認
  console.log(
    '🔍 [TestApp] Prisma Client models:',
    Object.keys(prisma).filter(
      k => !k.startsWith('$') && typeof prisma[k as keyof typeof prisma] === 'object'
    )
  );
  console.log('🔍 [TestApp] has ogpPublicMedia:', !!prisma.ogpPublicMedia);
  console.log('🔍 [TestApp] Prisma Client version:', (prisma as { _clientVersion?: string })._clientVersion);
  try {
    const prismaPath = await import.meta.resolve!('@prisma/client');
    console.log('🔍 [TestApp] @prisma/client resolved path:', prismaPath);
  } catch {
    console.log('🔍 [TestApp] could not resolve @prisma/client path');
  }
  console.log('🔍 [TestApp] Prisma Client engine:', (prisma as { _engine?: unknown })._engine);
  console.log(
    '🔍 [TestApp] Prisma Client datamodel:',
    Object.keys((prisma as { _dataModel?: Record<string, unknown> })._dataModel || {})
  );

  // Redis初期化（テスト用）
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: 1, // テスト用DB
    lazyConnect: true,
  });

  // Cookieプラグイン登録
  await app.register(cookie);

  // 認証プラグイン登録
  await app.register(authPlugin, {
    prisma,
    redis,
  });

  // PrismaとRedisをアプリケーションに追加
  app.decorate('prisma', prisma);
  app.decorate('redis', redis);

  // Redis接続
  await redis.connect();

  // GraphQL設定（オプション）
  if (options.initializeGraphQL !== false) {
    try {
      await initializeGraphQL(app);
    } catch (error) {
      console.warn('⚠️ [TestApp] GraphQL初期化エラー:', error);
      // GraphQL初期化エラーでもテストは継続
    }
  }

  // 内部APIルート登録
  await internalOgpRoutes(app);

  (app as unknown as FastifyInstance & { redis: Redis }).redis = redis;
  return app as unknown as FastifyInstance & { prisma: PrismaClient; redis: Redis };
}

/**
 * テストアプリケーションクリーンアップ
 */
export async function cleanupTestApp(
  app: (FastifyInstance & { prisma?: PrismaClient; redis?: Redis }) | undefined
) {
  if (!app) return;

  try {
    if (app.redis && typeof app.redis.disconnect === 'function') {
      try {
        await app.redis.disconnect();
      } catch (error) {
        console.warn('Redis disconnect error:', error);
      }
    }

    // 追加: @libark/redis-client の全Redis接続をクローズ（PubSub含む）
    try {
      const mod = (await import('@libark/redis-client')) as {
        RedisConnectionManager?: { getInstance(): { closeAllConnections(): Promise<void> } };
      };
      if (mod?.RedisConnectionManager?.getInstance) {
        await mod.RedisConnectionManager.getInstance().closeAllConnections();
      }
    } catch (error) {
      console.warn('RedisConnectionManager closeAllConnections error:', error);
    }

    if (app.prisma && typeof app.prisma.$disconnect === 'function') {
      try {
        await app.prisma.$disconnect();
      } catch (error) {
        console.warn('Prisma disconnect error:', error);
      }
    }

    if (typeof app.close === 'function') {
      try {
        await app.close();
      } catch (error) {
        console.warn('App close error:', error);
      }
    }
  } catch (error) {
    console.warn('Global cleanupTestApp error:', error);
  }
}
