/**
 * 🔄 OGP匿名配信メディアバックフィルスクリプト（雛形）
 *
 * 機能:
 * - 既存のMediaVariant(type=OGP)からOgpPublicMediaへの移行
 * - 匿名配信用キーとソルトの生成
 * - コンテンツハッシュの計算
 * - 安全な段階的移行
 *
 * 使用方法:
 *   docker-compose exec dev pnpm ts-node packages/db/scripts/backfill-ogp-public-media.ts
 *   docker-compose exec dev pnpm ts-node packages/db/scripts/backfill-ogp-public-media.ts --dry-run
 *   docker-compose exec dev pnpm ts-node packages/db/scripts/backfill-ogp-public-media.ts --batch-size=50
 */

import { createHash, randomBytes } from 'crypto';

import { logger } from '@libark/core-shared';

import { createPrismaClient } from '@libark/db/server';

const prisma = createPrismaClient();

interface BackfillStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
}

interface BackfillOptions {
  batchSize: number;
  dryRun: boolean;
  continueOnError: boolean;
  bucket: string;
  backendId: string;
}

/**
 * 🚀 メインバックフィル処理
 */
export async function backfillOgpPublicMedia(
  options: BackfillOptions = {
    batchSize: 100,
    dryRun: false,
    continueOnError: true,
    bucket: 'lbrk1-dev',
    backendId: 'default',
  }
): Promise<BackfillStats> {
  const stats: BackfillStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  try {
    logger.info('🚀 OGP匿名配信メディアバックフィル開始', { options });

    // 移行ログ開始
    const migrationLog = await prisma.migrationLog.create({
      data: {
        operation: 'BACKFILL_OGP_PUBLIC_MEDIA',
        tableName: 'ogp_public_media',
        status: 'RUNNING',
      },
    });

    // 1. 既存データ統計取得
    await logBackfillStats();

    // 2. OGPバリアントデータのバックフィル
    await backfillOgpVariants(stats, options);

    // 3. バックフィル完了処理
    stats.endTime = new Date();

    await prisma.migrationLog.update({
      where: { id: migrationLog.id },
      data: {
        recordsProcessed: stats.total,
        recordsSuccess: stats.success,
        recordsFailed: stats.failed,
        completedAt: stats.endTime,
        status: 'COMPLETED',
      },
    });

    logger.info('✅ OGP匿名配信メディアバックフィル完了', { stats });
    return stats;
  } catch (error) {
    logger.error('❌ OGPバックフィルエラー:', error);
    stats.endTime = new Date();
    throw error;
  }
}

/**
 * 📊 バックフィル前統計ログ
 */
async function logBackfillStats(): Promise<void> {
  const ogpVariantCount = await prisma.mediaVariant.count({
    where: { type: 'OGP' },
  });

  const ogpPublicMediaCount = await prisma.ogpPublicMedia.count();

  logger.info('📊 バックフィル前統計', {
    ogpVariantCount,
    ogpPublicMediaCount,
    targetCount: ogpVariantCount - ogpPublicMediaCount,
  });
}

/**
 * 🎯 OGPバリアントデータのバックフィル
 */
async function backfillOgpVariants(stats: BackfillStats, options: BackfillOptions): Promise<void> {
  logger.info('🎯 OGPバリアントデータバックフィル開始');

  // OGPバリアントのみ取得（まだOgpPublicMediaに移行されていないもの）
  const ogpVariants = await prisma.mediaVariant.findMany({
    where: {
      type: 'OGP',
    },
    include: {
      media: {
        select: {
          id: true,
          s3Key: true,
          mimeType: true,
          fileSize: true,
        },
      },
    },
  });

  stats.total = ogpVariants.length;

  logger.info(`📊 処理対象OGPバリアント数: ${stats.total}`);

  for (let i = 0; i < ogpVariants.length; i++) {
    const variant = ogpVariants[i];
    const batchIndex = Math.floor(i / options.batchSize) + 1;
    const batchTotal = Math.ceil(stats.total / options.batchSize);

    try {
      // 既存のOgpPublicMediaをチェック
      const existing = await prisma.ogpPublicMedia.findUnique({
        where: {
          mediaId_variant: {
            mediaId: variant.mediaId,
            variant: 'OGP',
          },
        },
      });

      if (existing) {
        stats.skipped++;
        logger.debug(`⏭️ スキップ: Media ${variant.mediaId} (既に存在)`);
        continue;
      }

      // 単一バリアントのバックフィル
      await backfillSingleOgpVariant(variant, options);
      stats.success++;

      // 進捗ログ
      if (i % options.batchSize === 0 || i === stats.total - 1) {
        logger.info(
          `📈 バックフィル進捗: ${i + 1}/${stats.total} ` +
            `(バッチ ${batchIndex}/${batchTotal}, 成功: ${stats.success}, スキップ: ${stats.skipped}, 失敗: ${stats.failed})`
        );
      }
    } catch (error) {
      stats.failed++;
      logger.error(`❌ OGPバリアントバックフィルエラー: ${variant.id}`, error);

      if (!options.continueOnError) {
        throw error;
      }
    }
  }
}

/**
 * 🎨 単一OGPバリアントのバックフィル
 */
async function backfillSingleOgpVariant(
  variant: {
    id: string;
    mediaId: string;
    s3Key: string;
    width: number;
    height: number;
    fileSize: number;
    createdAt: Date;
    media: {
      id: string;
      s3Key: string;
      mimeType: string;
      fileSize: number;
    };
  },
  options: BackfillOptions
): Promise<void> {
  // 拡張子の抽出
  const ext = extractExtension(variant.media.mimeType);

  // 匿名配信用キーの生成
  const ogpKey = generateOgpKey(variant.mediaId, 'OGP');

  // ソルトの生成
  const salt = generateSalt();

  // コンテンツハッシュの生成（s3Key + fileSize + salt）
  const contentHash = generateContentHash(variant.media.s3Key, variant.media.fileSize, salt);

  const ogpPublicMediaData = {
    mediaId: variant.mediaId,
    bucket: options.bucket,
    backendId: options.backendId,
    ogpKey,
    contentHash,
    contentType: variant.media.mimeType,
    ext,
    variant: 'OGP',
    salt,
    createdAt: variant.createdAt,
    updatedAt: new Date(),
  };

  if (!options.dryRun) {
    await prisma.ogpPublicMedia.create({
      data: ogpPublicMediaData,
    });
  } else {
    logger.debug('🔍 ドライラン: 作成されるデータ', ogpPublicMediaData);
  }
}

/**
 * 🔄 ヘルパー関数
 */

/**
 * MIMEタイプから拡張子を抽出
 */
function extractExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };

  return mimeToExt[mimeType] || 'webp';
}

/**
 * 匿名配信用OGPキーを生成
 * 形式: ogp/{hash}.webp
 */
function generateOgpKey(mediaId: string, variant: string): string {
  const hash = createHash('sha256')
    .update(`${mediaId}-${variant}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);

  return `ogp/${hash}.webp`;
}

/**
 * ソルトを生成（64文字のhex文字列）
 */
function generateSalt(): string {
  return randomBytes(32).toString('hex');
}

/**
 * コンテンツハッシュを生成（s3Key + fileSize + salt）
 */
function generateContentHash(s3Key: string, fileSize: number, salt: string): string {
  return createHash('sha256').update(`${s3Key}-${fileSize}-${salt}`).digest('hex');
}

/**
 * 🎯 CLI実行用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSize = parseInt(
    args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100'
  );
  const bucket = args.find(arg => arg.startsWith('--bucket='))?.split('=')[1] || 'lbrk1-dev';
  const backendId = args.find(arg => arg.startsWith('--backend-id='))?.split('=')[1] || 'default';

  backfillOgpPublicMedia({
    batchSize,
    dryRun,
    continueOnError: true,
    bucket,
    backendId,
  })
    .then(stats => {
      console.log('✅ バックフィル完了:', stats);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ バックフィル失敗:', error);
      process.exit(1);
    });
}
