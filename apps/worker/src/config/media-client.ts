/**
 * 🔧 メディアクライアント設定 - ワーカー用（S3 Gateway統合版）
 */

import { createMediaClient, S3GatewayClient } from '@libark/media';

let mediaClient: S3GatewayClient | null = null;

/**
 * メディアクライアント取得（S3 Gateway統合版）
 */
export function getMediaClient(): S3GatewayClient {
  if (!mediaClient) {
    mediaClient = createMediaClient();
    console.log('🔧 ワーカー用メディアクライアント初期化完了（S3 Gateway統合版）');
  }

  return mediaClient;
}
