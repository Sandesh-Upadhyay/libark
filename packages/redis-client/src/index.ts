/**
 * 統一Redis接続ユーティリティ
 *
 * 全てのRedis接続を一元管理し、重複を排除
 * - BullMQ用接続
 * - WebSocket PubSub用接続
 * - 通常のコマンド用接続
 */

export { RedisConnectionManager, getRedisClient, createRedisClient } from './redis-manager.js';
export { RedisPubSubManager, createRedisPubSubManager } from './pubsub-manager.js';
export type { RedisClientType, RedisConnectionConfig, PubSubNotificationData } from './types.js';
export { REDIS_CHANNELS, REDIS_KEYS, DEFAULT_REDIS_CONFIG } from './constants.js';

// セッション管理
export {
  RedisSessionManager,
  sessionManager,
  type SessionData,
  type TokenBlacklistEntry,
  type RefreshTokenData,
} from './session-manager.js';

// レートリミッター
export {
  RedisRateLimiter,
  rateLimiter,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitOptions,
} from './rate-limiter.js';

// カウンター管理
export {
  RedisCounterManager,
  counterManager,
  type PostStats,
  type UserStats,
  type GlobalStats,
} from './counter-manager.js';

// 分散キャッシュ（統一キャッシュシステムに移行済み）
// export {
//   RedisDistributedCache,
//   distributedCache,
//   type CacheOptions,
//   type CacheEntry,
//   type CacheStats,
// } from './distributed-cache.js';
