/**
 * 🎯 取引ステータス表示コンポーネント (Atom)
 *
 * 責任:
 * - 取引ステータスの視覚的表示
 * - ステータスに応じたアイコンと色分け
 * - 統一されたデザインシステム
 * - アクセシビリティ対応
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * ステータスアイコンのバリアント定義
 */

// 取引ステータス
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

const transactionStatusVariants = cva('inline-flex items-center gap-1.5', {
  variants: {
    size: {
      xs: 'text-xs gap-1',
      sm: 'text-sm gap-1.5',
      md: 'text-base gap-2',
      lg: 'text-lg gap-2',
    },
    layout: {
      horizontal: 'flex-row',
      vertical: 'flex-col items-center gap-1',
      compact: 'flex-row gap-1',
    },
    variant: {
      default: '',
      badge: 'px-2 py-1 rounded-full text-xs font-medium',
      minimal: 'gap-1',
    },
  },
  defaultVariants: {
    size: 'sm',
    layout: 'horizontal',
    variant: 'default',
  },
});

/**
 * アイコンサイズのマッピング
 */

/**
 * ステータス情報の取得
 */
const getStatusInfo = (status: TransactionStatus) => {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle,
        label: '完了',
        color: 'text-success',
        bgColor: 'bg-success/10',
        ariaLabel: '取引完了',
      };
    case 'pending':
      return {
        icon: Clock,
        label: '処理中',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        ariaLabel: '取引処理中',
      };
    case 'failed':
      return {
        icon: AlertCircle,
        label: '失敗',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        ariaLabel: '取引失敗',
      };
    case 'cancelled':
      return {
        icon: XCircle,
        label: 'キャンセル',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        ariaLabel: '取引キャンセル',
      };
    default:
      return {
        icon: Clock,
        label: '不明',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        ariaLabel: 'ステータス不明',
      };
  }
};

export interface TransactionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: TransactionStatus;
  showLabel?: boolean;
  showIcon?: boolean;
  iconOnly?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  variant?: 'default' | 'minimal' | 'badge';
}

/**
 * 取引ステータスコンポーネント
 */
export const TransactionStatusComponent = React.memo<TransactionStatusProps>(
  React.forwardRef<HTMLDivElement, TransactionStatusProps>(
    (
      {
        status,
        showLabel = true,
        showIcon = true,
        iconOnly = false,
        size = 'sm',
        layout = 'vertical',
        variant = 'default',
        className,
        ...props
      },
      ref
    ) => {
      const statusInfo = getStatusInfo(status);
      const IconComponent = statusInfo.icon;

      // アイコンのみの表示
      if (iconOnly) {
        return (
          <div
            ref={ref}
            className={className}
            role='img'
            aria-label={statusInfo.ariaLabel}
            {...props}
          >
            <IconComponent className='' />
          </div>
        );
      }

      return (
        <div
          ref={ref}
          className={cn(transactionStatusVariants({ size, layout, variant }), className)}
          role='img'
          aria-label={statusInfo.ariaLabel}
          {...props}
        >
          {/* アイコン */}
          {showIcon && (
            <div className='flex justify-center'>
              <IconComponent className='' />
            </div>
          )}

          {/* ラベル */}
          {showLabel && <div className=''>{statusInfo.label}</div>}
        </div>
      );
    }
  )
);

TransactionStatusComponent.displayName = 'TransactionStatus';

// 元の名前でもエクスポート（互換性のため）
export { TransactionStatusComponent as TransactionStatus };
export { getStatusInfo };
