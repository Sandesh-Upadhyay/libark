/**
 * 🎯 ウォレット関連カスタムフック
 *
 * ウォレット機能のフロントエンド統合
 */

import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@libark/graphql-client';
import { useState, useEffect } from 'react';
import {
  MyWalletDocument,
  MyWalletTransactionsDocument,
  MyUserWalletsDocument,
  MyDepositRequestsDocument,
  MyWithdrawalRequestsDocument,
  GetExchangeRateDocument,
  CreateDepositRequestDocument,
  CreateWithdrawalRequestDocument,
  // 新しい権限管理クエリ
  MyPermissionsDocument,
  AllPermissionsDocument,
  GrantPermissionDocument,
  TransferBalanceDocument,
} from '@libark/graphql-client';

import { useFeatures } from '@/hooks';
// import type { DisplayCurrency, CurrencyInfo } from '@libark/nowpayments-api';
interface DisplayCurrency {
  id?: string;
  code: string;
  name: string;
  logoUrl?: string;
  isPopular?: boolean;
  isStable?: boolean;
  network?: string;
}

interface CurrencyInfo {
  ticker: string;
  name: string;
  image?: string;
  featured?: boolean;
  is_stable?: boolean;
  network?: string;
}

// 型定義
export interface WalletData {
  id: string;
  userId: string;
  balanceUsd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 取引メタデータの型定義
export interface TransactionMetadata {
  paymentId?: string;
  orderId?: string;
  exchangeRate?: number;
  networkFee?: number;
  providerFee?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REFUND';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  metadata?: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface UserWallet {
  id: string;
  userId: string;
  currency: string;
  address: string;
  label?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentId?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  address: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  permission: Permission;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * ウォレット情報取得フック
 */
export const useWallet = () => {
  const { user } = useAuth();

  const { features, loading: featuresLoading } = useFeatures();

  const shouldSkip = !user || featuresLoading || features.WALLET_ACCESS === false;

  const {
    data: walletData,
    loading: walletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useQuery(MyWalletDocument, {
    skip: shouldSkip,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // パフォーマンス最適化のためキャッシュ優先
  });

  const wallet = walletData?.myWallet;

  return {
    wallet,
    loading: walletLoading,
    error: walletError,
    refetch: refetchWallet,
  };
};

/**
 * ウォレット取引履歴取得フック（カーソル方式）
 * 初期取得は控えめ（デフォルト first=20）。
 */
export const useWalletTransactions = (first = 20, after?: string) => {
  const { user } = useAuth();

  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    fetchMore,
  } = useQuery(MyWalletTransactionsDocument, {
    variables: { first, after },
    skip: !user,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // パフォーマンス最適化のためキャッシュ優先
  });

  const transactions = transactionsData?.myWalletTransactions || [];

  return {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    fetchMore,
  };
};

/**
 * ユーザーウォレット一覧取得フック
 */
export const useUserWallets = () => {
  const { user } = useAuth();

  const {
    data: userWalletsData,
    loading: userWalletsLoading,
    error: userWalletsError,
    refetch: refetchUserWallets,
  } = useQuery(MyUserWalletsDocument, {
    skip: !user,
    errorPolicy: 'all',
  });

  const userWallets = userWalletsData?.myUserWallets || [];

  return {
    userWallets,
    loading: userWalletsLoading,
    error: userWalletsError,
    refetch: refetchUserWallets,
  };
};

/**
 * 入金リクエスト一覧取得フック
 */
export const useDepositRequests = () => {
  const { user } = useAuth();

  const {
    data: depositRequestsData,
    loading: depositRequestsLoading,
    error: depositRequestsError,
    refetch: refetchDepositRequests,
  } = useQuery(MyDepositRequestsDocument, {
    skip: !user,
    errorPolicy: 'all',
  });

  const depositRequests = depositRequestsData?.myDepositRequests || [];

  return {
    depositRequests,
    loading: depositRequestsLoading,
    error: depositRequestsError,
    refetch: refetchDepositRequests,
  };
};

/**
 * 出金リクエスト一覧取得フック
 */
export const useWithdrawalRequests = () => {
  const { user } = useAuth();

  const {
    data: withdrawalRequestsData,
    loading: withdrawalRequestsLoading,
    error: withdrawalRequestsError,
    refetch: refetchWithdrawalRequests,
  } = useQuery(MyWithdrawalRequestsDocument, {
    skip: !user,
    errorPolicy: 'all',
  });

  const withdrawalRequests = withdrawalRequestsData?.myWithdrawalRequests || [];

  return {
    withdrawalRequests,
    loading: withdrawalRequestsLoading,
    error: withdrawalRequestsError,
    refetch: refetchWithdrawalRequests,
  };
};

/**
 * 為替レート取得フック
 */
export const useExchangeRate = (fromCurrency: string, toCurrency: string) => {
  const {
    data: exchangeRateData,
    loading: exchangeRateLoading,
    error: exchangeRateError,
    refetch: refetchExchangeRate,
  } = useQuery(GetExchangeRateDocument, {
    variables: { fromCurrency, toCurrency },
    skip: !fromCurrency || !toCurrency,
    errorPolicy: 'all',
  });

  const exchangeRate = exchangeRateData?.getExchangeRate;

  return {
    exchangeRate,
    loading: exchangeRateLoading,
    error: exchangeRateError,
    refetch: refetchExchangeRate,
  };
};

/**
 * サポート通貨一覧取得フック
 */
export const useSupportedCurrencies = () => {
  const [currencies, setCurrencies] = useState<DisplayCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/nowpayments/currencies/full');
        const result = await response.json();

        if (result.success && result.data) {
          // NOWPaymentsCurrencyからDisplayCurrencyに変換
          const displayCurrencies: DisplayCurrency[] = result.data.map(
            (currency: CurrencyInfo) => ({
              id: currency.ticker,
              code: currency.ticker,
              name: currency.name,
              logoUrl: currency.image ? `https://nowpayments.io${currency.image}` : '',
              isPopular: currency.featured,
              isStable: currency.is_stable,
              network: currency.network,
            })
          );

          setCurrencies(displayCurrencies);
        } else {
          throw new Error('Failed to fetch currencies');
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  return {
    currencies,
    loading,
    error,
  };
};

/**
 * 入金申請作成フック
 */
export const useCreateDepositRequest = () => {
  const [createDepositRequest, { loading, error }] = useMutation(CreateDepositRequestDocument);

  const createDeposit = async (input: {
    requestedUsdAmount: number;
    currency: string;
    network: string;
    userWalletAddress: string;
  }) => {
    try {
      const result = await createDepositRequest({
        variables: { input },
      });
      return result.data?.createDepositRequest;
    } catch (err) {
      console.error('Failed to create deposit request:', err);
      throw err;
    }
  };

  return {
    createDeposit,
    loading,
    error,
  };
};

/**
 * 出金申請作成フック
 */
export const useCreateWithdrawalRequest = () => {
  const [createWithdrawalRequest, { loading, error }] = useMutation(
    CreateWithdrawalRequestDocument
  );

  const createWithdrawal = async (input: {
    currency: string;
    amount: number;
    destinationAddress: string;
    memo?: string;
    network: string;
  }) => {
    try {
      const result = await createWithdrawalRequest({
        variables: { input },
      });
      return result.data?.createWithdrawalRequest;
    } catch (err) {
      console.error('Failed to create withdrawal request:', err);
      throw err;
    }
  };

  return {
    createWithdrawal,
    loading,
    error,
  };
};

/**
 * 権限付与フック
 */
export const useGrantPermission = () => {
  const [grantPermission, { loading, error }] = useMutation(GrantPermissionDocument);

  const grant = async (input: { userId: string; permissionName: string; expiresAt?: string }) => {
    try {
      const result = await grantPermission({
        variables: { input },
        refetchQueries: [MyPermissionsDocument, AllPermissionsDocument],
      });
      return result.data?.grantPermission;
    } catch (err) {
      console.error('Failed to grant permission:', err);
      throw err;
    }
  };

  return {
    grant,
    loading,
    error,
  };
};

/**
 * 残高転送フック
 */
export const useTransferBalance = () => {
  const [transferBalance, { loading, error }] = useMutation(TransferBalanceDocument);

  const transfer = async (input: { toUserId: string; amount: number; description?: string }) => {
    try {
      const result = await transferBalance({
        variables: { input },
        refetchQueries: [MyWalletDocument, MyWalletTransactionsDocument],
      });
      return result.data?.transferBalance;
    } catch (err) {
      console.error('Failed to transfer balance:', err);
      throw err;
    }
  };

  return {
    transfer,
    loading,
    error,
  };
};
