/**
 * Vitest グローバルセットアップ・ティアダウン
 * 全テスト実行前後に1回だけ実行される
 */

// 不要なimportを削除（DBクリーンアップ処理を削除したため）

export async function setup() {
  console.log('🚀 グローバルセットアップ開始...');

  // EventEmitterの最大リスナー数を増やす
  process.setMaxListeners(20);

  // 必要に応じてセットアップ処理を追加
  console.log('🚀 グローバルセットアップ完了');
}

export async function teardown() {
  console.log('🧹 グローバルティアダウン開始...');
  console.log('⏭️ DBクリーンアップは不要のためスキップします');
  console.log('🧹 グローバルティアダウン完了');
}
