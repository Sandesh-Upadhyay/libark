/**
 * 🎯 暗号通貨送金ページ
 *
 * 責任:
 * - 暗号通貨の送金機能を独立したページとして提供
 * - WithdrawModalの機能をページ形式で実装
 * - ウォレットナビゲーションとの統合
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Motion, Button } from '@/components/atoms';
import { SectionShell } from '@/components/molecules/SectionShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms';
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

/**
 * 🎯 暗号通貨送金ページコンポーネント
 */
const WithdrawPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ウォレット情報とフック
  const { wallet, loading: walletLoading } = useWallet();
  const { currencies, loading: currenciesLoading } = useSupportedCurrencies();
  const { createWithdrawal, loading: withdrawalLoading } = useCreateWithdrawalRequest();

  // フォーム状態
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [amountType, setAmountType] = useState<'crypto' | 'usd'>('crypto');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  // 為替レート取得
  const { exchangeRate: rate, loading: rateLoading } = useExchangeRate(selectedCurrency, 'USD');

  // 計算された金額
  const cryptoAmount =
    amountType === 'usd' && rate ? parseFloat(amount) / rate : parseFloat(amount) || 0;
  const usdAmount =
    amountType === 'crypto' && rate ? parseFloat(amount) * rate : parseFloat(amount) || 0;

  // 手数料（モック）
  const estimatedFee = cryptoAmount * 0.001; // 0.1%
  const finalAmount = cryptoAmount - estimatedFee;

  // 残高チェック
  const hasInsufficientBalance = wallet ? usdAmount > wallet.balanceUsd : false;

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCurrency || !selectedNetwork || !amount || !destinationAddress) {
      toast.error('すべての必須項目を入力してください');
      return;
    }

    if (hasInsufficientBalance) {
      toast.error('残高が不足しています');
      return;
    }

    try {
      await createWithdrawal({
        currency: selectedCurrency,
        amount: cryptoAmount,
        destinationAddress,
        memo: memo || undefined,
        network: selectedNetwork,
      });

      toast.success('送金申請を送信しました');
      navigate('/wallet');
    } catch (error) {
      console.error('送金申請エラー:', error);
      toast.error('送金申請の送信に失敗しました');
    }
  };

  // 戻るボタン
  const handleBack = () => {
    navigate('/wallet');
  };

  return (
    <div className='space-y-6'>
      {/* ヘッダーアクション */}
      <div className='flex justify-end'>
        <Button variant='outline' size='sm' onClick={handleBack} className='flex items-center'>
          <ArrowLeft className='h-4 w-4' />
          戻る
        </Button>
      </div>

      <Motion.div preset='slideUp' delay={0.1}>
        <SectionShell
          variant='settings'
          title={t('wallet.withdraw.form.title', { default: '送金情報' })}
          description={t('wallet.withdraw.form.description', {
            default: '送金先と金額を入力してください',
          })}
          icon={Send}
        >
          <form onSubmit={handleSubmit}>
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
            <div>
              <Label htmlFor='currency'>通貨</Label>
              <CurrencySelector
                currencies={currencies?.map(c => c.code) || []}
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
                selectedNetwork={selectedNetwork}
                onNetworkChange={setSelectedNetwork}
                getNetworksForCurrency={currency => {
                  const networks: Record<string, string[]> = {
                    BTC: ['BTC'],
                    ETH: ['ETH', 'BSC', 'POLYGON'],
                    USDT: ['TRC20', 'ETH', 'BSC', 'POLYGON'],
                    BNB: ['BSC'],
                  };
                  return networks[currency] || [];
                }}
                isLoading={currenciesLoading}
              />
            </div>

            {/* ネットワーク選択 */}
            {selectedCurrency && (
              <div>
                <Label htmlFor='network'>ネットワーク</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
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
            <div>
              <Label htmlFor='amount'>金額</Label>
              <div className='flex'>
                <Input
                  id='amount'
                  type='number'
                  step='0.00000001'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder='0.00'
                  className='flex-1'
                />
                <Select
                  value={amountType}
                  onValueChange={(value: 'crypto' | 'usd') => setAmountType(value)}
                >
                  <SelectTrigger className='w-24'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='crypto'>{selectedCurrency || 'CRYPTO'}</SelectItem>
                    <SelectItem value='usd'>USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {rate && amount && (
                <p className='text-sm text-muted-foreground'>
                  ≈{' '}
                  {amountType === 'crypto'
                    ? `$${usdAmount.toFixed(2)}`
                    : `${cryptoAmount.toFixed(8)} ${selectedCurrency}`}
                </p>
              )}
            </div>

            {/* 送金先アドレス */}
            <div>
              <Label htmlFor='address'>送金先アドレス</Label>
              <Input
                id='address'
                value={destinationAddress}
                onChange={e => setDestinationAddress(e.target.value)}
                placeholder='送金先のウォレットアドレスを入力'
              />
            </div>

            {/* メモ（オプション） */}
            <div>
              <Label htmlFor='memo'>メモ（オプション）</Label>
              <Textarea
                id='memo'
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder='取引の詳細やメモを入力'
                rows={3}
              />
            </div>

            {/* 手数料と最終金額 */}
            {cryptoAmount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>送金詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex justify-between text-sm'>
                    <span>送金金額:</span>
                    <span>
                      {cryptoAmount.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>手数料:</span>
                    <span>
                      {estimatedFee.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                  <div className='flex justify-between font-medium border-t pt-2'>
                    <span>受取金額:</span>
                    <span>
                      {finalAmount.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* エラー表示 */}
            {hasInsufficientBalance && (
              <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
                <p className='text-sm text-destructive'>残高が不足しています</p>
              </div>
            )}

            {/* 送信ボタン */}
            <Button
              type='submit'
              className='w-full'
              disabled={
                !selectedCurrency ||
                !selectedNetwork ||
                !amount ||
                !destinationAddress ||
                hasInsufficientBalance ||
                withdrawalLoading ||
                walletLoading ||
                rateLoading
              }
            >
              {withdrawalLoading ? '送信中...' : '送金申請を送信'}
            </Button>
          </form>
        </SectionShell>
      </Motion.div>
    </div>
  );
};

export default WithdrawPage;
