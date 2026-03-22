/**
 * NOWPayments API実装
 * 外部ライブラリが見つからない場合の代替実装
 */

export const MAJOR_CURRENCIES = [
  'BTC',
  'ETH',
  'USDT',
  'XRP',
  'BNB',
  'ADA',
  'DOT',
  'MATIC',
  'SOL',
  'AAVE',
  'USDC',
  'DOGE',
  'AVAX',
  'SHIB',
  'TRX',
  'UNI',
  'ATOM',
  'LTC',
  'LINK',
  'XLM',
] as const;

export interface DisplayCurrency {
  code: string;
  name: string;
  network?: string;
}

export interface NOWPaymentsCurrency {
  code: string;
  name: string;
  network?: string;
  isAvailable: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface NOWPaymentsEstimate {
  estimatedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
}

export interface NOWPaymentsPayment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  address?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrenciesResponse {
  success: boolean;
  data?: NOWPaymentsCurrency[];
  error?: string;
}

export interface NOWPaymentsAPI {
  getCurrencies(): Promise<NOWPaymentsCurrency[]>;
  getEstimate(
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<NOWPaymentsEstimate>;
  createPayment(data: {
    amount: number;
    currency: string;
    address: string;
    memo?: string;
  }): Promise<NOWPaymentsPayment>;
}

// モックAPI実装
export const nowPaymentsAPI: NOWPaymentsAPI = {
  async getCurrencies() {
    // モック実装
    return MAJOR_CURRENCIES.map(code => ({
      code,
      name: code,
      isAvailable: true,
      minAmount: 0.001,
      maxAmount: 1000000,
    }));
  },

  async getEstimate(fromCurrency: string, toCurrency: string, amount: number) {
    // モック実装
    return {
      estimatedAmount: amount * 0.98, // 2%手数料を想定
      fromCurrency,
      toCurrency,
      exchangeRate: 0.98,
    };
  },

  async createPayment(data) {
    // モック実装
    return {
      id: `payment_${Date.now()}`,
      status: 'pending',
      amount: data.amount,
      currency: data.currency,
      address: data.address,
      memo: data.memo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

export function formatCurrency(amount: number, currency: string): string {
  return `${amount.toFixed(8)} ${currency}`;
}

export function validateCurrency(currency: string): boolean {
  return MAJOR_CURRENCIES.includes(currency as (typeof MAJOR_CURRENCIES)[number]);
}
