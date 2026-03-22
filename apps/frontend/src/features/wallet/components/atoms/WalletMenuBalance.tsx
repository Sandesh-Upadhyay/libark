/**
 * 🎯 ウォレットメニュー残高表示コンポーネント (Atom)
 *
 * 責任:
 * - ナビゲーションメニュー内での残高表示
 * - コンパクトなフォーマット
 * - 右側配置レイアウト
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { formatWalletBalance } from '@/lib/utils/currencyUtils';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

/**
 * ウォレットメニュー残高のバリアント定義
 * レスポンシブ対応とモバイル最適化
 */
const walletMenuBalanceVariants = cva('font-mono tabular-nums', {
  variants: {
    size: {
      xs: 'text-[10px] sm:text-xs',
      sm: 'text-xs sm:text-sm',
      md: 'text-sm sm:text-base',
      lg: 'text-base sm:text-lg',
    },
    responsive: {
      true: 'hidden xs:inline sm:inline',
      false: '',
    },
    truncate: {
      true: 'truncate max-w-[80px] sm:max-w-none',
      false: '',
    },
  },
  defaultVariants: {
    size: 'sm',
    responsive: false,
    truncate: false,
  },
});

export interface WalletMenuBalanceProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 残高金額 */
  amount: number;
  /** 通貨コード */
  currency?: string;
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** テキストバリアント */
  variant?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'destructive';
  /** レスポンシブ表示（小画面で非表示） */
  responsive?: boolean;
  /** テキストの切り詰め */
  truncate?: boolean;
  /** モバイル向けの短縮表示 */
  mobileShort?: boolean;
}

// 統一フォーマット関数を使用するため、ローカル関数は削除

/**
 * 🎯 ウォレットメニュー残高表示コンポーネント
 * レスポンシブ対応とモバイル最適化済み
 */
export const WalletMenuBalance = React.forwardRef<HTMLSpanElement, WalletMenuBalanceProps>(
  (
    {
      amount,
      currency = 'USD',
      size = 'sm',
      variant = 'default',
      responsive = false,
      truncate = false,
      mobileShort = false,
      className,
      ...props
    },
    ref
  ) => {
    // モバイル向けの短縮フォーマット
    const formattedBalance = mobileShort
      ? formatWalletBalance(amount, currency, { compact: true })
      : formatWalletBalance(amount, currency);

    return (
      <span
        ref={ref}
        className={cn(
          walletMenuBalanceVariants({ size, responsive, truncate }),
          'font-medium text-right',
          variant === 'default' && 'text-foreground',
          variant === 'muted' && 'text-muted-foreground',
          variant === 'success' && 'text-green-600 dark:text-green-400',
          variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
          variant === 'destructive' && 'text-destructive',
          className
        )}
        title={mobileShort ? formatWalletBalance(amount, currency) : undefined}
        {...props}
      >
        {formattedBalance}
      </span>
    );
  }
);

WalletMenuBalance.displayName = 'WalletMenuBalance';

export { walletMenuBalanceVariants };
