/**
 * 🎯 サーバー専用設定
 *
 * Node.js環境でのみ使用される設定
 * 機密情報を含むため、ブラウザには公開しない
 */

import { getConfig } from './validation.js';
import { authConfig } from './auth.config.js';

/**
 * 🗄️ データベース設定（サーバー専用）
 */
export function getDatabaseConfig() {
  const config = getConfig();

  return {
    url: config.DATABASE_URL,
  } as const;
}

/**
 * ☁️ S3設定（サーバー専用）
 */
export function getS3Config() {
  const config = getConfig();

  return {
    accessKey: config.S3_ACCESS_KEY,
    secretKey: config.S3_SECRET_KEY,
    bucket: config.S3_BUCKET,
    region: config.S3_REGION,
    endpoint: config.S3_ENDPOINT,
    publicUrl: config.S3_PUBLIC_URL,
    cdnDomain: config.S3_CDN_DOMAIN,
  } as const;
}

/**
 * 🔗 Redis設定（サーバー専用）
 */
export function getRedisConfig() {
  const config = getConfig();

  return {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    url: config.REDIS_URL || `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
  } as const;
}

/**
 * 🔌 GraphQLサブスクリプション設定（サーバー専用）
 */
export function getWebSocketConfig() {
  const config = getConfig();

  return {
    path: config.WEBSOCKET_PATH,
    enabled: config.WEBSOCKET_ENABLED,
    corsOrigins: config.WEBSOCKET_CORS_ORIGINS,
    maxConnections: config.WEBSOCKET_MAX_CONNECTIONS,
    debug: config.WEBSOCKET_DEBUG ?? config.NODE_ENV === 'development',
    connectionTimeout: config.WEBSOCKET_CONNECTION_TIMEOUT,
    authenticationTimeout: config.WEBSOCKET_AUTHENTICATION_TIMEOUT,
  } as const;
}

/**
 * 📤 アップロード設定（サーバー専用）
 */
export function getUploadConfig() {
  const config = getConfig();

  return {
    maxFileSizeMb: config.UPLOAD_MAX_FILE_SIZE_MB,
    maxFiles: config.UPLOAD_MAX_FILES,
    allowedTypes: config.UPLOAD_ALLOWED_TYPES,
    rateLimitMax: config.UPLOAD_RATE_LIMIT_MAX,
    // 🚫 imageEncryption は削除されました（プリサインドS3システムに移行済み）
  } as const;
}

/**
 * 🎯 サーバー設定（サーバー専用）
 */
export function getServerConfig() {
  const config = getConfig();

  return {
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    corsOrigins: config.CORS_ORIGINS,
  } as const;
}

/**
 * 🎯 統一サーバー設定オブジェクト
 */
export const serverConfig = {
  get auth() {
    return authConfig;
  },

  get database() {
    return getDatabaseConfig();
  },

  get s3() {
    return getS3Config();
  },

  get redis() {
    return getRedisConfig();
  },

  get websocket() {
    return getWebSocketConfig();
  },

  get upload() {
    return getUploadConfig();
  },

  get server() {
    return getServerConfig();
  },
} as const;

export default serverConfig;
