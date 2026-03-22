/**
 * 🎯 メディア処理統一型定義
 *
 * MediaProcessingWorkerとその関連システムで使用される
 * 統一型定義を提供し、フロントエンド・バックエンド・ワーカー間での
 * 型安全性と一貫性を確保
 */

// ================================
// ジョブデータ型定義
// ================================

/**
 * メディア処理ジョブのデータ型
 * BullMQキューで使用される統一ジョブデータ形式
 */
export interface MediaProcessingJobData {
  /** メディアID（UUID） */
  mediaId: string;
  /** ユーザーID（UUID） */
  userId: string;
  /** メディアタイプ（統一形式：post, avatar, cover, ogp） */
  mediaType: string;
}

// ================================
// バリアント設定型定義
// ================================

/**
 * バリアントタイプの列挙型
 * 全てのメディア処理で使用される標準バリアント
 * PrismaスキーマのVariantType enumに準拠
 */
export type VariantType = 'THUMB' | 'MEDIUM' | 'LARGE' | 'OGP' | 'BLUR';

/**
 * オンデマンドOGP用バリアントタイプ
 * s3-gatewayで使用されるOGP専用バリアント
 */
export type OnDemandOgpVariantType = 'STANDARD' | 'TEASER_TEMPLATE';

/**
 * Sharp.jsのfitオプション型
 * 画像リサイズ時の動作を定義
 */
export type SharpFitType = 'cover' | 'contain' | 'fill' | 'inside';

/**
 * メディア処理バリアント設定の型定義
 * 各バリアントの生成パラメータを定義
 */
export interface MediaProcessingVariantConfig {
  /** バリアントタイプ */
  variantType: VariantType;
  /** 幅（ピクセル） */
  width: number;
  /** 高さ（ピクセル） */
  height: number;
  /** リサイズ方法 */
  fit: SharpFitType;
  /** 品質（1-100） */
  quality: number;
}

/**
 * メディアタイプ別バリアント設定
 * 各メディアタイプに対応するバリアント設定の配列
 */
export type MediaTypeVariantConfigs = Record<string, MediaProcessingVariantConfig[]>;

/**
 * 特殊バリアント設定（Worker事前生成用）
 * BLURのみ
 */
export interface SpecialVariantConfigs {
  BLUR: MediaProcessingVariantConfig;
}

/**
 * オンデマンドOGP用バリアント設定
 * s3-gatewayで使用されるOGP専用バリアント
 */
export interface OnDemandOgpVariantConfig {
  variantType: OnDemandOgpVariantType;
  width: number;
  height: number;
  fit: SharpFitType;
  quality: number;
}

/**
 * オンデマンドOGP設定（s3-gatewayで使用）
 * OGPはオンデマンド生成へ移行済み
 */
export interface OnDemandOgpConfigs {
  STANDARD: OnDemandOgpVariantConfig;
  TEASER_TEMPLATE: OnDemandOgpVariantConfig;
}

// ================================
// 進捗通知型定義
// ================================

/**
 * アップロード進捗の状態
 */
export type UploadProgressStatus = 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * アップロード進捗データ
 * リアルタイム通知で使用される進捗情報
 */
export interface UploadProgressData {
  /** メディアID */
  mediaId: string;
  /** 進捗状態 */
  status: UploadProgressStatus;
  /** 進捗率（0-100） */
  progress: number;
  /** 進捗メッセージ */
  message: string;
}

/**
 * 進捗通知イベントデータ
 * Redis Pub/Subで送信される通知データ
 */
export interface ProgressNotificationEvent {
  /** イベントタイプ */
  type: 'UPLOAD_PROGRESS';
  /** タイムスタンプ */
  timestamp: string;
  /** メディアID */
  mediaId: string;
  /** 進捗データ */
  uploadProgress: UploadProgressData;
}

// ================================
// 画像メタデータ型定義
// ================================

/**
 * 画像メタデータ
 * Sharp.jsから取得される画像情報
 */
export interface ImageMetadata {
  /** 幅（ピクセル） */
  width?: number;
  /** 高さ（ピクセル） */
  height?: number;
  /** 画像形式 */
  format?: string;
  /** チャンネル数 */
  channels?: number;
  /** 密度（DPI） */
  density?: number;
  /** アルファチャンネルの有無 */
  hasAlpha?: boolean;
  /** 画像の向き */
  orientation?: number;
}

// ================================
// S3アップロード型定義
// ================================

/**
 * S3アップロード用メタデータ
 * S3 Gateway APIに送信されるメタデータ
 */
export interface S3UploadMetadata {
  /** メディアID */
  mediaId: string;
  /** バリアント名 */
  variant: string;
  /** 処理日時 */
  processedAt: string;
}

// ================================
// エラー型定義
// ================================

/**
 * メディア処理エラーの種類
 */
export type MediaProcessingErrorType =
  | 'MEDIA_NOT_FOUND'
  | 'DOWNLOAD_FAILED'
  | 'PROCESSING_FAILED'
  | 'UPLOAD_FAILED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * メディア処理エラー情報
 */
export interface MediaProcessingError {
  /** エラータイプ */
  type: MediaProcessingErrorType;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 */
  details?: Record<string, unknown>;
  /** 元のエラー */
  originalError?: Error;
}

// ================================
// 投稿処理完了通知型定義
// ================================

/**
 * 投稿処理完了通知データ
 * 楽観的更新対応のための通知データ
 */
export interface PostProcessingCompletedData {
  /** イベントタイプ */
  type: 'post_processing_completed' | 'all_posts_processing_updated';
  /** 投稿データ */
  post: {
    id: string;
    isProcessing: boolean;
    likesCount: number;
    commentsCount: number;
    isLikedByCurrentUser: boolean;
    [key: string]: unknown;
  };
  /** タイムスタンプ */
  timestamp: string;
}

// ================================
// 型ガード関数
// ================================

/**
 * VariantTypeの型ガード
 */
export function isValidVariantType(value: string): value is VariantType {
  return ['THUMB', 'MEDIUM', 'LARGE', 'OGP', 'BLUR'].includes(value);
}

/**
 * SharpFitTypeの型ガード
 */
export function isValidSharpFitType(value: string): value is SharpFitType {
  return ['cover', 'contain', 'fill', 'inside'].includes(value);
}

/**
 * UploadProgressStatusの型ガード
 */
export function isValidUploadProgressStatus(value: string): value is UploadProgressStatus {
  return ['UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(value);
}
