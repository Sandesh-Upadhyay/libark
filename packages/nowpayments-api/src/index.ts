/**
 * 🚀 NOWPayments API パッケージ エントリーポイント
 */

// メインクライアント
export { NOWPaymentsServiceClient } from './nowpayments-service-client.js';
export { NOWPaymentsRestClient } from './rest-client.js';
export { NOWPaymentsIPNHandler } from './ipn-handler.js';

// 型定義
export type {
  // 設定
  NOWPaymentsConfig,

  // 基本型
  CryptoCurrency,
  FiatCurrency,
  PaymentStatus,
  SandboxTestCase,

  // API リクエスト・レスポンス型
  CreatePaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  CurrencyInfo,
  APIStatusResponse,
  MinAmountResponse,
  MaxAmountResponse,

  // IPN 型
  IPNData,
  PaymentEvent,

  // エラー型
  NOWPaymentsError,

  // ユーティリティ型
  RequestOptions,
} from './types.js';

// デフォルトエクスポート
export { NOWPaymentsServiceClient as default } from './nowpayments-service-client.js';
