/**
 * ワーカー共通設定
 *
 * 全ワーカーで使用する設定を一元管理
 */

import { NETWORK_CONSTANTS, envUtils } from '@libark/core-shared';

// 🚫 IMAGE_PROCESSING_CONFIG は削除されました（ImageProcessingWorkerと共に削除）
// プリサインドS3システムでは画像処理設定は不要です
// 🚫 MEDIA_PROCESSING_CONFIG は削除されました（ImageProcessingWorkerと共に削除）
// プリサインドS3システムではメディア処理設定は不要です

/**
 * ワーカー専用定数
 */
export const WORKER_SPECIFIC_CONSTANTS = {
  // ポート番号
  DEFAULT_WORKER_PORT: 8100,

  // タイムアウト・間隔
  RETRY_DELAY_ON_FAILOVER: 100,

  // 時間変換
  SECONDS_PER_MINUTE: 60,
  MILLISECONDS_PER_SECOND: 1000,
} as const;

/**
 * Redis接続設定（参考用）
 * 実際の接続はioredisインスタンスを直接作成して使用
 */
export const REDIS_CONFIG = {
  host: 'redis',
  port: NETWORK_CONSTANTS.REDIS_DEFAULT_PORT,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: WORKER_SPECIFIC_CONSTANTS.RETRY_DELAY_ON_FAILOVER,
  enableReadyCheck: false,
  lazyConnect: true,
} as const;

/**
 * ワーカー別設定（ウォレット関連のみ）
 */
export const WORKER_CONFIGS = {
  // ウォレット関連ワーカーの設定はBaseWorkerで管理
} as const;

/**
 * 通知設定（GraphQLサブスクリプション専用）
 */
export const NOTIFICATION_CONFIG = {
  enableGraphQLSubscription: true,
  redisPubSub: true,
  duplicateCheckWindowMinutes: 5,
  // GraphQLサブスクリプション専用設定
  subscriptionChannels: {
    notifications: true,
    wallet: true,
  },
} as const;

/**
 * 環境別設定の取得
 */
export function getEnvironmentConfig() {
  const isDevelopment = envUtils.isDevelopment();
  const isProduction = envUtils.isProduction();

  return {
    isDevelopment,
    isProduction,
    logLevel: isDevelopment ? 'debug' : 'info',
    enableDetailedLogging: isDevelopment,
    enablePerformanceMetrics: isProduction,
  };
}

// 🚫 暗号化設定は削除されました（プリサインドS3システムに移行済み）
// Zenkoが透明暗号化を処理するため、アプリケーション層での暗号化設定は不要です
