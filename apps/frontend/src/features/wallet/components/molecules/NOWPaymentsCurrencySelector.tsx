/**
 * 🪙 NOWPayments風通貨選択コンポーネント
 *
 * NOWPaymentsの公式UIを再現した通貨選択コンポーネント
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';
import { CurrencyIcon } from '@/features/wallet/components/atoms/CurrencyIcon';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
// import type { DisplayCurrency } from '../../../src/types/nowpayments';
interface DisplayCurrency {
  id?: string;
  code: string;
  name: string;
  logoUrl?: string;
  isPopular?: boolean;
  isStable?: boolean;
  network?: string;
}

interface NOWPaymentsCurrencySelectorProps {
  /** 利用可能な通貨リスト */
  currencies: DisplayCurrency[];
  /** 選択された通貨 */
  selectedCurrency?: string;
  /** 通貨変更時のコールバック */
  onCurrencyChange: (currency: string) => void;
  /** ローディング状態 */
  isLoading?: boolean;
  /** 無効化状態 */
  disabled?: boolean;
  /** カスタムクラス */
  className?: string;
}

export const NOWPaymentsCurrencySelector: React.FC<NOWPaymentsCurrencySelectorProps> = ({
  currencies,
  selectedCurrency,
  onCurrencyChange,
  isLoading = false,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 選択された通貨の詳細を取得
  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency);

  // 検索でフィルタリングされた通貨リスト
  const filteredCurrencies = currencies.filter(
    currency =>
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // デバッグログ
  React.useEffect(() => {
    console.log('NOWPaymentsCurrencySelector - currencies:', currencies.length);
    console.log('NOWPaymentsCurrencySelector - filteredCurrencies:', filteredCurrencies.length);
    if (currencies.length > 0) {
      console.log('Sample currency:', currencies[0]);
    }
  }, [currencies, filteredCurrencies]);

  // ドロップダウンの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ドロップダウンが開いたときに検索フィールドにフォーカス
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleCurrencySelect = (currency: DisplayCurrency) => {
    onCurrencyChange(currency.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  // 統一されたCryptoIconコンポーネントを使用

  return (
    <div className={cn('relative', className)}>
      {/* ラベル */}
      <div className='mb-2'>
        <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>Pay currency</div>
      </div>

      {/* メイン選択ボタン */}
      <div className='relative' ref={dropdownRef}>
        <button
          type='button'
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={cn(
            'w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors',
            isOpen && 'border-blue-500 dark:border-blue-400',
            disabled && 'opacity-50 cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
        >
          {selectedCurrencyData ? (
            <div className='flex items-center gap-3'>
              <CurrencyIcon
                currency={selectedCurrencyData.code}
                logoUrl={selectedCurrencyData.logoUrl}
                size='xl'
                className='flex-shrink-0'
              />
              <div className='text-left'>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-gray-900 dark:text-white'>
                    {selectedCurrencyData.code.toUpperCase()}
                  </span>
                  {selectedCurrencyData.network && (
                    <sup className='px-1.5 py-0.5 text-xs font-bold text-white rounded bg-gray-500'>
                      {selectedCurrencyData.network.toUpperCase()}
                    </sup>
                  )}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  {selectedCurrencyData.name}
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <div className='w-[35px] h-[35px] bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center'>
                <div className='text-xs font-bold'>?</div>
              </div>
              <div className='text-left'>
                <div className='font-semibold text-gray-500 dark:text-gray-400'>通貨を選択</div>
                <div className='text-sm text-gray-400 dark:text-gray-500'>
                  暗号通貨を選んでください
                </div>
              </div>
            </div>
          )}

          <ChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {/* ドロップダウンメニュー */}
        {isOpen && (
          <div
            className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${getComponentZIndexClass('DropdownMenu')} max-h-80 overflow-hidden`}
          >
            {/* 検索フィールド */}
            <div className='p-3 border-b border-gray-200 dark:border-gray-700'>
              <input
                ref={searchInputRef}
                type='text'
                placeholder='通貨を検索...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* 通貨リスト */}
            <div className='max-h-60 overflow-y-auto'>
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((currency, index) => {
                  // より安全なキー生成 - プリミティブ値のみ使用
                  const safeId =
                    typeof currency.id === 'string' || typeof currency.id === 'number'
                      ? String(currency.id)
                      : '';
                  const safeCode = typeof currency.code === 'string' ? currency.code : '';
                  const safeNetwork =
                    typeof currency.network === 'string' ? currency.network : 'default';
                  const uniqueKey = `currency-${safeId}-${safeCode}-${safeNetwork}-${index}`;

                  // キーの検証
                  if (
                    process.env.NODE_ENV === 'development' &&
                    uniqueKey.includes('[object Object]')
                  ) {
                    console.error(
                      'Invalid key detected in NOWPaymentsCurrencySelector:',
                      uniqueKey,
                      currency
                    );
                  }

                  return (
                    <button
                      key={uniqueKey}
                      onClick={() => handleCurrencySelect(currency)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left',
                        selectedCurrency === currency.code && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <CurrencyIcon
                        currency={currency.code}
                        logoUrl={currency.logoUrl}
                        size='xl'
                        className='flex-shrink-0'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-gray-900 dark:text-white'>
                            {typeof currency.code === 'string' ? currency.code.toUpperCase() : ''}
                          </span>
                          {currency.network && typeof currency.network === 'string' && (
                            <sup className='px-1.5 py-0.5 text-xs font-bold text-white rounded bg-gray-500'>
                              {currency.network.toUpperCase()}
                            </sup>
                          )}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                          {typeof currency.name === 'string' ? currency.name : ''}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
                  <div className='text-sm'>通貨が見つかりません</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NOWPaymentsCurrencySelector;
