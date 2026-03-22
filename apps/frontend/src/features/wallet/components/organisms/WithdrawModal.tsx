/**
 * 🎯 出金モーダルコンポーネント
 *
 * 暗号通貨出金機能
 */

import React, { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/atoms';
import { useExchangeRate, useSupportedCurrencies, useWallet } from '@/features/wallet/hooks';

import { CurrencyIcon } from '../atoms/CurrencyIcon';
import { WalletBalance } from '../atoms/WalletBalance';


export interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🎯 出金モーダルコンポーネント
 */
export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form');

  // フォーム状態
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [amountType, setAmountType] = useState<'crypto' | 'usd'>('crypto');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  // 結果状態
  const [withdrawalResult, setWithdrawalResult] = useState<{ id: string; status: string } | null>(
    null
  );

  // フック
  const { wallet } = useWallet();
  const { currencies } = useSupportedCurrencies();
  const { exchangeRate: rate } = useExchangeRate(selectedCurrency, 'USD');
  // const { createWithdrawal, loading: createLoading } = useCreateWithdrawalRequest(); // TODO: 実装待ち

  // ネットワーク選択肢
  const getNetworksForCurrency = (currency: string) => {
    const networks: Record<string, string[]> = {
      BTC: ['BTC'],
      ETH: ['ETH', 'BSC', 'POLYGON'],
      USDT: ['TRC20', 'ETH', 'BSC', 'POLYGON'],
      BNB: ['BSC'],
    };
    return networks[currency] || [];
  };

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
  const handleSubmit = async () => {
    if (!selectedCurrency || !selectedNetwork || !amount || !destinationAddress) {
      toast.error('すべての必須項目を入力してください');
      return;
    }

    if (hasInsufficientBalance) {
      toast.error('残高が不足しています');
      return;
    }

    setStep('confirm');
  };

  // 出金確認（フック未実装のため一時的に無効化）
  const handleConfirm = async () => {
    try {
      console.log('出金申請:', {
        currency: selectedCurrency,
        amount: cryptoAmount,
        destinationAddress,
        memo: memo || undefined,
        network: selectedNetwork,
      });

      // TODO: createWithdrawal実装後に有効化
      // const result = await createWithdrawal({
      //   currency: selectedCurrency,
      //   amount: cryptoAmount,
      //   destinationAddress,
      //   memo: memo || undefined,
      //   network: selectedNetwork,
      // });

      // 一時的なモックレスポンス
      const mockResult = {
        id: 'mock-withdrawal-' + Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setWithdrawalResult(mockResult);
      setStep('result');
      toast.success('出金申請を送信しました（デモ）');
    } catch (error) {
      console.error('出金申請エラー:', error);
      toast.error('出金申請の送信に失敗しました');
      setStep('form');
    }
  };

  // モーダルクローズ
  const handleClose = () => {
    setStep('form');
    setSelectedCurrency('');
    setSelectedNetwork('');
    setAmount('');
    setAmountType('crypto');
    setDestinationAddress('');
    setMemo('');
    setWithdrawalResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Send className='h-5 w-5' />
            暗号通貨出金
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && '出金情報を入力してください'}
            {step === 'confirm' && '出金内容を確認してください'}
            {step === 'result' && '出金申請が完了しました'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className='space-y-4'>
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
              <Label>出金通貨</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder='通貨を選択' />
                </SelectTrigger>
                <SelectContent>
                  {currencies?.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className='flex items-center gap-2'>
                        <CurrencyIcon currency={currency.code} size='xs' />
                        {currency.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ネットワーク選択 */}
            {selectedCurrency && (
              <div className='space-y-2'>
                <Label>ネットワーク</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder='ネットワークを選択' />
                  </SelectTrigger>
                  <SelectContent>
                    {getNetworksForCurrency(selectedCurrency).map(network => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 金額入力 */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>出金金額</Label>
                <div className='flex gap-1'>
                  <Button
                    variant={amountType === 'crypto' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setAmountType('crypto')}
                  >
                    {selectedCurrency || 'CRYPTO'}
                  </Button>
                  <Button
                    variant={amountType === 'usd' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setAmountType('usd')}
                  >
                    USD
                  </Button>
                </div>
              </div>
              <Input
                type='number'
                placeholder={amountType === 'crypto' ? '0.001' : '100.00'}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min='0'
                step={amountType === 'crypto' ? '0.00000001' : '0.01'}
              />
              {amount && rate && (
                <p className='text-xs text-muted-foreground'>
                  ≈{' '}
                  {amountType === 'crypto'
                    ? `$${usdAmount.toFixed(2)}`
                    : `${cryptoAmount.toFixed(8)} ${selectedCurrency}`}
                </p>
              )}
            </div>

            {/* 送金先アドレス */}
            <div className='space-y-2'>
              <Label htmlFor='destination'>送金先アドレス</Label>
              <Input
                id='destination'
                placeholder='受取先ウォレットアドレス'
                value={destinationAddress}
                onChange={e => setDestinationAddress(e.target.value)}
              />
            </div>

            {/* メモ（オプション） */}
            <div className='space-y-2'>
              <Label htmlFor='memo'>メモ (オプション)</Label>
              <Input
                id='memo'
                placeholder='取引メモ'
                value={memo}
                onChange={e => setMemo(e.target.value)}
              />
            </div>

            {/* 手数料表示 */}
            {cryptoAmount > 0 && (
              <Card>
                <CardContent className='pt-4 space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>出金額:</span>
                    <span>
                      {cryptoAmount.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>手数料:</span>
                    <span>
                      {estimatedFee.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                  <hr />
                  <div className='flex justify-between text-sm font-medium'>
                    <span>受取額:</span>
                    <span>
                      {finalAmount.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 残高不足警告 */}
            {hasInsufficientBalance && (
              <Card className='border-red-200 bg-red-50'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 text-red-700'>
                    <AlertTriangle className='h-4 w-4' />
                    <span className='text-sm'>残高が不足しています</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 次へボタン */}
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedCurrency ||
                !selectedNetwork ||
                !amount ||
                !destinationAddress ||
                hasInsufficientBalance
              }
              className='w-full'
            >
              確認画面へ
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>出金内容確認</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>通貨:</span>
                  <span className='font-medium'>{selectedCurrency}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>ネットワーク:</span>
                  <span className='font-medium'>{selectedNetwork}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>送金先:</span>
                  <span className='font-mono text-xs break-all'>{destinationAddress}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>出金額:</span>
                  <span className='font-medium'>
                    {cryptoAmount.toFixed(8)} {selectedCurrency}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>手数料:</span>
                  <span className='font-medium'>
                    {estimatedFee.toFixed(8)} {selectedCurrency}
                  </span>
                </div>
                <hr />
                <div className='flex justify-between text-sm font-medium'>
                  <span>受取額:</span>
                  <span>
                    {finalAmount.toFixed(8)} {selectedCurrency}
                  </span>
                </div>
                {memo && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>メモ:</span>
                    <span>{memo}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => setStep('form')} className='flex-1'>
                戻る
              </Button>
              <Button onClick={handleConfirm} className='flex-1'>
                出金申請
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && withdrawalResult && (
          <div className='space-y-4'>
            <Card className='border-green-200 bg-green-50'>
              <CardContent className='pt-4 text-center'>
                <div className='text-green-700'>
                  <Send className='h-8 w-8 mx-auto mb-2' />
                  <p className='font-medium'>出金申請が完了しました</p>
                  <p className='text-sm mt-1'>処理状況はウォレット履歴でご確認ください</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-4 space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>申請ID:</span>
                  <span className='font-mono text-xs'>{withdrawalResult.id}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>ステータス:</span>
                  <Badge variant='secondary'>{withdrawalResult.status}</Badge>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>申請日時:</span>
                  <span>
                    {new Date((withdrawalResult as any).createdAt || Date.now()).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className='w-full'>
              閉じる
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
