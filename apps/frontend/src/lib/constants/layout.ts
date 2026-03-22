/**
 * レイアウト定数（レスポンシブ対応強化版）
 */

// 基本的なレイアウト定数（レスポンシブ対応）
export const HEADER_HEIGHT = {
  mobile: 56, // 3.5rem = 56px（モバイルヘッダー）
  desktop: 64, // 4rem = 64px（デスクトップナビゲーション）
} as const;

export const FOOTER_HEIGHT = {
  mobile: 56, // 3.5rem = 56px（モバイル）
  desktop: 64, // 4rem = 64px（デスクトップ）
} as const;

export const BOTTOM_NAV_HEIGHT = {
  mobile: 64, // 4rem = 64px（モバイル下部ナビゲーション）
} as const;

// ナビゲーション対応パディング定数
export const NAVIGATION_PADDING = {
  // モバイル: 上部ヘッダー + 下部ナビゲーション用、デスクトップ: 上部ナビゲーション用
  responsive: 'pt-14 pb-16 md:pt-16 md:pb-0',
  // 上部ナビゲーション用（デスクトップのみ）
  top: 'pt-16',
  // 下部ナビゲーション用（モバイルのみ）
  bottom: 'pb-16',
  // モバイルヘッダー用
  mobileHeader: 'pt-14',
  // デスクトップヘッダー用
  desktopHeader: 'pt-16',
} as const;

// コンテンツ最大幅（デバイス別）
export const CONTENT_MAX_WIDTH = {
  mobile: 'full', // モバイル：フル幅
  tablet: 680, // タブレット：42.5rem
  desktop: 768, // デスクトップ：48rem
  wide: 1024, // ワイド：64rem
} as const;

// Post関係コンテンツの最大幅（600px固定）
export const POST_CONTENT_MAX_WIDTH = {
  mobile: 'full', // モバイル：フル幅
  tablet: 600, // タブレット：37.5rem（600px）
  desktop: 600, // デスクトップ：37.5rem（600px）
  wide: 600, // ワイド：37.5rem（600px）
} as const;

// レイアウトサイズ定数（レスポンシブ対応）
export const LAYOUT_SIZES = {
  content: CONTENT_MAX_WIDTH,
  postContent: POST_CONTENT_MAX_WIDTH,
  header: HEADER_HEIGHT,
  footer: FOOTER_HEIGHT,
  bottomNav: BOTTOM_NAV_HEIGHT,
  navigationPadding: NAVIGATION_PADDING,
} as const;

/**
 * ナビゲーション対応パディングのユーティリティ関数
 *
 * 使用例:
 * ```tsx
 * // 統一的なレスポンシブパディング
 * <div className={getNavigationPadding('responsive')}>
 *   コンテンツ
 * </div>
 *
 * // デスクトップのみ上部パディング
 * <div className={getNavigationPadding('top')}>
 *   コンテンツ
 * </div>
 * ```
 */
export const getNavigationPadding = (type: keyof typeof NAVIGATION_PADDING): string => {
  return NAVIGATION_PADDING[type];
};

// ブレークポイント定数（拡張版）
export const BREAKPOINTS = {
  xs: 475, // 小型スマートフォン
  sm: 640, // スマートフォン
  md: 768, // タブレット
  lg: 1024, // 小型ノートPC
  xl: 1280, // デスクトップ
  '2xl': 1536, // 大型デスクトップ
} as const;

// デバイスタイプ判定用
export const DEVICE_TYPES = {
  mobile: { min: 0, max: BREAKPOINTS.md - 1 },
  tablet: { min: BREAKPOINTS.md, max: BREAKPOINTS.lg - 1 },
  desktop: { min: BREAKPOINTS.lg, max: Infinity },
} as const;
