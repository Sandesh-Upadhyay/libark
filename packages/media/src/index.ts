/**
 * 📦 @libark/media - メインエクスポート
 *
 * S3 Gateway統合による統一メディア処理システム（責任分離最適化版）
 */

// ================================
// S3GatewayClient - メイン実装
// ================================
// 統合クライアント作成用のインポート
import { sanitizeFilename } from '@libark/core-shared';
import { getS3GatewayUrl } from '@libark/core-shared';

import { S3GatewayClient, createS3GatewayClient } from './s3-gateway-client.js';
// 共通ユーティリティのインポート

export {
  S3GatewayClient,
  createS3GatewayClient,
  type S3GatewayConfig,
  type S3GatewayPresignResponse,
  type PresignedUploadInput,
  type PresignedUploadData,
  type MultipartUploadInput,
  type MultipartUploadData,
  type PartUploadUrl,
  type CompletedPart,
} from './s3-gateway-client.js';

// 🚀 Phase 2: 統一メディアクライアント
export {
  MediaClient,
  createUnifiedMediaClient,
  createTestMediaClient,
  type UploadFileParams,
  type UploadFileResult,
  type MediaClientConfig,
  type Logger,
} from './clients/MediaClient.js';

// ================================
// メディアクライアント作成関数
// ================================

/**
 * S3GatewayClientを作成（環境対応版）
 *
 * 統一メディアクライアントのシンプルなラッパー
 */
export function createMediaClient(): S3GatewayClient {
  console.log('🔧 S3 Gateway統合モードでメディアクライアントを初期化');

  // 統一URL生成システムを使用
  const isServer = typeof window === 'undefined';
  const gatewayUrl = getS3GatewayUrl();

  const config = {
    gatewayUrl,
    bucket: 'media',
    publicUrl: `${gatewayUrl}/files/media`,
  };

  console.log(
    `🔧 ${isServer ? 'サーバーサイド' : 'クライアントサイド'} メディアクライアント設定:`,
    config
  );
  return createS3GatewayClient(config);
}

// ================================
// 型定義
// ================================
export interface UploadProgressUpdate {
  mediaId: string;
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message?: string;
  error?: string;
}

// ================================
// 定数
// ================================
export const MEDIA_V2_CONSTANTS = {
  // ファイルサイズ制限
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_MULTIPART_FILE_SIZE: 5 * 1024 * 1024 * 1024, // 5GB

  // マルチパート設定
  MULTIPART_THRESHOLD: 100 * 1024 * 1024, // 100MB
  MULTIPART_CHUNK_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PARTS: 1000,

  // URL有効期限
  DEFAULT_PRESIGNED_EXPIRES: 3600, // 1時間
  MAX_PRESIGNED_EXPIRES: 7 * 24 * 3600, // 7日

  // サポートされるメディアタイプ（@libark/core-shared/configから取得推奨）
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/bmp',
    'image/tiff',
  ],

  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],

  SUPPORTED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],

  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// ================================
// ユーティリティ関数
// ================================

/**
 * ファイルサイズがマルチパートアップロードの閾値を超えているかチェック
 */
export function shouldUseMultipartUpload(fileSize: number): boolean {
  return fileSize > MEDIA_V2_CONSTANTS.MULTIPART_THRESHOLD;
}

/**
 * マルチパートアップロードのパート数を計算
 */
export function calculatePartCount(fileSize: number): number {
  const partCount = Math.ceil(fileSize / MEDIA_V2_CONSTANTS.MULTIPART_CHUNK_SIZE);
  return Math.min(partCount, MEDIA_V2_CONSTANTS.MAX_PARTS);
}

/**
 * ファイルタイプがサポートされているかチェック
 */
export function isSupportedFileType(mimeType: string): boolean {
  const allSupportedTypes = [
    ...MEDIA_V2_CONSTANTS.SUPPORTED_IMAGE_TYPES,
    ...MEDIA_V2_CONSTANTS.SUPPORTED_VIDEO_TYPES,
    ...MEDIA_V2_CONSTANTS.SUPPORTED_AUDIO_TYPES,
    ...MEDIA_V2_CONSTANTS.SUPPORTED_DOCUMENT_TYPES,
  ] as readonly string[];

  return allSupportedTypes.includes(mimeType);
}

/**
 * メディアタイプを推定
 */
export function inferMediaType(mimeType: string): string {
  if ((MEDIA_V2_CONSTANTS.SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return 'image';
  }
  if ((MEDIA_V2_CONSTANTS.SUPPORTED_VIDEO_TYPES as readonly string[]).includes(mimeType)) {
    return 'video';
  }
  if ((MEDIA_V2_CONSTANTS.SUPPORTED_AUDIO_TYPES as readonly string[]).includes(mimeType)) {
    return 'audio';
  }
  if ((MEDIA_V2_CONSTANTS.SUPPORTED_DOCUMENT_TYPES as readonly string[]).includes(mimeType)) {
    return 'document';
  }
  return 'general';
}

// sanitizeFilename は @libark/core-shared から使用

/**
 * ファイル拡張子を安全に取得
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return 'bin';

  const extension = parts.pop()?.toLowerCase() || 'bin';

  // 許可された拡張子のみ
  const allowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'mp4',
    'webm',
    'ogg',
    'mp3',
    'wav',
    'aac',
    'pdf',
    'txt',
    'doc',
    'docx',
  ];

  return allowedExtensions.includes(extension) ? extension : 'bin';
}

/**
 * 表示用ファイル名を生成（セキュア）
 */
export function generateDisplayFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const extension = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));

  // 表示用は更に制限（英数字とハイフン、アンダースコアのみ）
  const displayName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50); // 50文字まで

  return `${displayName}.${extension}`;
}

/**
 * プリサインドURL有効期限の検証
 */
export function validatePresignedExpires(expiresIn: number): number {
  if (expiresIn < 1) {
    return MEDIA_V2_CONSTANTS.DEFAULT_PRESIGNED_EXPIRES;
  }
  if (expiresIn > MEDIA_V2_CONSTANTS.MAX_PRESIGNED_EXPIRES) {
    return MEDIA_V2_CONSTANTS.MAX_PRESIGNED_EXPIRES;
  }
  return expiresIn;
}
