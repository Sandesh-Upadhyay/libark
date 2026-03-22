/**
 * P2P取引サンプルデータ
 * シードで使用するP2P取引データを定義
 */

import type { P2PTradeData, P2PSellerOfferData } from '../utils/types';

// 為替レート（1 USD = 150 JPY）
const EXCHANGE_RATE_JPY = 150;

/**
 * 売り手オファーデータ
 */
export const p2pSellerOffersData: P2PSellerOfferData[] = [
  {
    sellerUsername: 'p2p_trader_ken',
    minAmountUsd: 10,
    maxAmountUsd: 500,
    fiatCurrency: 'JPY',
    exchangeRateMargin: 2.5,
    paymentMethods: ['BANK_TRANSFER', 'PAYPAY', 'LINE_PAY'],
    isActive: true,
  },
  {
    sellerUsername: 'p2p_trader_yumi',
    minAmountUsd: 20,
    maxAmountUsd: 1000,
    fiatCurrency: 'JPY',
    exchangeRateMargin: 1.5,
    paymentMethods: ['BANK_TRANSFER', 'PAYPAY'],
    isActive: true,
  },
  {
    sellerUsername: 'p2p_trader_naoki',
    minAmountUsd: 50,
    maxAmountUsd: 2000,
    fiatCurrency: 'JPY',
    exchangeRateMargin: 3.0,
    paymentMethods: ['PAYPAY', 'LINE_PAY', 'WISE'],
    isActive: true,
  },
];

/**
 * 取引リクエストデータ
 * 各ステータスのサンプル
 */
export const p2pTradeRequestsData: P2PTradeData[] = [
  // 1. PENDING状態（買い手: user1）
  {
    buyerUsername: 'user1',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 50,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    paymentDetails: '銀行口座情報を入力してください',
  },
  // 2. MATCHED状態（買い手: user2）
  {
    buyerUsername: 'user2',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 100,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'MATCHED',
    paymentMethod: 'PAYPAY',
    paymentDetails: 'PayPayアカウント: test@example.com',
    escrowAmount: 100,
  },
  // 3. PAYMENT_SENT状態（買い手: user3）
  {
    buyerUsername: 'user3',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 75,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'PAYMENT_SENT',
    paymentMethod: 'LINE_PAY',
    paymentDetails: 'LINE Pay ID: 123456',
    escrowAmount: 75,
  },
  // 4. CONFIRMED状態（買い手: user4）
  {
    buyerUsername: 'user4',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 150,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'CONFIRMED',
    paymentMethod: 'BANK_TRANSFER',
    paymentDetails: '銀行口座情報を入力してください',
    escrowAmount: 150,
  },
  // 5. COMPLETED状態（買い手: user5）
  {
    buyerUsername: 'user5',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 200,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'COMPLETED',
    paymentMethod: 'PAYPAY',
    paymentDetails: 'PayPayアカウント: test@example.com',
    escrowAmount: 200,
    completedAt: new Date(),
  },
  // 6. CANCELLED状態（買い手: user6）
  {
    buyerUsername: 'user6',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 80,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'CANCELLED',
    paymentMethod: 'LINE_PAY',
    paymentDetails: 'LINE Pay ID: 789012',
    escrowAmount: 80,
  },
  // 7. 期限切れのCANCELLED状態（買い手: user7）
  {
    buyerUsername: 'user7',
    sellerUsername: 'p2p_trader_ken',
    amountUsd: 120,
    fiatCurrency: 'JPY',
    exchangeRate: EXCHANGE_RATE_JPY,
    status: 'CANCELLED',
    paymentMethod: 'BANK_TRANSFER',
    paymentDetails: '銀行口座情報を入力してください',
    escrowAmount: 120,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
  },
];

/**
 * ウォレット取引データ
 * 各取引に対応する履歴
 */
export interface P2PWalletTransactionData {
  username: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'RECEIVE' | 'TRANSFER';
  balanceType: 'WALLET' | 'SALES' | 'P2P';
  amountUsd: number;
  description: string;
  metadata?: Record<string, unknown>;
  relatedTradeIndex?: number; // p2pTradeRequestsDataのインデックス
}

/**
 * ウォレット取引データ
 */
export const p2pWalletTransactionsData: P2PWalletTransactionData[] = [
  // MATCHED状態の取引（user2）: エスクロー作成時のTRANSFER
  {
    username: 'p2p_trader_ken',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: -100,
    description: 'P2P取引エスクロー作成',
    metadata: { tradeId: 'pending', action: 'escrow_lock' },
    relatedTradeIndex: 1,
  },
  // CONFIRMED状態の取引（user4）: エスクロー解放時のTRANSFER
  {
    username: 'p2p_trader_ken',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: -150,
    description: 'P2P取引エスクロー作成',
    metadata: { tradeId: 'pending', action: 'escrow_lock' },
    relatedTradeIndex: 3,
  },
  {
    username: 'user4',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: 150,
    description: 'P2P取引完了: エスクロー解放',
    metadata: { tradeId: 'pending', action: 'escrow_release' },
    relatedTradeIndex: 3,
  },
  // CANCELLED状態の取引（user6）: 返金時のTRANSFER
  {
    username: 'p2p_trader_ken',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: -80,
    description: 'P2P取引エスクロー作成',
    metadata: { tradeId: 'pending', action: 'escrow_lock' },
    relatedTradeIndex: 5,
  },
  {
    username: 'p2p_trader_ken',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: 80,
    description: 'P2P取引キャンセル: 返金',
    metadata: { tradeId: 'pending', action: 'refund' },
    relatedTradeIndex: 5,
  },
  // COMPLETED状態の取引（user5）: 完了時のTRANSFER
  {
    username: 'p2p_trader_ken',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: -200,
    description: 'P2P取引エスクロー作成',
    metadata: { tradeId: 'pending', action: 'escrow_lock' },
    relatedTradeIndex: 4,
  },
  {
    username: 'user5',
    type: 'TRANSFER',
    balanceType: 'P2P',
    amountUsd: 200,
    description: 'P2P取引完了: エスクロー解放',
    metadata: { tradeId: 'pending', action: 'escrow_release' },
    relatedTradeIndex: 4,
  },
];

/**
 * P2P取引設定
 */
export const p2pConfig = {
  // 取引有効期限（分）
  tradeExpiryMinutes: 30,
  // エスクローマージン（%）
  escrowMargin: 0,
  // 最小取引金額（USD）
  minTradeAmount: 10,
  // 最大取引金額（USD）
  maxTradeAmount: 500,
} as const;
