/**
 * Post関係の型定義
 */

import type { PostVisibility } from '@libark/graphql-client';

/**
 * 投稿リストのフィルター設定
 */
export interface PostListFilters {
  /** 投稿タイプ */
  type: 'all' | 'media' | 'liked';
  /** タイムラインタイプ */
  timelineType: 'ALL' | 'FOLLOWING';
  /** ユーザーID（特定ユーザーの投稿のみ表示する場合） */
  userId?: string;
  /** 公開範囲フィルター */
  visibility?: PostVisibility;
  /** 表示件数制限 */
  limit?: number;
}

/**
 * 投稿リストの表示設定
 */
export interface PostListDisplayOptions {
  /** 無限スクロールを有効にするか */
  enableInfiniteScroll?: boolean;
  /** 削除確認ダイアログを表示するか */
  showDeleteConfirmation?: boolean;
  /** 空状態のメッセージ */
  emptyStateMessage?: string;
}

/**
 * 投稿詳細の表示バリアント
 */
export type PostDetailVariant = 'default' | 'detail' | 'compact';

/**
 * 投稿アクションの種類
 */
export type PostActionType = 'like' | 'comment' | 'share' | 'delete';

/**
 * 投稿の処理状態
 */
export interface PostProcessingState {
  /** 処理中かどうか */
  isProcessing: boolean;
  /** 処理の種類 */
  processingType?: 'creating' | 'updating' | 'deleting' | 'uploading';
  /** 進捗率（0-100） */
  progress?: number;
  /** エラーメッセージ */
  error?: string;
}
