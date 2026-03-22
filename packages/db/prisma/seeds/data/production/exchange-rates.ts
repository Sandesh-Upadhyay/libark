/**
 * 本番環境用為替レートデータ
 * 暗号通貨の初期為替レート設定
 */

export interface ExchangeRateData {
  currency: string;
  usdRate: number;
  source: string;
  isActive: boolean;
}

/**
 * 本番環境用為替レート（2025年1月時点の市場価格ベース）
 * 注意: 本番環境では外部APIから定期的に更新される
 */
export const PRODUCTION_EXCHANGE_RATES: ExchangeRateData[] = [
  {
    currency: 'BTC',
    usdRate: 95000.0,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'ETH',
    usdRate: 3400.0,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'USDT',
    usdRate: 1.0,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'BNB',
    usdRate: 650.0,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'ADA',
    usdRate: 0.85,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'DOT',
    usdRate: 7.5,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'MATIC',
    usdRate: 0.45,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'SOL',
    usdRate: 180.0,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'XRP',
    usdRate: 2.2,
    source: 'mexc',
    isActive: true,
  },
  {
    currency: 'XMR',
    usdRate: 160.0,
    source: 'mexc',
    isActive: true,
  },
];

/**
 * サポートされている暗号通貨の基本情報
 */
export const SUPPORTED_CURRENCIES = [
  { currency: 'BTC', network: 'Bitcoin', name: 'Bitcoin' },
  { currency: 'ETH', network: 'Ethereum', name: 'Ethereum' },
  { currency: 'USDT', network: 'TRC20', name: 'Tether (TRC20)' },
  { currency: 'USDT', network: 'ERC20', name: 'Tether (ERC20)' },
  { currency: 'BNB', network: 'BSC', name: 'BNB Smart Chain' },
  { currency: 'ADA', network: 'Cardano', name: 'Cardano' },
  { currency: 'DOT', network: 'Polkadot', name: 'Polkadot' },
  { currency: 'MATIC', network: 'Polygon', name: 'Polygon' },
  { currency: 'SOL', network: 'Solana', name: 'Solana' },
  { currency: 'XRP', network: 'Ripple', name: 'Ripple' },
  { currency: 'XMR', network: 'Monero', name: 'Monero' },
] as const;
