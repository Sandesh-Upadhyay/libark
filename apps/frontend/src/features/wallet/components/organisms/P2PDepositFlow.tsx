import { useEffect } from 'react';
import { useAvailableP2POffersQuery } from '@libark/graphql-client';

import { toast } from '@/lib/toast';

import { useP2PDepositFlow } from '../../hooks/useP2PDepositFlow';
import { AmountInputStep, OfferSelectionStep, PaymentStep, ConfirmationStep } from '../steps';

export interface P2PDepositFlowProps {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function P2PDepositFlow({ onComplete, onError }: P2PDepositFlowProps) {
  const {
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep: _goToStep,
    resetFlow,
    amount,
    setAmount,
    fiatCurrency,
    setFiatCurrency,
    selectedOffer: _selectedOffer,
    setSelectedOffer,
    trade,
    setTrade,
    isCreating,
    isCancelling: _isCancelling,
    isMarkingPayment,
    error,
    setError,
    createTrade,
    cancelTrade,
    markPaymentSent,
  } = useP2PDepositFlow({ onComplete, onError });

  // オファー一覧を取得
  const { data: offersData, loading: offersLoading } = useAvailableP2POffersQuery({
    variables: {
      fiatCurrency,
      amountUsd: amount,
    },
    skip: currentStep !== 'offer-selection',
  });

  const offers = offersData?.availableP2POffers || [];

  // 金額入力ステップ
  const handleAmountSubmit = (newAmount: number, newCurrency: string) => {
    setAmount(newAmount);
    setFiatCurrency(newCurrency);
    goToNextStep();
  };

  // オファー選択ステップ
  const handleOfferSelect = async (offer: any) => {
    try {
      setSelectedOffer(offer);
      const createdTrade = await createTrade({
        offerId: offer.id,
        amountUsd: amount,
      });
      setTrade(createdTrade);
      goToNextStep();
    } catch (_err) {
      toast.error('取引の作成に失敗しました');
    }
  };

  // 支払い完了ステップ
  const handlePaymentComplete = async () => {
    if (!trade) return;

    try {
      await markPaymentSent(trade.id);
      goToNextStep();
    } catch (_err) {
      toast.error('支払い完了の通知に失敗しました');
    }
  };

  // キャンセル
  const handleCancel = async () => {
    if (!trade) return;

    try {
      await cancelTrade(trade.id);
      resetFlow();
      toast.success('取引をキャンセルしました');
    } catch (_err) {
      toast.error('取引のキャンセルに失敗しました');
    }
  };

  // エラー表示
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  // ステップ別のレンダリング
  const renderStep = () => {
    switch (currentStep) {
      case 'amount-input':
        return (
          <AmountInputStep
            amount={amount}
            fiatCurrency={fiatCurrency}
            exchangeRate={150} // TODO: 実際のレートを取得
            limits={{ min: 1000, max: 500000 }}
            onNext={handleAmountSubmit}
            isLoading={isCreating}
          />
        );

      case 'offer-selection':
        return (
          <OfferSelectionStep
            offers={offers as any}
            requestedAmount={amount}
            fiatCurrency={fiatCurrency}
            onSelect={handleOfferSelect}
            onBack={() => goToPreviousStep()}
            isLoading={isCreating || offersLoading}
          />
        );

      case 'payment':
        return trade ? (
          <PaymentStep
            trade={trade}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handleCancel}
            isLoading={isMarkingPayment}
          />
        ) : null;

      case 'confirmation':
        return trade ? (
          <ConfirmationStep
            trade={trade}
            onNewDeposit={resetFlow}
            onViewHistory={() => onComplete?.()}
            onGoToWallet={() => onComplete?.()}
          />
        ) : null;

      default:
        return null;
    }
  };

  return <div className='max-w-2xl mx-auto'>{renderStep()}</div>;
}
