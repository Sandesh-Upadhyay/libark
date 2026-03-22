export interface P2PAmountDisplayProps {
  amountUsd: number;
  fiatAmount: number;
  fiatCurrency: string;
  exchangeRate?: number;
  className?: string;
}

export function P2PAmountDisplay({
  amountUsd,
  fiatAmount,
  fiatCurrency,
  exchangeRate,
  className = '',
}: P2PAmountDisplayProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-600'>入金額</span>
        <span className='text-lg font-semibold'>{formatUSD(amountUsd)}</span>
      </div>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-600'>支払額</span>
        <span className='text-lg font-semibold'>{formatAmount(fiatAmount, fiatCurrency)}</span>
      </div>
      {exchangeRate && (
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span>レート</span>
          <span>
            1 USD = {exchangeRate.toFixed(2)} {fiatCurrency}
          </span>
        </div>
      )}
    </div>
  );
}
