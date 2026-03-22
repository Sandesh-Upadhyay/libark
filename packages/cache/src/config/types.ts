/**
 * 🔧 統一キャッシュ設定型定義
 */

import type { CacheCategory, CacheTTL } from '../types.js';

/**
 * メモリキャッシュ設定
 */
export interface MemoryCacheConfig {
  /** 最大サイズ（バイト） */
  maxSize: number;

  /** デフォルトTTL（秒） */
  defaultTTL: CacheTTL;

  /** 最大アイテム数 */
  maxItems?: number;

  /** 有効/無効 */
  enabled: boolean;
}

/**
 * Redisキャッシュ設定
 */
export interface RedisCacheConfig {
  /** デフォルトTTL（秒） */
  defaultTTL: CacheTTL;

  /** キープレフィックス */
  keyPrefix: string;

  /** 有効/無効 */
  enabled: boolean;

  /** 圧縮設定 */
  compression: {
    /** 圧縮有効/無効 */
    enabled: boolean;

    /** 圧縮閾値（バイト） */
    threshold: number;

    /** 圧縮レベル（1-9） */
    level: number;
  };
}

/**
 * カテゴリ別TTL設定
 */
export type CategoryTTLConfig = Record<CacheCategory, CacheTTL>;

/**
 * 統一キャッシュ設定
 */
export interface UnifiedCacheConfig {
  /** 全体有効/無効 */
  enabled: boolean;

  /** メモリキャッシュ設定 */
  memory: MemoryCacheConfig;

  /** Redisキャッシュ設定 */
  redis: RedisCacheConfig;

  /** カテゴリ別TTL設定 */
  categoryTTLs: CategoryTTLConfig;

  /** メトリクス設定 */
  metrics: {
    /** メトリクス収集有効/無効 */
    enabled: boolean;

    /** 統計更新間隔（秒） */
    updateInterval: number;

    /** 詳細メトリクス有効/無効 */
    detailed: boolean;
  };

  /** ログ設定 */
  logging: {
    /** ログレベル */
    level: 'debug' | 'info' | 'warn' | 'error' | 'silent';

    /** 操作ログ有効/無効 */
    operations: boolean;

    /** パフォーマンスログ有効/無効 */
    performance: boolean;
  };

  /** 開発モード設定 */
  development: {
    /** 開発モード有効/無効 */
    enabled: boolean;

    /** デバッグ情報表示 */
    debug: boolean;

    /** テストモード */
    testMode: boolean;
  };
}
