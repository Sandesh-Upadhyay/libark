/**
 * 🚨 統一アップロードエラーシステム
 *
 * 全てのアップロード処理で一貫したエラーハンドリングを提供
 * フロントエンド、バックエンド、S3ゲートウェイ間でのエラー形式を統一
 */

/**
 * エラーコードの定義
 * 全てのアップロード関連エラーで使用される標準コード
 */
export const UPLOAD_ERROR_CODES = {
  // バリデーションエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  EMPTY_FILE: 'EMPTY_FILE',
  INVALID_FILENAME: 'INVALID_FILENAME',
  SIZE_MISMATCH: 'SIZE_MISMATCH',

  // 認証・認可エラー
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // ネットワーク・インフラエラー
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  S3_GATEWAY_ERROR: 'S3_GATEWAY_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',

  // サーバーエラー
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',

  // 設定・システムエラー
  UNKNOWN_MEDIA_TYPE: 'UNKNOWN_MEDIA_TYPE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  FEATURE_DISABLED: 'FEATURE_DISABLED',

  // 一般的なエラー
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[keyof typeof UPLOAD_ERROR_CODES];

/**
 * エラー詳細情報の型定義
 */
export interface ErrorDetails {
  [key: string]: unknown;
  timestamp?: string;
  requestId?: string;
  userId?: string;
  mediaType?: string;
  filename?: string;
  fileSize?: number;
}

/**
 * 統一アップロードエラークラス
 * 全てのアップロード関連エラーで使用される基底クラス
 */
export class UnifiedUploadError extends Error {
  public readonly code: UploadErrorCode;
  public readonly details: ErrorDetails;
  public readonly timestamp: string;
  public readonly isRetryable: boolean;

  constructor(
    code: UploadErrorCode,
    message: string,
    details: ErrorDetails = {},
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'UnifiedUploadError';
    this.code = code;

    // タイムスタンプを確実に文字列として設定
    const timestamp = new Date().toISOString();
    this.details = {
      ...details,
      timestamp,
    };
    this.timestamp = timestamp;
    this.isRetryable = isRetryable;

    // Error.captureStackTrace が利用可能な場合のみ使用
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnifiedUploadError);
    }
  }

  /**
   * バリデーションエラーの作成
   */
  static fromValidation(field: string, message: string, value?: unknown): UnifiedUploadError {
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.VALIDATION_ERROR,
      message,
      { field, value },
      false
    );
  }

  /**
   * ファイルサイズエラーの作成
   */
  static fromFileSize(fileSize: number, maxSize: number, filename?: string): UnifiedUploadError {
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.FILE_TOO_LARGE,
      `ファイルサイズが大きすぎます。最大: ${formatFileSize(maxSize)}`,
      { fileSize, maxSize, filename },
      false
    );
  }

  /**
   * ファイルタイプエラーの作成
   */
  static fromFileType(
    fileType: string,
    allowedTypes: string[],
    filename?: string
  ): UnifiedUploadError {
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.UNSUPPORTED_FILE_TYPE,
      `サポートされていないファイル形式: ${fileType}`,
      { fileType, allowedTypes, filename },
      false
    );
  }

  /**
   * ネットワークエラーの作成
   */
  static fromNetwork(status: number, statusText: string, url?: string): UnifiedUploadError {
    const isRetryable = status >= 500 || status === 408 || status === 429;
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.NETWORK_ERROR,
      `ネットワークエラー: ${status} ${statusText}`,
      { status, statusText, url },
      isRetryable
    );
  }

  /**
   * サーバーエラーの作成
   */
  static fromServer(
    serverError: { code?: string; message?: string; details?: Record<string, unknown> },
    requestId?: string
  ): UnifiedUploadError {
    const code = (serverError.code as UploadErrorCode) || UPLOAD_ERROR_CODES.SERVER_ERROR;
    const message = serverError.message || 'サーバーエラーが発生しました';
    const isRetryable = code === UPLOAD_ERROR_CODES.SERVER_ERROR;

    return new UnifiedUploadError(
      code,
      message,
      { ...serverError.details, requestId },
      isRetryable
    );
  }

  /**
   * タイムアウトエラーの作成
   */
  static fromTimeout(timeoutMs: number): UnifiedUploadError {
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.TIMEOUT_ERROR,
      `アップロードがタイムアウトしました (${timeoutMs}ms)`,
      { timeoutMs },
      true
    );
  }

  /**
   * 認証エラーの作成
   */
  static fromAuthentication(message?: string): UnifiedUploadError {
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.UNAUTHENTICATED,
      message || '認証が必要です',
      {},
      false
    );
  }

  /**
   * 認可エラーの作成
   */
  static fromAuthorization(resource: string, action: string): UnifiedUploadError {
    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.UNAUTHORIZED,
      `${resource}への${action}権限がありません`,
      { resource, action },
      false
    );
  }

  /**
   * エラーの詳細情報を含むオブジェクトに変換
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }

  /**
   * ユーザー向けの表示用メッセージを取得
   */
  getUserMessage(): string {
    switch (this.code) {
      case UPLOAD_ERROR_CODES.FILE_TOO_LARGE:
        return 'ファイルサイズが大きすぎます。';
      case UPLOAD_ERROR_CODES.UNSUPPORTED_FILE_TYPE:
        return 'サポートされていないファイル形式です。';
      case UPLOAD_ERROR_CODES.TOO_MANY_FILES:
        return 'ファイル数が多すぎます。';
      case UPLOAD_ERROR_CODES.NETWORK_ERROR:
        return 'ネットワークエラーが発生しました。しばらく待ってから再試行してください。';
      case UPLOAD_ERROR_CODES.UNAUTHENTICATED:
        return 'ログインが必要です。';
      case UPLOAD_ERROR_CODES.UNAUTHORIZED:
        return 'この操作を実行する権限がありません。';
      case UPLOAD_ERROR_CODES.QUOTA_EXCEEDED:
        return 'アップロード容量の上限に達しています。';
      case UPLOAD_ERROR_CODES.TIMEOUT_ERROR:
        return 'アップロードがタイムアウトしました。再試行してください。';
      default:
        return 'アップロードに失敗しました。';
    }
  }

  /**
   * エラーが特定のコードかどうかをチェック
   */
  isCode(code: UploadErrorCode): boolean {
    return this.code === code;
  }

  /**
   * エラーがリトライ可能かどうかをチェック
   */
  canRetry(): boolean {
    return this.isRetryable;
  }
}

/**
 * エラーハンドリングユーティリティ関数
 */
export class UploadErrorHandler {
  /**
   * 未知のエラーを統一エラーに変換
   */
  static normalize(error: unknown): UnifiedUploadError {
    if (error instanceof UnifiedUploadError) {
      return error;
    }

    if (error instanceof Error) {
      return new UnifiedUploadError(
        UPLOAD_ERROR_CODES.UNKNOWN_ERROR,
        error.message,
        { originalError: error.name },
        false
      );
    }

    return new UnifiedUploadError(
      UPLOAD_ERROR_CODES.UNKNOWN_ERROR,
      '不明なエラーが発生しました',
      { originalError: String(error) },
      false
    );
  }

  /**
   * エラーログの出力
   */
  static logError(error: UnifiedUploadError, context?: Record<string, unknown>): void {
    const logData = {
      ...error.toJSON(),
      context,
    };

    if (error.isRetryable) {
      console.warn('Retryable upload error:', logData);
    } else {
      console.error('Upload error:', logData);
    }
  }

  /**
   * エラーの重要度を判定
   */
  static getSeverity(error: UnifiedUploadError): 'low' | 'medium' | 'high' | 'critical' {
    switch (error.code) {
      case UPLOAD_ERROR_CODES.VALIDATION_ERROR:
      case UPLOAD_ERROR_CODES.FILE_TOO_LARGE:
      case UPLOAD_ERROR_CODES.UNSUPPORTED_FILE_TYPE:
      case UPLOAD_ERROR_CODES.TOO_MANY_FILES:
        return 'low';

      case UPLOAD_ERROR_CODES.UNAUTHENTICATED:
      case UPLOAD_ERROR_CODES.UNAUTHORIZED:
      case UPLOAD_ERROR_CODES.NETWORK_ERROR:
      case UPLOAD_ERROR_CODES.TIMEOUT_ERROR:
        return 'medium';

      case UPLOAD_ERROR_CODES.SERVER_ERROR:
      case UPLOAD_ERROR_CODES.DATABASE_ERROR:
      case UPLOAD_ERROR_CODES.S3_GATEWAY_ERROR:
        return 'high';

      case UPLOAD_ERROR_CODES.CONFIGURATION_ERROR:
      case UPLOAD_ERROR_CODES.INTERNAL_ERROR:
        return 'critical';

      default:
        return 'medium';
    }
  }
}

/**
 * ファイルサイズのフォーマット用ユーティリティ
 */
function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

/**
 * 型ガード関数
 */
export function isUnifiedUploadError(error: unknown): error is UnifiedUploadError {
  return error instanceof UnifiedUploadError;
}

/**
 * エラーコードの型ガード
 */
export function isValidErrorCode(code: string): code is UploadErrorCode {
  return Object.values(UPLOAD_ERROR_CODES).includes(code as UploadErrorCode);
}
