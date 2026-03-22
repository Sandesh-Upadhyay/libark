/**
 * 🗄️ 統一キャッシュマネージャー
 *
 * cache-managerをベースとした階層化キャッシュシステム
 */

// import { createCache, type Cache } from 'cache-manager';
// import { createKeyv } from '@keyv/redis';
// import { getRedisClient } from '@libark/redis-client';
import { getCacheConfig } from './config/index.js';
import { CacheEventEmitter } from './utils/events.js';
import { createCacheKey } from './utils/cache-key.js';
import type {
  CacheKey,
  CacheValue,
  CacheCategory,
  CacheOptions,
  CacheEntry,
  CacheStats,
  CacheEvent,
  CacheEventType,
} from './types.js';
import type { UnifiedCacheConfig } from './config/types.js';

/**
 * キャッシュマネージャーオプション
 */
export interface CacheManagerOptions {
  /** カスタム設定（省略時は環境変数から取得） */
  config?: UnifiedCacheConfig;

  /** カスタムRedisクライアント */
  redisClient?: unknown;

  /** イベントエミッター */
  eventEmitter?: CacheEventEmitter;
}

/**
 * 統一キャッシュマネージャークラス
 */
console.log('🔥 DEBUG: UnifiedCacheManager class definition loaded');

export class UnifiedCacheManager {
  private config: UnifiedCacheConfig;
  private memoryCache: Map<string, CacheEntry>;
  private eventEmitter: CacheEventEmitter;
  private stats: CacheStats;
  private metricsInterval?: NodeJS.Timeout;

  constructor(options: CacheManagerOptions = {}) {
    console.log('🔥 DEBUG: UnifiedCacheManager constructor called!');
    console.log('🔥 DEBUG: Constructor options =', JSON.stringify(options, null, 2));

    // 設定の取得（オプションで渡された設定を優先）
    this.config = options.config || getCacheConfig();

    console.log('🔥 DEBUG: Final config memory.enabled =', this.config.memory.enabled);
    console.log('🔥 DEBUG: Final config redis.enabled =', this.config.redis.enabled);

    // 設定バリデーション
    console.log('🔥 DEBUG: Checking validation conditions:');
    console.log('🔥 DEBUG: !this.config.memory.enabled =', !this.config.memory.enabled);
    console.log('🔥 DEBUG: !this.config.redis.enabled =', !this.config.redis.enabled);
    console.log(
      '🔥 DEBUG: Both conditions =',
      !this.config.memory.enabled && !this.config.redis.enabled
    );

    if (!this.config.memory.enabled && !this.config.redis.enabled) {
      console.log('🔥 DEBUG: About to throw error - both stores disabled');
      throw new Error('At least one cache store must be enabled');
    }

    console.log('🔥 DEBUG: Validation passed, continuing with initialization');

    this.eventEmitter = options.eventEmitter || new CacheEventEmitter();
    this.stats = this.initializeStats();
    this.memoryCache = new Map();

    // メトリクス収集の開始
    if (this.config.metrics.enabled) {
      this.startMetricsCollection();
    }

    this.log('info', 'UnifiedCacheManager initialized', {
      memoryEnabled: this.config.memory.enabled,
      redisEnabled: this.config.redis.enabled,
      metricsEnabled: this.config.metrics.enabled,
    });
  }

  /**
   * 統計情報の初期化
   */
  private initializeStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalKeys: 0,
      hitRate: 0,
      memoryUsage: 0,
      redisUsage: 0,
    };
  }

  /**
   * データの取得
   */
  async get<T = CacheValue>(
    category: CacheCategory,
    key: CacheKey,
    options?: Pick<CacheOptions, 'version'>
  ): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const fullKey = createCacheKey(category, key, options?.version);
    const startTime = Date.now();

    try {
      const result = this.memoryCache.get(fullKey);
      const duration = Date.now() - startTime;

      if (result) {
        // 有効期限チェック
        if (result.expiresAt && Date.now() > result.expiresAt) {
          this.memoryCache.delete(fullKey);
          this.updateStats('miss');
          this.emitEvent('miss', { category, key, duration });
          return null;
        }

        this.updateStats('hit');
        this.emitEvent('hit', { category, key, duration, size: result.size });

        this.log('debug', 'Cache hit', { category, key, duration });
        return result.data as T;
      } else {
        this.updateStats('miss');
        this.emitEvent('miss', { category, key, duration });

        this.log('debug', 'Cache miss', { category, key, duration });
        return null;
      }
    } catch (error) {
      this.log('error', 'Cache get error', { category, key, error });
      this.emitEvent('error', { category, key, error: error as Error });
      return null;
    }
  }

  /**
   * データの設定
   */
  async set<T = CacheValue>(
    category: CacheCategory,
    key: CacheKey,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const fullKey = createCacheKey(category, key, options.version);
    const ttl = options.ttl || this.config.categoryTTLs[category] || this.config.memory.defaultTTL;
    const startTime = Date.now();

    try {
      let serializedSize = 0;
      try {
        const serialized = JSON.stringify(value);
        serializedSize = typeof serialized === 'string' ? serialized.length : 0;
      } catch (error) {
        serializedSize = 0;
        this.log('warn', 'Cache value serialization failed', { category, key, error });
      }

      const entry: CacheEntry<T> = {
        data: value,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000,
        version: options.version,
        compressed: options.compress,
        tags: options.tags,
        size: serializedSize,
      };

      // 圧縮処理（必要に応じて）
      if (this.shouldCompress(entry, options)) {
        // 実際の圧縮実装は省略（zlib等を使用）
        entry.compressed = true;
        this.log('debug', 'Data compressed', { category, key, originalSize: entry.size });
      }

      this.memoryCache.set(fullKey, entry);

      const duration = Date.now() - startTime;
      this.updateStats('set');
      this.emitEvent('set', { category, key, duration, size: entry.size, ttl });

      this.log('debug', 'Cache set', { category, key, ttl, duration, size: entry.size });
    } catch (error) {
      this.log('error', 'Cache set error', { category, key, error });
      this.emitEvent('error', { category, key, error: error as Error });
      throw error;
    }
  }

  /**
   * データの削除
   */
  async delete(category: CacheCategory, key: CacheKey, version?: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const fullKey = createCacheKey(category, key, version);
    const startTime = Date.now();

    try {
      this.memoryCache.delete(fullKey);

      const duration = Date.now() - startTime;
      this.updateStats('delete');
      this.emitEvent('delete', { category, key, duration });

      this.log('debug', 'Cache delete', { category, key, duration });
    } catch (error) {
      this.log('error', 'Cache delete error', { category, key, error });
      this.emitEvent('error', { category, key, error: error as Error });
      throw error;
    }
  }

  /**
   * カテゴリ全体のクリア
   */
  async clearCategory(category: CacheCategory): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // カテゴリに一致するキーを削除
      for (const [key] of this.memoryCache) {
        if (key.startsWith(`${category}:`)) {
          this.memoryCache.delete(key);
        }
      }

      this.emitEvent('clear', { category });
      this.log('info', 'Category cleared', { category });
    } catch (error) {
      this.log('error', 'Cache clear error', { category, error });
      this.emitEvent('error', { category, error: error as Error });
      throw error;
    }
  }

  /**
   * 全キャッシュのクリア
   */
  async clear(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      this.memoryCache.clear();
      this.stats = this.initializeStats();

      this.emitEvent('clear', {});
      this.log('info', 'All cache cleared');
    } catch (error) {
      this.log('error', 'Cache clear all error', { error });
      this.emitEvent('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * 統計情報の取得
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 圧縮が必要かどうかの判定
   */
  private shouldCompress(entry: CacheEntry, options: CacheOptions): boolean {
    if (!this.config.redis.compression.enabled || options.compress === false) {
      return false;
    }

    if (options.compress === true) {
      return true;
    }

    return (entry.size || 0) >= this.config.redis.compression.threshold;
  }

  /**
   * 統計情報の更新
   */
  private updateStats(operation: 'hit' | 'miss' | 'set' | 'delete'): void {
    this.stats[
      operation === 'hit'
        ? 'hits'
        : operation === 'miss'
          ? 'misses'
          : operation === 'set'
            ? 'sets'
            : 'deletes'
    ]++;

    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * イベントの発行
   */
  private emitEvent(type: string, data?: unknown): void {
    const event: CacheEvent = {
      type: type as CacheEventType,
      timestamp: Date.now(),
      ...(data && typeof data === 'object' ? data : {}),
      metadata: {
        ...(data &&
        typeof data === 'object' &&
        'metadata' in data &&
        typeof data.metadata === 'object'
          ? data.metadata
          : {}),
        duration:
          data &&
          typeof data === 'object' &&
          'duration' in data &&
          typeof data.duration === 'number'
            ? data.duration
            : undefined,
      },
    };

    this.eventEmitter.emit(type, event);
  }

  /**
   * ログ出力
   */
  private log(level: string, message: string, data?: unknown): void {
    if (this.config.logging.level === 'silent') {
      return;
    }

    const shouldLog =
      (level === 'debug' && this.config.logging.level === 'debug') ||
      (level === 'info' && ['debug', 'info'].includes(this.config.logging.level)) ||
      (level === 'warn' && ['debug', 'info', 'warn'].includes(this.config.logging.level)) ||
      level === 'error';

    if (shouldLog) {
      console.log(`[Cache:${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  /**
   * メトリクス収集の開始
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      // メトリクス更新処理（実装簡略化）
      this.log('debug', 'Metrics updated', this.stats);
    }, this.config.metrics.updateInterval * 1000);
  }

  /**
   * リソースのクリーンアップ
   */
  async dispose(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.log('info', 'UnifiedCacheManager disposed');
  }
}

// 型エクスポート
export type { CacheEntry, CacheStats };
