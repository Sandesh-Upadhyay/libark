'use client';

/**
 * CurrencyIcon - 通貨アイコン表示コンポーネント (Atom)
 *
 * 責任:
 * - 暗号通貨とUSDのアイコン統一表示
 * - 一貫したサイズとスタイル管理
 * - 色とバリアントの統一
 * - アトミックデザイン原則の厳密な遵守
 *
 * 特徴:
 * - 型安全な通貨指定
 * - CVAによる一貫したバリアント管理
 * - パフォーマンス最適化
 * - アクセシビリティ対応
 */

import React from 'react';
import { DollarSign, CircleDollarSign } from 'lucide-react';
import {
  TokenBTC,
  TokenETH,
  TokenUSDT,
  TokenXRP,
  TokenXMR,
  TokenBNB,
  TokenADA,
  TokenDOT,
  TokenMATIC,
  TokenSOL,
} from '@web3icons/react';
/**
 * CurrencyIcon バリアント定義（アトミックデザイン準拠）
 */
import { cva } from 'class-variance-authority';

import { DESIGN_COLORS } from '@/lib/constants/design-system';

// サポートされる通貨タイプ（型安全性を重視）
export type CurrencyType =
  | 'BTC'
  | 'ETH'
  | 'USDT'
  | 'XRP'
  | 'XMR'
  | 'BNB'
  | 'ADA'
  | 'DOT'
  | 'MATIC'
  | 'SOL'
  | 'AAVE'
  | 'USD'
  | 'JPY'
  | 'EUR';

/**
 * 通貨別のデフォルト色定義（デザインシステム準拠）
 * 統一定数から取得
 */
const CURRENCY_COLORS = DESIGN_COLORS.currency;

const currencyIconVariants = cva('inline-flex items-center justify-center', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
      '2xl': 'h-10 w-10',
    },
    variant: {
      default: 'text-foreground',
      currency: '', // 通貨固有の色を使用
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-destructive',
    },
  },
  defaultVariants: {
    size: 'sm',
    variant: 'currency',
  },
});

export interface CurrencyIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 通貨タイプ */
  currency: CurrencyType | string; // 文字列も受け入れるように拡張
  /** アイコンのみ表示（テキストなし） */
  iconOnly?: boolean;
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** バリアント */
  variant?: 'default' | 'currency' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
  /** NOWPayments SVGアイコンURL（オプション） */
  logoUrl?: string;
}

/**
 * NOWPayments SVGアイコンコンポーネント（フォールバック機能付き）
 */
const NOWPaymentsSVGIcon = ({
  logoUrl,
  currency,
  size,
  className,
  onError,
}: {
  logoUrl: string;
  currency: string;
  size?: string;
  className?: string;
  onError?: () => void;
}) => {
  const _iconSize =
    size === 'xs'
      ? 12
      : size === 'sm'
        ? 16
        : size === 'md'
          ? 20
          : size === 'lg'
            ? 24
            : size === 'xl'
              ? 32
              : size === '2xl'
                ? 40
                : 20;

  // Tailwindクラスでサイズを管理
  const sizeClass =
    size === 'xs'
      ? 'w-3 h-3'
      : size === 'sm'
        ? 'w-4 h-4'
        : size === 'md'
          ? 'w-5 h-5'
          : size === 'lg'
            ? 'w-6 h-6'
            : size === 'xl'
              ? 'w-8 h-8'
              : size === '2xl'
                ? 'w-10 h-10'
                : 'w-5 h-5';

  return (
    <img
      src={logoUrl}
      alt={`${currency} icon`}
      className={`${className} ${sizeClass} object-contain`}
      onError={e => {
        // SVG読み込みエラー時はフォールバック
        console.warn(`Failed to load icon for ${currency}:`, logoUrl);
        e.currentTarget.style.display = 'none';
        if (onError) {
          onError();
        }
      }}
    />
  );
};

/**
 * 通貨に対応するアイコンコンポーネントを取得（@web3icons/react使用）
 */
const getCurrencyIconComponent = (
  currency: CurrencyType | string,
  className?: string,
  variant?: string,
  size?: string,
  _logoUrl?: string
) => {
  // @web3icons/reactのサイズマッピング
  const iconSize =
    size === 'xs'
      ? 10
      : size === 'sm'
        ? 12
        : size === 'md'
          ? 16
          : size === 'lg'
            ? 20
            : size === 'xl'
              ? 24
              : size === '2xl'
                ? 32
                : 16;

  // バリアントが'currency'の場合は通貨固有の色を適用
  const color = variant === 'currency' ? (CURRENCY_COLORS as any)[currency] : undefined;

  // @web3icons/reactは色をcolorプロップで指定
  const iconProps = {
    size: iconSize,
    color: typeof color === 'string' && !color.startsWith('text-') ? color : undefined,
    className: typeof color === 'string' && color.startsWith('text-') ? className : className,
    'aria-label': getCurrencyDisplayName(currency as any),
  };

  switch (currency) {
    case 'BTC':
      return <TokenBTC {...iconProps} />;
    case 'ETH':
      return <TokenETH {...iconProps} />;
    case 'USDT':
      return <TokenUSDT {...iconProps} />;
    case 'XRP':
      return <TokenXRP {...iconProps} />;
    case 'XMR':
      return <TokenXMR {...iconProps} />;
    case 'BNB':
      return <TokenBNB {...iconProps} />;
    case 'ADA':
      return <TokenADA {...iconProps} />;
    case 'DOT':
      return <TokenDOT {...iconProps} />;
    case 'MATIC':
      return <TokenMATIC {...iconProps} />;
    case 'SOL':
      return <TokenSOL {...iconProps} />;
    case 'AAVE':
      // AAVEアイコンがない場合はCircleDollarSignで代用
      return <DollarSign className={className} aria-label='AAVE' />;
    case 'USD':
      return <DollarSign className={className} aria-label='US Dollar' />;
    case 'JPY':
      return <CircleDollarSign className={className} aria-label='Japanese Yen' />;
    case 'EUR':
      return <CircleDollarSign className={className} aria-label='Euro' />;
    default:
      return <DollarSign className={className} />;
  }
};

/**
 * 通貨の表示名を取得
 */
const getCurrencyDisplayName = (currency: CurrencyType): string => {
  switch (currency) {
    case 'BTC':
      return 'Bitcoin';
    case 'ETH':
      return 'Ethereum';
    case 'USDT':
      return 'Tether';
    case 'XRP':
      return 'Ripple';
    case 'XMR':
      return 'Monero';
    case 'BNB':
      return 'Binance Coin';
    case 'ADA':
      return 'Cardano';
    case 'DOT':
      return 'Polkadot';
    case 'MATIC':
      return 'Polygon';
    case 'SOL':
      return 'Solana';
    case 'AAVE':
      return 'Aave';
    case 'USD':
      return 'USD';
    case 'JPY':
      return 'JPY';
    case 'EUR':
      return 'EUR';
    default:
      return currency;
  }
};

/**
 * 🎯 CurrencyIcon コンポーネント (Atom)
 *
 * 責任:
 * - 通貨アイコンの統一表示
 * - サイズとスタイルの管理
 * - アクセシビリティ対応
 * - パフォーマンス最適化
 *
 * 特徴:
 * - アトミックデザイン準拠
 * - 型安全な通貨指定
 * - 一貫したスタイル管理
 * - メモ化によるパフォーマンス最適化
 */
export const CurrencyIcon = React.memo(
  React.forwardRef<HTMLDivElement, CurrencyIconProps>(
    (
      {
        currency,
        iconOnly = false,
        size = 'sm',
        variant = 'currency',
        className,
        logoUrl,
        ...props
      },
      ref
    ) => {
      const [localIconFailed, setLocalIconFailed] = React.useState(false);
      const [externalIconFailed, setExternalIconFailed] = React.useState(false);

      const iconClassName = currencyIconVariants({ size, variant });

      // フィアット通貨（USD, JPY, EUR）は直接Lucideアイコンを使用
      const isFiatCurrency = ['USD', 'JPY', 'EUR'].includes(currency.toString().toUpperCase());

      let iconComponent;

      if (isFiatCurrency) {
        // フィアット通貨は直接Lucideアイコンを使用
        iconComponent = getCurrencyIconComponent(
          currency as CurrencyType,
          iconClassName,
          variant,
          size
        );
      } else {
        // 暗号通貨の優先順位付きフォールバック
        const localIconPath = `/currency-icons/${currency.toString().toLowerCase()}.svg`;

        if (!localIconFailed) {
          // 1. ローカルSVGを最優先
          iconComponent = NOWPaymentsSVGIcon({
            logoUrl: localIconPath,
            currency: currency as string,
            size,
            className: iconClassName,
            onError: () => setLocalIconFailed(true),
          });
        } else if (logoUrl && !externalIconFailed) {
          // 2. propsのlogoUrlをフォールバック
          iconComponent = NOWPaymentsSVGIcon({
            logoUrl: logoUrl,
            currency: currency as string,
            size,
            className: iconClassName,
            onError: () => setExternalIconFailed(true),
          });
        } else {
          // 3. @web3icons/reactを最終フォールバック
          iconComponent = getCurrencyIconComponent(
            currency as CurrencyType,
            iconClassName,
            variant,
            size
          );
        }
      }

      const displayName = getCurrencyDisplayName(currency as CurrencyType);

      if (iconOnly) {
        return (
          <div
            ref={ref}
            className={className}
            role='img'
            aria-label={`${displayName} icon`}
            {...props}
          >
            {iconComponent}
          </div>
        );
      }

      return (
        <div
          ref={ref}
          className={className}
          role='img'
          aria-label={`${displayName} with label`}
          {...props}
        >
          {iconComponent}
          <span className=''>{displayName}</span>
        </div>
      );
    }
  )
);

CurrencyIcon.displayName = 'CurrencyIcon';

export { currencyIconVariants };
