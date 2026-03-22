/**
 * データベース操作ユーティリティ
 * シードスクリプトで使用する共通のデータベース操作を提供
 */

import { PrismaClient } from '@prisma/client';

import type { SeedResult, SeederConfig } from './types';

/**
 * データベースをクリアする関数
 */
export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  console.log('⚠️  データベースをクリアしています...');

  try {
    // 外部キー制約のあるテーブルから順番に削除
    console.log('通知を削除中...');
    await prisma.notification.deleteMany({});

    console.log('会話参加者を削除中...');
    await prisma.conversationParticipant.deleteMany({});

    console.log('会話を削除中...');
    await prisma.conversation.deleteMany({});

    console.log('メッセージを削除中...');
    await prisma.message.deleteMany({});

    console.log('いいねを削除中...');
    await prisma.like.deleteMany({});

    console.log('コメントを削除中...');
    await prisma.comment.deleteMany({});

    console.log('投稿を削除中...');
    await prisma.post.deleteMany({});

    console.log('メディアバリアントを削除中...');
    await prisma.mediaVariant.deleteMany({});

    console.log('メディアを削除中...');
    await prisma.media.deleteMany({});

    console.log('ウォレット取引履歴を削除中...');
    await prisma.walletTransaction.deleteMany({});

    console.log('外部取引データを削除中...');
    await prisma.externalTransaction.deleteMany({});

    console.log('決済リクエストを削除中...');
    await prisma.paymentRequest.deleteMany({});

    console.log('出金申請を削除中...');
    await prisma.withdrawalRequest.deleteMany({});

    console.log('入金申請を削除中...');
    await prisma.depositRequest.deleteMany({});

    console.log('ユーザーウォレットを削除中...');
    await prisma.userWallet.deleteMany({});

    console.log('ウォレットを削除中...');
    await prisma.wallet.deleteMany({});

    console.log('ユーザー権限オーバーライドを削除中...');
    await prisma.userPermissionOverride.deleteMany({});

    console.log('権限を削除中...');
    await prisma.permission.deleteMany({});

    console.log('為替レートを削除中...');
    await prisma.exchangeRate.deleteMany({});

    console.log('決済プロバイダーを削除中...');
    await prisma.paymentProvider.deleteMany({});

    console.log('サイト機能設定を削除中...');
    await prisma.siteFeatureSetting.deleteMany({});

    console.log('ユーザーを削除中...');
    await prisma.user.deleteMany({});

    console.log('ロールを削除中...');
    await prisma.role.deleteMany({});

    console.log('✅ データベースのクリアが完了しました');
  } catch (error) {
    console.error('❌ データベースのクリア中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * バッチ処理でデータを作成する
 */
export async function createInBatches<T, R>(
  items: T[],
  createFn: (item: T) => Promise<R>,
  batchSize: number = 10,
  logProgress: boolean = true
): Promise<R[]> {
  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    if (logProgress) {
      console.log(`バッチ ${batchNumber}/${totalBatches} を処理中... (${batch.length}件)`);
    }

    const batchResults = await Promise.all(batch.map(item => createFn(item)));

    results.push(...batchResults);

    if (logProgress && batchNumber % 5 === 0) {
      console.log(`${results.length}/${items.length} 件完了`);
    }
  }

  return results;
}

/**
 * エラーハンドリング付きでシード処理を実行
 */
export async function executeSeed<T>(
  name: string,
  seedFn: () => Promise<T[]>,
  config: SeederConfig = {}
): Promise<SeedResult<T>> {
  const startTime = Date.now();

  try {
    console.log(`🌱 ${name}のシードを開始...`);

    const data = await seedFn();
    const duration = Date.now() - startTime;

    console.log(`✅ ${name}のシード完了: ${data.length}件 (${duration}ms)`);

    return {
      success: true,
      data,
      count: data.length,
      message: `${name}のシードが正常に完了しました`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';

    console.error(`❌ ${name}のシードでエラー: ${errorMessage} (${duration}ms)`);

    return {
      success: false,
      error: error instanceof Error ? error : new Error(errorMessage),
      message: `${name}のシードでエラーが発生しました: ${errorMessage}`,
    };
  }
}

/**
 * 既存データの存在確認
 */
export async function checkExistingData(
  prisma: PrismaClient,
  tableName: string,
  condition: Record<string, unknown>
): Promise<boolean> {
  try {
    const table = (prisma as unknown)[tableName];
    if (!table) {
      throw new Error(`テーブル ${tableName} が見つかりません`);
    }

    const existing = await table.findFirst({
      where: condition,
    });

    return !!existing;
  } catch (error) {
    console.warn(`既存データの確認でエラー: ${error}`);
    return false;
  }
}

/**
 * プログレスログ出力
 */
export function logProgress(current: number, total: number, itemName: string): void {
  if (current % Math.max(1, Math.floor(total / 10)) === 0 || current === total) {
    const percentage = Math.round((current / total) * 100);
    console.log(`${current}/${total} ${itemName}を作成しました (${percentage}%)`);
  }
}

/**
 * シード実行結果のサマリーを出力
 */
export function logSeedSummary(results: SeedResult[]): void {
  console.log('\n=== シード実行結果サマリー ===');

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalItems = 0;

  results.forEach(result => {
    if (result.success) {
      totalSuccess++;
      totalItems += result.count || 0;
      console.log(`✅ ${result.message} (${result.count}件)`);
    } else {
      totalFailed++;
      console.log(`❌ ${result.message}`);
    }
  });

  console.log(`\n📊 成功: ${totalSuccess}件, 失敗: ${totalFailed}件`);
  console.log(`📈 作成されたデータ総数: ${totalItems}件`);

  if (totalFailed > 0) {
    console.log('⚠️ 一部のシードで失敗がありました。ログを確認してください。');
  } else {
    console.log('🎉 すべてのシードが正常に完了しました！');
  }
}
