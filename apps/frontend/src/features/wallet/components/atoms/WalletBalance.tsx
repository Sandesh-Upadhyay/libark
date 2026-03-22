/**
 * 🎯 ウォレット残高表示コンポーネント (Atom)
 *
 * 責任:
 * - 残高の統一表示
 * - 通貨フォーマット
 * - サイズとアライメントのバリエーション
 * - アクセシビリティ対応
 *
 * 特徴:
 * - アトミックデザイン準拠
 * - パフォーマンス最適化
 * - 型安全性
 * - 一貫したスタイル管理
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { formatWalletBalance } from '@/lib/utils/currencyUtils';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

/**
 * ウォレット残高のバリアント定義（最適化版）
 */

const walletBalanceVariants = cva('inline-flex items-center gap-1', {
  variants: {
    align: {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    },
    spacing: {
      tight: 'gap-0.5',
      normal: 'gap-1',
      loose: 'gap-2',
    },
    emphasis: {
      normal: '',
      strong: 'font-semibold',
      subtle: 'opacity-80',
    },
  },
  defaultVariants: {
    align: 'left',
    spacing: 'normal',
    emphasis: 'normal',
  },
});

export interface WalletBalanceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 残高金額 */
  amount: number;
  /** 通貨コード */
  currency?: string;
  /** 通貨記号を表示するか */
  showCurrency?: boolean;
  /** テキストサイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** テキストバリアント */
  variant?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
  /** 数値のフォーマット設定 */
  formatOptions?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  };
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  hasError?: boolean;
  /** テキスト配置 */
  align?: 'left' | 'center' | 'right';
  /** スペーシング */
  spacing?: 'tight' | 'normal' | 'loose';
  /** 強調レベル */
  emphasis?: 'normal' | 'strong' | 'subtle';
}

// 統一フォーマット関数を使用するため、ローカル関数は削除

/**
 * 🎯 ウォレット残高表示コンポーネント（最適化版）
 */
export const WalletBalance = React.memo(
  React.forwardRef<HTMLDivElement, WalletBalanceProps>(
    (
      {
        amount,
        currency = 'USD',
        showCurrency = true,
        size = 'md',
        variant = 'default',
        align,
        spacing,
        emphasis,
        formatOptions,
        isLoading = false,
        hasError = false,
        className,
        ...props
      },
      ref
    ) => {
      // ローディング・エラー状態の処理
      if (isLoading) {
        return (
          <div
            ref={ref}
            className={cn(walletBalanceVariants({ align, spacing, emphasis }), className)}
            {...props}
          >
            <span
              className={cn(
                'text-muted-foreground animate-pulse',
                size === 'xs' && 'text-xs',
                size === 'sm' && 'text-sm',
                size === 'md' && 'text-base',
                size === 'lg' && 'text-lg',
                size === 'xl' && 'text-xl'
              )}
            >
              読み込み中...
            </span>
          </div>
        );
      }

      if (hasError) {
        return (
          <div
            ref={ref}
            className={cn(walletBalanceVariants({ align, spacing, emphasis }), className)}
            {...props}
          >
            <span
              className={cn(
                'text-destructive',
                size === 'xs' && 'text-xs',
                size === 'sm' && 'text-sm',
                size === 'md' && 'text-base',
                size === 'lg' && 'text-lg',
                size === 'xl' && 'text-xl'
              )}
            >
              エラー
            </span>
          </div>
        );
      }

      // 統一フォーマットを使用（カスタムオプション対応）
      const formattedBalance = formatOptions
        ? amount.toLocaleString('ja-JP', {
            style: 'currency',
            currency: currency,
            ...formatOptions,
          })
        : formatWalletBalance(amount, currency);

      // 通貨記号と数値部分を分離
      const parts = formattedBalance.split(' ');
      const numberPart = parts[0];
      const currencyPart = parts[1] || currency;

      // サイズに応じたテキストサイズマッピング
      const sizeMap = {
        sm: { currency: 'xs', number: 'sm' },
        md: { currency: 'sm', number: 'md' },
        lg: { currency: 'md', number: 'lg' },
        xl: { currency: 'lg', number: 'xl' },
        '2xl': { currency: 'xl', number: '2xl' },
        '3xl': { currency: 'xl', number: '3xl' },
      } as const;

      const { currency: currencySize, number: numberSize } = (sizeMap as any)[size] || sizeMap.md;

      return (
        <div
          ref={ref}
          className={cn(walletBalanceVariants({ align, spacing, emphasis }), className)}
          role='text'
          aria-label={`残高: ${formattedBalance}`}
          {...props}
        >
          <span
            className={cn(
              'font-bold',
              variant === 'default' && 'text-foreground',
              variant === 'muted' && 'text-muted-foreground',
              variant === 'success' && 'text-green-600 dark:text-green-400',
              variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
              variant === 'danger' && 'text-destructive',
              numberSize === 'xs' && 'text-xs',
              numberSize === 'sm' && 'text-sm',
              numberSize === 'md' && 'text-base',
              numberSize === 'lg' && 'text-lg',
              numberSize === 'xl' && 'text-xl'
            )}
          >
            {numberPart}
          </span>
          {showCurrency && (
            <span
              className={cn(
                'font-normal',
                variant === 'default'
                  ? 'text-muted-foreground'
                  : variant === 'muted' && 'text-muted-foreground',
                variant === 'success' && 'text-green-600 dark:text-green-400',
                variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
                variant === 'danger' && 'text-destructive',
                currencySize === 'xs' && 'text-xs',
                currencySize === 'sm' && 'text-sm',
                currencySize === 'md' && 'text-base',
                currencySize === 'lg' && 'text-lg',
                currencySize === 'xl' && 'text-xl'
              )}
            >
              {currencyPart}
            </span>
          )}
        </div>
      );
    }
  )
);

WalletBalance.displayName = 'WalletBalance';

export { walletBalanceVariants };
