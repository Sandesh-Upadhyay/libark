/**
 * 🎯 統一UI設定定数
 *
 * 責任:
 * - ページネーション、表示件数、UI動作の統一管理
 * - 設定値の重複防止
 * - 一貫したUI体験の提供
 *
 * 使用方法:
 * - リスト表示、ページネーション、無限スクロールでこの定数を使用
 * - ESLintルールによりハードコード設定値の使用を検出・警告
 */

/**
 * ページネーション設定
 */
export const UI_PAGINATION = {
  // 基本設定
  default: {
    limit: 20,
    maxLimit: 100,
    minLimit: 5,
  },

  // 機能別設定
  posts: {
    limit: 20,
    maxLimit: 50,
  },

  users: {
    limit: 15,
    maxLimit: 50,
  },

  comments: {
    limit: 10,
    maxLimit: 50,
  },

  notifications: {
    limit: 25,
    maxLimit: 100,
  },

  transactions: {
    limit: 20,
    maxLimit: 100,
  },
} as const;

/**
 * 無限スクロール設定
 */
export const UI_INFINITE_SCROLL = {
  // トリガーマージン（要素がビューポートに入る前の距離）
  triggerMargin: '200px',

  // 読み込み閾値（0.0 - 1.0）
  threshold: 0.1,

  // 機能別設定
  feed: {
    triggerMargin: '300px',
    threshold: 0.2,
  },

  search: {
    triggerMargin: '150px',
    threshold: 0.1,
  },
} as const;

/**
 * ローディング・スピナー設定
 */
export const UI_LOADING = {
  // 遅延表示（短時間の処理では表示しない）
  delayMs: 200,

  // 最小表示時間（チラつき防止）
  minDisplayMs: 500,

  // タイムアウト
  timeoutMs: 30000, // 30秒

  // サイズ設定
  sizes: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
} as const;

/**
 * トースト通知設定
 */
export const UI_TOAST = {
  // 表示時間（ミリ秒）
  duration: {
    short: 3000, // 3秒
    medium: 5000, // 5秒
    long: 8000, // 8秒
    persistent: 0, // 手動で閉じるまで表示
  },

  // 最大表示数
  maxToasts: 5,

  // 位置設定
  position: {
    default: 'bottom-right',
    mobile: 'bottom-center',
  },
} as const;

/**
 * モーダル・ダイアログ設定
 */
export const UI_MODAL = {
  // アニメーション時間
  animationDuration: 300,

  // 背景クリックで閉じる
  closeOnBackdropClick: true,

  // ESCキーで閉じる
  closeOnEscape: true,

  // 最大幅設定
  maxWidth: {
    small: '400px',
    medium: '600px',
    large: '800px',
    xlarge: '1200px',
  },
} as const;

/**
 * フォーム設定
 */
export const UI_FORM = {
  // デバウンス時間（入力検証の遅延）
  debounceMs: 300,

  // オートセーブ間隔
  autoSaveMs: 5000, // 5秒

  // バリデーション設定
  validation: {
    showErrorsOnBlur: true,
    showErrorsOnSubmit: true,
    clearErrorsOnFocus: true,
  },

  // ファイルアップロード
  upload: {
    chunkSize: 1024 * 1024, // 1MB chunks
    maxConcurrent: 3, // 同時アップロード数
    retryAttempts: 3, // リトライ回数
  },
} as const;

/**
 * 検索・フィルター設定
 */
export const UI_SEARCH = {
  // 検索実行の遅延（デバウンス）
  debounceMs: 500,

  // 最小検索文字数
  minLength: 2,

  // 検索結果表示件数
  resultsLimit: 10,

  // 検索履歴保存件数
  historyLimit: 10,

  // ハイライト設定
  highlight: {
    className: 'bg-yellow-200 dark:bg-yellow-800',
    maxLength: 100, // ハイライト対象の最大文字数
  },
} as const;

/**
 * テーブル設定
 */
export const UI_TABLE = {
  // デフォルト設定
  default: {
    rowsPerPage: 25,
    maxRowsPerPage: 100,
  },

  // ソート設定
  sort: {
    defaultDirection: 'asc' as const,
    multiSort: false,
  },

  // 列幅設定
  columnWidth: {
    small: '80px',
    medium: '120px',
    large: '200px',
    auto: 'auto',
  },
} as const;

/**
 * メディア・画像設定
 */
export const UI_MEDIA = {
  // 画像遅延読み込み
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1,
  },

  // 画像プレースホルダー
  placeholder: {
    backgroundColor: '#f3f4f6',
    showSkeleton: true,
  },

  // 動画設定
  video: {
    autoplay: false,
    muted: true,
    controls: true,
    preload: 'metadata' as const,
  },
} as const;

/**
 * レスポンシブ設定
 */
export const UI_RESPONSIVE = {
  // ブレークポイント（Tailwindと同期）
  breakpoints: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // モバイル判定
  mobileMaxWidth: 768,

  // タッチデバイス対応
  touch: {
    tapHighlight: false,
    scrollBehavior: 'smooth' as const,
  },
} as const;

/**
 * パフォーマンス設定
 */
export const UI_PERFORMANCE = {
  // 仮想化設定（大量データ表示）
  virtualization: {
    itemHeight: 50,
    overscan: 5,
    threshold: 100, // この件数を超えたら仮想化を有効にする
  },

  // 画像最適化
  imageOptimization: {
    quality: 80,
    format: 'webp',
    sizes: [320, 640, 768, 1024, 1280],
  },

  // キャッシュ設定
  cache: {
    maxAge: 5 * 60 * 1000, // 5分
    maxSize: 100, // 最大キャッシュ数
  },
} as const;

/**
 * アクセシビリティ設定
 */
export const UI_ACCESSIBILITY = {
  // フォーカス管理
  focus: {
    trapInModal: true,
    restoreOnClose: true,
    skipLinks: true,
  },

  // キーボードナビゲーション
  keyboard: {
    enableArrowKeys: true,
    enableTabNavigation: true,
    enableEnterActivation: true,
  },

  // スクリーンリーダー
  screenReader: {
    announceChanges: true,
    liveRegionPolite: true,
  },
} as const;

/**
 * 型定義
 */
export type UIPaginationConfig = typeof UI_PAGINATION.default;
export type UILoadingSize = keyof typeof UI_LOADING.sizes;
export type UIToastDuration = keyof typeof UI_TOAST.duration;
export type UIModalSize = keyof typeof UI_MODAL.maxWidth;
