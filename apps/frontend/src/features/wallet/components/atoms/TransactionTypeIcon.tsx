/**
 * 🎯 取引タイプアイコンコンポーネント (Atom)
 *
 * 責任:
 * - 取引タイプに応じたアイコンとスタイルの表示
 * - 統一されたデザインシステム
 * - アクセシビリティ対応
 */

import React from 'react';
import { ArrowUp, ArrowDown, Send, Download } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * 取引タイプアイコンのバリアント定義
 */

// 取引タイプ（4パターン）
export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'receive';

const transactionTypeIconVariants = cva('inline-flex items-center justify-center rounded-full', {
  variants: {
    size: {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
    variant: {
      default: '',
      minimal: 'bg-transparent',
      outlined: 'border-2',
    },
  },
  defaultVariants: {
    size: 'sm',
    variant: 'default',
  },
});

/**
 * 取引タイプ情報の取得
 */
const getTransactionTypeInfo = (type: TransactionType) => {
  switch (type) {
    case 'deposit':
      return {
        icon: ArrowDown,
        label: '入金',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        iconColor: 'text-green-600 dark:text-green-400',
        ariaLabel: '入金取引',
      };
    case 'withdrawal':
      return {
        icon: ArrowUp,
        label: '出金',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        iconColor: 'text-red-600 dark:text-red-400',
        ariaLabel: '出金取引',
      };
    case 'payment':
      return {
        icon: Send,
        label: '支払い',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        iconColor: 'text-orange-600 dark:text-orange-400',
        ariaLabel: '支払い取引',
      };
    case 'receive':
      return {
        icon: Download,
        label: '受け取り',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        ariaLabel: '受け取り取引',
      };
    default:
      return {
        icon: ArrowDown,
        label: '取引',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        iconColor: 'text-gray-600 dark:text-gray-400',
        ariaLabel: '取引',
      };
  }
};

export interface TransactionTypeIconProps extends React.HTMLAttributes<HTMLDivElement> {
  type: TransactionType;
  showLabel?: boolean;
  labelPosition?: 'bottom' | 'right';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'outlined';
}

/**
 * 取引タイプアイコンコンポーネント
 */
export const TransactionTypeIcon = React.memo<TransactionTypeIconProps>(
  React.forwardRef<HTMLDivElement, TransactionTypeIconProps>(
    (
      {
        type,
        size = 'sm',
        variant = 'default',
        showLabel = false,
        labelPosition: _labelPosition = 'bottom',
        className,
        ...props
      },
      ref
    ) => {
      const typeInfo = getTransactionTypeInfo(type);
      const IconComponent = typeInfo.icon;

      const iconElement = (
        <div
          className={cn(
            transactionTypeIconVariants({ size, variant }),
            typeInfo.bgColor,
            className
          )}
          aria-label={typeInfo.ariaLabel}
          role='img'
          {...props}
          ref={ref}
        >
          <IconComponent className='' />
        </div>
      );

      if (!showLabel) {
        return iconElement;
      }

      return (
        <div className=''>
          {iconElement}
          <span className=''>{typeInfo.label}</span>
        </div>
      );
    }
  )
);

TransactionTypeIcon.displayName = 'TransactionTypeIcon';

export { getTransactionTypeInfo };
