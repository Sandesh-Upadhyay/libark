/**
 * 🔧 統一キャッシュ設定管理
 */

import { CacheEnvironmentSchema, createCacheConfigFromEnv } from './schema.js';
import type { UnifiedCacheConfig } from './types.js';

/**
 * キャッシュ設定のシングルトンインスタンス
 */
let cacheConfig: UnifiedCacheConfig | null = null;

/**
 * 環境変数から統一キャッシュ設定を取得
 */
export function getCacheConfig(): UnifiedCacheConfig {
  if (cacheConfig) {
    return cacheConfig;
  }

  // 環境変数の検証と変換
  const envResult = CacheEnvironmentSchema.safeParse(process.env);

  if (!envResult.success) {
    console.error('❌ [Cache] 環境変数の検証に失敗しました:', envResult.error.format());
    throw new Error('Invalid cache environment variables');
  }

  // 設定オブジェクトの生成
  cacheConfig = createCacheConfigFromEnv(envResult.data);

  // 開発環境でのデバッグ情報出力
  if (cacheConfig.development.debug && process.env.NODE_ENV === 'development') {
    console.log('🔧 [Cache] 設定が読み込まれました:');
    console.log(`  - 全体有効: ${cacheConfig.enabled}`);
    console.log(
      `  - メモリキャッシュ: ${cacheConfig.memory.enabled} (${Math.round(cacheConfig.memory.maxSize / 1024 / 1024)}MB)`
    );
    console.log(
      `  - Redisキャッシュ: ${cacheConfig.redis.enabled} (TTL: ${cacheConfig.redis.defaultTTL}s)`
    );
    console.log(
      `  - 圧縮: ${cacheConfig.redis.compression.enabled} (閾値: ${cacheConfig.redis.compression.threshold}B)`
    );
    console.log(`  - メトリクス: ${cacheConfig.metrics.enabled}`);
  }

  return cacheConfig;
}

/**
 * キャッシュ設定をリセット（テスト用）
 */
export function resetCacheConfig(): void {
  cacheConfig = null;
}

/**
 * カスタム設定でキャッシュ設定を上書き（テスト用）
 */
export function setCacheConfig(config: UnifiedCacheConfig): void {
  cacheConfig = config;
}

/**
 * 設定の妥当性チェック
 */
export function validateCacheConfig(config: UnifiedCacheConfig): boolean {
  try {
    // 基本的な妥当性チェック
    if (config.memory.maxSize <= 0) {
      throw new Error('Memory cache max size must be positive');
    }

    if (config.memory.defaultTTL <= 0) {
      throw new Error('Memory cache default TTL must be positive');
    }

    if (config.redis.defaultTTL <= 0) {
      throw new Error('Redis cache default TTL must be positive');
    }

    if (config.redis.compression.threshold < 0) {
      throw new Error('Compression threshold must be non-negative');
    }

    if (config.redis.compression.level < 1 || config.redis.compression.level > 9) {
      throw new Error('Compression level must be between 1 and 9');
    }

    if (config.metrics.updateInterval <= 0) {
      throw new Error('Metrics update interval must be positive');
    }

    // カテゴリ別TTLの妥当性チェック
    for (const [category, ttl] of Object.entries(config.categoryTTLs)) {
      if (ttl <= 0) {
        throw new Error(`TTL for category '${category}' must be positive`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ [Cache] 設定の妥当性チェックに失敗:', error);
    return false;
  }
}

// 型エクスポート
export type { UnifiedCacheConfig } from './types.js';
export { CacheEnvironmentSchema, createCacheConfigFromEnv } from './schema.js';
