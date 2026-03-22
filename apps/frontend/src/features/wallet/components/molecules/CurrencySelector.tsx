/**
 * 🎯 通貨選択コンポーネント (Molecule)
 *
 * 責任:
 * - 通貨とネットワークの選択
 * - 為替レートの表示
 * - 計算結果の表示
 * - アトミックデザイン原則の厳密な遵守
 *
 * 特徴:
 * - 最適化されたATOMコンポーネントの使用
 * - パフォーマンス最適化
 * - アクセシビリティ対応
 * - 型安全性
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Label } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';

/**
 * 通貨選択のバリアント定義（シンプル版）
 */
const currencySelectorVariants = cva('w-full transition-all duration-200', {
  variants: {
    variant: {
      default: 'space-y-4',
      compact: 'space-y-3',
      minimal: 'space-y-3',
    },
    layout: {
      vertical: '',
      horizontal: 'grid grid-cols-2 gap-4 space-y-0',
      inline: 'flex flex-wrap gap-3 space-y-0',
    },
    state: {
      default: '',
      loading: 'opacity-60 pointer-events-none',
      error: 'opacity-80',
    },
  },
  defaultVariants: {
    variant: 'default',
    layout: 'vertical',
    state: 'default',
  },
});

export interface CurrencySelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'fullWidth' | 'maxWidth'>,
    VariantProps<typeof currencySelectorVariants> {
  /** 利用可能な通貨リスト */
  currencies: string[];
  /** 選択された通貨 */
  selectedCurrency: string;
  /** 通貨変更時のコールバック */
  onCurrencyChange: (currency: string) => void;
  /** 選択されたネットワーク */
  selectedNetwork: string;
  /** ネットワーク変更時のコールバック */
  onNetworkChange: (network: string) => void;
  /** 通貨に対応するネットワークを取得する関数 */
  getNetworksForCurrency: (currency: string) => string[];
  /** 現在の為替レート */
  exchangeRate?: number;
  /** USD金額 */
  usdAmount?: number;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  hasError?: boolean;
  /** エラーメッセージ */
  errorMessage?: string;
  /** 無効化状態 */
  disabled?: boolean;
  /** 全幅表示 */
  fullWidth?: boolean;
  /** 最大幅 */
  maxWidth?: string | number;
}

/**
 * 🎯 通貨選択コンポーネント（最適化版）
 */
const CurrencySelectorComponent = React.forwardRef<HTMLDivElement, CurrencySelectorProps>(
  (
    {
      currencies,
      selectedCurrency,
      onCurrencyChange,
      selectedNetwork,
      onNetworkChange,
      getNetworksForCurrency,
      isLoading = false,
      fullWidth = false,
      maxWidth,
      variant,
      layout,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // 利用可能なネットワーク（メモ化）
    const availableNetworks = React.useMemo(() => {
      return selectedCurrency ? getNetworksForCurrency(selectedCurrency) : [];
    }, [selectedCurrency, getNetworksForCurrency]);

    // ネットワーク表示名を取得
    const getNetworkDisplayName = (network: string): string => {
      const networkNames: { [key: string]: string } = {
        BITCOIN: 'Bitcoin Network',
        BTC: 'Bitcoin Network',
        ETH: 'Ethereum',
        TRC20: 'TRON (TRC20)',
        TRON: 'TRON',
        BSC: 'Binance Smart Chain',
        POLYGON: 'Polygon',
        ARBITRUM: 'Arbitrum One',
        OPTIMISM: 'Optimism',
        AVALANCHE: 'Avalanche C-Chain',
        SOLANA: 'Solana',
        CELO: 'CELO',
        BASE: 'Base',
        NEAR: 'NEAR Protocol',
      };
      return networkNames[network.toUpperCase()] || network;
    };

    // ネットワーク短縮説明を取得
    const getNetworkShortDescription = (network: string): string => {
      const descriptions: { [key: string]: string } = {
        ETH: '手数料: $3-20 | 確認: 1-5分',
        TRC20: '手数料: $0.1-1 | 確認: 1-3分',
        TRON: '手数料: $0.1-1 | 確認: 1-3分',
        BSC: '手数料: $0.1-2 | 確認: 1-3分',
        POLYGON: '手数料: $0.01-0.1 | 確認: 1-2分 ⭐おすすめ',
        ARBITRUM: '手数料: $0.1-2 | 確認: 1-2分',
        OPTIMISM: '手数料: $0.1-2 | 確認: 1-2分',
        SOLANA: '手数料: $0.001-0.01 | 確認: 30秒-1分 ⚡最速',
        AVALANCHE: '手数料: $0.1-1 | 確認: 1-2分',
        BITCOIN: '手数料: $1-10 | 確認: 10-60分',
        BTC: '手数料: $1-10 | 確認: 10-60分',
        CELO: '手数料: $0.01-0.1 | 確認: 1-2分',
      };
      return descriptions[network.toUpperCase()] || 'ブロックチェーンネットワーク';
    };

    // ネットワーク詳細説明を取得
    const getNetworkDescription = (network: string): string => {
      const descriptions: { [key: string]: string } = {
        ETH: 'Ethereum メインネット | 最高のセキュリティと流動性',
        TRC20: 'TRON ネットワーク | 低手数料で高速処理',
        TRON: 'TRON ネットワーク | 低手数料で高速処理',
        BSC: 'Binance Smart Chain | バランスの取れた選択',
        POLYGON: 'Polygon (Ethereum L2) | 最もコスパが良い選択',
        ARBITRUM: 'Arbitrum One (Ethereum L2) | Ethereum互換で低手数料',
        OPTIMISM: 'Optimism (Ethereum L2) | Ethereum L2の先駆者',
        SOLANA: 'Solana ネットワーク | 最速・最安の選択',
        AVALANCHE: 'Avalanche C-Chain | 環境に優しい選択',
        BITCOIN: 'Bitcoin ネットワーク | 最高のセキュリティ',
        BTC: 'Bitcoin ネットワーク | 最高のセキュリティ',
        CELO: 'CELO ネットワーク | モバイルファースト',
      };
      return descriptions[network.toUpperCase()] || 'ブロックチェーンネットワーク';
    };

    return (
      <div
        ref={ref}
        className={cn(
          currencySelectorVariants({ variant, layout }),
          fullWidth && 'w-full',
          className
        )}
        style={{
          maxWidth: maxWidth
            ? typeof maxWidth === 'number'
              ? `${maxWidth}px`
              : maxWidth
            : undefined,
          ...style,
        }}
        {...props}
      >
        {/* 通貨選択 */}
        <div className='space-y-2'>
          <Label>暗号通貨</Label>
          <Select value={selectedCurrency} onValueChange={onCurrencyChange} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder='通貨を選択'>
                {selectedCurrency && (
                  <div className='flex items-center gap-2'>
                    <span>{selectedCurrency}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.map(currency => (
                <SelectItem key={currency} value={currency}>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm'>{currency}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ネットワーク選択 - マルチネットワーク通貨のみ表示 */}
        {selectedCurrency && availableNetworks.length > 1 && (
          <div className='space-y-3'>
            <Label>ネットワーク</Label>
            <Select value={selectedNetwork} onValueChange={onNetworkChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder='ネットワークを選択' />
              </SelectTrigger>
              <SelectContent>
                {availableNetworks.map(network => (
                  <SelectItem key={network} value={network}>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-medium'>{getNetworkDisplayName(network)}</span>
                      <span className='text-xs text-muted-foreground'>
                        {getNetworkShortDescription(network)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 選択されたネットワークの詳細情報 */}
            {selectedNetwork && (
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800'>
                <div className='flex items-start gap-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0'></div>
                  <div className='flex-1'>
                    <span className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                      {getNetworkDisplayName(selectedNetwork)}
                    </span>
                    <span className='text-xs text-blue-600 dark:text-blue-300 mt-1'>
                      {getNetworkDescription(selectedNetwork)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

CurrencySelectorComponent.displayName = 'CurrencySelector';

export const CurrencySelector = React.memo(CurrencySelectorComponent);

export { currencySelectorVariants };
