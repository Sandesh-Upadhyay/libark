import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateP2PTradeRequestMutation,
  useMarkP2PPaymentSentMutation,
  useCancelP2PTradeRequestMutation,
  useCurrentExchangeRateQuery,
} from '@libark/graphql-client';
import type {
  P2POfferInfoFragment,
  P2PTradeInfoFragment,
  P2PTradeStatus,
} from '@libark/graphql-client';


import { toast } from '@/lib/toast';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { formatCurrency } from '@/lib/utils/currencyUtils';

import { AmountInputStep, PaymentStep, ConfirmationStep } from '../steps';
import { FALLBACK_EXCHANGE_RATES } from '../../../p2p/constants/p2pConstants';

export interface P2PBuyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  offer: P2POfferInfoFragment | null;
}

type DrawerStep = 'amount' | 'payment' | 'confirmation';

export function P2PBuyDrawer({ isOpen, onClose, offer }: P2PBuyDrawerProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<DrawerStep>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [fiatCurrency, setFiatCurrency] = useState<string>('JPY');
  const [trade, setTrade] = useState<P2PTradeInfoFragment | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  // Exchange Rate Query
  const { data: exchangeRateData } = useCurrentExchangeRateQuery({
    variables: { currency: offer?.fiatCurrency || 'USD' },
    skip: !offer,
    fetchPolicy: 'network-only', // 常に最新を取得
  });

  // Mutations
  const [createTrade, { loading: isCreating }] = useCreateP2PTradeRequestMutation();
  const [markPaymentSent, { loading: isMarking }] = useMarkP2PPaymentSentMutation();
  const [cancelTrade, { loading: _isCancelling }] = useCancelP2PTradeRequestMutation();

  // ドロワーが開かれたときにリセット
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('amount');
      setAmount(0);
      setFiatCurrency('JPY');
      setTrade(null);
    }
  }, [isOpen]);

  // オファーが選択されたときに通貨を設定
  useEffect(() => {
    if (offer) {
      setFiatCurrency(offer.fiatCurrency);
      const baseRate = exchangeRateData?.currentExchangeRate || FALLBACK_EXCHANGE_RATES[offer.fiatCurrency] || 1;
      setExchangeRate(baseRate * (1 + Number(offer.exchangeRateMargin) / 100));
    }
  }, [offer, exchangeRateData]);

  // 金額入力のハンドラー
  const handleAmountSubmit = async (submittedAmount: number, submittedCurrency: string) => {
    if (!offer) return;

    try {
      setAmount(submittedAmount);
      setFiatCurrency(submittedCurrency);

      // 取引を作成
      const result = await createTrade({
        variables: {
          input: {
            offerId: offer.id,
            amountUsd: submittedAmount,
          },
        },
      });

      if (result.data?.createP2PTradeRequest) {
        setTrade(result.data.createP2PTradeRequest);
        setCurrentStep('payment');
      }
    } catch (error) {
      console.error('取引作成エラー:', error);
      toast.error('取引の作成に失敗しました');
    }
  };

  // 支払い完了のハンドラー
  const handlePaymentComplete = async () => {
    if (!trade) return;

    try {
      await markPaymentSent({
        variables: {
          tradeId: trade.id,
        },
      });
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('支払い完了通知エラー:', error);
      toast.error('支払い完了の通知に失敗しました');
    }
  };

  // キャンセルのハンドラー
  const handleCancel = async () => {
    if (!trade) return;

    try {
      await cancelTrade({
        variables: {
          tradeId: trade.id,
        },
      });
      onClose();
      toast.success('取引をキャンセルしました');
    } catch (error) {
      console.error('キャンセルエラー:', error);
      toast.error('取引のキャンセルに失敗しました');
    }
  };

  // 取引詳細へ移動
  const handleViewTradeDetail = () => {
    if (!trade) return;
    navigate(`/wallet/p2p/trade/${trade.id}`);
    onClose();
  };

  // 取引がMATCHED以上のステータスになったら支払い情報を表示
  const canShowPaymentInfo =
    trade &&
    ['MATCHED', 'PAYMENT_SENT', 'CONFIRMED', 'COMPLETED'].includes(trade.status as P2PTradeStatus);

  if (!isOpen || !offer) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* オーバーレイ */}
      <div
        className='absolute inset-0 bg-black/50 transition-opacity'
        onClick={onClose}
      />

      {/* ドロワー */}
      <div className='absolute right-0 top-0 h-full w-full max-w-md bg-card shadow-xl overflow-y-auto border-l'>
        <div className='p-6'>
          {/* ヘッダー */}
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-foreground'>P2P購入</h2>
            <button
              onClick={onClose}
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              ✕
            </button>
          </div>

          {/* オファー情報 */}
          <div className='mb-6 p-4 bg-muted/30 rounded-lg border border-border'>
            <div className='flex items-center gap-3 mb-4'>
              <UserAvatar
                size="md"
                username={offer.seller?.username}
                displayName={offer.seller?.displayName ?? undefined}
                profileImageId={offer.seller?.profileImageId ?? undefined}
              />
              <div>
                <h3 className='font-medium'>@{offer.seller?.username || 'unknown'}</h3>
                <p className='text-xs text-muted-foreground'>売り手情報</p>
              </div>
            </div>

            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-xs'>通貨</span>
                <span className='font-medium'>{offer.fiatCurrency}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-xs'>レート</span>
                <span className='font-medium'>
                  {formatCurrency(exchangeRate, { currency: offer.fiatCurrency })}/USD
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-xs'>対応金額</span>
                <span className='font-medium'>
                  {formatCurrency(Number(offer.minAmountUsd), { currency: 'USD' })} - {formatCurrency(Number(offer.maxAmountUsd), { currency: 'USD' })}
                </span>
              </div>
            </div>
          </div>

          {/* ステップ別のレンダリング */}
          {currentStep === 'amount' && (
            <AmountInputStep
              amount={amount}
              fiatCurrency={fiatCurrency}
              exchangeRate={exchangeRate}
              limits={{
                min: Number(offer.minAmountUsd),
                max: Number(offer.maxAmountUsd),
              }}
              onNext={handleAmountSubmit}
              isLoading={isCreating}
            />
          )}

          {currentStep === 'payment' && trade && canShowPaymentInfo && (
            <PaymentStep
              trade={trade}
              onPaymentComplete={handlePaymentComplete}
              onCancel={handleCancel}
              isLoading={isMarking}
            />
          )}

          {currentStep === 'payment' && trade && !canShowPaymentInfo && (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>売り手の承認を待っています...</p>
              <p className='text-sm text-muted-foreground mt-2'>取引ID: {trade.id}</p>
            </div>
          )}

          {currentStep === 'confirmation' && trade && (
            <ConfirmationStep
              trade={trade}
              onNewDeposit={() => {
                setCurrentStep('amount');
                setAmount(0);
                setTrade(null);
              }}
              onViewHistory={handleViewTradeDetail}
              onGoToWallet={() => {
                navigate('/wallet');
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
