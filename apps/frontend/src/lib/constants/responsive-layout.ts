/**
 * レスポンシブレイアウト設定の一元管理
 *
 * モバイル/デスクトップでのマージン、パディング、スペーシングを
 * 統一的に管理し、ベストプラクティスに従った実装を提供
 */

/**
 * レスポンシブスペーシング設定
 * モバイルファーストアプローチに基づく設定
 */
export const RESPONSIVE_SPACING = {
  /** ゼロスペーシング（モバイル最適化用） */
  none: {
    mobile: '0',
    tablet: '0',
    desktop: '0',
  },
  /** 最小スペーシング */
  xs: {
    mobile: '0.25rem', // 4px
    tablet: '0.5rem', // 8px
    desktop: '0.75rem', // 12px
  },
  /** 小スペーシング */
  sm: {
    mobile: '0.5rem', // 8px
    tablet: '0.75rem', // 12px
    desktop: '1rem', // 16px
  },
  /** 標準スペーシング */
  md: {
    mobile: '0.75rem', // 12px
    tablet: '1rem', // 16px
    desktop: '1.5rem', // 24px
  },
  /** 大スペーシング */
  lg: {
    mobile: '1rem', // 16px
    tablet: '1.5rem', // 24px
    desktop: '2rem', // 32px
  },
  /** 特大スペーシング */
  xl: {
    mobile: '1.5rem', // 24px
    tablet: '2rem', // 32px
    desktop: '3rem', // 48px
  },
} as const;

/**
 * レスポンシブパディング設定
 * コンテナやカード要素用
 */
export const RESPONSIVE_PADDING = {
  /** ゼロパディング（フルブリード用） */
  none: {
    mobile: '0',
    tablet: '0',
    desktop: '0',
  },
  /** 最小パディング */
  xs: {
    mobile: '0.5rem', // 8px
    tablet: '0.75rem', // 12px
    desktop: '1rem', // 16px
  },
  /** 小パディング */
  sm: {
    mobile: '0.75rem', // 12px
    tablet: '1rem', // 16px
    desktop: '1.25rem', // 20px
  },
  /** 標準パディング */
  md: {
    mobile: '1rem', // 16px
    tablet: '1.5rem', // 24px
    desktop: '2rem', // 32px
  },
  /** 大パディング */
  lg: {
    mobile: '1.5rem', // 24px
    tablet: '2rem', // 32px
    desktop: '2.5rem', // 40px
  },
} as const;

/**
 * フィード専用レスポンシブ設定
 * PostCard、PostList用の最適化された設定
 */
export const FEED_RESPONSIVE_CONFIG = {
  /** コンテナパディング */
  container: {
    /** モバイル：ゼロマージン、デスクトップ：標準マージン */
    fullBleed: {
      mobile: RESPONSIVE_PADDING.none.mobile,
      tablet: RESPONSIVE_PADDING.sm.tablet,
      desktop: RESPONSIVE_PADDING.md.desktop,
    },
    /** 全デバイスで統一パディング */
    consistent: {
      mobile: RESPONSIVE_PADDING.sm.mobile,
      tablet: RESPONSIVE_PADDING.sm.tablet,
      desktop: RESPONSIVE_PADDING.sm.desktop,
    },
  },
  /** PostCard間のスペーシング */
  cardSpacing: {
    /** モバイル：最小、デスクトップ：標準 */
    adaptive: {
      mobile: RESPONSIVE_SPACING.xs.mobile,
      tablet: RESPONSIVE_SPACING.sm.tablet,
      desktop: RESPONSIVE_SPACING.md.desktop,
    },
    /** モバイル：ゼロ、デスクトップ：標準 */
    fullBleed: {
      mobile: RESPONSIVE_SPACING.none.mobile,
      tablet: RESPONSIVE_SPACING.sm.tablet,
      desktop: RESPONSIVE_SPACING.md.desktop,
    },
  },
  /** セクション間のスペーシング */
  sectionSpacing: {
    /** 標準的なセクション間隔 */
    standard: {
      mobile: RESPONSIVE_SPACING.sm.mobile,
      tablet: RESPONSIVE_SPACING.md.tablet,
      desktop: RESPONSIVE_SPACING.lg.desktop,
    },
    /** コンパクトなセクション間隔 */
    compact: {
      mobile: RESPONSIVE_SPACING.xs.mobile,
      tablet: RESPONSIVE_SPACING.sm.tablet,
      desktop: RESPONSIVE_SPACING.md.desktop,
    },
  },
} as const;

/**
 * レスポンシブ設定タイプ
 */
export type ResponsiveSpacingKey = keyof typeof RESPONSIVE_SPACING;
export type ResponsivePaddingKey = keyof typeof RESPONSIVE_PADDING;
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * レスポンシブ値を取得するユーティリティ関数
 */
export function getResponsiveValue<T extends Record<DeviceType, string>>(
  config: T,
  device: DeviceType = 'mobile'
): string {
  return config[device];
}

/**
 * Tailwind CSS クラス生成ユーティリティ
 * レスポンシブ設定からTailwindクラスを生成
 */
export function generateResponsiveClasses(
  property:
    | 'p'
    | 'px'
    | 'py'
    | 'pt'
    | 'pb'
    | 'pl'
    | 'pr'
    | 'm'
    | 'mx'
    | 'my'
    | 'mt'
    | 'mb'
    | 'ml'
    | 'mr'
    | 'space-x'
    | 'space-y',
  config: Record<DeviceType, string>
): string {
  const classes: string[] = [];

  // モバイル（ベース）
  if (config.mobile !== '0') {
    classes.push(`${property}-[${config.mobile}]`);
  }

  // タブレット（md以上）
  if (config.tablet !== config.mobile) {
    classes.push(`md:${property}-[${config.tablet}]`);
  }

  // デスクトップ（lg以上）
  if (config.desktop !== config.tablet) {
    classes.push(`lg:${property}-[${config.desktop}]`);
  }

  return classes.join(' ');
}

/**
 * フィード用レスポンシブクラス生成
 */
export const FEED_RESPONSIVE_CLASSES = {
  /** フルブリードコンテナ（モバイル：マージンなし、デスクトップ：マージンあり） */
  fullBleedContainer: generateResponsiveClasses('px', FEED_RESPONSIVE_CONFIG.container.fullBleed),

  /** フルブリードカードスペーシング */
  fullBleedCardSpacing: generateResponsiveClasses(
    'space-y',
    FEED_RESPONSIVE_CONFIG.cardSpacing.fullBleed
  ),

  /** 標準セクションスペーシング */
  standardSectionSpacing: generateResponsiveClasses(
    'space-y',
    FEED_RESPONSIVE_CONFIG.sectionSpacing.standard
  ),

  /** コンパクトセクションスペーシング */
  compactSectionSpacing: generateResponsiveClasses(
    'space-y',
    FEED_RESPONSIVE_CONFIG.sectionSpacing.compact
  ),
} as const;

/**
 * レスポンシブレイアウト設定のプリセット
 */
export const RESPONSIVE_LAYOUT_PRESETS = {
  /** モバイル最適化フィード */
  mobileFeed: {
    containerClass: 'w-full mx-auto max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
    paddingClass: FEED_RESPONSIVE_CLASSES.fullBleedContainer,
    spacingClass: FEED_RESPONSIVE_CLASSES.fullBleedCardSpacing,
  },
  /** 標準フィード */
  standardFeed: {
    containerClass: 'w-full mx-auto px-4 sm:px-6 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
    paddingClass: generateResponsiveClasses('px', FEED_RESPONSIVE_CONFIG.container.consistent),
    spacingClass: generateResponsiveClasses('space-y', FEED_RESPONSIVE_CONFIG.cardSpacing.adaptive),
  },
} as const;
