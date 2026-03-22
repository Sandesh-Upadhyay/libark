/**
 * 通貨・為替レートデータ
 * シードで使用する暗号通貨と為替レート情報を定義
 */

import type { CurrencyData, ExchangeRateData, TransactionDescriptions } from '../utils/types';

/**
 * サポートされている暗号通貨とネットワーク
 */
export const supportedCurrencies: CurrencyData[] = [
  { currency: 'BTC', network: 'Bitcoin', name: 'Bitcoin' },
  { currency: 'ETH', network: 'Ethereum', name: 'Ethereum' },
  { currency: 'USDT', network: 'TRC20', name: 'Tether' },
  { currency: 'USDT', network: 'ERC20', name: 'Tether' },
  { currency: 'BNB', network: 'BSC', name: 'BNB' },
  { currency: 'ADA', network: 'Cardano', name: 'Cardano' },
  { currency: 'DOT', network: 'Polkadot', name: 'Polkadot' },
  { currency: 'MATIC', network: 'Polygon', name: 'Polygon' },
  { currency: 'SOL', network: 'Solana', name: 'Solana' },
  { currency: 'XRP', network: 'Ripple', name: 'Ripple' },
  { currency: 'XMR', network: 'Monero', name: 'Monero' },
];

/**
 * 現実的な為替レート（2025年1月時点の概算）
 */
export const exchangeRatesData: ExchangeRateData[] = [
  { currency: 'BTC', usdRate: 95000.0 },
  { currency: 'ETH', usdRate: 3400.0 },
  { currency: 'USDT', usdRate: 1.0 },
  { currency: 'BNB', usdRate: 650.0 },
  { currency: 'ADA', usdRate: 0.85 },
  { currency: 'DOT', usdRate: 7.5 },
  { currency: 'MATIC', usdRate: 0.45 },
  { currency: 'SOL', usdRate: 180.0 },
  { currency: 'XRP', usdRate: 2.2 },
  { currency: 'XMR', usdRate: 160.0 },
];

/**
 * ウォレット取引の説明文
 */
export const transactionDescriptions: TransactionDescriptions = {
  DEPOSIT: [
    'MEXC取引所からの入金',
    'Binance取引所からの入金',
    'Bybit取引所からの入金',
    'Coinbase取引所からの入金',
    'KuCoin取引所からの入金',
    'OKX取引所からの入金',
    'Kraken取引所からの入金',
    'Gate.io取引所からの入金',
    'Huobi取引所からの入金',
    'BitMEX取引所からの入金',
  ],
  WITHDRAWAL: [
    'MEXC取引所への出金',
    'Binance取引所への出金',
    'Bybit取引所への出金',
    'Coinbase取引所への出金',
    'KuCoin取引所への出金',
    'OKX取引所への出金',
    'Kraken取引所への出金',
    'Gate.io取引所への出金',
    'Huobi取引所への出金',
    'BitMEX取引所への出金',
  ],
  PAYMENT: [
    'プレミアムサブスクリプション',
    'デジタルコンテンツ購入',
    'サービス利用料',
    'プロフィール強化オプション',
    '広告非表示オプション',
    'ストレージ拡張',
    '高画質動画視聴',
    'ライブ配信視聴',
    'NFTアート購入',
    'クリエイター支援',
  ],
  RECEIVE: [
    'コンテンツ販売収益',
    'サブスクリプション収益',
    'チップ・投げ銭',
    'アフィリエイト報酬',
    'キャンペーン報酬',
    'ライブ配信収益',
    'NFT販売収益',
    'スポンサー収入',
    'コラボレーション報酬',
    'ボーナス報酬',
  ],
};

/**
 * 通貨設定
 */
export const currencyConfig = {
  defaultSource: 'mexc',
  updateInterval: 300000, // 5分間隔
  priceVariation: 0.05, // 5%の価格変動
} as const;

/**
 * ウォレット設定
 */
export const walletConfig = {
  maxBalance: 10000, // 最大残高（USD）
  maxSalesBalance: 5000, // 最大売上残高（USD）
  maxP2pBalance: 3000, // 最大P2P残高（USD）
  verificationRate: 0.7, // 70%の確率で認証済み
} as const;

/**
 * 取引設定
 */
export const transactionConfig = {
  depositRange: { min: 50, max: 1050 }, // 入金額範囲（USD）
  withdrawalRange: { min: 10, max: 510 }, // 出金額範囲（USD）
  paymentRange: { min: 5, max: 105 }, // 支払額範囲（USD）
  receiveRange: { min: 5, max: 55 }, // 受取額範囲（USD）
  completionRate: 0.7, // 70%の確率で完了
  expirationHours: 24, // 24時間で期限切れ
} as const;
