/**
 * ☁️ S3設定
 *
 * 統一されたS3設定を提供
 */

import { getConfig } from './validation.js';
import type { S3Config } from './schema.js';

/**
 * 🎯 S3設定の取得
 */
export function getS3Config(): S3Config {
  const config = getConfig();

  return {
    S3_ACCESS_KEY: config.S3_ACCESS_KEY,
    S3_SECRET_KEY: config.S3_SECRET_KEY,
    S3_BUCKET: config.S3_BUCKET,
    S3_REGION: config.S3_REGION,
    S3_ENDPOINT: config.S3_ENDPOINT,
    S3_PUBLIC_URL: config.S3_PUBLIC_URL,
    S3_CDN_DOMAIN: config.S3_CDN_DOMAIN,
  };
}

/**
 * ☁️ S3設定オブジェクト（レガシー互換性のため）
 */
export const s3Config = {
  get accessKey() {
    return getS3Config().S3_ACCESS_KEY;
  },

  get secretKey() {
    return getS3Config().S3_SECRET_KEY;
  },

  get bucket() {
    return getS3Config().S3_BUCKET;
  },

  get region() {
    return getS3Config().S3_REGION;
  },

  get endpoint() {
    return getS3Config().S3_ENDPOINT;
  },

  get publicUrl() {
    return getS3Config().S3_PUBLIC_URL;
  },

  get cdnDomain() {
    return getS3Config().S3_CDN_DOMAIN;
  },
} as const;

/**
 * 🎯 デフォルトエクスポート
 */
export default s3Config;
