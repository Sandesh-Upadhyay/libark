/**
 * 🎯 取引方法表示コンポーネント (Atom)
 *
 * 責任:
 * - 取引方法（暗号通貨、ウォレット、P2P等）の表示
 * - 関連する通貨アイコンの表示
 * - サービス名やユーザー情報の表示
 * - 統一されたデザインシステム
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { CurrencyIcon, type CurrencyType } from './CurrencyIcon';


/**
 * 取引方法表示のバリアント定義
 */

// 取引方法
export type TransactionMethod = 'crypto' | 'wallet' | 'p2p' | 'service';

const transactionMethodVariants = cva('inline-flex items-center gap-2', {
  variants: {
    size: {
      xs: 'text-xs gap-1',
      sm: 'text-sm gap-1.5',
      md: 'text-base gap-2',
      lg: 'text-lg gap-2',
    },
    layout: {
      horizontal: 'flex-row',
      vertical: 'flex-col items-start gap-1',
      compact: 'flex-row gap-1',
    },
    variant: {
      default: '',
      muted: 'text-muted-foreground',
      subtle: 'opacity-80',
    },
  },
  defaultVariants: {
    size: 'sm',
    layout: 'horizontal',
    variant: 'default',
  },
});

export interface TransactionMethodProps extends React.HTMLAttributes<HTMLDivElement> {
  method: TransactionMethod;
  currency?: CurrencyType;
  serviceName?: string;
  serviceUrl?: string;
  userName?: string;
  userAvatar?: string;
  showCurrency?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  variant?: 'default' | 'muted' | 'subtle';
}

/**
 * 取引方法の表示名を取得
 */
const getMethodDisplayName = (method: TransactionMethod): string => {
  switch (method) {
    case 'crypto':
      return '暗号通貨';
    case 'wallet':
      return 'ウォレット残高';
    case 'p2p':
      return 'P2P取引';
    case 'service':
      return 'サービス';
    default:
      return '不明';
  }
};

/**
 * 取引方法コンポーネント
 */
export const TransactionMethodComponent = React.memo<TransactionMethodProps>(
  React.forwardRef<HTMLDivElement, TransactionMethodProps>(
    (
      {
        method,
        currency,
        serviceName,
        serviceUrl,
        userName,
        userAvatar,
        showCurrency = true,
        size = 'sm',
        layout = 'vertical',
        variant = 'default',
        className,
        ...props
      },
      ref
    ) => {
      const methodName = getMethodDisplayName(method);

      return (
        <div
          ref={ref}
          className={cn(transactionMethodVariants({ size, layout, variant }), className)}
          {...props}
        >
          {/* 上段：取引方法名またはサービス名 */}
          <div className=''>
            {serviceName ? (
              serviceUrl ? (
                <a href={serviceUrl} target='_blank' rel='noopener noreferrer' className=''>
                  {serviceName}
                  <ExternalLink className='' />
                </a>
              ) : (
                serviceName
              )
            ) : (
              methodName
            )}
          </div>

          {/* 下段：通貨アイコンまたはユーザー情報 */}
          <div className='flex items-center justify-center'>
            {/* 暗号通貨・P2P取引の場合：通貨アイコン */}
            {(method === 'crypto' || method === 'p2p') && currency && showCurrency && (
              <CurrencyIcon
                currency={currency}
                size={size === 'xs' ? 'xs' : 'sm'}
                variant='currency'
                iconOnly={false}
              />
            )}

            {/* ウォレット取引の場合：USD表示 */}
            {method === 'wallet' && showCurrency && (
              <CurrencyIcon
                currency='USD'
                size={size === 'xs' ? 'xs' : 'sm'}
                variant='currency'
                iconOnly={false}
              />
            )}

            {/* サービス取引の場合：ユーザー情報 */}
            {method === 'service' && userName && (
              <div className=''>
                <div className=''>
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className='' />
                  ) : (
                    <span className=''>👤</span>
                  )}
                </div>
                <span className=''>@{userName}</span>
              </div>
            )}

            {/* その他の場合：ダッシュ表示 */}
            {!((method === 'crypto' || method === 'p2p') && currency && showCurrency) &&
              !(method === 'wallet' && showCurrency) &&
              !(method === 'service' && userName) && <div className=''>-</div>}
          </div>
        </div>
      );
    }
  )
);

TransactionMethodComponent.displayName = 'TransactionMethod';

// 元の名前でもエクスポート（互換性のため）
export { TransactionMethodComponent as TransactionMethod };
export { getMethodDisplayName };
