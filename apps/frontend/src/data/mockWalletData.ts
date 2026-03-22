/**
 * 🎯 ウォレット関連のモックデータ
 *
 * 責任:
 * - テスト用のウォレットデータ提供
 * - 開発環境でのデータ表示
 * - 型安全なモックデータ管理
 */

import { type TransactionItem } from '@/features/wallet/components/molecules/TransactionTable';

/**
 * モック残高データ
 */
export const MOCK_BALANCE = 3654.87;

/**
 * モック取引履歴データ
 * 実際の実装では API から取得
 */
export const MOCK_TRANSACTIONS: TransactionItem[] = [
  // 1. 暗号通貨入金の例
  {
    id: 'tx_001',
    type: 'deposit',
    amount: 500.25,
    currency: 'USD',
    description: '暗号通貨',
    timestamp: new Date('2024-07-15T10:30:00'),
    status: 'completed',
    method: 'crypto',
    cryptoDetails: {
      amount: 0.0125,
      currency: 'BTC',
    },
  },
  // 2. 暗号通貨出金の例
  {
    id: 'tx_002',
    type: 'withdrawal',
    amount: -200.5,
    currency: 'USD',
    description: '暗号通貨',
    timestamp: new Date('2024-07-14T15:45:00'),
    status: 'completed',
    method: 'crypto',
    cryptoDetails: {
      amount: 0.005,
      currency: 'BTC',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    },
  },
  // 3. ウォレット残高使用（サブスクリプション支払い）
  {
    id: 'tx_003',
    type: 'payment',
    amount: -9.99,
    currency: 'USD',
    description: 'ウォレット残高',
    timestamp: new Date('2024-07-13T16:00:00'),
    status: 'completed',
    method: 'wallet',
    relatedUser: {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Admin',
      profileImageId:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    serviceInfo: {
      name: 'プレミアムサブスクリプション',
      url: '/subscription/premium',
      type: 'subscription',
    },
  },
  // 4. ウォレット残高受け取り（コンテンツ売上）
  {
    id: 'tx_004',
    type: 'receive',
    amount: 15.99,
    currency: 'USD',
    description: 'ウォレット残高',
    timestamp: new Date('2024-07-12T12:30:00'),
    status: 'completed',
    method: 'wallet',
    relatedUser: {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Admin',
      profileImageId:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    serviceInfo: {
      name: '限定コンテンツ：開発秘話',
      url: '/content/dev-story-001',
      type: 'content',
    },
  },
  // 5. P2P取引（JPY入金）
  {
    id: 'tx_005',
    type: 'deposit',
    amount: 500.0,
    currency: 'USD',
    description: 'P2P取引',
    timestamp: new Date('2024-07-11T11:30:00'),
    status: 'completed',
    method: 'p2p',
    p2pDetails: {
      currency: 'JPY',
      amount: 75000,
      exchangeRate: 150.0,
    },
  },
  // 6. P2P取引（EUR支払い）
  {
    id: 'tx_006',
    type: 'payment',
    amount: -300.0,
    currency: 'USD',
    description: 'P2P取引',
    timestamp: new Date('2024-07-10T13:45:00'),
    status: 'completed',
    method: 'p2p',
    p2pDetails: {
      currency: 'EUR',
      amount: 270.0,
      exchangeRate: 0.9,
    },
  },
];

/**
 * 開発環境用のデバッグ情報
 */
export const logWalletDebugInfo = (
  wallet: { balance?: number; [key: string]: unknown } | null,
  transactions: Array<{ id: string; amount: number; [key: string]: unknown }>,
  walletLoading: boolean,
  transactionsLoading: boolean
) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug('🏦 ウォレットページデータ:', {
      wallet: wallet ? { id: wallet.id, balance: wallet.balanceUsd } : null,
      transactionsCount: transactions?.length || 0,
      walletLoading,
      transactionsLoading,
    });
  }
};
