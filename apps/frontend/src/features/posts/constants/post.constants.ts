/**
 * Post機能の定数定義
 */

import { VALIDATION_LIMITS, VALIDATION_FILES } from '@/lib/constants/validation';
import { UI_PAGINATION } from '@/lib/constants/ui-config';
import type { PostCreatorConfig } from '@/features/posts/types';

/**
 * 投稿作成フォームの設定
 */
export const POST_FORM_CONFIG: PostCreatorConfig = {
  /** 最大文字数 */
  maxContentLength: VALIDATION_LIMITS.post.contentMax,
  /** 最大画像数 */
  maxImageCount: VALIDATION_FILES.image.maxCount,
  /** 許可される画像形式 */
  allowedImageTypes: [...VALIDATION_FILES.image.allowedTypes],
  /** 最大ファイルサイズ（10MB） */
  maxFileSize: VALIDATION_FILES.image.maxSize,
};

/**
 * 投稿リストの設定
 */
export const POST_LIST_CONFIG = {
  /** デフォルトの表示件数 */
  defaultLimit: UI_PAGINATION.posts.limit,
  /** 無限スクロールのトリガーマージン */
  infiniteScrollMargin: '200px',
  /** 最大表示件数 */
  maxLimit: UI_PAGINATION.posts.maxLimit,
} as const;

/**
 * 投稿詳細の設定
 */
export const POST_DETAIL_CONFIG = {
  /** 内容の切り詰め文字数（詳細表示では無制限） */
  truncateLength: Number.MAX_SAFE_INTEGER,
  /** コメント表示件数 */
  commentsLimit: 50,
} as const;

/**
 * 投稿アクションの設定
 */
export const POST_ACTIONS_CONFIG = {
  /** いいねボタンのデバウンス時間（ms） */
  likeDebounceMs: 300,
  /** 削除確認ダイアログのタイムアウト（ms） */
  deleteConfirmTimeoutMs: 5000,
} as const;

/**
 * エラーメッセージ
 */
export const POST_ERROR_MESSAGES = {
  /** 内容が空の場合 */
  emptyContent: '投稿内容を入力してください',
  /** 文字数超過 */
  contentTooLong: `投稿内容は${POST_FORM_CONFIG.maxContentLength}文字以内で入力してください`,
  /** 画像数超過 */
  tooManyImages: `画像は${POST_FORM_CONFIG.maxImageCount}枚まで選択できます`,
  /** ファイルサイズ超過 */
  fileTooLarge: `ファイルサイズは${POST_FORM_CONFIG.maxFileSize / (1024 * 1024)}MB以下にしてください`,
  /** 未対応ファイル形式 */
  unsupportedFileType: '対応していないファイル形式です',
  /** ネットワークエラー */
  networkError: 'ネットワークエラーが発生しました',
  /** 認証エラー */
  authError: '認証が必要です',
  /** 一般的なエラー */
  genericError: 'エラーが発生しました',
} as const;

/**
 * 成功メッセージ
 */
export const POST_SUCCESS_MESSAGES = {
  /** 投稿作成成功 */
  postCreated: '投稿を作成しました',
  /** 投稿削除成功 */
  postDeleted: '投稿を削除しました',
  /** いいね成功 */
  liked: 'いいねしました',
  /** いいね取り消し成功 */
  unliked: 'いいねを取り消しました',
} as const;
