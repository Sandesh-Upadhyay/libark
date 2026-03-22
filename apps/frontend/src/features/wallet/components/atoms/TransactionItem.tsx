/**
 * 🎯 取引アイテム表示コンポーネント (Atom)
 *
 * 責任:
 * - 取引情報の表示
 * - 取引タイプの視覚的区別
 * - 時刻フォーマット
 */

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { formatTransactionAmount } from '@/lib/utils/currencyUtils';
import { Badge } from '@/components/atoms';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

/**
 * 取引アイテムのバリアント定義
 */

/**
 * 取引タイプの定義
 */
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';

const transactionItemVariants = cva(
  'flex items-center justify-between p-3 rounded-lg border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-background hover:bg-muted/50',
        compact: 'p-2 bg-background hover:bg-muted/50',
        minimal: 'p-1 bg-transparent',
      },
      status: {
        completed: 'border-border',
        pending: 'border-warning bg-warning/5',
        failed: 'border-destructive bg-destructive/5',
      },
    },
    defaultVariants: {
      variant: 'default',
      status: 'completed',
    },
  }
);

export interface TransactionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 取引ID */
  id: string;
  /** 取引タイプ */
  type: TransactionType;
  /** 金額 */
  amount: number;
  /** 通貨 */
  currency?: string;
  /** 説明 */
  description: string;
  /** 取引時刻 */
  timestamp: Date | string;
  /** 取引ステータス */
  status?: 'completed' | 'pending' | 'failed';
  /** バリアント */
  variant?: 'default' | 'compact' | 'minimal';
}

/**
 * 取引タイプに応じたアイコンとスタイルを取得
 */
const getTransactionTypeInfo = (type: TransactionType) => {
  switch (type) {
    case 'deposit':
    case 'transfer_in':
      return {
        icon: ArrowDownLeft,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        label: type === 'deposit' ? '入金' : '受取',
      };
    case 'withdrawal':
    case 'transfer_out':
      return {
        icon: ArrowUpRight,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        label: type === 'withdrawal' ? '出金' : '送金',
      };
    default:
      return {
        icon: Clock,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: '取引',
      };
  }
};

/**
 * 時刻をフォーマットする関数
 */
const formatTimestamp = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatAmount = (amount: number, currency: string = 'USD'): string => {
  return formatTransactionAmount(amount, currency);
};

/**
 * 🎯 取引アイテム表示コンポーネント
 */
export const TransactionItem = React.forwardRef<HTMLDivElement, TransactionItemProps>(
  (
    {
      id,
      type,
      amount,
      currency = 'USD',
      description,
      timestamp,
      status = 'completed',
      variant,
      className,
      ...props
    },
    ref
  ) => {
    const typeInfo = getTransactionTypeInfo(type);
    const IconComponent = typeInfo.icon;
    const formattedAmount = formatAmount(amount, currency);
    const formattedTime = formatTimestamp(timestamp);

    return (
      <div
        ref={ref}
        className={cn(transactionItemVariants({ variant, status }), className)}
        {...props}
      >
        {/* 左側: アイコンと取引情報 */}
        <div className=''>
          {/* アイコン */}
          <div className=''>
            <IconComponent className='' />
          </div>

          {/* 取引情報 */}
          <div className=''>
            <div className=''>
              <div className='text-sm'>{description}</div>
              <Badge variant='secondary' size='sm'>
                {typeInfo.label}
              </Badge>
            </div>
            <div className=''>
              <div className='text-xs text-muted-foreground'>ID: {id.slice(0, 8)}...</div>
              <div className='text-xs text-muted-foreground'>{formattedTime}</div>
            </div>
          </div>
        </div>

        {/* 右側: 金額 */}
        <div className=''>
          <div className='text-sm font-medium'>{formattedAmount}</div>
          {status !== 'completed' && (
            <Badge
              variant={status === 'pending' ? 'secondary' : 'destructive'}
              size='sm'
              className=''
            >
              {status === 'pending' ? '処理中' : '失敗'}
            </Badge>
          )}
        </div>
      </div>
    );
  }
);

TransactionItem.displayName = 'TransactionItem';

export { transactionItemVariants };
