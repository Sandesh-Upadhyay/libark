/**
 * Redis関連の定数 - 統一設定システム対応版
 */

import { getRedisConfig, envUtils } from '@libark/core-shared';

/**
 * Redis PubSubチャンネル名（GraphQLサブスクリプション専用）
 *
 * WebSocketからGraphQLサブスクリプションへの移行完了
 */
export const REDIS_CHANNELS = {
  // GraphQLサブスクリプション専用チャンネル
  NOTIFICATION_PREFIX: 'notification:',
  NOTIFICATION_COUNT_PREFIX: 'notification_count:',

  // 投稿関連サブスクリプション
  POST_ADDED: 'post_added',
  POST_UPDATED_PREFIX: 'post_updated:',

  // コメント関連サブスクリプション
  COMMENT_ADDED_PREFIX: 'comment_added:',

  // いいね関連サブスクリプション
  LIKE_TOGGLED_PREFIX: 'like_toggled:',

  // ウォレット関連サブスクリプション
  WALLET_BALANCE_UPDATED_PREFIX: 'wallet_balance_updated:',
  WALLET_TRANSACTION_ADDED_PREFIX: 'wallet_transaction_added:',

  // メディア・投稿処理（ワーカー用）
  MEDIA_PROCESSING: 'media:*',
  POST_PROCESSING: 'post:*',
  USER_NOTIFICATIONS: 'user:*',
} as const;

/**
 * Redis キー名前空間
 */
export const REDIS_KEYS = {
  // セッション・認証
  SESSION: 'session',
  TOKEN_BLACKLIST: 'blacklist:token',
  REFRESH_TOKEN: 'refresh_token',

  // レートリミティング
  RATE_LIMIT_API: 'rate_limit:api',
  RATE_LIMIT_IP: 'rate_limit:ip',
  RATE_LIMIT_LOGIN: 'rate_limit:login',

  // カウンタ・統計
  POST_STATS: 'post_stats',
  COMMENT_STATS: 'comment_stats',
  USER_STATS: 'user_stats',
  GLOBAL_STATS: 'global_stats',

  // 分散キャッシュ
  CACHE_USER: 'cache:user',
  CACHE_POST: 'cache:post',
  CACHE_FEED: 'cache:feed',
  CACHE_MEDIA: 'cache:media',

  // 分散ロック
  LOCK: 'lock',

  // エフェメラル・トークン
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFY: 'email_verify',
  TWO_FA: '2fa',
} as const;

/**
 * デフォルトRedis設定（統一設定システムのフォールバック）
 */
export const DEFAULT_REDIS_CONFIG = {
  HOST: 'redis',
  PORT: 6379,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 50,
  RETRY_DELAY_MAX: 2000,
} as const;

/**
 * 統一設定システムからRedis設定を取得
 */
export function getRedisConfigFromUnified() {
  try {
    // 統一設定システムを使用
    const redisConfig = getRedisConfig();

    return {
      host: redisConfig.REDIS_HOST,
      port: redisConfig.REDIS_PORT,
      password: redisConfig.REDIS_PASSWORD,
      maxRetriesPerRequest: DEFAULT_REDIS_CONFIG.MAX_RETRIES,
      retryDelayOnFailover: DEFAULT_REDIS_CONFIG.RETRY_DELAY_BASE,
    };
  } catch {
    // フォールバック設定
    console.warn(
      '⚠️ [RedisClient] 統一設定システムからの設定取得に失敗しました。デフォルト設定を使用します。'
    );
    return {
      host: envUtils.getEnvVar('REDIS_HOST', DEFAULT_REDIS_CONFIG.HOST),
      port: parseInt(
        envUtils.getEnvVar('REDIS_PORT', String(DEFAULT_REDIS_CONFIG.PORT)) ||
          String(DEFAULT_REDIS_CONFIG.PORT),
        10
      ),
      password: envUtils.getEnvVar('REDIS_PASSWORD'),
      maxRetriesPerRequest: DEFAULT_REDIS_CONFIG.MAX_RETRIES,
      retryDelayOnFailover: DEFAULT_REDIS_CONFIG.RETRY_DELAY_BASE,
    };
  }
}
