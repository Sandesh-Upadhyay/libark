/**
 * 🎯 アクションボタングループコンポーネント (Molecule)
 *
 * 責任:
 * - ウォレットアクションボタンのグループ化
 * - レスポンシブなグリッドレイアウト
 * - 統一されたボタンスタイル
 * - アクセシビリティ対応
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { Bitcoin, Users, CreditCard, Send } from 'lucide-react';

import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';

// アイコンを事前インポートしてパフォーマンスを最適化

/**
 * アクションボタングループのバリアント定義（ESLintルール準拠）
 */
const actionButtonGroupVariants = cva('grid', {
  variants: {
    layout: {
      responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      horizontal: 'grid-cols-2 sm:grid-cols-4',
      vertical: 'grid-cols-1',
      compact: 'grid-cols-2 lg:grid-cols-4',
    },
    spacing: {
      sm: 'gap-2',
      md: 'gap-3 sm:gap-4',
      lg: 'gap-4 sm:gap-6',
    },
  },
  defaultVariants: {
    layout: 'responsive',
    spacing: 'md',
  },
});

/**
 * アクションボタンの定義
 */
export interface ActionButtonItem {
  /** ボタンのID */
  id: string;
  /** ボタンのラベル */
  label: string;
  /** ボタンのアイコン */
  icon: LucideIcon;
  /** ボタンのバリアント */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** ボタンのサイズ */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** クリックハンドラー */
  onClick: () => void;
  /** 無効状態 */
  disabled?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** 追加のクラス名 */
  className?: string;
}

export interface ActionButtonGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof actionButtonGroupVariants> {
  /** アクションボタンのリスト */
  buttons: ActionButtonItem[];
  /** ボタンのデフォルトサイズ */
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  /** ボタンの幅を統一するかどうか */
  uniformWidth?: boolean;
}

/**
 * アクションボタングループコンポーネント
 */
export const ActionButtonGroup = React.forwardRef<HTMLDivElement, ActionButtonGroupProps>(
  (
    { className, layout, spacing, buttons, buttonSize = 'lg', uniformWidth = true, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          actionButtonGroupVariants({ layout, spacing }),
          'action-button-group p-1', // 全体に軽いパディングを追加
          className
        )}
        role='group'
        aria-label='アクションボタン'
        {...props}
      >
        {buttons.map(button => {
          const IconComponent = button.icon;

          return (
            <Button
              key={button.id}
              variant={button.variant || 'outline'}
              size={button.size || buttonSize}
              onClick={button.onClick}
              disabled={button.disabled || button.loading}
              className={cn(
                'flex items-center justify-center h-12 px-4',
                'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-50',
                // バリアント別のベーススタイルを除去して、Buttonコンポーネントのデフォルトを使用
                uniformWidth && 'w-full',
                button.className
              )}
              aria-label={button.label}
            >
              {button.loading ? (
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current flex-shrink-0' />
              ) : (
                <IconComponent className='h-4 w-4 flex-shrink-0' aria-hidden='true' />
              )}
              <span className='ml-2 text-sm font-medium text-left'>{button.label}</span>
            </Button>
          );
        })}
      </div>
    );
  }
);

ActionButtonGroup.displayName = 'ActionButtonGroup';

/**
 * ウォレット専用のアクションボタングループ
 * よく使用されるウォレットアクションのプリセット
 */
export interface WalletActionButtonGroupProps extends Omit<ActionButtonGroupProps, 'buttons'> {
  /** 暗号通貨入金ハンドラー */
  onCryptoDeposit: () => void;
  /** クレジットカード入金ハンドラー */
  onCardDeposit: () => void;
  /** P2P入金ハンドラー */
  onP2PDeposit: () => void;
  /** 出金ハンドラー */
  onWithdraw: () => void;
  /** ローディング状態 */
  loading?: {
    crypto?: boolean;
    card?: boolean;
    p2p?: boolean;
    withdraw?: boolean;
  };
  /** 無効状態 */
  disabled?: {
    crypto?: boolean;
    card?: boolean;
    p2p?: boolean;
    withdraw?: boolean;
  };
}

export const WalletActionButtonGroup: React.FC<WalletActionButtonGroupProps> = React.memo(
  ({
    onCryptoDeposit,
    onCardDeposit,
    onP2PDeposit,
    onWithdraw,
    loading = {},
    disabled = {},
    ...props
  }) => {
    const buttons: ActionButtonItem[] = [
      {
        id: 'crypto-deposit',
        label: '暗号通貨',
        icon: Bitcoin,
        variant: 'outline',
        onClick: onCryptoDeposit,
        loading: loading.crypto,
        disabled: disabled.crypto,
      },
      {
        id: 'card-deposit',
        label: 'クレジットカード',
        icon: CreditCard,
        variant: 'outline',
        onClick: onCardDeposit,
        loading: loading.card,
        disabled: disabled.card,
      },
      {
        id: 'p2p-deposit',
        label: 'P2P取引',
        icon: Users,
        variant: 'outline',
        onClick: onP2PDeposit,
        loading: loading.p2p,
        disabled: disabled.p2p,
      },
      {
        id: 'withdraw',
        label: '出金',
        icon: Send,
        variant: 'destructive',
        onClick: onWithdraw,
        loading: loading.withdraw,
        disabled: disabled.withdraw,
      },
    ];

    return <ActionButtonGroup buttons={buttons} {...props} />;
  }
);

export default ActionButtonGroup;
