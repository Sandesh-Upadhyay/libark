/**
 * 🚀 LIBARK Fastify + Mercurius GraphQL Server
 *
 * 既存機能を維持しながらGraphQLに移行
 */

import Fastify from 'fastify';
import { config, validateEnvironment } from '@libark/core-shared';
import { prisma, type PrismaClient } from '@libark/db';
// 🚫 worker-utils関数は削除されました（プリサインドS3システムに移行済み）
// Fastifyプラグインの静的インポート
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import { getRedisClient } from '@libark/redis-client';

import { redisNotificationHandler } from './services/redis-notification-handler.js';
import { notificationService } from './services/notification-service.js';
// 🚫 initializeFileUpload は削除されました（プリサインドS3システムに移行済み）
import authPlugin from './plugins/auth.js';
import { initializeGraphQL } from './graphql/index.js';
import { nowpaymentsRoutes } from './routes/nowpayments.js';
import { nowpaymentsMockRoutes } from './routes/nowpayments-mock.js';
import { mediaRoutes } from './routes/media.js';
import { internalOgpRoutes } from './routes/internal-ogp.js';

// 環境変数を明示的に検証
console.log('🔧 Validating environment...');
const validatedConfig = validateEnvironment();
console.log('🔧 Validated config CORS_ORIGINS:', validatedConfig.CORS_ORIGINS);

// Fastifyの型拡張
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Fastifyインスタンスの作成
const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
    transport:
      config.nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
  // タイムアウト設定（メディアアップロード対応）
  connectionTimeout: 120000, // 2分
  keepAliveTimeout: 125000, // 2分5秒
  requestTimeout: 120000, // 2分
  bodyLimit: 52428800, // 50MB
});

// プラグインの登録
async function registerPlugins() {
  // CORS設定
  console.log('🔍 Environment CORS_ORIGINS:', process.env.CORS_ORIGINS);
  console.log('🔍 CORS Origins:', config.corsOrigins, typeof config.corsOrigins);
  console.log('🔍 Using validated config CORS_ORIGINS:', validatedConfig.CORS_ORIGINS);
  await fastify.register(fastifyCors, {
    origin: validatedConfig.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Cache-Control',
      'x-user-id', // NOWPayments用
      'Apollo-Require-Preflight', // apollo-upload-client用
      'X-Apollo-Operation-Name', // apollo-upload-client用
      'X-Apollo-Operation-Id', // apollo-upload-client用
    ],
  });

  // セキュリティヘッダー
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        scriptSrc:
          config.nodeEnv === 'development'
            ? ["'self'", "'unsafe-inline'", 'https://unpkg.com']
            : ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://unpkg.com'],
      },
    },
  });

  // Cookie処理
  await fastify.register(fastifyCookie);

  // 静的ファイル配信は削除（GraphQLで画像配信を行うため）

  // Prismaクライアントをデコレート
  fastify.decorate('prisma', prisma);

  // Redis接続の取得
  let redis;
  try {
    redis = getRedisClient();
    fastify.log.info('✅ Redis接続を取得しました');
  } catch (error) {
    fastify.log.warn({ error: error } as unknown, '⚠️ Redis接続の取得に失敗しました:');
    redis = null;
  }

  // 現代的認証システム（ベストプラクティス適用）
  await fastify.register(authPlugin, {
    prisma,
    redis,
  });

  // GraphQL設定（WebSocketサブスクリプション含む）
  await initializeGraphQL(fastify);

  // NOWPayments APIルート
  await fastify.register(nowpaymentsRoutes);
  // 開発・テストではモックAPIも併設（/mock/nowpayments/v1/*）
  const useMock =
    process.env.NOWPAYMENTS_USE_MOCK === 'true' || process.env.NODE_ENV !== 'production';
  if (useMock) {
    fastify.log.warn('⚠️ Using NOWPayments Mock Routes for development/testing');
    await fastify.register(nowpaymentsMockRoutes);
  }

  // セキュアメディア配信ルート
  await fastify.register(mediaRoutes);

  // 内部APIルート（OGP匿名配信用）
  await fastify.register(internalOgpRoutes);

  // 通知サービスにロガー注入
  notificationService.setLogger(fastify.log);

  // Redis通知ハンドラー初期化（ロガー注入）
  redisNotificationHandler.setLogger(fastify.log);
  await redisNotificationHandler.initialize();

  // 🚫 メディアジョブエンキューア初期化は削除されました（プリサインドS3システムに移行済み）
  // 🚫 ファイルアップロードプラグインは削除されました（プリサインドS3システムに移行済み）
  fastify.log.info('🎯 Backend initialization completed (worker-based processing removed)');
}

// ヘルスチェックエンドポイント
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'LIBARK Fastify GraphQL',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };
});

// サーバー起動
async function start() {
  try {
    // S3設定の確認（一時的に無効化）
    fastify.log.info('⚠️ S3設定の確認をスキップしました（環境変数問題のため）');

    await registerPlugins();

    const port = config.port || 8000;
    await fastify.listen({ port, host: '0.0.0.0' });

    fastify.log.info(`🚀 Fastify GraphQL Server running on port ${port}`);
    fastify.log.info(`📊 GraphQL Playground: http://localhost:${port}/graphiql`);
    fastify.log.info(`🔌 GraphQL Subscriptions: ws://localhost:${port}/graphql`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// グレースフルシャットダウン
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`\n${signal} received, shutting down gracefully...`);
  try {
    await fastify.close();
    fastify.log.info('✅ Server closed successfully');
    process.exit(0);
  } catch (err) {
    fastify.log.error({ err } as unknown, '❌ Error during shutdown:');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// サーバー起動
start();
