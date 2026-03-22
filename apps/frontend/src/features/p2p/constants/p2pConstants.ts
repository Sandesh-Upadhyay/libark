/**
 * P2P機能で使用する表示用定数
 */

// 支払い方法の表示名
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: '銀行振込',
  PAYPAY: 'PayPay',
  PAYPAL: 'PayPal',
  WISE: 'Wise',
  LINE_PAY: 'LINE Pay',
  RAKUTEN_PAY: '楽天ペイ',
};

// 支払い方法オプション
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: 'すべての支払い方法' },
  { value: 'BANK_TRANSFER', label: '銀行振込' },
  { value: 'PAYPAY', label: 'PayPay' },
  { value: 'LINE_PAY', label: 'LINE Pay' },
  { value: 'RAKUTEN_PAY', label: '楽天ペイ' },
] as const;

// 通貨記号（表示用フォールバック）
export const CURRENCY_SYMBOLS: Record<string, string> = {
  JPY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// 通貨オプション
export const CURRENCY_OPTIONS = [
  { value: 'JPY', label: 'JPY (日本円)' },
  { value: 'USD', label: 'USD (米ドル)' },
  { value: 'EUR', label: 'EUR (ユーロ)' },
] as const;

// ソートオプション
export const SORT_OPTIONS = [
  { value: 'rate', label: 'レート順' },
  { value: 'minAmount', label: '最小金額順' },
  { value: 'maxAmount', label: '最大金額順' },
] as const;

/**
 * 暫定的な換算レート（1 USD あたりの各通貨）
 * TODO: バックエンドの getExchangeRate クエリを使用するように将来的に移行
 */
export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  JPY: 150,
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
};
