import React from 'react';

/**
 * 🎯 画像キャッシュフックの戻り値型（統一・強化版）
 */
export interface ImageCacheHookReturn {
  /** BlobURL（キャッシュされた画像URL） */
  blobUrl: string | null;
  /** 読み込み中かどうか */
  isLoading: boolean;
  /** エラーが発生したかどうか */
  isError: boolean;
  /** エラー詳細 */
  error: Error | null;
  /** プリロード機能 */
  preloadImage: (mediaId: string, variant: string) => void;
  /** キャッシュ統計 */
  cacheStats: {
    hits: number;
    misses: number;
    totalCached: number;
    apolloCached: boolean;
  };
}

/**
 * 🎯 画像キャッシュフック型定義（統一）
 */
export type ImageCacheHook = (
  mediaId: string,
  variant: 'thumb' | 'main' | 'high' | 'blur'
) => ImageCacheHookReturn;

// 楽観的メディアオブジェクトの型定義（media-clientから独立）
export interface _OptimisticMediaObject {
  id: string;
  blobUrl: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  displayOrder: number;
  mediaId?: string;
  postId?: string;
}

/**
 * 🎯 統一画像ソース型定義（新版）
 *
 * 全ての画像タイプを統一的に扱うための型システム
 * imageUtils.tsのUnifiedImageSourceと統合
 */
export type ImageSource =
  | { type: 'blob'; url: string; file?: File }
  | { type: 'simple-blob'; url: string; file?: File; index: number }
  | {
      type: 'media';
      mediaId: string;
      variant?: 'thumb' | 'main' | 'high' | 'blur' | 'medium' | 'large' | 'webp';
      s3Path?: string;
      variants?: Array<{
        id: string;
        type: string;
        s3Key: string;
        width?: number;
        height?: number;
        fileSize?: number;
        quality?: number;
        url?: string;
        createdAt: string;
      }>;
    }
  | { type: 'url'; url: string };

/**
 * 🎯 統一画像コンポーネントのプロパティ（削除済み）
 * MediaVariantImageとBlobImageを直接使用してください
 */

/**
 * 🎯 ステータスオーバーレイのプロパティ（削除済み - 未使用）
 */
// export interface StatusOverlayProps {
//   status: 'uploading' | 'processing' | 'completed' | 'error';
//   progress?: number;
// }

/**
 * 🎯 画像ソース判定ユーティリティ
 */
export const isImageSource = {
  blob: (source: ImageSource): source is Extract<ImageSource, { type: 'blob' }> =>
    source.type === 'blob',
  simpleBlob: (source: ImageSource): source is Extract<ImageSource, { type: 'simple-blob' }> =>
    source.type === 'simple-blob',
  media: (source: ImageSource): source is Extract<ImageSource, { type: 'media' }> =>
    source.type === 'media',
  url: (source: ImageSource): source is Extract<ImageSource, { type: 'url' }> =>
    source.type === 'url',
};

/**
 * 🎯 画像ソース作成ヘルパー（統一版対応）
 */
export const createImageSource = {
  blob: (url: string, file?: File): ImageSource => ({
    type: 'blob',
    url,
    file,
  }),
  media: (
    mediaId: string,
    variant?: 'thumb' | 'main' | 'high' | 'blur' | 'medium' | 'large' | 'webp',
    s3Path?: string
  ): ImageSource => ({
    type: 'media',
    mediaId,
    variant,
    s3Path,
  }),
  url: (url: string): ImageSource => ({ type: 'url', url }),
};

/**
 * 🎯 統一画像表示プロパティ（新版）
 *
 * UnifiedImageDisplayコンポーネント用の統一プロパティ
 */
export interface UnifiedImageDisplayProps {
  /** 画像ソース（メディアID、URL、またはBlob URL） */
  src?: string | null;
  /** バリアント（メディアIDの場合） */
  variant?: 'thumb' | 'main' | 'medium' | 'large' | 'high' | 'blur' | 'webp';
  /** alt属性 */
  alt?: string;
  /** CSSクラス */
  className?: string;
  /** 幅 */
  width?: number | string;
  /** 高さ */
  height?: number | string;
  /** オブジェクトフィット */
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  /** 優先読み込み */
  priority?: boolean;
  /** フォールバック設定 */
  fallbackConfig?: {
    type: 'avatar' | 'cover' | 'post' | 'default';
    displayName?: string | null;
    username?: string | null;
    customMessage?: string;
    showIcon?: boolean;
  };
  /** カスタムプレースホルダー */
  placeholder?: React.ReactNode;
  /** 読み込み完了時のコールバック */
  onLoad?: () => void;
  /** エラー時のコールバック */
  onError?: (error: Error) => void;
  /** クリック時のコールバック */
  onClick?: () => void;
  /** ローディング状態の表示 */
  showLoading?: boolean;
}

/**
 * 🎯 プレースホルダー設定
 */
export interface PlaceholderConfig {
  message?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
  customContent?: React.ReactNode;
}

// PostImageContainerProps は削除済み（PostCreatorImageGridで代替）

/**
 * 🎯 画像アップロードボタンのプロパティ
 */
export interface ImageUploadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  label?: string;
}
