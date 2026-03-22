/**
 * 🗄️ LIBARK 統一キャッシュシステム
 *
 * 責任:
 * - 階層化キャッシュ（Memory + Redis）の統一管理
 * - 型安全なキャッシュ操作インターフェース
 * - Apollo Server、フロントエンド、バックエンドの統一キャッシュ
 * - 自動無効化とTTL管理
 * - パフォーマンス監視とメトリクス
 */

// メインキャッシュマネージャー
export { UnifiedCacheManager } from './cache-manager.js';
export type { CacheEntry, CacheStats } from './cache-manager.js';
export type { CacheManagerOptions } from './cache-manager.js';

// 設定システム
export { getCacheConfig } from './config/index.js';
export type { UnifiedCacheConfig } from './config/types.js';

// アダプター
export { ApolloServerCacheAdapter } from './adapters/apollo-server.js';
export { createCacheAdapter } from './adapters/factory.js';

// 型定義
export type {
  CacheKey,
  CacheValue,
  CacheTTL,
  CacheCategory,
  CacheOptions,
  CacheMetrics,
  CacheEventType,
  CacheEvent,
} from './types.js';

// ユーティリティ
export { createCacheKey, parseCacheKey } from './utils/cache-key.js';
export { CacheEventEmitter } from './utils/events.js';

// デフォルトインスタンス（シングルトン）
export { getDefaultCacheManager } from './singleton.js';
