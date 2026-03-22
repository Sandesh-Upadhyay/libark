/**
 * @fileoverview サーバーサイド専用メディア処理エクスポート
 *
 * このファイルはサーバーサイド環境でのみ使用される
 * メディア処理機能をエクスポートします。
 */

// サーバーサイド専用のメディアクライアント
export { createMediaClient } from './index.js';

// サーバーサイド専用のS3ゲートウェイクライアント
export { S3GatewayClient } from './s3-gateway-client.js';

// サーバーサイド専用のメディアクライアント実装
export { MediaClient } from './clients/MediaClient.js';

// 定数とユーティリティ（サーバーサイドでも使用可能）
export {
  MEDIA_V2_CONSTANTS,
  shouldUseMultipartUpload,
  calculatePartCount,
  isSupportedFileType,
  inferMediaType,
  getFileExtension,
  generateDisplayFilename,
  validatePresignedExpires,
} from './index.js';

// 型定義（サーバーサイドでも使用可能）
export type { MediaClientConfig } from './index.js';
