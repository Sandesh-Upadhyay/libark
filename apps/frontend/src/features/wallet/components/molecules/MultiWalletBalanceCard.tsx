/**
 * 🎯 複数ウォレット残高カードコンポーネント (Molecule)
 *
 * 責任:
 * - 複数の残高情報の表示（ウォレット、売上、P2P）
 * - 残高種別の切り替え
 * - ロール別表示制御
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/atoms';

import { WalletTabs } from './WalletTabs';

// WalletBalanceはWalletTabsコンポーネント内で使用

/**
 * 複数ウォレット残高カードのバリアント定義
 */
const multiWalletBalanceCardVariants = cva('transition-all duration-200', {
  variants: {
    variant: {
      default: '',
      featured: 'border-primary/20 bg-primary/5',
      compact: 'p-4',
    },
    size: {
      default: '',
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface MultiWalletBalanceCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiWalletBalanceCardVariants> {
  /** ウォレット残高 */
  walletBalance: number;
  /** 売上残高 */
  salesBalance: number;
  /** P2P残高 */
  p2pBalance: number;
  /** 通貨コード */
  currency?: string;
  /** 入金ボタンを表示するか */
  showDepositButton?: boolean;
  /** 出金ボタンを表示するか */
  showWithdrawButton?: boolean;
  /** 残高移動ボタンを表示するか */
  showTransferButton?: boolean;
  /** 入金ボタンクリック時のコールバック */
  onDeposit?: (balanceType: string) => void;
  /** 出金ボタンクリック時のコールバック */
  onWithdraw?: (balanceType: string) => void;
  /** 残高移動ボタンクリック時のコールバック */
  onTransfer?: () => void;
  /** 残高クリック時のコールバック */
  onBalanceClick?: (balanceType: string) => void;
}

/**
 * 🎯 複数ウォレット残高カードコンポーネント
 */
export const MultiWalletBalanceCard = React.forwardRef<HTMLDivElement, MultiWalletBalanceCardProps>(
  (
    {
      walletBalance,
      salesBalance,
      p2pBalance,
      currency = 'USD',
      showDepositButton = true,
      showWithdrawButton = true,
      showTransferButton = true,
      onDeposit,
      onWithdraw,
      onTransfer,
      onBalanceClick,
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(multiWalletBalanceCardVariants({ variant, size }), className)}
        {...props}
      >
        <CardHeader>
          <CardTitle>ウォレット管理</CardTitle>
        </CardHeader>
        <CardContent>
          <WalletTabs
            walletBalance={walletBalance}
            salesBalance={salesBalance}
            p2pBalance={p2pBalance}
            currency={currency}
            onBalanceClick={onBalanceClick}
            className='space-y-4'
          />

          {/* ボタンは別途実装が必要な場合はここに追加 */}
          {(showDepositButton || showWithdrawButton || showTransferButton) && (
            <div className='flex flex-col sm:flex-row gap-2 mt-4'>
              {showDepositButton && (
                <Button
                  variant='default'
                  size='sm'
                  onClick={() => onDeposit?.('wallet')}
                  className='flex-1'
                >
                  入金
                </Button>
              )}
              {showWithdrawButton && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onWithdraw?.('wallet')}
                  className='flex-1'
                >
                  出金
                </Button>
              )}
              {showTransferButton && (
                <Button variant='ghost' size='sm' onClick={onTransfer} className='flex-1'>
                  残高移動
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

MultiWalletBalanceCard.displayName = 'MultiWalletBalanceCard';
