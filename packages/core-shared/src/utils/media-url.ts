/**
 * 🎯 メディアURL生成ユーティリティ
 *
 * 環境に応じた適切なメディアURLを生成する統一システム
 */

import { envUtils } from '../config/environment-strategy.js';
import { getFrontendConfig } from '../config/client.js';

/**
 * 🌍 環境別ベースURL取得
 */
function getMediaBaseUrl(): string {
  const isServer = envUtils.isServer();

  if (isServer) {
    // サーバーサイド: Docker内部ネットワーク用
    return envUtils.getEnvVar('NEXT_PUBLIC_BACKEND_URL_INTERNAL') || 'http://backend:8000';
  } else {
    // クライアントサイド: 公開URL
    const config = getFrontendConfig();
    return config.backendUrl;
  }
}

/**
 * 🎯 メディアURL生成（メイン関数）
 */
export function generateMediaUrl(mediaId: string, variant?: string): string {
  const baseUrl = getMediaBaseUrl();
  const url = `${baseUrl}/api/media/${mediaId}`;
  return variant ? `${url}?variant=${variant}` : url;
}

/**
 * 🖼️ サムネイルURL生成
 */
export function generateThumbnailUrl(mediaId: string): string {
  return generateMediaUrl(mediaId, 'THUMB');
}

/**
 * 🔧 S3Gateway URL生成
 */
export function getS3GatewayUrl(): string {
  const isServer = envUtils.isServer();

  if (isServer) {
    // サーバーサイド: Docker内部ネットワーク
    return envUtils.getEnvVar('S3_GATEWAY_URL') || 'http://s3-gateway:8080';
  } else {
    // クライアントサイド: 公開URL
    return (
      envUtils.getEnvVar('NEXT_PUBLIC_S3_GATEWAY_URL') ||
      (envUtils.isProduction() ? 'https://libark.io' : 'http://localhost')
    );
  }
}

/**
 * 🌐 公開メディアURL生成（S3Gateway経由）
 */
export function generatePublicMediaUrl(s3Key: string): string {
  const gatewayUrl = getS3GatewayUrl();
  const bucket = envUtils.getEnvVar('S3_BUCKET') || 'media';
  return `${gatewayUrl}/files/${bucket}/${s3Key}`;
}

/**
 * 🔍 URL生成設定のデバッグ情報
 */
export function getMediaUrlDebugInfo() {
  return {
    isServer: envUtils.isServer(),
    isProduction: envUtils.isProduction(),
    mediaBaseUrl: getMediaBaseUrl(),
    s3GatewayUrl: getS3GatewayUrl(),
    environment: envUtils.getNodeEnv(),
  };
}
