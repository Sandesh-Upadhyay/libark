/**
 * 🎯 暗号通貨入金フロー管理フック
 *
 * 責任:
 * - 入金フローのステップ管理（通貨選択 → 入金額入力 → QRコード表示）
 * - 各ステップの状態管理
 * - API呼び出しの統合管理
 * - エラーハンドリング
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// ステップの定義
export type DepositStep = 'currency-selection' | 'amount-input' | 'payment-display';

// 決済データの型定義
export interface PaymentData {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number | string; // バックエンドから文字列で返される場合があるため
  pay_currency: string;
  order_id: string;
  order_description?: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  // XRP、XLMなどで必要なメモ・タグ情報
  payin_extra_id?: string;
  extra_id_name?: string; // "memo", "destination_tag", "payment_id" など
}

// 制限額データの型定義
export interface AmountLimits {
  minAmount: number; // 最低額（USD換算）
  maxAmount: number; // 最高額（USD）
  minAmountCrypto: number; // 最低額（暗号通貨単位）
  maxAmountCrypto: number; // 最高額（暗号通貨単位）
  selectedCurrency: string; // 選択された通貨
  exchangeRate: number; // 為替レート（1暗号通貨 = X USD）
}

// フックの戻り値の型定義
export interface UseCryptoDepositFlowResult {
  // ステップ管理
  currentStep: DepositStep;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetFlow: () => void;

  // 通貨選択
  selectedCurrency: string | null;
  setSelectedCurrency: (currency: string) => void;

  // 入金額
  amount: number | null;
  setAmount: (amount: number) => void;

  // 制限額情報
  limits: AmountLimits | null;
  limitsLoading: boolean;
  limitsError: string | null;

  // 決済情報
  paymentData: PaymentData | null;
  paymentLoading: boolean;
  paymentError: string | null;

  // アクション
  createPayment: () => Promise<void>;
  createPaymentWithAmount: (amount: number) => Promise<void>;
  fetchLimits: (currency: string) => Promise<void>;
}

/**
 * 🎯 暗号通貨入金フロー管理フック
 */
export const useCryptoDepositFlow = (): UseCryptoDepositFlowResult => {
  // ステップ管理
  const [currentStep, setCurrentStep] = useState<DepositStep>('currency-selection');

  // 通貨選択
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  // 入金額
  const [amount, setAmount] = useState<number | null>(null);

  // 制限額情報
  const [limits, setLimits] = useState<AmountLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  // 決済情報
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ステップ遷移
  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => {
      switch (prev) {
        case 'currency-selection':
          return 'amount-input';
        case 'amount-input':
          return 'payment-display';
        default:
          return prev;
      }
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => {
      switch (prev) {
        case 'payment-display':
          return 'amount-input';
        case 'amount-input':
          return 'currency-selection';
        default:
          return prev;
      }
    });
  }, []);

  const resetFlow = useCallback(() => {
    setCurrentStep('currency-selection');
    setSelectedCurrency(null);
    setAmount(null);
    setLimits(null);
    setPaymentData(null);
    setLimitsError(null);
    setPaymentError(null);
  }, []);

  // 制限額取得
  const fetchLimits = useCallback(async (currency: string) => {
    if (!currency) return;

    try {
      setLimitsLoading(true);
      setLimitsError(null);

      // 最小額取得
      const minResponse = await fetch(`/api/nowpayments/min-amount/${currency}`);
      const minResult = await minResponse.json();

      if (!minResult.success) {
        throw new Error(minResult.error || 'Failed to fetch minimum amount');
      }

      // 最大額取得
      const maxResponse = await fetch(`/api/nowpayments/max-amount/${currency}`);
      const maxResult = await maxResponse.json();

      if (!maxResult.success) {
        throw new Error(maxResult.error || 'Failed to fetch maximum amount');
      }

      // 為替レート取得（1単位の暗号通貨のUSD価格）
      const exchangeResponse = await fetch(
        `/api/nowpayments/estimate?currency_from=${currency}&currency_to=USD&amount=1`
      );
      const exchangeResult = await exchangeResponse.json();

      if (!exchangeResult.success) {
        throw new Error(exchangeResult.error || 'Failed to fetch exchange rate');
      }

      const minData = minResult.data;
      const maxData = maxResult.data;
      const exchangeData = exchangeResult.data;

      // デバッグログを追加
      console.log('🔍 API Responses Debug:', {
        currency,
        minData,
        maxData,
        exchangeData,
        exchangeDataType: typeof exchangeData,
        exchangeDataKeys: exchangeData ? Object.keys(exchangeData) : 'null',
      });

      // 1単位の暗号通貨のUSD価格を取得
      console.log('🔍 Exchange Rate Parsing:', {
        exchangeData,
        'exchangeData.estimated_amount': exchangeData?.estimated_amount,
        'typeof estimated_amount': typeof exchangeData?.estimated_amount,
        'parseFloat result': parseFloat(exchangeData?.estimated_amount || '0'),
      });

      const cryptoToUsdRate = parseFloat(exchangeData?.estimated_amount || '0') || 1;

      // NOWPayments APIの仕様：
      // /min-amount?currency_from=FLOKIBSC&currency_to=USD の場合、
      // min_amountは暗号通貨単位での最小額を返す
      // これをUSD換算するために為替レートを使用
      let minAmountUsd: number;

      if (cryptoToUsdRate && cryptoToUsdRate !== 1) {
        // 正常な為替レートが取得できた場合
        minAmountUsd = minData.min_amount * cryptoToUsdRate;
      } else {
        // 為替レート取得に失敗した場合、最小額をそのままUSD値として使用
        console.warn('⚠️ Exchange rate unavailable, treating min_amount as USD value', {
          currency,
          minAmount: minData.min_amount,
        });
        minAmountUsd = minData.min_amount; // APIから返された値をUSD値として使用
      }

      console.log('💡 NOWPayments API Response Analysis:', {
        currency,
        'API endpoint': `/min-amount?currency_from=${currency}&currency_to=USD`,
        'minData.min_amount': minData.min_amount,
        cryptoToUsdRate: cryptoToUsdRate,
        minAmountUsd: minAmountUsd,
        interpretation: 'min_amount is in crypto units, converted to USD',
      });

      // デバッグログを追加
      console.log('🧮 Calculation Debug:', {
        currency,
        'minData.min_amount': minData.min_amount,
        cryptoToUsdRate: cryptoToUsdRate,
        minAmountUsd: minAmountUsd,
        calculation: `${minData.min_amount} * ${cryptoToUsdRate} = ${minAmountUsd}`,
      });

      // 異常に高い値の場合は制限を設ける
      if (minAmountUsd > 1000) {
        console.warn('⚠️ Abnormally high minimum amount detected, capping at $10', {
          original: minAmountUsd,
          currency,
          cryptoToUsdRate,
          minAmountCrypto: minData.min_amount,
        });
        minAmountUsd = 10; // 最大$10に制限
      }

      // 異常に低い値の場合は最小値を設ける
      if (minAmountUsd < 0.01) {
        console.warn('⚠️ Abnormally low minimum amount detected, setting to $0.50', {
          original: minAmountUsd,
          currency,
          cryptoToUsdRate,
          minAmountCrypto: minData.min_amount,
        });
        minAmountUsd = 0.5; // 最小$0.50に設定
      }

      // 最大額の暗号通貨単位も計算
      let maxAmountCrypto = 0;
      if (cryptoToUsdRate && cryptoToUsdRate !== 1) {
        maxAmountCrypto = maxData.max_amount / cryptoToUsdRate;
      }

      setLimits({
        minAmount: minAmountUsd, // USD換算の最低額
        maxAmount: maxData.max_amount, // USD最高額
        minAmountCrypto: minData.min_amount, // 暗号通貨単位の最低額
        maxAmountCrypto: maxAmountCrypto, // 暗号通貨単位の最高額
        selectedCurrency: currency,
        exchangeRate: cryptoToUsdRate, // 為替レート
      });
    } catch (error) {
      console.error('Failed to fetch limits:', error);
      setLimitsError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('制限額の取得に失敗しました');
    } finally {
      setLimitsLoading(false);
    }
  }, []);

  // 決済作成（金額を直接指定）
  const createPaymentWithAmount = useCallback(
    async (paymentAmount: number) => {
      if (!selectedCurrency || !paymentAmount) {
        const errorMsg = '通貨と金額を選択してください';
        setPaymentError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setPaymentLoading(true);
      setPaymentError(null);

      try {
        console.log('Creating payment with amount:', paymentAmount, 'currency:', selectedCurrency);

        const response = await fetch('/api/nowpayments/payment', {
          method: 'POST',
          credentials: 'include', // Cookie認証を含める
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_amount: paymentAmount,
            price_currency: 'USD',
            pay_currency: selectedCurrency,
            order_id: `deposit_${Date.now()}`,
            order_description: `Crypto deposit - ${paymentAmount} USD in ${selectedCurrency}`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}`;

          // 最小額エラーの特別処理
          if (
            (response.status === 400 || response.status === 500) &&
            (errorMessage.includes('less than minimal') ||
              errorData.error === 'Minimum amount not met')
          ) {
            throw new Error(
              errorData.details ||
                '入金額が最小額を下回っています。より大きな金額を入力してください。'
            );
          }

          // その他のNOWPayments APIエラー
          if (errorData.error === 'Payment service error') {
            throw new Error(errorData.details || 'Payment service error');
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Payment creation result:', result);

        if (!result.success) {
          throw new Error(result.error || result.details || 'Failed to create payment');
        }

        if (!result.data) {
          throw new Error('No payment data received from API');
        }

        // APIレスポンスの必須フィールド検証
        const paymentData = result.data;
        const requiredFields = ['payment_id', 'pay_address', 'pay_amount', 'pay_currency'];
        const missingFields = requiredFields.filter(field => !paymentData[field]);

        if (missingFields.length > 0) {
          throw new Error(
            `APIレスポンスに必須フィールドが不足しています: ${missingFields.join(', ')}`
          );
        }

        // 金額の妥当性チェック（文字列または数値を許可）
        const payAmount =
          typeof paymentData.pay_amount === 'string'
            ? parseFloat(paymentData.pay_amount)
            : paymentData.pay_amount;

        if (typeof payAmount !== 'number' || isNaN(payAmount) || payAmount <= 0) {
          throw new Error('APIレスポンスの入金額が無効です');
        }

        // アドレスの妥当性チェック
        if (typeof paymentData.pay_address !== 'string' || paymentData.pay_address.length < 10) {
          throw new Error('APIレスポンスの入金アドレスが無効です');
        }

        console.log('Payment data validated:', {
          payment_id: paymentData.payment_id,
          pay_currency: paymentData.pay_currency,
          pay_amount: paymentData.pay_amount,
          pay_amount_parsed: payAmount,
          has_extra_id: !!paymentData.payin_extra_id,
          extra_id_name: paymentData.extra_id_name,
        });

        // pay_amount を数値として正規化
        const normalizedPaymentData = {
          ...paymentData,
          pay_amount: payAmount,
        };

        setPaymentData(normalizedPaymentData);
        setPaymentError(null); // 明示的にエラーをクリア
        toast.success('決済が作成されました');
      } catch (error) {
        console.error('Failed to create payment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setPaymentError(errorMessage);
        toast.error(`決済の作成に失敗しました: ${errorMessage}`);
        throw error; // エラーを再スローして呼び出し元で処理できるようにする
      } finally {
        setPaymentLoading(false);
      }
    },
    [selectedCurrency]
  );

  // 決済作成（既存の状態を使用）
  const createPayment = useCallback(async () => {
    if (!amount) {
      const errorMsg = '金額を選択してください';
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    return createPaymentWithAmount(amount);
  }, [amount, createPaymentWithAmount]);

  // 通貨選択時に制限額を自動取得
  useEffect(() => {
    if (selectedCurrency) {
      fetchLimits(selectedCurrency);
    }
  }, [selectedCurrency, fetchLimits]);

  return {
    // ステップ管理
    currentStep,
    goToNextStep,
    goToPreviousStep,
    resetFlow,

    // 通貨選択
    selectedCurrency,
    setSelectedCurrency,

    // 入金額
    amount,
    setAmount,

    // 制限額情報
    limits,
    limitsLoading,
    limitsError,

    // 決済情報
    paymentData,
    paymentLoading,
    paymentError,

    // アクション
    createPayment,
    createPaymentWithAmount,
    fetchLimits,
  };
};
