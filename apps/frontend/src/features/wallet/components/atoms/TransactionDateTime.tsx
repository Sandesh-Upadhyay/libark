/**
 * 🎯 取引日時表示コンポーネント (Atom)
 *
 * 責任:
 * - 取引日時の統一されたフォーマット表示
 * - 日付と時刻の分離表示
 * - タイムゾーン対応
 * - アクセシビリティ対応
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import {
  formatInUserTimezone,
  parseDate,
  getBrowserTimezone,
  type SupportedLocale,
} from '@/lib/utils/timezoneUtils';

/**
 * 日時表示のバリアント定義
 */

const transactionDateTimeVariants = cva('inline-flex items-center text-muted-foreground', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    layout: {
      horizontal: 'flex-row gap-2',
      vertical: 'flex-col gap-0.5',
      compact: 'flex-row gap-1',
    },
    variant: {
      default: '',
      muted: 'opacity-70',
      subtle: 'opacity-60',
    },
  },
  defaultVariants: {
    size: 'sm',
    layout: 'horizontal',
    variant: 'default',
  },
});

export interface TransactionDateTimeProps extends React.HTMLAttributes<HTMLDivElement> {
  date: string | Date;
  showDate?: boolean;
  showTime?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  locale?: SupportedLocale;
  timezone?: string;
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** レイアウト */
  layout?: 'horizontal' | 'vertical' | 'compact';
  /** バリアント */
  variant?: 'default' | 'muted' | 'subtle';
}

// ローカル関数は削除し、インポートしたユーティリティ関数を使用

/**
 * 取引日時コンポーネント
 */
export const TransactionDateTime = React.memo<TransactionDateTimeProps>(
  React.forwardRef<HTMLDivElement, TransactionDateTimeProps>(
    (
      {
        date,
        showDate = true,
        showTime = true,
        dateFormat = 'yyyy/MM/dd',
        timeFormat = 'HH:mm',
        locale = 'ja',
        timezone = getBrowserTimezone(),
        size = 'sm',
        layout = 'vertical',
        variant = 'default',
        className,
        ...props
      },
      ref
    ) => {
      const parsedDate = parseDate(date);

      if (!parsedDate) {
        return (
          <div
            ref={ref}
            className={cn(transactionDateTimeVariants({ size, layout, variant }), className)}
            {...props}
          >
            <span className=''>無効な日付</span>
          </div>
        );
      }

      const formattedDate = showDate
        ? formatInUserTimezone(parsedDate, dateFormat, timezone, locale)
        : '';
      const formattedTime = showTime
        ? formatInUserTimezone(parsedDate, timeFormat, timezone, locale)
        : '';

      return (
        <div
          ref={ref}
          className={cn(transactionDateTimeVariants({ size, layout, variant }), className)}
          role='img'
          aria-label={`取引日時: ${formattedDate} ${formattedTime}`}
          {...props}
        >
          {/* 日付表示 */}
          {showDate && <div className=''>{formattedDate}</div>}

          {/* 時刻表示 */}
          {showTime && <div className=''>{formattedTime}</div>}
        </div>
      );
    }
  )
);

TransactionDateTime.displayName = 'TransactionDateTime';
