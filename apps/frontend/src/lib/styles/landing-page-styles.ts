/**
 * 🎯 ランディングページ専用スタイル定義
 *
 * 責任:
 * - ランディングページ固有のCVAバリアント管理
 * - 複雑なボタンスタイルの共通化
 * - レスポンシブデザインの統一
 *
 * 特徴:
 * - CVAによる型安全なバリアント管理
 * - Tailwind設定のカスタムグラデーション活用
 * - レスポンシブ対応
 */

import { cva, type VariantProps } from 'class-variance-authority';

/**
 * ランディングページ用ボタンバリアント
 */
export const landingButtonVariants = cva(
  [
    // 基本スタイル
    'group transition-all duration-300 font-medium',
    'flex items-center justify-center',
    'w-full sm:w-auto',
    // フォーカス・アクセシビリティ
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-landing-button-primary hover:bg-landing-button-primary-hover',
          'text-white border-0',
          'shadow-2xl hover:shadow-pink-500/25',
          'focus:ring-pink-500',
        ],
        outline: [
          'border-2 border-slate-300 dark:border-slate-600',
          'hover:border-pink-500 dark:hover:border-pink-400',
          'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm',
          'text-slate-700 dark:text-slate-200',
          'focus:ring-slate-500',
        ],
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

/**
 * ランディングページ用アイコンバリアント
 */
export const landingIconVariants = cva('transition-transform', {
  variants: {
    animation: {
      none: '',
      scale: 'group-hover:scale-110',
      slide: 'group-hover:translate-x-1',
    },
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
    position: {
      left: 'mr-2',
      right: 'ml-2',
    },
  },
  defaultVariants: {
    animation: 'scale',
    size: 'md',
    position: 'left',
  },
});

/**
 * ランディングページ用セクションバリアント
 */
export const landingSectionVariants = cva('relative', {
  variants: {
    spacing: {
      none: '',
      sm: 'py-8 sm:py-12',
      md: 'py-12 sm:py-16',
      lg: 'py-16 sm:py-24',
      xl: 'py-24 sm:py-32',
    },
    background: {
      transparent: '',
      subtle: 'bg-white/50 dark:bg-slate-900/50',
      card: 'bg-card border border-border rounded-2xl shadow-sm',
    },
  },
  defaultVariants: {
    spacing: 'md',
    background: 'transparent',
  },
});

// 型エクスポート
export type LandingButtonVariants = VariantProps<typeof landingButtonVariants>;
export type LandingIconVariants = VariantProps<typeof landingIconVariants>;
export type LandingSectionVariants = VariantProps<typeof landingSectionVariants>;
