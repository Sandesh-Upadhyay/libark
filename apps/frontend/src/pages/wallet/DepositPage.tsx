/**
 * 🎯 入金方法選択ページ
 *
 * 責任:
 * - 入金方法（NOWPayments、CoinPayments）の選択
 * - 各決済プロバイダーへの導線提供
 * - ウォレットナビゲーションとの統合
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bitcoin, History, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { type DisplayCurrency, type CurrenciesResponse } from '@/lib/nowpayments-api';
import { Motion } from '@/components/atoms';
import { Button } from '@/components/atoms';
import { SectionShell } from '@/components/molecules/SectionShell';
import { TabNavigation } from '@/components/atoms/tabs/TabNavigation';
import { TabContent } from '@/components/atoms/tabs/TabContent';
import type { TabItem } from '@/types';
import { Header } from '@/components/molecules/Header';
// 新しいコンポーネントとフックのインポート
import { useCryptoDepositFlow } from '@/features/wallet/hooks';
import {
  CurrencySelectionStep,
  AmountInputStep,
  PaymentDisplayStep,
} from '@/features/wallet/components/molecules/CryptoDepositSteps';
// 出金関連のインポート
import { Card, CardContent } from '@/components/atoms';
import { Label } from '@/components/atoms';
import { Input } from '@/components/atoms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';
import { Textarea } from '@/components/atoms';
import { CurrencySelector } from '@/features/wallet/components/molecules';
import { WalletBalance } from '@/features/wallet/components/atoms/WalletBalance';
import {
  useWallet,
  useExchangeRate,
  useSupportedCurrencies,
  useCreateWithdrawalRequest,
} from '@/features/wallet/hooks';

// 主要通貨の定義（コンポーネント外で定義して参照の安定性を保つ）
const LOCAL_MAJOR_CURRENCIES = [
  'BTC',
  'ETH',
  'USDT',
  'USDC',
  'BNB',
  'XRP',
  'ADA',
  'SOL',
  'DOGE',
  'MATIC',
  'DOT',
  'AVAX',
  'SHIB',
  'TRX',
  'UNI',
  'ATOM',
  'LTC',
  'LINK',
  'XLM',
  'AAVE',
] as const;

/**
 * 🎯 暗号通貨入金・出金ページコンポーネント
 */
const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  // 入金フロー管理フック
  const {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    resetFlow,
    selectedCurrency,
    setSelectedCurrency,
    amount,
    setAmount,
    limits,
    limitsLoading,
    limitsError,
    paymentData,
    paymentLoading,
    paymentError,
    createPayment: _createPayment,
    createPaymentWithAmount,
  } = useCryptoDepositFlow();

  // 出金関連のフック
  const { wallet, loading: walletLoading } = useWallet();
  const { currencies: withdrawCurrencies, loading: currenciesLoading } = useSupportedCurrencies();
  const { createWithdrawal, loading: withdrawalLoading } = useCreateWithdrawalRequest();

  // 出金フォーム状態
  const [withdrawSelectedCurrency, setWithdrawSelectedCurrency] = useState<string>('');
  const [withdrawSelectedNetwork, setWithdrawSelectedNetwork] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAmountType, setWithdrawAmountType] = useState<'crypto' | 'usd'>('crypto');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  // 為替レート取得（出金用）
  const { exchangeRate: rate, loading: rateLoading } = useExchangeRate(
    withdrawSelectedCurrency,
    'USD'
  );

  // 出金の計算された金額
  const cryptoAmount =
    withdrawAmountType === 'usd' && rate
      ? parseFloat(withdrawAmount) / rate
      : parseFloat(withdrawAmount) || 0;

  // タブ設定
  const tabs: TabItem[] = [
    {
      value: 'deposit',
      label: '入金',
      icon: Bitcoin,
    },
    {
      value: 'withdraw',
      label: '出金',
      icon: Send,
    },
  ];
  const usdAmount =
    withdrawAmountType === 'crypto' && rate
      ? parseFloat(withdrawAmount) * rate
      : parseFloat(withdrawAmount) || 0;

  // 手数料（モック）
  const estimatedFee = cryptoAmount * 0.001; // 0.1%
  const finalAmount = cryptoAmount - estimatedFee;

  // 残高チェック
  const hasInsufficientBalance = wallet ? usdAmount > wallet.balanceUsd : false;

  // 新しい通貨取得ロジック（full-currencies APIを使用）
  const [currencies, setCurrencies] = useState<DisplayCurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 検索機能用状態
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState<DisplayCurrency[]>([]);

  // 主要通貨表示用状態
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [displayedCurrencies, setDisplayedCurrencies] = useState<DisplayCurrency[]>([]);

  // 設定
  const CACHE_KEY = 'full-currencies-cache';
  const CACHE_EXPIRY = 10 * 60 * 1000; // 10分

  // キャッシュから取得
  const getCachedCurrencies = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to get cached currencies:', error);
    }
    return null;
  }, [CACHE_KEY, CACHE_EXPIRY]);

  // キャッシュに保存
  const setCachedCurrencies = useCallback(
    (currencies: DisplayCurrency[]) => {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: currencies,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.warn('Failed to cache currencies:', error);
      }
    },
    [CACHE_KEY]
  );

  // 通貨の詳細情報を取得（新しいfull-currencies APIを使用）
  useEffect(() => {
    const fetchFullCurrencies = async () => {
      try {
        setIsLoading(true);

        // キャッシュから取得を試行
        const cachedCurrencies = getCachedCurrencies();
        if (cachedCurrencies) {
          setCurrencies(cachedCurrencies);
          setIsLoading(false);
          console.log('Currencies loaded from cache:', cachedCurrencies.length, 'currencies');
          return;
        }

        // 新しいAPIから取得
        const response = await fetch('/api/nowpayments/currencies/full');
        const result: CurrenciesResponse = await response.json();

        if (result.success && result.data) {
          // NOWPaymentsCurrencyからDisplayCurrencyに変換
          const displayCurrencies: DisplayCurrency[] = result.data.map(
            (currency: {
              id?: string;
              code: string;
              name: string;
              logo_url?: string;
              is_popular?: boolean;
              is_stable?: boolean;
              network?: string;
            }) => ({
              id: currency.id || currency.code,
              code: currency.code,
              name: currency.name,
              logoUrl: currency.logo_url ? `https://nowpayments.io${currency.logo_url}` : '',
              isPopular: currency.is_popular || false,
              isStable: currency.is_stable || false,
              network: currency.network,
            })
          );

          setCurrencies(displayCurrencies);
          setCachedCurrencies(displayCurrencies);
          console.log('Currencies loaded from API:', displayCurrencies.length, 'currencies');
          console.log(
            'Sample currencies:',
            displayCurrencies.slice(0, 5).map(c => `${c.code} (${c.name})`)
          );
        } else {
          throw new Error('Failed to fetch currencies');
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
        toast.error('対応通貨の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullCurrencies();
  }, [getCachedCurrencies, setCachedCurrencies]);

  // 検索フィルタリング機能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCurrencies(currencies);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = currencies.filter(currency => {
        return (
          currency.code.toLowerCase().includes(query) ||
          currency.name.toLowerCase().includes(query) ||
          (currency.network || '').toLowerCase().includes(query)
        );
      });
      setFilteredCurrencies(filtered);
    }
  }, [searchQuery, currencies]);

  // 表示する通貨を計算（useMemoで最適化）
  const displayedCurrenciesCalculated = useMemo(() => {
    if (filteredCurrencies.length === 0) {
      return [];
    }

    // 主要通貨と残りの通貨を分離
    const majorCurrencies = filteredCurrencies.filter(currency =>
      LOCAL_MAJOR_CURRENCIES.includes(currency.code as (typeof LOCAL_MAJOR_CURRENCIES)[number])
    );
    const otherCurrencies = filteredCurrencies.filter(
      currency =>
        !LOCAL_MAJOR_CURRENCIES.includes(currency.code as (typeof LOCAL_MAJOR_CURRENCIES)[number])
    );

    // 主要通貨を定義順にソート
    const sortedMajorCurrencies = majorCurrencies.sort((a, b) => {
      const indexA = LOCAL_MAJOR_CURRENCIES.indexOf(
        a.code as (typeof LOCAL_MAJOR_CURRENCIES)[number]
      );
      const indexB = LOCAL_MAJOR_CURRENCIES.indexOf(
        b.code as (typeof LOCAL_MAJOR_CURRENCIES)[number]
      );
      return indexA - indexB;
    });

    // 検索中または全表示モードの場合は全て表示
    if (searchQuery.trim() || showAllCurrencies) {
      return [...sortedMajorCurrencies, ...otherCurrencies];
    } else {
      // 通常時は主要通貨のみ表示
      return sortedMajorCurrencies;
    }
  }, [filteredCurrencies, searchQuery, showAllCurrencies]);

  // 計算結果をstateに反映
  useEffect(() => {
    setDisplayedCurrencies(displayedCurrenciesCalculated);
  }, [displayedCurrenciesCalculated]);

  // 全通貨表示の切り替え
  const handleShowAllCurrencies = useCallback(() => {
    setShowAllCurrencies(true);
  }, []);

  // 通貨選択ハンドラー
  const handleCurrencySelect = useCallback(
    (currency: DisplayCurrency) => {
      console.log('Currency selected:', currency.code, currency.name);
      setSelectedCurrency(currency.code);
      // 状態更新後にステップ遷移するため、setTimeoutを使用
      setTimeout(() => {
        goToNextStep();
      }, 100);
    },
    [setSelectedCurrency, goToNextStep]
  );

  // 戻るボタン
  const handleBack = () => {
    if (currentStep === 'currency-selection') {
      navigate('/wallet');
    } else {
      goToPreviousStep();
    }
  };

  // 入金額送信処理
  const handleAmountSubmit = async (submittedAmount: number) => {
    try {
      console.log('Submitting amount:', submittedAmount, 'for currency:', selectedCurrency);

      // 金額を設定してから決済作成を実行
      setAmount(submittedAmount);

      // 直接パラメータを渡して決済作成を実行
      await createPaymentWithAmount(submittedAmount);
    } catch (error) {
      console.error('Payment creation failed:', error);
      // createPayment内でtoast.errorが既に呼ばれているので、ここでは追加のエラー処理のみ
    }
  };

  // 決済作成成功時に自動的に次のステップに進む
  useEffect(() => {
    if (paymentData && !paymentError && currentStep === 'amount-input') {
      console.log('Payment created successfully, moving to next step');
      goToNextStep();
    }
  }, [paymentData, paymentError, currentStep, goToNextStep]);

  // 出金フォーム送信
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !withdrawSelectedCurrency ||
      !withdrawSelectedNetwork ||
      !withdrawAmount ||
      !destinationAddress
    ) {
      toast.error('すべての必須項目を入力してください');
      return;
    }

    if (hasInsufficientBalance) {
      toast.error('残高が不足しています');
      return;
    }

    try {
      await createWithdrawal({
        currency: withdrawSelectedCurrency,
        amount: cryptoAmount,
        destinationAddress,
        memo: memo || undefined,
        network: withdrawSelectedNetwork,
      });

      toast.success('送金申請を送信しました');
      navigate('/wallet');
    } catch (error) {
      console.error('送金申請エラー:', error);
      toast.error('送金申請の送信に失敗しました');
    }
  };

  // ステップタイトルの取得
  const getStepTitle = () => {
    switch (currentStep) {
      case 'currency-selection':
        return '対応暗号通貨';
      case 'amount-input':
        return '入金額入力';
      case 'payment-display':
        return '入金指示';
      default:
        return '暗号通貨入金';
    }
  };

  // ステップ説明の取得（最小限）
  const getStepDescription = () => {
    return ''; // 説明文を削除してタイトルのみ表示
  };

  return (
    <div role='main' aria-label='暗号通貨入金'>
      {/* メインヘッダー - ウォレットページと統一 */}
      <Header
        title='暗号通貨入金'
        variant='x-style'
        headingLevel='h2'
        showBorder={true}
        showBackButton={true}
        onBackClick={() => navigate('/wallet')}
        backButtonLabel='ウォレットに戻る'
      />

      {/* 統一タブナビゲーション */}
      <div className='bg-background border-b border-border/30'>
        <div className='p-4'>
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={value => setActiveTab(value as 'deposit' | 'withdraw')}
            sticky={false}
          />
        </div>
      </div>

      {/* 入金タブ */}
      <TabContent value='deposit' activeTab={activeTab}>
        <div className='bg-background border-b border-border/30'>
          <div className='p-4'>
            <div className='flex justify-between mb-4 gap-2'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigate('/wallet/deposit/crypto/history')}
                  className='flex items-center gap-2'
                >
                  <History className='h-4 w-4' />
                  入金履歴
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigate('/p2p/deposit')}
                  className='flex items-center gap-2'
                >
                  <Send className='h-4 w-4' />
                  P2P入金
                </Button>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleBack}
                className='flex items-center'
              >
                <ArrowLeft className='h-4 w-4' />
                {currentStep === 'currency-selection' ? '戻る' : '前のステップ'}
              </Button>
            </div>

            <Motion.div preset='slideUp'>
              <SectionShell
                variant='settings'
                title={getStepTitle()}
                description={getStepDescription()}
                icon={Bitcoin}
              >
                {/* ステップベースのコンテンツ - 固定高さでレイアウトシフト防止 */}
                <div className='min-h-[500px]'>
                  {currentStep === 'currency-selection' && (
                    <CurrencySelectionStep
                      currencies={displayedCurrencies}
                      selectedCurrency={selectedCurrency}
                      onCurrencySelect={handleCurrencySelect}
                      onNext={goToNextStep}
                      isLoading={isLoading}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      showAllCurrencies={showAllCurrencies}
                      onShowAllCurrencies={handleShowAllCurrencies}
                      totalCurrenciesCount={currencies.length}
                    />
                  )}

                  {currentStep === 'amount-input' && selectedCurrency && (
                    <AmountInputStep
                      selectedCurrency={selectedCurrency}
                      selectedCurrencyData={currencies.find(c => c.code === selectedCurrency)}
                      limits={limits}
                      limitsLoading={limitsLoading}
                      limitsError={limitsError}
                      onSubmit={handleAmountSubmit}
                      onBack={goToPreviousStep}
                      isLoading={paymentLoading}
                    />
                  )}

                  {/* フォールバック表示 - ステップが表示されない場合 */}
                  {currentStep === 'amount-input' && !selectedCurrency && (
                    <div className='text-center py-8'>
                      <div className='text-muted-foreground'>通貨が選択されていません</div>
                      <Button onClick={goToPreviousStep} className='mt-4'>
                        通貨を選択
                      </Button>
                    </div>
                  )}

                  {currentStep === 'payment-display' &&
                    paymentData &&
                    selectedCurrency &&
                    amount && (
                      <PaymentDisplayStep
                        paymentData={paymentData}
                        selectedCurrency={selectedCurrency}
                        selectedCurrencyData={currencies.find(c => c.code === selectedCurrency)}
                        amount={amount}
                        onNewDeposit={resetFlow}
                      />
                    )}
                </div>
              </SectionShell>
            </Motion.div>
          </div>
        </div>
      </TabContent>

      {/* 出金タブ */}
      <TabContent value='withdraw' activeTab={activeTab}>
        <div className='bg-background border-b border-border/30'>
          <div className='p-4'>
            <div className='flex justify-between mb-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigate('/wallet/withdraw/crypto/history')}
                className='flex items-center gap-2'
              >
                <History className='h-4 w-4' />
                出金履歴
              </Button>
            </div>

            <Motion.div preset='slideUp'>
              <SectionShell
                variant='settings'
                title={t('wallet.withdraw.form.title', { default: '送金情報' })}
                description={t('wallet.withdraw.form.description', {
                  default: '送金先と金額を入力してください',
                })}
                icon={Send}
              >
                <form onSubmit={handleWithdrawSubmit}>
                  {/* 現在の残高表示 */}
                  {wallet && (
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-center'>
                          <p className='text-sm text-muted-foreground mb-1'>利用可能残高</p>
                          <WalletBalance
                            amount={wallet.balanceUsd}
                            currency='USD'
                            size='lg'
                            variant='primary'
                            // align='center' // alignプロパティを削除
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 通貨選択 */}
                  <div className='space-y-2'>
                    <Label htmlFor='currency'>通貨</Label>
                    <CurrencySelector
                      currencies={withdrawCurrencies.map(c => c.code)}
                      selectedCurrency={withdrawSelectedCurrency}
                      onCurrencyChange={setWithdrawSelectedCurrency}
                      selectedNetwork=''
                      onNetworkChange={() => {}}
                      getNetworksForCurrency={() => []}
                      isLoading={currenciesLoading}
                    />
                  </div>

                  {/* ネットワーク選択 */}
                  {withdrawSelectedCurrency && (
                    <div className='space-y-2'>
                      <Label htmlFor='network'>ネットワーク</Label>
                      <Select
                        value={withdrawSelectedNetwork}
                        onValueChange={setWithdrawSelectedNetwork}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='ネットワークを選択' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='mainnet'>メインネット</SelectItem>
                          <SelectItem value='testnet'>テストネット</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 金額入力 */}
                  <div className='space-y-2'>
                    <Label htmlFor='amount'>金額</Label>
                    <div className='flex space-x-2'>
                      <Input
                        id='amount'
                        type='number'
                        step='0.00000001'
                        placeholder='0.00000000'
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        className='flex-1'
                      />
                      <Select
                        value={withdrawAmountType}
                        onValueChange={(value: 'crypto' | 'usd') => setWithdrawAmountType(value)}
                      >
                        <SelectTrigger className='w-24'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='crypto'>
                            {withdrawSelectedCurrency || 'CRYPTO'}
                          </SelectItem>
                          <SelectItem value='usd'>USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {rate && withdrawAmount && (
                      <p className='text-sm text-muted-foreground'>
                        ≈{' '}
                        {withdrawAmountType === 'crypto'
                          ? `$${usdAmount.toFixed(2)} USD`
                          : `${cryptoAmount.toFixed(8)} ${withdrawSelectedCurrency}`}
                      </p>
                    )}
                  </div>

                  {/* 送金先アドレス */}
                  <div className='space-y-2'>
                    <Label htmlFor='address'>送金先アドレス</Label>
                    <Input
                      id='address'
                      placeholder='送金先のウォレットアドレスを入力'
                      value={destinationAddress}
                      onChange={e => setDestinationAddress(e.target.value)}
                      className='font-mono'
                    />
                  </div>

                  {/* メモ（オプション） */}
                  <div className='space-y-2'>
                    <Label htmlFor='memo'>メモ（オプション）</Label>
                    <Textarea
                      id='memo'
                      placeholder='必要に応じてメモを入力'
                      value={memo}
                      onChange={e => setMemo(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* 手数料と最終金額 */}
                  {withdrawAmount && rate && (
                    <Card>
                      <CardContent className='p-4 space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span>送金金額:</span>
                          <span>
                            {cryptoAmount.toFixed(8)} {withdrawSelectedCurrency}
                          </span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span>手数料:</span>
                          <span>
                            {estimatedFee.toFixed(8)} {withdrawSelectedCurrency}
                          </span>
                        </div>
                        <div className='flex justify-between font-medium border-t pt-2'>
                          <span>受取金額:</span>
                          <span>
                            {finalAmount.toFixed(8)} {withdrawSelectedCurrency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* エラー表示 */}
                  {hasInsufficientBalance && (
                    <div className='text-red-600 text-sm'>
                      残高が不足しています。利用可能残高: ${wallet?.balanceUsd.toFixed(2)}
                    </div>
                  )}

                  {/* 送信ボタン */}
                  <Button
                    type='submit'
                    className='w-full'
                    disabled={
                      withdrawalLoading ||
                      !withdrawSelectedCurrency ||
                      !withdrawSelectedNetwork ||
                      !withdrawAmount ||
                      !destinationAddress ||
                      hasInsufficientBalance
                    }
                  >
                    {withdrawalLoading ? '送金申請中...' : '送金申請を送信'}
                  </Button>
                </form>
              </SectionShell>
            </Motion.div>
          </div>
        </div>
      </TabContent>
    </div>
  );
};

export default DepositPage;
