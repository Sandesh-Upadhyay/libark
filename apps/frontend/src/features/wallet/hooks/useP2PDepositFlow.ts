import { useState, useCallback } from 'react';
import {
  useCreateP2PTradeRequestMutation,
  useCancelP2PTradeRequestMutation,
  useMarkP2PPaymentSentMutation,
} from '@libark/graphql-client';
import type { P2PTradeInfoFragment, CreateP2PTradeRequestInput } from '@libark/graphql-client';

export type P2PDepositStep = 'amount-input' | 'offer-selection' | 'payment' | 'confirmation';

interface UseP2PDepositFlowOptions {
  onComplete?: (trade: P2PTradeInfoFragment) => void;
  onError?: (error: Error) => void;
}

export function useP2PDepositFlow(options: UseP2PDepositFlowOptions = {}) {
  const { onComplete, onError } = options;

  // ステップ管理
  const [currentStep, setCurrentStep] = useState<P2PDepositStep>('amount-input');

  // 金額入力
  const [amount, setAmount] = useState<number>(0);
  const [fiatCurrency, setFiatCurrency] = useState<string>('JPY');

  // オファー
  const [selectedOffer, setSelectedOffer] = useState<P2PTradeInfoFragment | null>(null);

  // 取引
  const [trade, setTrade] = useState<P2PTradeInfoFragment | null>(null);

  // ローディング状態
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingPayment, setIsMarkingPayment] = useState(false);

  // エラー状態
  const [error, setError] = useState<Error | null>(null);

  // ミューテーション
  const [createTradeMutation] = useCreateP2PTradeRequestMutation();
  const [cancelTradeMutation] = useCancelP2PTradeRequestMutation();
  const [markPaymentMutation] = useMarkP2PPaymentSentMutation();

  // ステップ遷移
  const goToNextStep = useCallback(() => {
    const steps: P2PDepositStep[] = ['amount-input', 'offer-selection', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    const steps: P2PDepositStep[] = ['amount-input', 'offer-selection', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: P2PDepositStep) => {
    setCurrentStep(step);
  }, []);

  // フローリセット
  const resetFlow = useCallback(() => {
    setCurrentStep('amount-input');
    setAmount(0);
    setFiatCurrency('JPY');
    setSelectedOffer(null);
    setTrade(null);
    setError(null);
  }, []);

  // 取引作成
  const createTrade = useCallback(
    async (input: CreateP2PTradeRequestInput) => {
      setIsCreating(true);
      setError(null);

      try {
        const result = await createTradeMutation({
          variables: { input },
        });

        if (result.data?.createP2PTradeRequest) {
          setTrade(result.data.createP2PTradeRequest);
          return result.data.createP2PTradeRequest;
        }

        throw new Error('取引の作成に失敗しました');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('不明なエラーが発生しました');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createTradeMutation, onError]
  );

  // 取引キャンセル
  const cancelTrade = useCallback(
    async (tradeId: string) => {
      setIsCancelling(true);
      setError(null);

      try {
        const result = await cancelTradeMutation({
          variables: { tradeId },
        });

        if (result.data?.cancelP2PTradeRequest) {
          resetFlow();
          return true;
        }

        throw new Error('取引のキャンセルに失敗しました');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('不明なエラーが発生しました');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsCancelling(false);
      }
    },
    [cancelTradeMutation, onError, resetFlow]
  );

  // 支払い完了通知
  const markPaymentSent = useCallback(
    async (tradeId: string) => {
      setIsMarkingPayment(true);
      setError(null);

      try {
        const result = await markPaymentMutation({
          variables: { tradeId },
        });

        if (result.data?.markP2PPaymentSent) {
          setTrade(result.data.markP2PPaymentSent);
          onComplete?.(result.data.markP2PPaymentSent);
          return result.data.markP2PPaymentSent;
        }

        throw new Error('支払い完了の通知に失敗しました');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('不明なエラーが発生しました');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsMarkingPayment(false);
      }
    },
    [markPaymentMutation, onError, onComplete]
  );

  return {
    // ステップ管理
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetFlow,

    // 金額入力
    amount,
    setAmount,
    fiatCurrency,
    setFiatCurrency,

    // オファー
    selectedOffer,
    setSelectedOffer,

    // 取引
    trade,
    setTrade,

    // ローディング状態
    isCreating,
    isCancelling,
    isMarkingPayment,

    // エラー状態
    error,
    setError,

    // 操作
    createTrade,
    cancelTrade,
    markPaymentSent,
  };
}
