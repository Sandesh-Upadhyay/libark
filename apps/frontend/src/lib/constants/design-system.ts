/**
 * 🎯 統一デザインシステム定数
 *
 * 責任:
 * - 色、サイズ、スペーシングの統一管理
 * - ハードコード値の防止
 * - デザイン一貫性の保証
 *
 * 使用方法:
 * - 直接色コードやサイズ値をハードコードする代わりにこの定数を使用
 * - ESLintルールによりハードコード使用を検出・警告
 */

/**
 * 統一色定義
 * CSS変数と連携した色管理
 */
export const DESIGN_COLORS = {
  // ブランドカラー（CSS変数ベース）
  brand: {
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    secondaryForeground: 'hsl(var(--secondary-foreground))',
    accent: 'hsl(var(--accent))',
    accentForeground: 'hsl(var(--accent-foreground))',
  },

  // システムカラー
  system: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',
    popover: 'hsl(var(--popover))',
    popoverForeground: 'hsl(var(--popover-foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    destructive: 'hsl(var(--destructive))',
    destructiveForeground: 'hsl(var(--destructive-foreground))',
  },

  // 通貨別カラー（統一管理）
  currency: {
    BTC: '#F7931A',
    ETH: '#627EEA',
    USDT: '#26A17B',
    XRP: '#23292F',
    XMR: '#FF6600',
    BNB: '#F3BA2F',
    ADA: '#0033AD',
    DOT: '#E6007A',
    MATIC: '#8247E5',
    SOL: '#9945FF',
    AAVE: '#B6509E',
    USD: 'text-success',
    JPY: 'text-info',
    EUR: 'text-primary',
  },

  // 特殊用途カラー
  special: {
    qrBackground: '#ffffff',
    qrForeground: '#000000',
    loadingPrimary: '#f22358',
    loadingSecondary: '#f4e4a9',
    loadingTertiary: '#f24452',
  },
} as const;

/**
 * 統一サイズ定義
 * レスポンシブ対応のサイズ管理
 */
export const DESIGN_SIZES = {
  // コンポーネントサイズ
  components: {
    qrCode: {
      small: 150,
      medium: 200,
      large: 300,
    },
    header: {
      mobile: 56,
      desktop: 64,
    },
    footer: {
      mobile: 56,
      desktop: 64,
    },
    bottomNav: {
      mobile: 64,
    },
  },

  // スペーシング（rem単位）
  spacing: {
    none: '0',
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    '2xl': '2rem', // 32px
    '3xl': '3rem', // 48px
  },

  // レスポンシブスペーシング
  responsiveSpacing: {
    xs: {
      mobile: '0.25rem',
      tablet: '0.5rem',
      desktop: '0.75rem',
    },
    sm: {
      mobile: '0.5rem',
      tablet: '0.75rem',
      desktop: '1rem',
    },
    md: {
      mobile: '0.75rem',
      tablet: '1rem',
      desktop: '1.5rem',
    },
    lg: {
      mobile: '1rem',
      tablet: '1.5rem',
      desktop: '2rem',
    },
    xl: {
      mobile: '1.5rem',
      tablet: '2rem',
      desktop: '3rem',
    },
  },

  // ボーダー半径
  radius: {
    none: '0',
    sm: '0.125rem', // 2px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    full: '9999px',
  },
} as const;

/**
 * Z-Index階層（既存のz-index.tsと統合）
 */
export const DESIGN_Z_INDEX = {
  // システムレベル
  debug: 10000,
  devTools: 9999,

  // アプリケーションレベル
  modal: 1200,
  modalOverlay: 1150,
  sidebar: 1000,
  sidebarOverlay: 900,

  // ページレベル
  dropdown: 500,
  tooltip: 400,
  popover: 350,
  toast: 300,

  // ナビゲーションレベル
  navigation: 100,
  mobileBottomNav: 90,

  // コンテンツレベル
  sticky: 50,
  overlay: 40,
  cardHover: 30,
  card: 20,

  // 基本レベル
  content: 10,
  base: 1,
  auto: 0,
  background: -1,
} as const;

/**
 * アニメーション設定
 */
export const DESIGN_ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

/**
 * 型定義
 */
export type DesignColor =
  | keyof typeof DESIGN_COLORS.brand
  | keyof typeof DESIGN_COLORS.system
  | keyof typeof DESIGN_COLORS.currency
  | keyof typeof DESIGN_COLORS.special;
export type DesignSize = keyof typeof DESIGN_SIZES.spacing;
export type DesignZIndex = keyof typeof DESIGN_Z_INDEX;
