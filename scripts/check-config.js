#!/usr/bin/env node

/**
 * 統一設定確認スクリプト
 *
 * 使用方法:
 * node scripts/check-config.js
 */

import { getVariantConfigSummary } from '../packages/core/dist/config/variantConfig.js';

console.log('🔧 統一設定確認');
console.log('================');

try {
  const summary = getVariantConfigSummary();

  console.log('\n📁 バリアント設定:');
  console.log(`  総バリアント種類数: ${summary.totalVariantTypes}`);

  console.log('\n📁 標準設定:');
  Object.entries(summary.standardConfigs).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}個のバリアント`);
  });

  console.log('\n📁 特殊設定:');
  summary.specialConfigs.forEach(config => {
    console.log(`  ${config}`);
  });

  console.log('\n⚙️ ワーカー設定:');
  Object.entries(summary.upload.workers).forEach(([type, config]) => {
    console.log(`  ${type}:`);
    console.log(`    並行処理数: ${config.concurrency}`);
    console.log(`    停止間隔: ${config.stalledInterval}`);
    console.log(`    最大停止回数: ${config.maxStalledCount}`);
    console.log(`    リトライ遅延: ${config.retryProcessDelay}`);
    console.log(`    説明: ${config.description}`);
  });

  console.log('\n🖼️ バリアント設定:');
  Object.entries(summary.variants).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}種類`);
  });

  console.log('\n✅ 統一設定の確認が完了しました');

} catch (error) {
  console.error('❌ 設定確認エラー:', error.message);
  process.exit(1);
}
