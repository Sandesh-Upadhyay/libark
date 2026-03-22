/**
 * 🎯 シンプル版入金モーダルコンポーネント (Organism)
 *
 * 責任:
 * - 入金フローの統合管理
 * - ミニマルなデザイン
 * - 最適化されたユーザーエクスペリエンス
 */

import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@/components/atoms';
import { useExchangeRate, useSupportedCurrencies, useUserWallets } from '@/features/wallet/hooks';

import {
  CurrencySelector,
  WalletManager,
  PaymentInstructions,
  DepositForm,
  ActionButtonGroup,
  type UserWallet,
} from '../molecules';

export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🎯 シンプル版入金モーダルコンポーネント
 */
export const DepositModal: React.FC<DepositModalProps> = React.memo(({ isOpen, onClose }) => {
  const [step, setStep] = useState<'setup' | 'payment' | 'confirmation'>('setup');

  // フォーム状態
  const [formState, setFormState] = useState({
    usdAmount: '10',
    selectedCurrency: '',
    selectedNetwork: '',
    depositAddress: '',
  });
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | undefined>();

  // フォーム状態の更新関数
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const { usdAmount, selectedCurrency, selectedNetwork, depositAddress } = formState;

  // 個別のsetter関数
  const setUsdAmount = useCallback(
    (value: string) => {
      updateFormState({ usdAmount: value });
    },
    [updateFormState]
  );

  const setSelectedCurrency = useCallback(
    (value: string) => {
      updateFormState({ selectedCurrency: value });
    },
    [updateFormState]
  );

  const setSelectedNetwork = useCallback(
    (value: string) => {
      updateFormState({ selectedNetwork: value });
    },
    [updateFormState]
  );

  const setDepositAddress = useCallback(
    (value: string) => {
      updateFormState({ depositAddress: value });
    },
    [updateFormState]
  );

  // フック
  const { currencies, loading: currenciesLoading } = useSupportedCurrencies();
  const { exchangeRate: rate, loading: rateLoading } = useExchangeRate(selectedCurrency, 'USD');
  const { userWallets, loading: walletsLoading, refetch: _refetchWallets } = useUserWallets();

  // ネットワーク選択肢
  const getNetworksForCurrency = (currency: string) => {
    const networks: Record<string, string[]> = {
      BTC: ['Bitcoin'],
      ETH: ['Ethereum', 'BSC', 'Polygon'],
      USDT: ['TRC20', 'ERC20', 'BSC', 'Polygon'],
      BNB: ['BSC'],
      ADA: ['Cardano'],
      DOT: ['Polkadot'],
      MATIC: ['Polygon'],
      SOL: ['Solana'],
      XRP: ['Ripple'],
      XMR: ['Monero'],
    };
    return networks[currency] || [];
  };

  // 固定モック送金先アドレス生成
  const generateMockDepositAddress = (currency: string, network: string): string => {
    switch (currency) {
      case 'BTC':
        return 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      case 'ETH':
      case 'USDT':
      case 'BNB':
      case 'MATIC':
        return '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF';
      case 'ADA':
        return 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlhxyz123456789';
      case 'DOT':
        return '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg';
      case 'SOL':
        return '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      case 'XRP':
        return 'rDNa4jbVzSYrVS2sTxvsHRHNKp8TEhNiCs';
      case 'XMR':
        return '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRj5UzqtReoS44qo9mtmXCqY45DJ852K5Jv2684Rge';
      default:
        return `mock_${currency}_${network}_address_demo`;
    }
  };

  // セットアップ完了
  const handleSetupComplete = () => {
    if (!usdAmount || !selectedCurrency || !selectedNetwork) {
      toast.error('通貨、ネットワーク、金額を選択してください');
      return;
    }

    const mockAddress = generateMockDepositAddress(selectedCurrency, selectedNetwork);
    setDepositAddress(mockAddress);
    setStep('payment');
    toast.success('送金先を生成しました');
  };

  // ウォレット管理（フック未実装のため一時的に無効化）
  const handleWalletAdd = async (wallet: Omit<UserWallet, 'id' | 'isVerified'>) => {
    console.log('ウォレット追加:', wallet);
    // TODO: registerWallet実装後に有効化
    // await registerWallet(wallet);
    // await refetchWallets();
  };

  const handleWalletUpdate = async (id: string, wallet: Partial<UserWallet>) => {
    console.log('ウォレット更新:', id, wallet);
    // TODO: updateWallet実装後に有効化
    // await updateWallet({ id, ...wallet });
    // await refetchWallets();
  };

  const handleWalletDelete = async (id: string) => {
    console.log('ウォレット削除:', id);
    // TODO: deleteWallet実装後に有効化
    // await deleteWallet(id);
    // await refetchWallets();
    if (selectedWallet?.id === id) {
      setSelectedWallet(undefined);
    }
  };

  // 送金完了確認
  const handlePaymentComplete = () => {
    setStep('confirmation');
    toast.success('送金完了を受け付けました');

    setTimeout(() => {
      toast.success('入金が確認されました！');
      handleClose();
    }, 20000);
  };

  // モーダルクローズ
  const handleClose = useCallback(() => {
    setStep('setup');
    setFormState({
      usdAmount: '10',
      selectedCurrency: '',
      selectedNetwork: '',
      depositAddress: '',
    });
    setSelectedWallet(undefined);
    onClose();
  }, [onClose]);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 'setup':
        return '入金設定';
      case 'payment':
        return '送金実行';
      case 'confirmation':
        return '確認中';
      default:
        return '入金設定';
    }
  }, [step]);

  const stepDescription = useMemo(() => {
    switch (step) {
      case 'setup':
        return '入金したい通貨と金額を選択してください';
      case 'payment':
        return '以下の情報を使用して送金してください';
      case 'confirmation':
        return '送金完了を確認中です';
      default:
        return '';
    }
  }, [step]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <h2 className='text-xl font-semibold'>{stepTitle}</h2>
          </DialogTitle>
          <DialogDescription>{stepDescription}</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Step 1: セットアップ */}
          {step === 'setup' && (
            <div className='space-y-4'>
              {/* USD金額入力 */}
              <DepositForm
                minAmount={1}
                maxAmount={100000}
                currency='USD'
                title='入金金額'
                description='入金したい金額を入力してください'
                onSubmit={amount => setUsdAmount(amount.toString())}
                variant='compact'
              />

              {/* 通貨・ネットワーク選択 */}
              <CurrencySelector
                currencies={currencies?.map(c => c.code) || []}
                selectedCurrency={selectedCurrency}
                onCurrencyChange={currency => {
                  setSelectedCurrency(currency);
                  setSelectedNetwork('');
                }}
                selectedNetwork={selectedNetwork}
                onNetworkChange={setSelectedNetwork}
                getNetworksForCurrency={getNetworksForCurrency}
                exchangeRate={rate}
                usdAmount={parseFloat(usdAmount) || 0}
                isLoading={currenciesLoading || rateLoading}
                variant='minimal'
              />

              {/* 次へボタン */}
              <ActionButtonGroup
                buttons={[
                  {
                    id: 'setup-complete',
                    label: '送金先を表示',
                    icon: ArrowRight,
                    onClick: handleSetupComplete,
                    disabled: !usdAmount || !selectedCurrency || !selectedNetwork || rateLoading,
                    variant: 'default',
                  },
                ]}
                layout='horizontal'
                uniformWidth={true}
              />
            </div>
          )}

          {/* Step 2: 送金 */}
          {step === 'payment' && (
            <div className='space-y-4'>
              {/* ウォレット管理 */}
              <WalletManager
                userWallets={userWallets || []}
                selectedWallet={selectedWallet}
                onWalletSelect={setSelectedWallet}
                onWalletAdd={handleWalletAdd}
                onWalletUpdate={handleWalletUpdate}
                onWalletDelete={handleWalletDelete}
                selectedCurrency={selectedCurrency}
                selectedNetwork={selectedNetwork}
                isLoading={walletsLoading}
                variant='compact'
              />

              {/* 送金指示 */}
              <PaymentInstructions
                depositAddress={depositAddress}
                currency={selectedCurrency}
                network={selectedNetwork}
                cryptoAmount={rate ? parseFloat(usdAmount) / rate : 0}
                usdAmount={parseFloat(usdAmount)}
                countdownSeconds={300}
                onPaymentComplete={handlePaymentComplete}
                showCompletionButton={true}
                variant='minimal'
              />

              {/* 戻るボタン */}
              <Button onClick={() => setStep('setup')} variant='outline' className='w-full'>
                設定に戻る
              </Button>
            </div>
          )}

          {/* Step 3: 確認中 */}
          {step === 'confirmation' && (
            <div className='space-y-4 text-center py-8'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
              <div className='space-y-2'>
                <p className='text-lg font-medium'>送金を確認中です...</p>
                <p className='text-sm text-muted-foreground'>しばらくお待ちください</p>
              </div>
              <Button onClick={handleClose} variant='outline' className='mt-4'>
                閉じる
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

DepositModal.displayName = 'DepositModal';
