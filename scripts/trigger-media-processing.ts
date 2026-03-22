#!/usr/bin/env tsx

/**
 * 🔧 メディア処理ジョブ手動投入スクリプト
 *
 * PROCESSING状態のメディアに対して手動でワーカージョブを投入
 */

import { prisma } from '@libark/db';
import { getQueue, QueueName } from '@libark/queues';

async function triggerMediaProcessing() {
  try {
    console.log('🔍 PROCESSING状態のメディアレコードを検索中...');

    // PROCESSING状態のメディアレコードを取得
    const processingMedia = await prisma.media.findMany({
      where: {
        status: 'PROCESSING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // 最新10件まで
    });

    if (processingMedia.length === 0) {
      console.log('✅ 処理対象のメディアはありません');
      return;
    }

    console.log(`📋 ${processingMedia.length}件の処理中メディアが見つかりました`);

    const mediaProcessingQueue = getQueue(QueueName.MEDIA_PROCESSING);

    for (const media of processingMedia) {
      try {
        console.log(`🚀 メディア処理ジョブを投入: ${media.id}`);

        // メディア処理ジョブを投入
        await mediaProcessingQueue.add('process-media-manual', {
          mediaId: media.id,
          userId: media.userId,
          mediaType: media.type,
        });

        console.log(`✅ ジョブ投入完了: ${media.id} (${media.filename})`);
      } catch (error) {
        console.error(`❌ ジョブ投入失敗: ${media.id}`, error);
      }
    }

    console.log('🎉 全てのメディア処理ジョブの投入が完了しました');
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  triggerMediaProcessing();
}
