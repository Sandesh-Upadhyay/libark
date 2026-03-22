/**
 * 🎯 レイアウトテンプレート共通設定 統一エクスポート
 *
 * 共通設定・型・ユーティリティの統一エクスポート
 * 各レイアウトテンプレートから簡単にインポートできるように整理
 */

// 定数のエクスポート
export {
  LAYOUT_STRUCTURE,
  LAYOUT_SPACING,
  LAYOUT_CONTAINERS,
  LAYOUT_PADDING,
  HEADER_VARIANTS,
  HEADER_SIZES,
  LAYOUT_HEADER_DEFAULTS,
  CONTENT_SPACING,
  PAGE_SPACING,
  LEGACY_LAYOUT_SETTINGS,
} from './layout-constants';

// 型のエクスポート
export type {
  LayoutType,
  StructureVariant,
  ContainerVariant,
  PaddingVariant,
  HeaderVariant,
  HeaderSize,
} from './layout-constants';

export type {
  BaseLayoutProps,
  HeaderConfig,
  LayoutConfig,
  PageLayoutProps,
  FeedLayoutProps,
  SettingsLayoutProps,
  SimpleLayoutProps,
  CustomLayoutProps,
  LayoutClasses,
  LayoutSettings,
  LayoutContextValue,
  ResponsiveConfig,
  AnimationConfig,
  LayoutTypeGuard,
  LayoutPropsMap,
  ConditionalLayoutProps,
} from './layout-types';

// ユーティリティ関数のエクスポート
export {
  getLayoutClasses,
  getHeaderConfig,
  getLayoutConfig,
  applyResponsiveConfig,
  getAnimationConfig,
  isPageLayout,
  isFeedLayout,
  isSettingsLayout,
  isSimpleLayout,
  isCustomLayout,
  getRecommendedSettings,
  debugLayoutInfo,
  validateLayoutClasses,
  getLegacyLayoutSettings,
  isTailwindClass,
  mergeLayoutConfigs,
} from './layout-utils';
