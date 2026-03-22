import type { P2POfferInfoFragment, P2PTradeStatus } from '@libark/graphql-client';

import { P2PStatusBadge } from '@/features/wallet/components/atoms/P2PStatusBadge';
import { Button } from '@/components/atoms/button';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { formatCurrency } from '@/lib/utils/currencyUtils';

import { FALLBACK_EXCHANGE_RATES } from '../../../p2p/constants/p2pConstants';

export interface P2POfferCardProps {
  offer: P2POfferInfoFragment;
  requestedAmount?: number;
  fiatCurrency: string;
  onSelect?: (offer: P2POfferInfoFragment) => void;
  isLoading?: boolean;
  className?: string;
  buttonText?: string;
}

export function P2POfferCard({
  offer,
  requestedAmount: _requestedAmount,
  fiatCurrency: _fiatCurrency,
  onSelect,
  isLoading = false,
  className = '',
  buttonText,
}: P2POfferCardProps) {
  const exchangeRate =
    (FALLBACK_EXCHANGE_RATES[offer.fiatCurrency] || 1) *
    (1 + Number(offer.exchangeRateMargin) / 100);

  return (
    <div
      className={`border rounded-lg p-4 hover:border-primary transition-colors bg-card ${className}`}
    >
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center space-x-3'>
          <UserAvatar
            username={offer.seller?.username}
            displayName={offer.seller?.displayName ?? undefined}
            profileImageId={offer.seller?.profileImageId ?? undefined}
            size='sm'
          />
          <div>
            <div className='font-semibold'>@{offer.seller?.username || 'unknown'}</div>
          </div>
        </div>
        <P2PStatusBadge status={'PENDING' as P2PTradeStatus} />
      </div>

      <div className='space-y-2 mb-4'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>レート</span>
          <span className='font-medium'>
            {formatCurrency(exchangeRate, { currency: offer.fiatCurrency })}/USD (+
            {offer.exchangeRateMargin}%)
          </span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>対応金額</span>
          <span className='font-medium'>
            {formatCurrency(Number(offer.minAmountUsd), { currency: 'USD' })} -{' '}
            {formatCurrency(Number(offer.maxAmountUsd), { currency: 'USD' })}
          </span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>取引完了率</span>
          <span className='font-medium text-success'>100% (0件)</span>
        </div>
      </div>

      {onSelect && (
        <Button
          onClick={() => onSelect(offer)}
          disabled={isLoading}
          className='w-full'
          loading={isLoading}
        >
          {buttonText || 'このオファーを選択'}
        </Button>
      )}
    </div>
  );
}
