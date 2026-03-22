/**
 * 🔗 Redis設定
 *
 * 統一されたRedis設定を提供
 */

import { getConfig } from './validation.js';
import type { RedisConfig } from './schema.js';

/**
 * 🎯 Redis設定の取得
 */
export function getRedisConfig(): RedisConfig {
  const config = getConfig();

  return {
    REDIS_HOST: config.REDIS_HOST,
    REDIS_PORT: config.REDIS_PORT,
    REDIS_PASSWORD: config.REDIS_PASSWORD,
    REDIS_URL: config.REDIS_URL,
  };
}

/**
 * 🔗 Redis設定オブジェクト（レガシー互換性のため）
 */
export const redisConfig = {
  get url() {
    const config = getRedisConfig();
    return config.REDIS_URL || `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`;
  },

  get host() {
    return getRedisConfig().REDIS_HOST;
  },

  get port() {
    return getRedisConfig().REDIS_PORT;
  },

  get password() {
    return getRedisConfig().REDIS_PASSWORD;
  },
} as const;

/**
 * 🎯 デフォルトエクスポート
 */
export default redisConfig;
