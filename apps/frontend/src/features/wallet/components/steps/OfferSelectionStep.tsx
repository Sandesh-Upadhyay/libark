import { useState } from 'react';
import { P2PPaymentMethodType, type P2POfferInfoFragment } from '@libark/graphql-client';

import { P2POfferCard } from '@/features/p2p/components/molecules/P2POfferCard';
import { Button } from '@/components/atoms/button';

export interface OfferSelectionStepProps {
  offers: P2POfferInfoFragment[];
  requestedAmount: number;
  fiatCurrency: string;
  onSelect: (offer: P2POfferInfoFragment) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PAYMENT_METHODS: (P2PPaymentMethodType | 'すべて')[] = [
  'すべて',
  P2PPaymentMethodType.BankTransfer,
  P2PPaymentMethodType.Paypay,
  P2PPaymentMethodType.LinePay,
] as const;

export function OfferSelectionStep({
  offers,
  requestedAmount,
  fiatCurrency,
  onSelect,
  onBack,
  isLoading = false,
}: OfferSelectionStepProps) {
  const [selectedFilter, setSelectedFilter] = useState<P2PPaymentMethodType | 'すべて'>('すべて');

  const filteredOffers =
    selectedFilter === 'すべて'
      ? offers
      : offers.filter(offer => offer.paymentMethod === selectedFilter);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold mb-2'>オファーを選択</h2>
        <p className='text-sm text-muted-foreground'>
          {fiatCurrency} {requestedAmount.toLocaleString()} (≈ ${(requestedAmount / 150).toFixed(2)}{' '}
          USD) を入金
        </p>
      </div>

      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>フィルター</label>
        <div className='flex space-x-2'>
          {PAYMENT_METHODS.map(method => {
            const label =
              method === 'すべて'
                ? 'すべて'
                : method === P2PPaymentMethodType.BankTransfer
                  ? '銀行振込'
                  : method === P2PPaymentMethodType.Paypay
                    ? 'PayPay'
                    : method === P2PPaymentMethodType.LinePay
                      ? 'LINE Pay'
                      : method;
            return (
              <button
                key={method}
                onClick={() => setSelectedFilter(method)}
                className={`px-4 py-2 rounded-md border-2 transition-colors ${
                  selectedFilter === method
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-border/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className='space-y-4'>
        {filteredOffers.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            利用可能なオファーが見つかりませんでした
          </div>
        ) : (
          filteredOffers.map(offer => (
            <P2POfferCard
              key={offer.id}
              offer={offer}
              requestedAmount={requestedAmount}
              fiatCurrency={fiatCurrency}
              onSelect={onSelect}
              isLoading={isLoading}
            />
          ))
        )}
      </div>

      <div className='flex justify-between'>
        <Button onClick={onBack} variant='outline' size='lg'>
          ← 金額を変更
        </Button>
      </div>
    </div>
  );
}
