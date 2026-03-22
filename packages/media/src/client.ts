/**
 * @fileoverview クライアントサイド専用メディア処理エクスポート
 *
 * このファイルはクライアントサイド環境（ブラウザ）でのみ使用される
 * メディア処理機能をエクスポートします。
 */

// クライアントサイド専用のメディアクライアント
export { createMediaClient } from './index.js';

// 定数とユーティリティ（クライアントサイドでも使用可能）
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

// 型定義（クライアントサイドでも使用可能）
export type { MediaClientConfig } from './index.js';
