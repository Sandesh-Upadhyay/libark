/**
 * Prisma シードスクリプト（リファクタリング版）
 * データベースの初期データを作成します
 *
 * 責任分離の原則に基づいて、各エンティティのシード処理を
 * 独立したモジュールに分離し、保守性と拡張性を向上させました。
 */

import { prisma } from '../src/server';

import { clearDatabase, logSeedSummary } from './seeds/utils/database';
import { seedUsers } from './seeds/seeders/user-seeder';
import { seedRolesAndPermissions } from './seeds/seeders/role-permission-seeder';
import { seedContent } from './seeds/seeders/content-seeder';
import { seedWallet } from './seeds/seeders/wallet-seeder';
import { seedSystem } from './seeds/seeders/system-seeder';
import { seedMessages } from './seeds/seeders/message-seeder';
import { seedP2PTrades } from './seeds/seeders/p2p-seeder';
import type { SeedResult } from './seeds/utils/types';

// 環境変数からクリアオプションを取得
const CLEAR_DATABASE = process.env.CLEAR_DB === 'true';

/**
 * メイン関数
 * 各シーダーを順次実行し、結果をまとめて報告
 */
async function seed(): Promise<void> {
  try {
    console.log('🌱 データベースのシードを開始します...');

    // 環境変数でクリアが指定されている場合はデータベースをクリア
    if (CLEAR_DATABASE) {
      await clearDatabase(prisma);
    }

    const results: SeedResult[] = [];

    // 1. ロール・権限のシードを先に実行（ユーザー割当前の基盤データ）
    const rpResult = await seedRolesAndPermissions(prisma);
    results.push(rpResult);

    // 2. ユーザー関連のシード実行
    const userResult = await seedUsers(prisma);
    results.push(userResult);

    // ユーザーデータを取得（後続のシードで使用）
    let users: unknown[] = [];
    if (userResult.success && userResult.data) {
      users = userResult.data;
    } else {
      // ユーザーシードが失敗した場合でも、既存ユーザーを取得して続行
      console.log('⚠️ ユーザーシードが失敗しましたが、既存ユーザーを取得して続行します');
      users = await prisma.user.findMany({
        include: {
          role: true,
        },
      });
      if (users.length === 0) {
        throw new Error('ユーザーが存在しないため、処理を中断します');
      }
    }

    // 2. コンテンツ関連のシード実行
    const contentResult = await seedContent(prisma, users);
    results.push(contentResult);

    // 3. ウォレット関連のシード実行
    const walletResult = await seedWallet(prisma, users);
    results.push(walletResult);

    // 4. システム設定関連のシード実行
    const systemResult = await seedSystem(prisma);
    results.push(systemResult);

    // 5. メッセージ関連のシード実行
    const messageResult = await seedMessages(prisma, users);
    results.push(messageResult);

    // 6. P2P取引関連のシード実行
    const p2pResult = await seedP2PTrades(prisma);
    results.push(p2pResult);

    // 結果のサマリーを出力
    logSeedSummary(results);
  } catch (error) {
    console.error('❌ シード処理中にエラーが発生しました:', error);
    throw error;
  } finally {
    // Prismaクライアントを切断
    await prisma.$disconnect();
  }
}

// シードスクリプトの実行
seed()
  .then(() => {
    console.log('✅ シードが正常に完了しました');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ シードの実行中にエラーが発生しました:', error);
    process.exit(1);
  });
