import { useState } from 'react';
import { useDeleteP2POfferMutation, P2PPaymentMethodType } from '@libark/graphql-client';

import { toast } from '@/lib/toast';
import { Button } from '@/components/atoms/button';

import { useP2PSellerOffer } from '../../hooks/useP2PSellerOffer';
import { CURRENCY_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../../../p2p/constants/p2pConstants';



export interface P2PSellerOfferFormProps {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function P2PSellerOfferForm({ onComplete, onError }: P2PSellerOfferFormProps) {
  const { offer, loading: _loading, isCreating, isUpdating, createOffer, updateOffer, refetch } =
    useP2PSellerOffer({
      onCreateComplete: onComplete,
      onUpdateComplete: onComplete,
      onError,
    });

  const [deleteOffer, { loading: isDeleting }] = useDeleteP2POfferMutation();

  const [minAmountUsd, setMinAmountUsd] = useState(
    offer?.minAmountUsd ? Number(offer.minAmountUsd) : 50
  );
  const [maxAmountUsd, setMaxAmountUsd] = useState(
    offer?.maxAmountUsd ? Number(offer.maxAmountUsd) : 5000
  );
  const [fiatCurrency, setFiatCurrency] = useState(offer?.fiatCurrency || 'JPY');
  const [exchangeRateMargin, setExchangeRateMargin] = useState(
    offer?.exchangeRateMargin ? Number(offer.exchangeRateMargin) : 5
  );
  const [paymentMethod, setPaymentMethod] = useState<P2PPaymentMethodType>(
    offer?.paymentMethod ?? P2PPaymentMethodType.BankTransfer
  );
  const [instructions, setInstructions] = useState(offer?.instructions || '');
  const [priority, setPriority] = useState(offer?.priority ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (offer) {
        const updateInput = {
          offerId: offer.id,
          minAmountUsd,
          maxAmountUsd,
          fiatCurrency,
          exchangeRateMargin,
          paymentMethod,
          instructions,
          priority,
        };

        await updateOffer(updateInput);
        toast.success('オファーを更新しました');
      } else {
        const createInput = {
          minAmountUsd,
          maxAmountUsd,
          fiatCurrency,
          exchangeRateMargin,
          paymentMethod,
          instructions,
          priority,
        };

        await createOffer(createInput);
        toast.success('オファーを作成しました');
      }
    } catch (_err) {
      toast.error('オファーの保存に失敗しました');
    }
  };

  const handleDeleteOffer = async () => {
    if (!window.confirm('オファーを削除しますか？')) {
      return;
    }

    try {
      await deleteOffer({
        variables: {
          offerId: offer?.id || '',
        },
      });
      toast.success('オファーを削除しました');
      refetch();
      onComplete?.();
    } catch (error) {
      console.error('オファー削除エラー:', error);
      toast.error('オファーの削除に失敗しました');
      onError?.(error instanceof Error ? error : new Error('不明なエラーが発生しました'));
    }
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <div>
        <h2 className='text-xl font-semibold mb-2'>
          {offer ? 'オファーを更新' : 'オファーを作成'}
        </h2>
        <p className='text-sm text-muted-foreground'>P2P売り手オファーを設定してください</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>最小金額（USD）</label>
          <input
            type='number'
            value={minAmountUsd}
            onChange={e => setMinAmountUsd(parseFloat(e.target.value))}
            className='w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
            min={1}
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>最大金額（USD）</label>
          <input
            type='number'
            value={maxAmountUsd}
            onChange={e => setMaxAmountUsd(parseFloat(e.target.value))}
            className='w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
            min={minAmountUsd}
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>通貨</label>
          <select
            value={fiatCurrency}
            onChange={e => setFiatCurrency(e.target.value)}
            className='w-full px-4 py-2 bg-card border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-foreground'
            required
          >
            {CURRENCY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>マージン（%）</label>
          <input
            type='number'
            value={exchangeRateMargin}
            onChange={e => setExchangeRateMargin(parseFloat(e.target.value))}
            className='w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
            min={0}
            step={0.1}
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>支払い方法</label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value as P2PPaymentMethodType)}
            className='w-full px-4 py-2 bg-card border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-foreground'
            required
          >
            {PAYMENT_METHOD_OPTIONS.filter(opt => opt.value !== 'all').map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>取引説明</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className='w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
            rows={3}
            placeholder='取引に関する説明を入力してください（任意）'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-foreground mb-2'>優先度</label>
          <input
            type='number'
            value={priority}
            onChange={e => setPriority(parseInt(e.target.value))}
            className='w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
            min={0}
            step={1}
          />
        </div>

        <div className='flex justify-between items-center'>
          {offer && (
            <Button
              type='button'
              onClick={handleDeleteOffer}
              disabled={isDeleting}
              variant='destructive'
              loading={isDeleting}
            >
              オファーを削除
            </Button>
          )}
          <Button
            type='submit'
            disabled={isCreating || isUpdating}
            loading={isCreating || isUpdating}
          >
            {offer ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </div>
  );
}
