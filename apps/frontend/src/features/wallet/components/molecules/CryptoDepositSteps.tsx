/**
 * 🎯 暗号通貨入金ステップコンポーネント群
 *
 * 責任:
 * - 各ステップのUI表示
 * - ユーザーインタラクションの処理
 * - 既存コンポーネントとの統合
 */

import React from 'react';
import { ArrowLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Motion, Button, QRCode } from '@/components/atoms';
import type { PaymentData, AmountLimits } from '@/features/wallet/hooks';

import { CurrencyIcon, type CurrencyType } from '../atoms/CurrencyIcon';

import { DepositForm } from './DepositForm';


// DisplayCurrency型の定義
interface DisplayCurrency {
  id?: string;
  code: string;
  name: string;
  logoUrl?: string;
  isPopular?: boolean;
  isStable?: boolean;
  network?: string;
}
// PaymentStatus型の定義
type _PaymentStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'sending'
  | 'partially_paid'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired';

/**
 * ネットワーク名の表示用変換
 */
const getDisplayNetworkName = (network: string): string | null => {
  const networkMap: Record<string, string> = {
    eth: 'Ethereum',
    bsc: 'BSC',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    avalanche: 'Avalanche',
    fantom: 'Fantom',
    solana: 'Solana',
    tron: 'TRON',
    bitcoin: 'Bitcoin',
    litecoin: 'Litecoin',
    dogecoin: 'Dogecoin',
    cardano: 'Cardano',
    polkadot: 'Polkadot',
    chainlink: 'Chainlink',
    cosmos: 'Cosmos',
    near: 'NEAR',
    algorand: 'Algorand',
    stellar: 'Stellar',
    ripple: 'XRP Ledger',
    monero: 'Monero',
    zcash: 'Zcash',
  };

  const normalizedNetwork = network.toLowerCase().trim();
  return networkMap[normalizedNetwork] || null;
};

// ==================== 通貨選択ステップ ====================

export interface CurrencySelectionStepProps {
  /** 利用可能な通貨リスト */
  currencies: DisplayCurrency[];
  /** 選択された通貨 */
  selectedCurrency: string | null;
  /** 通貨選択時のコールバック */
  onCurrencySelect: (currency: DisplayCurrency) => void;
  /** 次のステップに進むコールバック */
  onNext: () => void;
  /** ローディング状態 */
  isLoading?: boolean;
  /** 検索クエリ */
  searchQuery?: string;
  /** 検索クエリ変更コールバック */
  onSearchChange?: (query: string) => void;
  /** 全通貨表示状態 */
  showAllCurrencies?: boolean;
  /** 全通貨表示コールバック */
  onShowAllCurrencies?: () => void;
  /** 全通貨数 */
  totalCurrenciesCount?: number;
}

export const CurrencySelectionStep: React.FC<CurrencySelectionStepProps> = ({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  onNext: _onNext,
  isLoading = false,
  searchQuery = '',
  onSearchChange,
  showAllCurrencies = false,
  onShowAllCurrencies,
  totalCurrenciesCount = 0,
}) => {
  const handleCurrencyClick = (currency: DisplayCurrency) => {
    onCurrencySelect(currency);
    // onCurrencySelect内でステップ遷移を処理するため、ここではonNextを呼ばない
  };

  return (
    <Motion.div preset='slideUp' delay={0.1}>
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-lg font-semibold mb-2'>入金に使用する暗号通貨を選択してください</h2>
          <p className='text-sm text-muted-foreground'>対応している暗号通貨から選択できます</p>
        </div>

        {/* 検索バー */}
        {onSearchChange && (
          <div className='relative max-w-md mx-auto'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <svg
                className='h-5 w-5 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <input
              type='text'
              placeholder='通貨を検索...'
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            />
          </div>
        )}

        {/* 通貨グリッド - 固定高さでレイアウトシフト防止 */}
        <div className='min-h-[400px]'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              <span className='ml-3'>読み込み中...</span>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
              {currencies.map((currency, index) => {
                const isSelected = selectedCurrency === currency.code;

                // より安全なユニークキーを生成 - プリミティブ値のみ使用
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
                  console.error('Invalid key detected:', uniqueKey, currency);
                }

                return (
                  <button
                    key={uniqueKey}
                    onClick={() => handleCurrencyClick(currency)}
                    className={`flex flex-col p-4 border rounded-xl transition-all duration-200 cursor-pointer h-[140px] bg-white dark:bg-gray-800 overflow-hidden hover:shadow-md hover:scale-[1.02] ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* アイコン領域 */}
                    <div className='flex items-center justify-center h-12 w-12 mx-auto mb-3 flex-shrink-0 bg-muted/30 rounded-xl'>
                      <CurrencyIcon
                        currency={currency.code}
                        logoUrl={currency.logoUrl}
                        size='lg'
                        iconOnly={true}
                      />
                    </div>

                    {/* テキスト領域 */}
                    <div className='flex-1 flex flex-col justify-center items-center space-y-2 w-full min-h-0'>
                      <div className='w-full px-1'>
                        <p
                          className='text-sm font-semibold text-center leading-tight line-clamp-2 w-full break-words'
                          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                          {String(currency.name || '')}
                        </p>
                      </div>
                      <div className='w-full px-1 space-y-1'>
                        <p className='text-xs text-muted-foreground text-center font-mono font-bold w-full truncate'>
                          {String(currency.code || '').toUpperCase()}
                        </p>
                        {currency.network &&
                          typeof currency.network === 'string' &&
                          getDisplayNetworkName(currency.network) && (
                            <p className='text-xs text-center text-gray-400 w-full truncate'>
                              {getDisplayNetworkName(currency.network)}
                            </p>
                          )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 全通貨表示ボタン */}
          {!showAllCurrencies &&
            !searchQuery.trim() &&
            onShowAllCurrencies &&
            totalCurrenciesCount > currencies.length && (
              <div className='text-center mt-6'>
                <Button variant='outline' onClick={onShowAllCurrencies} className='px-6 py-3'>
                  全{totalCurrenciesCount}通貨から入金
                </Button>
              </div>
            )}
        </div>
      </div>
    </Motion.div>
  );
};

// ==================== 入金額入力ステップ ====================

export interface AmountInputStepProps {
  /** 選択された通貨 */
  selectedCurrency: string;
  /** 選択された通貨の詳細情報 */
  selectedCurrencyData?: DisplayCurrency;
  /** 制限額情報 */
  limits: AmountLimits | null;
  /** 制限額ローディング状態 */
  limitsLoading: boolean;
  /** 制限額エラー */
  limitsError: string | null;
  /** 入金額送信時のコールバック */
  onSubmit: (amount: number) => void;
  /** 前のステップに戻るコールバック */
  onBack: () => void;
  /** ローディング状態 */
  isLoading?: boolean;
}

export const AmountInputStep: React.FC<AmountInputStepProps> = ({
  selectedCurrency,
  selectedCurrencyData,
  limits,
  limitsLoading,
  limitsError,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  return (
    <Motion.div preset='slideUp' delay={0.1}>
      <div className='space-y-6 max-w-md mx-auto'>
        {/* 通貨ヘッダー - モダン版 */}
        <div className='text-center mb-8'>
          <div className='flex flex-col items-center gap-4'>
            {/* 通貨アイコン */}
            <div className='w-16 h-16 flex items-center justify-center bg-muted/30 rounded-2xl'>
              {selectedCurrencyData?.logoUrl ? (
                <img
                  src={selectedCurrencyData.logoUrl}
                  alt={selectedCurrencyData.name}
                  className='w-12 h-12 object-contain'
                />
              ) : (
                <CurrencyIcon
                  currency={selectedCurrency as CurrencyType}
                  size='2xl'
                  iconOnly={true}
                />
              )}
            </div>

            {/* 通貨情報 */}
            <div className='space-y-1'>
              <h3 className='text-xl font-bold text-center'>
                {selectedCurrencyData?.name || selectedCurrency}
              </h3>
              <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                <span className='text-sm font-mono font-semibold'>
                  {String(selectedCurrency || '').toUpperCase()}
                </span>
                {selectedCurrencyData?.network &&
                  getDisplayNetworkName(selectedCurrencyData.network) && (
                    <>
                      <span>•</span>
                      <span className='text-sm'>
                        {getDisplayNetworkName(selectedCurrencyData.network)}
                      </span>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {limitsError && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-2 h-2 bg-red-500 rounded-full'></div>
              <span className='text-sm font-medium text-red-700 dark:text-red-300'>エラー</span>
            </div>
            <p className='text-sm text-red-600 dark:text-red-400'>{String(limitsError || '')}</p>
          </div>
        )}

        {/* 入金フォーム */}
        <DepositForm
          minAmount={limits?.minAmount}
          maxAmount={limits?.maxAmount}
          currency='USD'
          minAmountCrypto={limits?.minAmountCrypto}
          selectedCurrency={selectedCurrency}
          isLoading={isLoading}
          limitsLoading={limitsLoading}
          limitsError={limitsError}
          limits={limits}
          onSubmit={onSubmit}
          title=''
          description=''
        />

        {/* 戻るボタン */}
        <div className='flex justify-center'>
          <Button variant='outline' onClick={onBack} className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            通貨変更
          </Button>
        </div>
      </div>
    </Motion.div>
  );
};

// ==================== QRコード表示ステップ ====================

export interface PaymentDisplayStepProps {
  /** 決済データ */
  paymentData: PaymentData;
  /** 選択された通貨 */
  selectedCurrency: string;
  /** 選択された通貨の詳細情報 */
  selectedCurrencyData?: DisplayCurrency;
  /** 入金額（USD） */
  amount: number;
  /** 新しい入金を開始するコールバック */
  onNewDeposit: () => void;
}

export const PaymentDisplayStep: React.FC<PaymentDisplayStepProps> = ({
  paymentData,
  selectedCurrency,
  selectedCurrencyData,
  amount,
  onNewDeposit,
}) => {
  // QRコード用のURI形式を生成（BIP21準拠、XRPなどのメモ対応）
  const generateQRValue = () => {
    const currency = String(selectedCurrency || '').toLowerCase();
    const address = String(paymentData.pay_address || '');
    const amount = paymentData.pay_amount;

    let qrValue = `${currency}:${address}?amount=${amount}&label=LIBARK%20Deposit`;

    // XRP、XLMなどでメモが必要な場合は追加
    if (paymentData.payin_extra_id) {
      const extraIdName = paymentData.extra_id_name || 'memo';
      qrValue += `&${extraIdName}=${paymentData.payin_extra_id}`;
    }

    return qrValue;
  };

  const qrCodeValue = generateQRValue();

  return (
    <Motion.div preset='slideUp' delay={0.1}>
      <div className='space-y-6 max-w-md mx-auto'>
        {/* 通貨ヘッダー - AmountInputStepと同じスタイル */}
        <div className='text-center mb-8'>
          <div className='flex flex-col items-center gap-4'>
            {/* 通貨アイコン */}
            <div className='w-16 h-16 flex items-center justify-center bg-muted/30 rounded-2xl'>
              <CurrencyIcon
                currency={selectedCurrency as CurrencyType}
                logoUrl={selectedCurrencyData?.logoUrl}
                size='2xl'
                iconOnly={true}
              />
            </div>

            {/* 通貨情報 */}
            <div className='space-y-1'>
              <h3 className='text-xl font-bold text-center'>
                {selectedCurrencyData?.name || selectedCurrency}
              </h3>
              <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                <span className='text-sm font-mono font-semibold'>
                  {String(selectedCurrency || '').toUpperCase()}
                </span>
                {selectedCurrencyData?.network &&
                  getDisplayNetworkName(selectedCurrencyData.network) && (
                    <>
                      <span>•</span>
                      <span className='text-sm'>
                        {getDisplayNetworkName(selectedCurrencyData.network)}
                      </span>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* QRコードと入金情報 */}
        <div className='bg-card border border-border rounded-lg p-4 sm:p-6'>
          {/* QRコード */}
          <div className='flex justify-center mb-6'>
            <div className='p-3 sm:p-4 bg-white rounded-lg border'>
              <QRCode
                value={qrCodeValue}
                size={window.innerWidth < 640 ? 160 : 200}
                alt={`${String(selectedCurrency || '')} Payment QR Code`}
              />
            </div>
          </div>

          {/* 入金情報 */}
          <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4'>
              <div className='text-center'>
                <p className='text-sm text-muted-foreground mb-1'>入金額</p>
                <p className='text-lg font-bold'>
                  {Number(paymentData.pay_amount).toFixed(8)}{' '}
                  {String(selectedCurrency || '').toUpperCase()}
                </p>
                <p className='text-sm text-muted-foreground'>(${amount.toFixed(2)} USD)</p>
              </div>
            </div>

            {/* 送金先アドレス */}
            <div>
              <p className='text-sm text-muted-foreground mb-2'>送金先アドレス</p>
              <div className='relative group'>
                <div className='p-3 bg-muted rounded-lg pr-12'>
                  <p className='text-sm font-mono break-all'>
                    {String(paymentData.pay_address || '')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentData.pay_address);
                    toast.success('アドレスをコピーしました');
                  }}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-background/80 transition-colors group-hover:bg-background/60'
                  title='アドレスをコピー'
                >
                  <Copy className='h-4 w-4 text-muted-foreground hover:text-foreground transition-colors' />
                </button>
              </div>
            </div>

            {/* メモ・タグ情報（XRP、XLMなどで必要） */}
            {paymentData.payin_extra_id && (
              <div>
                <p className='text-sm text-muted-foreground mb-2'>
                  {paymentData.extra_id_name || 'メモ'} (必須)
                </p>
                <div className='relative group'>
                  <div className='p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg pr-12'>
                    <p className='text-sm font-mono break-all font-bold'>
                      {String(paymentData.payin_extra_id || '')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentData.payin_extra_id || '');
                      toast.success(`${paymentData.extra_id_name || 'メモ'}をコピーしました`);
                    }}
                    className='absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-yellow-100/80 dark:hover:bg-yellow-800/40 transition-colors'
                    title={`${paymentData.extra_id_name || 'メモ'}をコピー`}
                  >
                    <Copy className='h-4 w-4 text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors' />
                  </button>
                </div>
                <div className='mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                  <p className='text-xs text-red-700 dark:text-red-300'>
                    ⚠️ {paymentData.extra_id_name || 'メモ'}
                    の入力を忘れると資金を失う可能性があります
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className='flex justify-center'>
          <Button onClick={onNewDeposit} className='flex items-center justify-center gap-2 w-full'>
            新しい入金
          </Button>
        </div>
      </div>
    </Motion.div>
  );
};
