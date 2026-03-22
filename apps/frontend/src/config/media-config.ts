/**
 * 🎯 フロントエンド統一メディア設定管理システム
 *
 * 責任:
 * - 画像アップロード制限の統一管理
 * - エラーメッセージの統一管理
 * - 設定の一元管理
 * - 環境別設定の管理
 */

import { SUPPORTED_IMAGE_FORMATS } from '@libark/core-shared/config';
import { envUtils } from '@libark/core-shared';

// ================================
// ユーティリティ関数
// ================================

/**
 * MIME_TO_EXTENSIONSから全ての拡張子を抽出
 */
function getAllowedExtensions(): string[] {
  const extensions: string[] = [];
  Object.values(SUPPORTED_IMAGE_FORMATS.MIME_TO_EXTENSIONS).forEach(exts => {
    extensions.push(...exts);
  });
  return extensions;
}

// ================================
// 基本設定
// ================================

/**
 * 🎯 画像アップロード制限設定
 */
export const IMAGE_UPLOAD_LIMITS = {
  // 投稿画像
  POST: {
    maxFiles: 4,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 40 * 1024 * 1024, // 40MB
    allowedTypes: [...SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES],
    allowedExtensions: getAllowedExtensions(),
  },

  // アバター画像
  AVATAR: {
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  // カバー画像
  COVER: {
    maxFiles: 1,
    maxFileSize: 8 * 1024 * 1024, // 8MB
    maxTotalSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
} as const;

/**
 * 🎯 統一エラーメッセージ
 */
export const ERROR_MESSAGES = {
  // ファイル関連エラー
  FILE_TOO_LARGE: (maxSize: number) =>
    `ファイルサイズが大きすぎます。${formatFileSize(maxSize)}以下にしてください。`,
  FILE_TYPE_NOT_SUPPORTED: (allowedTypes: string[]) =>
    `サポートされていないファイル形式です。対応形式: ${allowedTypes.join(', ')}`,
  TOO_MANY_FILES: (maxFiles: number) => `ファイル数が多すぎます。最大${maxFiles}ファイルまでです。`,
  TOTAL_SIZE_TOO_LARGE: (maxTotalSize: number) =>
    `合計ファイルサイズが大きすぎます。${formatFileSize(maxTotalSize)}以下にしてください。`,

  // アップロード関連エラー
  UPLOAD_FAILED: 'アップロードに失敗しました。しばらく時間をおいて再試行してください。',
  UPLOAD_CANCELLED: 'アップロードがキャンセルされました。',
  UPLOAD_TIMEOUT: 'アップロードがタイムアウトしました。ネットワーク接続を確認してください。',

  // 認証関連エラー
  AUTH_REQUIRED: 'ログインが必要です。',
  AUTH_EXPIRED: 'セッションが期限切れです。再度ログインしてください。',
  PERMISSION_DENIED: 'この操作を実行する権限がありません。',

  // ネットワーク関連エラー
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらく時間をおいて再試行してください。',

  // 処理関連エラー
  PROCESSING_FAILED: '画像処理に失敗しました。',
  PROCESSING_TIMEOUT: '画像処理がタイムアウトしました。',

  // 一般的なエラー
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
} as const;

/**
 * 🎯 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'アップロードが完了しました。',
  PROCESSING_SUCCESS: '画像処理が完了しました。',
  POST_CREATED: '投稿を作成しました。',
  AVATAR_UPDATED: 'アバターを更新しました。',
  COVER_UPDATED: 'カバー画像を更新しました。',
} as const;

/**
 * 🎯 処理中メッセージ
 */
export const PROCESSING_MESSAGES = {
  UPLOADING: 'アップロード中...',
  PROCESSING: '画像処理中...',
  SAVING: '保存中...',
  PREPARING: '準備中...',
} as const;

// ================================
// ユーティリティ関数
// ================================

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ファイル拡張子を取得
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

/**
 * ファイル形式の検証
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * ファイル拡張子の検証
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
}

/**
 * ファイルサイズの検証
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * 合計ファイルサイズの検証
 */
export function validateTotalFileSize(files: File[], maxTotalSize: number): boolean {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return totalSize <= maxTotalSize;
}

/**
 * ファイル数の検証
 */
export function validateFileCount(files: File[], maxFiles: number): boolean {
  return files.length <= maxFiles;
}

// ================================
// 設定取得関数
// ================================

/**
 * メディアタイプ別設定を取得
 */
export function getMediaConfig(mediaType: keyof typeof IMAGE_UPLOAD_LIMITS) {
  return IMAGE_UPLOAD_LIMITS[mediaType];
}

/**
 * 統一ファイル検証関数
 */
export function validateFiles(
  files: File[],
  mediaType: keyof typeof IMAGE_UPLOAD_LIMITS
): { isValid: boolean; errors: string[] } {
  const config = getMediaConfig(mediaType);
  const errors: string[] = [];

  // ファイル数チェック
  if (!validateFileCount(files, config.maxFiles)) {
    errors.push(ERROR_MESSAGES.TOO_MANY_FILES(config.maxFiles));
  }

  // 合計サイズチェック
  if (!validateTotalFileSize(files, config.maxTotalSize)) {
    errors.push(ERROR_MESSAGES.TOTAL_SIZE_TOO_LARGE(config.maxTotalSize));
  }

  // 個別ファイルチェック
  for (const file of files) {
    // ファイルサイズチェック
    if (!validateFileSize(file, config.maxFileSize)) {
      errors.push(ERROR_MESSAGES.FILE_TOO_LARGE(config.maxFileSize));
      break; // 同じエラーを重複させない
    }

    // ファイル形式チェック
    if (!validateFileType(file, [...config.allowedTypes])) {
      errors.push(ERROR_MESSAGES.FILE_TYPE_NOT_SUPPORTED([...config.allowedExtensions]));
      break; // 同じエラーを重複させない
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 🎯 環境別設定
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    enableDebugLogs: true,
    enablePerformanceMonitoring: true,
    showDetailedErrors: true,
  },
  production: {
    enableDebugLogs: false,
    enablePerformanceMonitoring: false,
    showDetailedErrors: false,
  },
} as const;

/**
 * 現在の環境設定を取得
 */
export function getEnvironmentConfig() {
  const nodeEnv = envUtils.getNodeEnv();
  const env = nodeEnv as keyof typeof ENVIRONMENT_CONFIG;
  return ENVIRONMENT_CONFIG[env] || ENVIRONMENT_CONFIG.development;
}

/**
 * 🎯 統一パフォーマンス設定
 */
export const PERFORMANCE_CONFIG = {
  // 画像遅延読み込み設定
  lazyLoading: {
    enabled: true,
    rootMargin: '50px',
    threshold: 0.1,
    // 特化型設定
    post: {
      rootMargin: '100px',
      threshold: 0.1,
      timeout: 10000,
      enableQualityCheck: true,
    },
    avatar: {
      rootMargin: '50px',
      threshold: 0.2,
      timeout: 6000,
      enableQualityCheck: true,
    },
    thumbnail: {
      rootMargin: '200px',
      threshold: 0.05,
      timeout: 5000,
      enableQualityCheck: false,
    },
  },

  // キャッシュ設定
  cache: {
    maxAge: 5 * 60 * 1000, // 5分
    maxSize: 100, // 最大100アイテム
    // エラーキャッシュ設定
    errorCache: {
      maxAge: 5 * 60 * 1000, // 5分
      maxRetries: 3,
      retryIntervals: {
        network: 30000, // 30秒
        auth: 60000, // 1分
        'not-found': 300000, // 5分
        permission: 600000, // 10分
        generic: 60000, // 1分
      },
    },
    // BlobURLキャッシュ設定
    blobCache: {
      maxSize: 50, // 最大50アイテム
      cleanupInterval: 300000, // 5分間隔でクリーンアップ（負荷軽減）
    },
  },

  // リトライ設定
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1秒
    maxDelay: 10000, // 10秒
    backoffMultiplier: 2, // 指数バックオフ
  },

  // ネットワーク設定
  network: {
    timeout: 8000, // 8秒
    authTimeout: 10000, // 認証付きは10秒
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },

  // 品質チェック設定
  qualityCheck: {
    enabled: true,
    minWidth: 1,
    minHeight: 1,
    maxWidth: 8192,
    maxHeight: 8192,
  },
} as const;
