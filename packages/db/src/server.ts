/**
 * 🏆 @libark/db/server - サーバー専用エクスポート
 *
 * ✅ Prismaクライアントインスタンス
 * ✅ サーバーサイドでのみ使用可能
 * ✅ データベース接続とクエリ実行
 * ✅ Prisma 7 対応（pg ドライバーアダプター使用）
 */

import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { envUtils } from '@libark/core-shared';

type PrismaClientFactoryOptions = {
  databaseUrl?: string;
  pool?: pg.Pool;
  poolConfig?: pg.PoolConfig;
  log?: Prisma.LogLevel[];
};

const defaultLog: Prisma.LogLevel[] = envUtils.isDevelopment() ? ['error', 'warn'] : ['error'];

// PrismaClient生成関数（Prisma 7 adapter-pg 統一）
export const createPrismaClient = (options: PrismaClientFactoryOptions = {}) => {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;

  if (!databaseUrl && !options.pool) {
    throw new Error('DATABASE_URL environment variable is required for Prisma 7');
  }

  // pg プール を作成
  const pool =
    options.pool ??
    new pg.Pool({
      connectionString: databaseUrl,
      ...(options.poolConfig ?? {}),
    });

  // Prisma アダプターを作成
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: options.log ?? defaultLog,
  });
};

// PrismaClientのシングルトンインスタンスを作成
const prismaClientSingleton = () => createPrismaClient();

// グローバルスコープでのPrismaClientの型定義
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// グローバル変数の宣言
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// シングルトンパターンでPrismaClientを提供
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// 開発環境以外ではグローバル変数にPrismaClientを保存
if (!envUtils.isProduction()) {
  globalForPrisma.prisma = prisma;
}

// Prisma型定義をエクスポート
export type * from '@prisma/client';

// 型定義の再エクスポート（明示的）
export type {
  User,
  Post,
  Media,
  Comment,
  Like,
  Conversation,
  Message,
  Notification,
  UserSettings,
  PostVisibility,
  MediaStatus,
  MediaType,
  VariantType,
  MediaVariant,
  PostPurchase,
  NotificationType,
  OgpPublicMedia,
  Prisma,
  Prisma as PrismaNamespace,
  PrismaClient,
} from '@prisma/client';

// メディアスキーマのエクスポート
export * from './schemas/media.js';
