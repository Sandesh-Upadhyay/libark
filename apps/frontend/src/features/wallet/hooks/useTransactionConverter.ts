/**
 * 🎯 取引データ変換カスタムフック
 *
 * 責任:
 * - WalletTransactionからTransactionItemへの変換
 * - 型安全な変換処理
 * - パフォーマンス最適化
 */

import { useMemo } from 'react';

import { type TransactionItem } from '@/features/wallet/components/molecules/TransactionTable';

/**
 * 取引データの型定義
 */
interface WalletTransaction {
  id: string;
  type: string;
  amountUsd: number;
  currency: string;
  description?: string;
  createdAt: string;
  metadata?: string | Record<string, unknown>;
  paymentRequest?: {
    method: string;
    currency: string;
    currencyAmount?: number;
  };
}

/**
 * メタデータの型定義
 */
interface TransactionMetadata {
  serviceType?: string;
  serviceName?: string;
  planName?: string;
  sellerId?: string;
  sellerName?: string;
  buyerId?: string;
  buyerName?: string;
  exchangeRate?: number;
  currency?: string;
  amount?: number;
}

/**
 * Type Guard: WalletTransactionかどうかを判定
 */
const isWalletTransaction = (tx: unknown): tx is WalletTransaction => {
  return (
    typeof tx === 'object' &&
    tx !== null &&
    'id' in tx &&
    'type' in tx &&
    'amountUsd' in tx &&
    'createdAt' in tx
  );
};

/**
 * メタデータを安全にパース
 */
const parseMetadata = (metadata: unknown): TransactionMetadata => {
  if (!metadata) return {};

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  if (typeof metadata === 'object') {
    return metadata as TransactionMetadata;
  }

  return {};
};

/**
 * 取引手段を決定
 */
const determineTransactionMethod = (
  tx: WalletTransaction,
  metadata: TransactionMetadata
): 'crypto' | 'wallet' | 'p2p' => {
  // PaymentRequestがある場合
  if (tx.paymentRequest) {
    return tx.paymentRequest.method === 'CRYPTO' ? 'crypto' : 'p2p';
  }

  // メタデータから判定
  if (metadata.serviceType || metadata.sellerName || metadata.buyerName) {
    return 'wallet';
  }

  // P2P取引の場合
  if (metadata.exchangeRate) {
    return 'p2p';
  }

  // デフォルトは暗号通貨
  return 'crypto';
};

/**
 * 関連ユーザー情報を生成
 */
const createRelatedUser = (
  transactionType: TransactionItem['type'],
  metadata: TransactionMetadata
) => {
  if (transactionType === 'payment' && metadata.sellerId) {
    return {
      id: metadata.sellerId,
      username: metadata.sellerName?.toLowerCase() || 'seller',
      displayName: metadata.sellerName || 'Seller',
      profileImageId: undefined,
    };
  }

  if (transactionType === 'receive' && metadata.buyerId) {
    return {
      id: metadata.buyerId,
      username: metadata.buyerName?.toLowerCase() || 'buyer',
      displayName: metadata.buyerName || 'Buyer',
      profileImageId: undefined,
    };
  }

  // フォールバック
  return {
    id: 'admin',
    username: 'admin',
    displayName: 'Admin',
    profileImageId: undefined,
  };
};

/**
 * 単一の取引を変換
 */
const convertSingleTransaction = (tx: WalletTransaction): TransactionItem => {
  const metadata = parseMetadata(tx.metadata);
  const method = determineTransactionMethod(tx, metadata);
  const transactionType = tx.type.toLowerCase() as TransactionItem['type'];

  // 基本的な取引データ
  const baseTransaction: Omit<TransactionItem, 'method'> = {
    id: tx.id,
    type: transactionType,
    currency: 'USD' as const,
    amount: Number(tx.amountUsd),
    timestamp: new Date(tx.createdAt),
    status: 'completed' as const,
    description: tx.description || `${tx.type} transaction`,
  };

  // 暗号通貨取引
  if (method === 'crypto') {
    const cryptoDetails = {
      currency: tx.paymentRequest?.currency || 'BTC',
      amount: tx.paymentRequest?.currencyAmount ? Number(tx.paymentRequest.currencyAmount) : 0,
    };

    if (transactionType === 'withdrawal') {
      return {
        ...baseTransaction,
        method: 'crypto' as const,
        cryptoDetails: {
          ...cryptoDetails,
          address: `mock_address_${tx.id.slice(-8)}`,
          currency: cryptoDetails.currency as 'BTC' | 'ETH' | 'USDT',
        },
      } as TransactionItem;
    }

    return {
      ...baseTransaction,
      method: 'crypto' as const,
      cryptoDetails: {
        ...cryptoDetails,
        currency: cryptoDetails.currency as 'BTC' | 'ETH' | 'USDT',
        address: 'mock_address',
      },
    } as TransactionItem;
  }

  // ウォレット残高取引
  if (method === 'wallet') {
    return {
      ...baseTransaction,
      method: 'wallet' as const,
      relatedUser: createRelatedUser(transactionType, metadata),
      serviceInfo: metadata.serviceType
        ? {
            name:
              metadata.serviceName ||
              (metadata.planName ? `${metadata.planName}プラン` : tx.description || 'サービス'),
            url: `/service/${metadata.serviceType}`,
            type:
              metadata.serviceType === 'subscription'
                ? ('subscription' as const)
                : ('content' as const),
          }
        : undefined,
    } as TransactionItem;
  }

  // P2P取引
  if (method === 'p2p') {
    return {
      ...baseTransaction,
      method: 'p2p' as const,
      p2pDetails: {
        currency: (metadata.currency || 'JPY') as 'USD' | 'JPY' | 'EUR',
        amount: metadata.amount || 0,
        exchangeRate: metadata.exchangeRate || 1,
      },
    } as TransactionItem;
  }

  // フォールバック（暗号通貨として扱う）
  return {
    ...baseTransaction,
    method: 'crypto' as const,
    cryptoDetails: {
      currency: 'BTC' as 'BTC' | 'ETH' | 'USDT',
      amount: 0,
      address: 'fallback_address',
    },
  } as TransactionItem;
};

/**
 * 取引データ変換カスタムフック
 */
export const useTransactionConverter = (walletTransactions: unknown[]) => {
  return useMemo(() => {
    if (!Array.isArray(walletTransactions)) {
      return [];
    }

    return walletTransactions.filter(isWalletTransaction).map(convertSingleTransaction);
  }, [walletTransactions]);
};

/**
 * デバッグ用ログ
 */
export const logTransactionConversion = (tx: WalletTransaction, metadata: TransactionMetadata) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug('Transaction conversion:', {
      id: tx.id,
      type: tx.type.toLowerCase(),
      currency: tx.currency,
      metadata,
      hasServiceType: !!metadata.serviceType,
      hasSellerName: !!metadata.sellerName,
    });
  }
};
