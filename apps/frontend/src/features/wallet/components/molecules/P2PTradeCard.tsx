import type { P2PTradeInfoFragment } from '@libark/graphql-client';

import { P2PStatusBadge } from '../atoms/P2PStatusBadge';
import { P2PAmountDisplay } from '../atoms/P2PAmountDisplay';

export interface P2PTradeCardProps {
  trade: P2PTradeInfoFragment;
  onClick?: () => void;
  className?: string;
}

export function P2PTradeCard({ trade, onClick, className = '' }: P2PTradeCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className='flex items-start justify-between mb-3'>
        <div>
          <div className='text-sm text-gray-600'>取引ID</div>
          <div className='font-mono text-sm'>{trade.id.slice(0, 8)}...</div>
        </div>
        <P2PStatusBadge status={trade.status} />
      </div>

      <P2PAmountDisplay
        amountUsd={Number(trade.amountUsd)}
        fiatAmount={Number(trade.fiatAmount)}
        fiatCurrency={trade.fiatCurrency}
        exchangeRate={Number(trade.exchangeRate)}
      />

      <div className='mt-3 pt-3 border-t flex items-center justify-between text-sm'>
        <span className='text-gray-600'>
          {new Date(trade.createdAt).toLocaleDateString('ja-JP')}
        </span>
        <span className='text-gray-600'>
          {new Date(trade.createdAt).toLocaleTimeString('ja-JP')}
        </span>
      </div>
    </div>
  );
}
