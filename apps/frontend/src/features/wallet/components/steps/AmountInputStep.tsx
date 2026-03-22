import { useState } from 'react';

import { Button } from '@/components/atoms/button';

export interface AmountInputStepProps {
  amount: number;
  fiatCurrency: string;
  exchangeRate: number;
  limits: { min: number; max: number };
  onNext: (amount: number, currency: string) => void;
  isLoading?: boolean;
}

const CURRENCIES = [
  { code: 'JPY', symbol: '¥' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
] as const;

const QUICK_AMOUNTS: Record<string, number[]> = {
  JPY: [5000, 10000, 30000, 50000, 100000],
  USD: [50, 100, 500, 1000, 5000],
  EUR: [50, 100, 500, 1000, 5000],
};

export function AmountInputStep({
  amount,
  fiatCurrency,
  exchangeRate: _exchangeRate,
  limits,
  onNext,
  isLoading = false,
}: AmountInputStepProps) {
  const [inputAmount, setInputAmount] = useState(amount.toString());
  const [selectedCurrency, setSelectedCurrency] = useState(fiatCurrency);

  const handleAmountChange = (value: string) => {
    setInputAmount(value);
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleNext = () => {
    const numAmount = parseFloat(inputAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('有効な金額を入力してください');
      return;
    }

    if (numAmount < limits.min || numAmount > limits.max) {
      alert(`金額は ${limits.min} 〜 ${limits.max} の範囲で入力してください`);
      return;
    }

    onNext(numAmount, selectedCurrency);
  };

  const quickAmounts = QUICK_AMOUNTS[selectedCurrency] || [];

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold mb-2'>入金額を入力</h2>
        <p className='text-sm text-muted-foreground'>
          入金額を入力してください。為替レートに基づいてUSDに換算されます。
        </p>
      </div>

      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>通貨選択</label>
        <div className='flex space-x-2'>
          {CURRENCIES.map(currency => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`px-4 py-2 rounded-md border-2 transition-colors ${
                selectedCurrency === currency.code
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-border/80'
              }`}
            >
              {currency.symbol} {currency.code}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>金額入力</label>
        <div className='relative'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
            {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol}
          </span>
          <input
            type='number'
            value={inputAmount}
            onChange={e => handleAmountChange(e.target.value)}
            className='w-full pl-10 pr-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
            placeholder='金額を入力'
            min={limits.min}
            max={limits.max}
          />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-foreground mb-2'>クイック選択</label>
        <div className='flex flex-wrap gap-2'>
          {quickAmounts.map(quickAmount => (
            <button
              key={quickAmount}
              onClick={() => handleAmountChange(quickAmount.toString())}
              className='px-4 py-2 bg-muted hover:bg-secondary rounded-md transition-colors'
            >
              {selectedCurrency} {quickAmount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className='p-4 bg-primary/10 border border-primary/20 rounded-md'>
        <p className='text-sm text-primary'>
          📌 最小入金額: {limits.min.toLocaleString()} / 最大入金額: {limits.max.toLocaleString()}
        </p>
      </div>

      <div className='flex justify-end'>
        <Button onClick={handleNext} disabled={isLoading} loading={isLoading} size='lg'>
          次へ: オファーを探す →
        </Button>
      </div>
    </div>
  );
}
