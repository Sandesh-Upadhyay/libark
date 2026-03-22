/**
 * 🎯 レイアウトテンプレート統一定数
 *
 * 全レイアウトテンプレートで使用する統一された定数を定義
 * ESLintルール準拠: space-*, gap-*, max-w-*, mx-auto クラスは使用禁止
 * 代わりに構造的な設定のみを定義
 */

import { LAYOUT_SIZES, BREAKPOINTS } from '@/lib/constants/layout';

/**
 * レイアウトタイプ別構造設定
 * スタイリングクラスは使用せず、構造的な設定のみ
 */
export const LAYOUT_STRUCTURE = {
  /** 標準ページ: 全ページ共通レイアウト（旧settings） */
  page: {
    type: 'page',
    hasHeader: true,
    hasFooter: false,
    sections: ['header', 'content'],
    supportsSidebar: true,
  },
  /** フィード系: PostCreator + PostList（pageベース） */
  feed: {
    type: 'feed',
    hasHeader: true,
    hasFooter: false,
    sections: ['creator', 'list'],
    basedOn: 'page',
  },

  /** シンプル系: 認証ページ等 */
  simple: {
    type: 'simple',
    hasHeader: false,
    hasFooter: false,
    sections: ['content'],
    centered: true,
  },
  /** 設定系: 設定ページ専用レイアウト */
  settings: {
    type: 'settings',
    hasHeader: true,
    hasFooter: false,
    sections: ['header', 'content'],
    supportsSidebar: true,
    basedOn: 'page',
  },
  /** カスタム系: 特殊レイアウト */
  custom: {
    type: 'custom',
    hasHeader: false,
    hasFooter: false,
    sections: ['content'],
    fullWidth: true,
  },
} as const;

/**
 * レイアウトタイプ別コンテナ設定
 * 直接Tailwindクラスを使用
 */
export const LAYOUT_CONTAINERS = {
  /** フィード系: 投稿コンテンツに最適（600px固定） */
  feed: {
    containerClass: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-[600px]',
    contentClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-[600px]',
    wideClass: 'w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-full sm:max-w-[600px]',
  },
  /** 設定系: フォーム要素に最適 */
  settings: {
    containerClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl',
    contentClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-md md:max-w-lg',
    wideClass: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-full md:max-w-2xl lg:max-w-3xl',
  },
  /** シンプル系: 認証フォーム等 */
  simple: {
    containerClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-sm md:max-w-md',
    contentClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-xs md:max-w-sm',
    wideClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-md md:max-w-lg',
  },
  /** カスタム系: 制限なし */
  custom: {
    containerClass: 'max-w-full',
    contentClass: 'max-w-6xl mx-auto',
    wideClass: 'max-w-7xl mx-auto',
  },
} as const;

/**
 * レイアウトタイプ別パディング設定
 * 直接Tailwindクラスを使用
 */
export const LAYOUT_PADDING = {
  /** フィード系: 投稿コンテンツ用 */
  feed: {
    containerClass: 'px-4 sm:px-6 lg:px-8',
    contentClass: 'p-4 sm:p-6 lg:p-8',
    compactClass: 'p-3 sm:p-4 lg:p-5',
  },
  /** 設定系: フォーム要素用 */
  settings: {
    containerClass: 'px-4 sm:px-6 lg:px-8',
    contentClass: 'p-4 sm:p-6 lg:p-8',
    compactClass: 'p-3 sm:p-4 lg:p-6',
  },
  /** シンプル系: 最小限 */
  simple: {
    containerClass: 'px-4 sm:px-6',
    contentClass: 'p-4 sm:p-6 lg:p-8',
    compactClass: 'p-3 sm:p-4 lg:p-5',
  },
  /** カスタム系: 自由設定 */
  custom: {
    containerClass: 'px-0',
    contentClass: 'p-0',
    compactClass: 'p-0',
  },
} as const;

/**
 * 共通ヘッダー設定
 * PageLayoutTemplateとの互換性を保持
 */
export const HEADER_VARIANTS = {
  default: 'default',
  minimal: 'minimal',
  compact: 'compact',
  prominent: 'prominent',
} as const;

export const HEADER_SIZES = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const;

/**
 * レイアウトタイプ別デフォルトヘッダー設定
 */
export const LAYOUT_HEADER_DEFAULTS = {
  page: {
    variant: HEADER_VARIANTS.default,
    size: HEADER_SIZES.md,
  },
  feed: {
    variant: HEADER_VARIANTS.compact,
    size: HEADER_SIZES.sm,
  },
  settings: {
    variant: HEADER_VARIANTS.default,
    size: HEADER_SIZES.md,
  },
  simple: {
    variant: HEADER_VARIANTS.minimal,
    size: HEADER_SIZES.sm,
  },
  custom: {
    variant: HEADER_VARIANTS.default,
    size: HEADER_SIZES.md,
  },
} as const;

/**
 * レイアウトタイプ別スペーシング設定
 * ESLintルール準拠: 直接的なTailwindクラスは使用しない
 */
export const LAYOUT_SPACING = {
  /** 標準ページ: 全ページ共通スペーシング */
  page: {
    sectionClass: 'page-section',
    groupClass: 'page-group',
    containerClass: 'page-layout-container',
    contentClass: 'page-section-content',
    formClass: 'page-form-spacing',
  },
  /** フィード系: 投稿間のスペーシング（pageベース） */
  feed: {
    sectionClass: 'feed-list-section',
    creatorClass: 'feed-creator-section',
    containerClass: 'feed-layout-container',
    basedOn: 'page',
  },
  /** シンプル系: 最小限のスペーシング */
  simple: {
    sectionClass: 'simple-content-container',
    containerClass: 'simple-layout-container',
  },
  /** カスタム系: 自由設定 */
  custom: {
    containerClass: 'custom-layout-container',
  },
} as const;

/**
 * コンテンツセクション用スペーシング設定
 * 全ページで統一されたコンテンツ間隔を提供
 */
export const CONTENT_SPACING = {
  /** 標準スペーシング（space-y-6 sm:space-y-8） */
  default: 'content-section',
  /** 小さなスペーシング（space-y-4 sm:space-y-6） */
  small: 'content-section-sm',
  /** 大きなスペーシング（space-y-8 sm:space-y-12） */
  large: 'content-section-lg',
} as const;

/**
 * 統一ページスペーシング設定
 * 全ページで使用する標準的なスペーシングクラス
 */
export const PAGE_SPACING = {
  /** セクション間（小）: space-y-4 sm:space-y-6 */
  section: 'page-section',
  /** セクション内コンテンツ: space-y-4 sm:space-y-6 */
  content: 'page-section-content',
  /** グループ間（大）: space-y-8 sm:space-y-12 */
  group: 'page-group',
  /** フォーム要素間: space-y-4 sm:space-y-6 */
  form: 'page-form-spacing',
} as const;

/**
 * 既存のuseLayoutSettingsとの互換性を保つための設定
 * 段階的移行をサポート
 */
export const LEGACY_LAYOUT_SETTINGS = {
  content: LAYOUT_SIZES.content,
  postCard: {
    maxWidth: 680,
    width: '100%',
    padding: {
      sm: '1rem 1.25rem',
      base: '1rem',
    },
  },
  postForm: {
    maxWidth: 680,
    width: '100%',
    padding: {
      sm: '1rem 1.25rem',
      base: '0.75rem',
    },
  },
  breakpoints: BREAKPOINTS,
} as const;

/**
 * レイアウトタイプの型定義
 */
export type LayoutType = keyof typeof LAYOUT_STRUCTURE;
export type StructureVariant = keyof typeof LAYOUT_STRUCTURE.feed;
export type ContainerVariant = keyof typeof LAYOUT_CONTAINERS.feed;
export type PaddingVariant = keyof typeof LAYOUT_PADDING.feed;
export type SpacingVariant = keyof typeof LAYOUT_SPACING.feed;
export type ContentSpacingVariant = keyof typeof CONTENT_SPACING;
export type HeaderVariant = keyof typeof HEADER_VARIANTS;
export type HeaderSize = keyof typeof HEADER_SIZES;
