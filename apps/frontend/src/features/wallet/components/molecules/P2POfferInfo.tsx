import type { P2POfferInfoFragment } from '@libark/graphql-client';

export interface P2POfferInfoProps {
  offer: P2POfferInfoFragment;
  className?: string;
}

export function P2POfferInfo({ offer, className = '' }: P2POfferInfoProps) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className='flex items-center space-x-3 mb-4'>
        <div className='w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl'>
          {offer.seller?.username?.[0] || '?'}
        </div>
        <div>
          <div className='font-semibold'>@{offer.seller?.username || 'unknown'}</div>
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>対応通貨</span>
          <span className='font-medium'>{offer.fiatCurrency}</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>対応金額</span>
          <span className='font-medium'>
            {Number(offer.minAmountUsd).toFixed(2)} - {Number(offer.maxAmountUsd).toFixed(2)} USD
          </span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>マージン</span>
          <span className='font-medium'>{offer.exchangeRateMargin}%</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>支払い方法</span>
          <div className='flex flex-wrap gap-1'>
            <span className='px-2 py-1 bg-muted rounded text-xs'>
              {offer.paymentMethod}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
