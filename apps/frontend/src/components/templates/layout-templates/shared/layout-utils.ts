/**
 * 🎯 レイアウトテンプレート共通ユーティリティ
 *
 * レイアウトテンプレート間で共有するユーティリティ関数を定義
 * クラス名生成、設定取得、型ガードなどを提供
 */

import { cn } from '@/lib/utils';

import {
  LAYOUT_HEADER_DEFAULTS,
  type LayoutType,
  type PaddingVariant,
  type HeaderVariant,
  type HeaderSize,
} from './layout-constants';
import type {
  LayoutClasses,
  LayoutConfig,
  HeaderConfig,
  ResponsiveConfig,
  AnimationConfig,
} from './layout-types';

/**
 * 🎯 シンプルなレイアウトクラス生成関数
 * ESLintルール準拠: 事前定義されたCSSクラスのみ使用
 */
export function getLayoutClasses(
  layoutType: LayoutType,
  options: {
    customClasses?: string;
  } = {}
): LayoutClasses {
  const { customClasses = '' } = options;

  // 各レイアウトタイプに対応するTailwindクラスを返す
  const baseClasses = {
    page: {
      container: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-4xl',
      content: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-3xl',
      spacing: 'space-y-6 sm:space-y-8',
      padding: 'px-4 sm:px-6 lg:px-8',
    },
    feed: {
      container: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-[600px]',
      content: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-[600px]',
      spacing: 'mb-4 sm:mb-6 md:mb-8',
      padding: 'px-4 sm:px-6 lg:px-8',
    },
    settings: {
      container: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl',
      content: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-md md:max-w-lg',
      spacing: 'space-y-4 sm:space-y-6',
      padding: 'px-4 sm:px-6 lg:px-8',
    },
    simple: {
      container: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-sm md:max-w-md',
      content: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-xs md:max-w-sm',
      spacing: 'space-y-6 sm:space-y-8',
      padding: 'px-4 sm:px-6',
    },
    custom: {
      container: 'max-w-full',
      content: 'max-w-6xl mx-auto',
      spacing: 'max-w-full',
      padding: 'px-0',
    },
  };

  const classes = baseClasses[layoutType];

  return {
    container: cn(classes.container, customClasses),
    content: classes.content,
    spacing: classes.spacing,
    padding: classes.padding,
  };
}

/**
 * ヘッダー設定を取得（デフォルト値とマージ）
 */
export function getHeaderConfig(
  layoutType: LayoutType,
  userConfig?: HeaderConfig
): Required<HeaderConfig> {
  const defaults = LAYOUT_HEADER_DEFAULTS[layoutType];

  return {
    variant: userConfig?.variant ?? defaults.variant,
    size: userConfig?.size ?? defaults.size,
    show: userConfig?.show ?? true,
  };
}

/**
 * レイアウト設定を取得（デフォルト値とマージ）
 */
export function getLayoutConfig(
  layoutType: LayoutType,
  userConfig?: Omit<LayoutConfig, 'type'>
): LayoutConfig {
  return {
    type: layoutType,
    spacing: userConfig?.spacing ?? 'containerClass',
    padding: userConfig?.padding ?? 'containerClass',
  };
}

/**
 * レスポンシブ設定を適用
 */
export function applyResponsiveConfig(
  baseConfig: LayoutConfig,
  responsiveConfig?: ResponsiveConfig
): LayoutConfig {
  // 簡単な実装：デスクトップ設定を優先
  // 実際のレスポンシブ対応は各テンプレートで実装
  if (responsiveConfig?.desktop) {
    return { ...baseConfig, ...responsiveConfig.desktop };
  }

  return baseConfig;
}

/**
 * アニメーション設定を取得
 */
export function getAnimationConfig(userConfig?: AnimationConfig): Required<AnimationConfig> {
  return {
    preset: userConfig?.preset ?? 'slideUp',
    delay: userConfig?.delay ?? 0.1,
    duration: userConfig?.duration ?? 0.3,
    disabled: userConfig?.disabled ?? false,
  };
}

/**
 * 型ガード：ページレイアウトかどうか
 */
export function isPageLayout(layoutType: LayoutType): layoutType is 'page' {
  return layoutType === 'page';
}

/**
 * 型ガード：フィードレイアウトかどうか
 */
export function isFeedLayout(layoutType: LayoutType): layoutType is 'feed' {
  return layoutType === 'feed';
}

/**
 * 型ガード：設定レイアウトかどうか
 */
export function isSettingsLayout(layoutType: LayoutType): layoutType is 'settings' {
  return layoutType === 'settings';
}

/**
 * 型ガード：シンプルレイアウトかどうか
 */
export function isSimpleLayout(layoutType: LayoutType): layoutType is 'simple' {
  return layoutType === 'simple';
}

/**
 * 型ガード：カスタムレイアウトかどうか
 */
export function isCustomLayout(layoutType: LayoutType): layoutType is 'custom' {
  return layoutType === 'custom';
}

/**
 * レイアウトタイプから推奨設定を取得
 */
export function getRecommendedSettings(layoutType: LayoutType) {
  const recommendations = {
    page: {
      spacing: 'containerClass' as PaddingVariant,
      maxWidth: 'containerClass' as PaddingVariant,
      padding: 'containerClass' as PaddingVariant,
      header: {
        variant: 'default' as HeaderVariant,
        size: 'default' as HeaderSize,
      },
    },
    feed: {
      spacing: 'containerClass' as PaddingVariant,
      maxWidth: 'containerClass' as PaddingVariant,
      padding: 'containerClass' as PaddingVariant,
      header: {
        variant: 'compact' as HeaderVariant,
        size: 'small' as HeaderSize,
      },
    },
    settings: {
      spacing: 'containerClass' as PaddingVariant,
      maxWidth: 'containerClass' as PaddingVariant,
      padding: 'containerClass' as PaddingVariant,
      header: {
        variant: 'default' as HeaderVariant,
        size: 'default' as HeaderSize,
      },
    },
    simple: {
      spacing: 'containerClass' as PaddingVariant,
      maxWidth: 'containerClass' as PaddingVariant,
      padding: 'containerClass' as PaddingVariant,
      header: {
        variant: 'minimal' as HeaderVariant,
        size: 'small' as HeaderSize,
      },
    },
    custom: {
      spacing: 'containerClass' as PaddingVariant,
      maxWidth: 'containerClass' as PaddingVariant,
      padding: 'containerClass' as PaddingVariant,
      header: {
        variant: 'hidden' as HeaderVariant,
        size: 'default' as HeaderSize,
      },
    },
  };

  return recommendations[layoutType];
}

/**
 * デバッグ用：レイアウト情報を出力
 */
export function debugLayoutInfo(
  layoutType: LayoutType,
  config: LayoutConfig,
  classes: LayoutClasses
) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🎯 Layout Debug: ${layoutType}`);
    console.log('Config:', config);
    console.log('Classes:', classes);
    console.groupEnd();
  }
}

/**
 * レイアウトクラス名を検証
 */
export function validateLayoutClasses(classes: LayoutClasses): boolean {
  const requiredKeys: (keyof LayoutClasses)[] = ['container', 'content', 'spacing', 'padding'];

  return requiredKeys.every(key => {
    const value = classes[key];
    return typeof value === 'string' && value.length > 0;
  });
}

/**
 * 既存のuseLayoutSettingsとの互換性を保つヘルパー（600px固定）
 */
export function getLegacyLayoutSettings() {
  return {
    postCard: {
      maxWidth: 600,
      width: '100%',
      padding: {
        sm: '1rem 1.25rem',
        base: '1rem',
      },
    },
    postForm: {
      maxWidth: 600,
      width: '100%',
      padding: {
        sm: '1rem 1.25rem',
        base: '0.75rem',
      },
    },
  };
}

/**
 * Tailwindクラス名の妥当性をチェック
 */
export function isTailwindClass(className: string): boolean {
  // 簡単な実装：Tailwindの一般的なパターンをチェック
  const tailwindPatterns = [
    /^(max-w|min-w|w)-/,
    /^(max-h|min-h|h)-/,
    /^(p|px|py|pt|pb|pl|pr)-/,
    /^(m|mx|my|mt|mb|ml|mr)-/,
    /^space-(x|y)-/,
    /^gap-/,
  ];

  return tailwindPatterns.some(pattern => pattern.test(className));
}

/**
 * レイアウト設定をマージ
 */
export function mergeLayoutConfigs(
  base: Partial<LayoutConfig>,
  override: Partial<LayoutConfig>
): Partial<LayoutConfig> {
  return {
    ...base,
    ...override,
  };
}
