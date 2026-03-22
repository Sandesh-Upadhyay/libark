/**
 * 📤 アップロード設定
 *
 * ファイルアップロードに関する統一設定を提供
 * フロントエンド・バックエンド・ワーカーで共通利用
 */

import { getConfig } from './validation.js';
import { envUtils } from './environment-strategy.js';
import { SUPPORTED_IMAGE_FORMATS, UPLOAD_CONSTANTS } from './constants.js';
import type { UploadConfig } from './schema.js';

/**
 * 🎯 統一ファイルサイズ制限
 * フロントエンド・バックエンド・ワーカーで共通利用
 *
 * ⚠️ 注意: UPLOAD_CONSTANTSを使用して統一管理
 */
export const UNIFIED_FILE_LIMITS = {
  // 一般的なメディアファイル（統一定数を使用）
  MEDIA_MAX_SIZE_MB: UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB,
  MEDIA_MAX_SIZE_BYTES: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,

  // アバター専用（統一定数を使用）
  AVATAR_MAX_SIZE_MB: UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB,
  AVATAR_MAX_SIZE_BYTES: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,

  // 最大ファイル数（統一定数を使用）
  MAX_FILES_COUNT: UPLOAD_CONSTANTS.MAX_FILES_COUNT,

  // 表示用テキスト（統一定数を使用）
  DISPLAY_TEXT: UPLOAD_CONSTANTS.DISPLAY_TEXT,
} as const;

/**
 * 🎯 アップロード設定の取得
 */
export function getUploadConfig(): UploadConfig & {
  // 計算済みの値を追加
  maxFileSizeBytes: number;
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  rateLimitMax: number;
  maxFiles: number;
} {
  const config = getConfig();

  return {
    UPLOAD_MAX_FILE_SIZE_MB: config.UPLOAD_MAX_FILE_SIZE_MB,
    UPLOAD_MAX_FILES: config.UPLOAD_MAX_FILES,
    UPLOAD_ALLOWED_TYPES: config.UPLOAD_ALLOWED_TYPES,
    UPLOAD_RATE_LIMIT_MAX: config.UPLOAD_RATE_LIMIT_MAX,

    // 計算済みの値
    maxFileSizeBytes:
      config.UPLOAD_MAX_FILE_SIZE_MB * UPLOAD_CONSTANTS.KB_PER_MB * UPLOAD_CONSTANTS.BYTES_PER_KB,
    maxFileSizeMB: config.UPLOAD_MAX_FILE_SIZE_MB,
    allowedMimeTypes: config.UPLOAD_ALLOWED_TYPES,
    rateLimitMax: config.UPLOAD_RATE_LIMIT_MAX,
    maxFiles: config.UPLOAD_MAX_FILES,
  };
}

/**
 * 🎯 アップロード設定の遅延初期化
 */
let cachedUploadConfig: ReturnType<typeof getUploadConfig> | null = null;

export const uploadConfig = {
  get() {
    if (!cachedUploadConfig) {
      cachedUploadConfig = getUploadConfig();
      console.log(`🔧 アップロード設定を読み込みました:`, {
        maxFileSizeMB: cachedUploadConfig.maxFileSizeMB,
        maxFiles: cachedUploadConfig.maxFiles,
        allowedMimeTypes: cachedUploadConfig.allowedMimeTypes,
        rateLimitMax: cachedUploadConfig.rateLimitMax,
      });
    }
    return cachedUploadConfig;
  },

  reload() {
    cachedUploadConfig = null;
    return this.get();
  },

  // 便利なヘルパー関数
  isValidFileSize(sizeBytes: number): boolean {
    return sizeBytes <= this.get().maxFileSizeBytes;
  },

  isValidMimeType(mimeType: string): boolean {
    return this.get().allowedMimeTypes.includes(mimeType);
  },

  formatFileSize(bytes: number): string {
    const mb = bytes / (UPLOAD_CONSTANTS.KB_PER_MB * UPLOAD_CONSTANTS.BYTES_PER_KB);
    return `${mb.toFixed(1)}MB`;
  },

  getErrorMessage(type: 'size' | 'type' | 'count', fileName?: string): string {
    const config = this.get();

    switch (type) {
      case 'size':
        return `${fileName ? `${fileName}: ` : ''}ファイルサイズが大きすぎます（最大${config.maxFileSizeMB}MB）`;
      case 'type':
        return `${fileName ? `${fileName}: ` : ''}サポートされていないファイル形式です`;
      case 'count':
        return `アップロードできるファイル数は最大${config.maxFiles}個です`;
      default:
        return 'アップロードエラーが発生しました';
    }
  },
};

/**
 * 🌐 フロントエンド用の公開設定
 * ブラウザ環境でも利用可能
 */
export function getPublicUploadConfig() {
  // 環境戦略を使用して環境判定
  const isBrowser = envUtils.isBrowser();

  if (isBrowser) {
    // フロントエンド用のデフォルト値
    const maxFileSizeMB = UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB;
    const maxFiles = UPLOAD_CONSTANTS.MAX_FILES_COUNT;
    const allowedTypes = [...SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES];

    return {
      maxFileSizeBytes: maxFileSizeMB * UPLOAD_CONSTANTS.KB_PER_MB * UPLOAD_CONSTANTS.BYTES_PER_KB,
      maxFileSizeMB,
      allowedMimeTypes: allowedTypes,
      maxFiles,

      // ヘルパー関数
      isValidFileSize: (sizeBytes: number) =>
        sizeBytes <= maxFileSizeMB * UPLOAD_CONSTANTS.KB_PER_MB * UPLOAD_CONSTANTS.BYTES_PER_KB,
      isValidMimeType: (mimeType: string) =>
        allowedTypes.includes(mimeType as (typeof allowedTypes)[number]),
      formatFileSize: (bytes: number) =>
        `${(bytes / (UPLOAD_CONSTANTS.KB_PER_MB * UPLOAD_CONSTANTS.BYTES_PER_KB)).toFixed(1)}MB`,
      getErrorMessage: (type: 'size' | 'type' | 'count', fileName?: string) => {
        switch (type) {
          case 'size':
            return `${fileName ? `${fileName}: ` : ''}ファイルサイズが大きすぎます（最大${maxFileSizeMB}MB）`;
          case 'type':
            return `${fileName ? `${fileName}: ` : ''}サポートされていないファイル形式です`;
          case 'count':
            return `アップロードできるファイル数は最大${maxFiles}個です`;
          default:
            return 'アップロードエラーが発生しました';
        }
      },
    };
  }

  // サーバー環境では統一設定を使用
  return uploadConfig.get();
}

export default uploadConfig;
