/**
 * 🔧 統一キャッシュ設定スキーマ（Zod）
 */

import { z } from 'zod';

import type { UnifiedCacheConfig } from './types.js';

/**
 * 環境変数スキーマ
 */
export const CacheEnvironmentSchema = z.object({
  // 全体設定
  CACHE_ENABLED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('true'),

  // メモリキャッシュ設定
  CACHE_MEMORY_ENABLED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('true'),

  CACHE_MEMORY_MAX_SIZE: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('104857600'), // 100MB

  CACHE_MEMORY_DEFAULT_TTL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('300'), // 5分

  CACHE_MEMORY_MAX_ITEMS: z
    .string()
    .transform(val => parseInt(val, 10))
    .optional(),

  // Redisキャッシュ設定
  CACHE_REDIS_ENABLED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('true'),

  CACHE_REDIS_DEFAULT_TTL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('3600'), // 1時間

  CACHE_REDIS_KEY_PREFIX: z.string().default('libark:cache'),

  // 圧縮設定
  CACHE_COMPRESSION_ENABLED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('true'),

  CACHE_COMPRESSION_THRESHOLD: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('1024'), // 1KB

  CACHE_COMPRESSION_LEVEL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('6'),

  // カテゴリ別TTL設定
  CACHE_TTL_USER: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('3600'), // 1時間

  CACHE_TTL_POST: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('1800'), // 30分

  CACHE_TTL_FEED: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('900'), // 15分

  CACHE_TTL_MEDIA: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('86400'), // 24時間

  CACHE_TTL_SEARCH: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('300'), // 5分

  CACHE_TTL_SESSION: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('7200'), // 2時間

  CACHE_TTL_GRAPHQL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('300'), // 5分

  CACHE_TTL_API: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('600'), // 10分

  CACHE_TTL_CONFIG: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('3600'), // 1時間

  CACHE_TTL_TEMP: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('60'), // 1分

  // メトリクス設定
  CACHE_METRICS_ENABLED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('true'),

  CACHE_METRICS_UPDATE_INTERVAL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('60'), // 1分

  CACHE_METRICS_DETAILED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),

  // ログ設定
  CACHE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),

  CACHE_LOG_OPERATIONS: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),

  CACHE_LOG_PERFORMANCE: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),

  // 開発モード設定
  CACHE_DEVELOPMENT_ENABLED: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),

  CACHE_DEVELOPMENT_DEBUG: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),

  CACHE_DEVELOPMENT_TEST_MODE: z
    .string()
    .transform(val => val.toLowerCase() === 'true')
    .default('false'),
});

/**
 * 環境変数型
 */
export type CacheEnvironmentVariables = z.infer<typeof CacheEnvironmentSchema>;

/**
 * 環境変数から統一キャッシュ設定を生成
 */
export function createCacheConfigFromEnv(env: CacheEnvironmentVariables): UnifiedCacheConfig {
  return {
    enabled: env.CACHE_ENABLED,

    memory: {
      enabled: env.CACHE_MEMORY_ENABLED,
      maxSize: env.CACHE_MEMORY_MAX_SIZE,
      defaultTTL: env.CACHE_MEMORY_DEFAULT_TTL,
      maxItems: env.CACHE_MEMORY_MAX_ITEMS,
    },

    redis: {
      enabled: env.CACHE_REDIS_ENABLED,
      defaultTTL: env.CACHE_REDIS_DEFAULT_TTL,
      keyPrefix: env.CACHE_REDIS_KEY_PREFIX,
      compression: {
        enabled: env.CACHE_COMPRESSION_ENABLED,
        threshold: env.CACHE_COMPRESSION_THRESHOLD,
        level: env.CACHE_COMPRESSION_LEVEL,
      },
    },

    categoryTTLs: {
      user: env.CACHE_TTL_USER,
      post: env.CACHE_TTL_POST,
      feed: env.CACHE_TTL_FEED,
      media: env.CACHE_TTL_MEDIA,
      search: env.CACHE_TTL_SEARCH,
      session: env.CACHE_TTL_SESSION,
      graphql: env.CACHE_TTL_GRAPHQL,
      api: env.CACHE_TTL_API,
      config: env.CACHE_TTL_CONFIG,
      temp: env.CACHE_TTL_TEMP,
    },

    metrics: {
      enabled: env.CACHE_METRICS_ENABLED,
      updateInterval: env.CACHE_METRICS_UPDATE_INTERVAL,
      detailed: env.CACHE_METRICS_DETAILED,
    },

    logging: {
      level: env.CACHE_LOG_LEVEL,
      operations: env.CACHE_LOG_OPERATIONS,
      performance: env.CACHE_LOG_PERFORMANCE,
    },

    development: {
      enabled: env.CACHE_DEVELOPMENT_ENABLED,
      debug: env.CACHE_DEVELOPMENT_DEBUG,
      testMode: env.CACHE_DEVELOPMENT_TEST_MODE,
    },
  };
}
