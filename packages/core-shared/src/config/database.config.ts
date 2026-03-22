/**
 * 🗄️ データベース設定
 *
 * 統一されたデータベース設定を提供
 */

import { getConfig } from './validation.js';
import type { DatabaseConfig } from './schema.js';

/**
 * 🎯 データベース設定の取得
 */
export function getDatabaseConfig(): DatabaseConfig {
  const config = getConfig();

  return {
    DATABASE_URL: config.DATABASE_URL,
  };
}

/**
 * 🔗 データベース設定オブジェクト（レガシー互換性のため）
 */
export const databaseConfig = {
  get databaseUrl() {
    return getDatabaseConfig().DATABASE_URL;
  },
} as const;

/**
 * 🎯 デフォルトエクスポート
 */
export default databaseConfig;
