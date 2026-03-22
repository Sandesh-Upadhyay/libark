/**
 * 🎯 NOWPayments API型定義
 */

// 基本的な暗号通貨型
export type CryptoCurrency =
  | 'BTC'
  | 'ETH'
  | 'USDT'
  | 'USDC'
  | 'XRP'
  | 'XMR'
  | 'BNB'
  | 'ADA'
  | 'DOT'
  | 'LINK'
  | 'LTC'
  | 'BCH'
  | 'EOS'
  | 'TRX'
  | 'XLM'
  | 'DOGE'
  | 'MATIC'
  | 'AVAX'
  | 'SOL'
  | 'ATOM'
  | 'FTM'
  | 'NEAR'
  | 'ALGO';

// フィアット通貨型
export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'KRW';

// 決済状態
export type PaymentStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'sending'
  | 'partially_paid'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired';

// サンドボックステストケース
export type SandboxTestCase =
  | 'success'
  | 'partially_paid'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'sending'
  | 'confirming';

// NOWPayments API設定
export interface NOWPaymentsConfig {
  apiKey: string;
  ipnSecret: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// 決済作成リクエスト
export interface CreatePaymentRequest {
  price_amount: number;
  price_currency: FiatCurrency;
  pay_currency: CryptoCurrency;
  pay_currency_network?: CryptoNetwork; // ネットワーク指定
  order_id: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
  case?: SandboxTestCase; // サンドボックス用
}

// 決済レスポンス
export interface PaymentResponse {
  payment_id: string;
  payment_status: PaymentStatus;
  pay_address: string;
  price_amount: number;
  price_currency: FiatCurrency;
  pay_amount: number;
  pay_currency: CryptoCurrency;
  order_id: string;
  order_description?: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount?: number;
  outcome_currency?: CryptoCurrency;
  // XRP、XLMなどで必要なExtra ID
  payin_extra_id?: string;
  extra_id_name?: string; // "memo", "destination_tag", "payment_id" など
}

// 決済状態確認レスポンス
export interface PaymentStatusResponse {
  payment_id: string;
  payment_status: PaymentStatus;
  pay_address: string;
  price_amount: number;
  price_currency: FiatCurrency;
  pay_amount: number;
  actually_paid?: number;
  pay_currency: CryptoCurrency;
  order_id: string;
  order_description?: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: CryptoCurrency;
  created_at: string;
  updated_at: string;
  // XRP、XLMなどで必要なExtra ID
  payin_extra_id?: string;
  extra_id_name?: string; // "memo", "destination_tag", "payment_id" など
}

// IPN通知データ
export interface IPNData {
  payment_id: string;
  payment_status: PaymentStatus;
  pay_address: string;
  price_amount: number;
  price_currency: FiatCurrency;
  pay_amount: number;
  actually_paid?: number;
  pay_currency: CryptoCurrency;
  order_id: string;
  order_description?: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: CryptoCurrency;
  created_at: string;
  updated_at: string;
  // XRP、XLMなどで必要なExtra ID
  payin_extra_id?: string;
  extra_id_name?: string; // "memo", "destination_tag", "payment_id" など
}

// ネットワーク型
export type CryptoNetwork =
  | 'BTC'
  | 'ETH'
  | 'TRC20'
  | 'BSC'
  | 'POLYGON'
  | 'ARBITRUM'
  | 'OPTIMISM'
  | 'AVALANCHE'
  | 'FANTOM'
  | 'SOLANA'
  | 'CARDANO'
  | 'DOT'
  | 'COSMOS';

// 通貨情報
export interface CurrencyInfo {
  ticker: string;
  name: string;
  image: string;
  has_external_id: boolean;
  isFiat: boolean;
  featured: boolean;
  is_stable: boolean;
  supportsFixedRate: boolean;
  network?: CryptoNetwork; // ネットワーク情報
  networks?: CryptoNetwork[]; // 対応ネットワーク一覧
}

// API状態レスポンス
export interface APIStatusResponse {
  message: string;
}

// 最小決済額レスポンス
export interface MinAmountResponse {
  currency_from: CryptoCurrency;
  currency_to: FiatCurrency;
  min_amount: number;
}

// 最大決済額レスポンス
export interface MaxAmountResponse {
  currency_from: FiatCurrency;
  currency_to: CryptoCurrency;
  max_amount: number;
}

// エラーレスポンス
export interface NOWPaymentsError {
  error: string;
  message: string;
  statusCode: number;
}

// リクエストオプション
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// イベント型
export interface PaymentEvent {
  type: 'payment_created' | 'payment_updated' | 'payment_finished' | 'payment_failed';
  payment: PaymentResponse | PaymentStatusResponse;
  timestamp: Date;
}
