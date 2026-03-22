/**
 * 🔄 統一キャッシュマネージャーシングルトン
 */

import { UnifiedCacheManager } from './cache-manager.js';
import type { CacheManagerOptions } from './cache-manager.js';

/**
 * デフォルトキャッシュマネージャーのシングルトンインスタンス
 */
let defaultCacheManager: UnifiedCacheManager | null = null;

/**
 * デフォルトキャッシュマネージャーの取得
 *
 * @param options - 初期化オプション（初回のみ有効）
 * @returns キャッシュマネージャーインスタンス
 */
export function getDefaultCacheManager(options?: CacheManagerOptions): UnifiedCacheManager {
  if (!defaultCacheManager) {
    defaultCacheManager = new UnifiedCacheManager(options);
  }
  return defaultCacheManager;
}

/**
 * デフォルトキャッシュマネージャーのリセット
 *
 * 主にテスト用途で使用
 */
export async function resetDefaultCacheManager(): Promise<void> {
  if (defaultCacheManager) {
    await defaultCacheManager.dispose();
    defaultCacheManager = null;
  }
}

/**
 * アプリケーション終了時のクリーンアップ
 */
export async function cleanupCacheManager(): Promise<void> {
  await resetDefaultCacheManager();
}

// プロセス終了時の自動クリーンアップ
process.on('SIGINT', cleanupCacheManager);
process.on('SIGTERM', cleanupCacheManager);
process.on('exit', () => {
  // 同期的なクリーンアップのみ
  if (defaultCacheManager) {
    console.log('🗄️ [Cache] Cleaning up cache manager...');
  }
});
