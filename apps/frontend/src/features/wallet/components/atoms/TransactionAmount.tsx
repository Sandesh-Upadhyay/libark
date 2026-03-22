/**
 * 🎯 取引金額表示コンポーネント (Atom)
 *
 * 責任:
 * - 取引金額の統一されたフォーマット表示
 * - 正負の値に応じた色分け
 * - 通貨アイコンとの組み合わせ表示
 * - アクセシビリティ対応
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { CurrencyIcon, type CurrencyType } from './CurrencyIcon';

/**
 * 取引金額のバリアント定義
 */

const transactionAmountVariants = cva('inline-flex items-center', {
  variants: {
    size: {
      xs: 'gap-1 text-xs',
      sm: 'gap-1 text-sm',
      md: 'gap-2 text-base',
      lg: 'gap-2 text-lg',
    },
    layout: {
      horizontal: 'flex-row',
      vertical: 'flex-col gap-0.5',
    },
    emphasis: {
      normal: '',
      strong: 'font-semibold',
      subtle: 'opacity-80',
    },
  },
  defaultVariants: {
    size: 'sm',
    layout: 'horizontal',
    emphasis: 'normal',
  },
});

/**
 * 金額テキストのバリアント定義
 */
const amountTextVariants = cva('font-mono tabular-nums', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    type: {
      positive: 'text-success',
      negative: 'text-destructive',
      neutral: 'text-foreground',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
  },
  defaultVariants: {
    size: 'sm',
    type: 'neutral',
    weight: 'medium',
  },
});

export interface TransactionAmountProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number;
  currency?: CurrencyType;
  showCurrency?: boolean;
  showSign?: boolean;
  precision?: number;
  locale?: string;
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** レイアウト */
  layout?: 'horizontal' | 'vertical';
  /** 強調 */
  emphasis?: 'normal' | 'strong' | 'subtle';
}

/**
 * 金額のフォーマット
 */
const formatAmount = (
  amount: number,
  precision: number = 2,
  locale: string = 'en-US',
  showSign: boolean = true
): string => {
  const absAmount = Math.abs(amount);
  const sign = showSign ? (amount >= 0 ? '+' : '-') : '';

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: true,
  }).format(absAmount);

  return `${sign}${formattedNumber}`;
};

/**
 * 金額タイプの判定
 */
const getAmountType = (amount: number): 'positive' | 'negative' | 'neutral' => {
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'neutral';
};

/**
 * 取引金額コンポーネント
 */
export const TransactionAmount = React.memo<TransactionAmountProps>(
  React.forwardRef<HTMLDivElement, TransactionAmountProps>(
    (
      {
        amount,
        currency = 'USD',
        showCurrency = true,
        showSign = true,
        precision = 2,
        locale = 'en-US',
        size = 'sm',
        layout = 'vertical',
        emphasis = 'normal',
        className,
        ...props
      },
      ref
    ) => {
      const formattedAmount = formatAmount(amount, precision, locale, showSign);
      const amountType = getAmountType(amount);

      return (
        <div
          ref={ref}
          className={cn(transactionAmountVariants({ size, layout, emphasis }), className)}
          role='img'
          aria-label={`${formattedAmount} ${currency}`}
          {...props}
        >
          {/* 金額表示 */}
          <div
            className={cn(
              amountTextVariants({
                size,
                type: amountType,
                weight: emphasis === 'strong' ? 'semibold' : 'medium',
              })
            )}
          >
            {formattedAmount}
          </div>

          {/* 通貨アイコン表示 */}
          {showCurrency && (
            <div className=''>
              <CurrencyIcon
                currency={currency}
                size={size === 'xs' ? 'xs' : 'sm'}
                variant='currency'
                iconOnly={false}
              />
            </div>
          )}
        </div>
      );
    }
  )
);

TransactionAmount.displayName = 'TransactionAmount';

export { formatAmount, getAmountType };
