/**
 * 投稿作成関係の型定義
 */

import type { PostVisibility } from '@libark/graphql-client';

/**
 * 投稿作成フォームの状態
 */
export interface PostCreatorState {
  /** 投稿内容 */
  content: string;
  /** 公開範囲 */
  visibility: PostVisibility;
  /** 価格（有料投稿の場合） */
  price?: number;
  /** 選択された画像ファイル */
  selectedImages: File[];
  /** アップロード中かどうか */
  isUploading: boolean;
  /** 送信中かどうか */
  isSubmitting: boolean;
  /** フォーカス状態 */
  isFocused: boolean;
  /** 画像があるかどうか */
  hasImages: boolean;
  /** エラーメッセージ */
  contentError?: string;
  /** アップロードエラー */
  uploadError?: string;
  /** 送信エラー */
  submitError?: string;
}

/**
 * 投稿作成フォームのアクション
 */
export interface PostCreatorActions {
  /** 内容を設定 */
  setContent: (content: string) => void;
  /** 公開範囲を設定 */
  setVisibility: (visibility: PostVisibility) => void;
  /** 価格を設定 */
  setPrice: (price?: number) => void;
  /** フォーカス状態を設定 */
  setIsFocused: (focused: boolean) => void;
  /** 画像の有無を設定 */
  setHasImages: (hasImages: boolean) => void;
  /** アップロード状態を設定 */
  setIsUploading: (uploading: boolean) => void;
  /** 送信状態を設定 */
  setIsSubmitting: (submitting: boolean) => void;
  /** 内容エラーを設定 */
  setContentError: (error?: string) => void;
  /** アップロードエラーを設定 */
  setUploadError: (error?: string) => void;
  /** 送信エラーを設定 */
  setSubmitError: (error?: string) => void;
  /** フォームをリセット */
  reset: () => void;
}

/**
 * 投稿送信データ
 */
export interface PostSubmissionData {
  /** 投稿内容 */
  content: string;
  /** 公開範囲 */
  visibility: PostVisibility;
  /** 価格（有料投稿の場合） */
  price?: number;
  /** メディアID配列 */
  mediaIds?: string[];
}

/**
 * 投稿作成の設定
 */
export interface PostCreatorConfig {
  /** 最大文字数 */
  maxContentLength: number;
  /** 最大画像数 */
  maxImageCount: number;
  /** 許可される画像形式 */
  allowedImageTypes: string[];
  /** 最大ファイルサイズ（バイト） */
  maxFileSize: number;
}
