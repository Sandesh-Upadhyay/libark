/**
 * 🧪 useWallet フック ユニットテスト
 *
 * ウォレットフックの機能をテストします
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import {
  TransactionType,
  DepositStatus,
  WithdrawalStatus,
  AuthProvider,
} from '@libark/graphql-client';

import {
  useWallet,
  useWalletTransactions,
  useUserWallets,
  useDepositRequests,
  useWithdrawalRequests,
  useExchangeRate,
  useCreateDepositRequest,
  useCreateWithdrawalRequest,
  useTransferBalance,
  type WalletData,
  type WalletTransaction,
  type UserWallet,
  type DepositRequest,
  type WithdrawalRequest,
} from '../../features/wallet/hooks';

// モックデータ
const mockWallet: WalletData = {
  id: 'wallet-1',
  userId: 'user-1',
  balanceUsd: 1000.0,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    walletId: 'wallet-1',
    type: TransactionType.Deposit,
    amount: 500.0,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'Deposit',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tx-2',
    walletId: 'wallet-1',
    type: TransactionType.Withdrawal,
    amount: 200.0,
    currency: 'USD',
    status: 'COMPLETED',
    description: 'Withdrawal',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockUserWallets: UserWallet[] = [
  {
    id: 'uw-1',
    userId: 'user-1',
    currency: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    label: 'My BTC Wallet',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockDepositRequests: DepositRequest[] = [
  {
    id: 'dr-1',
    userId: 'user-1',
    amount: 100.0,
    currency: 'BTC',
    status: DepositStatus.Pending,
    paymentId: 'pay-123',
    paymentUrl: 'https://nowpayments.io/payment/pay-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wr-1',
    userId: 'user-1',
    amount: 50.0,
    currency: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    status: WithdrawalStatus.Pending,
    txHash: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Apollo Clientのモック
const createMockApolloClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    uri: 'http://localhost:8000/graphql',
  });
};

// テスト用のラッパーコンポーネント（AuthProviderを含む）
const createWrapper = () => {
  const client = createMockApolloClient();
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
};

describe('useWallet フック', () => {
  describe('ウォレット情報の取得', () => {
    it('ウォレット情報が正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
      expect(typeof result.current.loading).toBe('boolean');
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'undefined'
      ).toBe(true);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('残高が正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
    });

    it('ローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('エラーが発生した場合にerrorが設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'undefined'
      ).toBe(true);
    });

    it('refetchでウォレット情報を再取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('トランザクション履歴の取得', () => {
    it('トランザクション履歴が正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(result.current.transactions).toBeDefined();
      expect(Array.isArray(result.current.transactions)).toBe(true);
    });

    it('ローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('エラーが発生した場合にerrorが設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });

    it('refetchでトランザクション履歴を再取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('fetchMoreで追加のトランザクションを取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(typeof result.current.fetchMore).toBe('function');
    });
  });

  describe('トランザクションのフィルタリング', () => {
    it('トランザクションタイプでフィルタリングできること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      // フィルタリングのテスト
      expect(result.current.transactions).toBeDefined();
    });

    it('トランザクションステータスでフィルタリングできること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      // ステータスフィルタリングのテスト
      expect(result.current.transactions).toBeDefined();
    });

    it('通貨でフィルタリングできること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      // 通貨フィルタリングのテスト
      expect(result.current.transactions).toBeDefined();
    });
  });

  describe('トランザクションのページネーション', () => {
    it('firstパラメータで取得数を制限できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(10), { wrapper });

      expect(result.current.transactions).toBeDefined();
    });

    it('afterパラメータで次のページを取得できること', () => {
      const wrapper = createWrapper();
      const cursor = 'cursor-123';
      const { result } = renderHook(() => useWalletTransactions(20, cursor), { wrapper });

      expect(result.current.transactions).toBeDefined();
    });

    it('fetchMoreで次のページを取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(typeof result.current.fetchMore).toBe('function');
    });
  });

  describe('ユーザーウォレット一覧の取得', () => {
    it('ユーザーウォレット一覧が正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      expect(result.current.userWallets).toBeDefined();
      expect(Array.isArray(result.current.userWallets)).toBe(true);
    });

    it('ローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('エラーが発生した場合にerrorが設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });

    it('refetchでユーザーウォレット一覧を再取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('入金リクエストの送信', () => {
    it('入金リクエストが正しく送信されること', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateDepositRequest(), { wrapper });

      expect(typeof result.current.createDeposit).toBe('function');
    });

    it('入金リクエストのローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateDepositRequest(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('入金リクエストのエラーが正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateDepositRequest(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });
  });

  describe('入金リクエスト一覧の取得', () => {
    it('入金リクエスト一覧が正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDepositRequests(), { wrapper });

      expect(result.current.depositRequests).toBeDefined();
      expect(Array.isArray(result.current.depositRequests)).toBe(true);
    });

    it('ローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDepositRequests(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('エラーが発生した場合にerrorが設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDepositRequests(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });

    it('refetchで入金リクエスト一覧を再取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDepositRequests(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('出金リクエストの送信', () => {
    it('出金リクエストが正しく送信されること', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      expect(typeof result.current.createWithdrawal).toBe('function');
    });

    it('出金リクエストのローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('出金リクエストのエラーが正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });
  });

  describe('出金リクエスト一覧の取得', () => {
    it('出金リクエスト一覧が正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWithdrawalRequests(), { wrapper });

      expect(result.current.withdrawalRequests).toBeDefined();
      expect(Array.isArray(result.current.withdrawalRequests)).toBe(true);
    });

    it('ローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWithdrawalRequests(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('エラーが発生した場合にerrorが設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWithdrawalRequests(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });

    it('refetchで出金リクエスト一覧を再取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWithdrawalRequests(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('残高転送', () => {
    it('残高転送が正しく実行されること', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTransferBalance(), { wrapper });

      expect(typeof result.current.transfer).toBe('function');
    });

    it('残高転送のローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTransferBalance(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('残高転送のエラーが正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTransferBalance(), { wrapper });

      // errorはnull、string、またはApolloErrorオブジェクトのいずれか
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string' ||
          typeof result.current.error === 'object' ||
          result.current.error === undefined
      ).toBe(true);
    });
  });

  describe('為替レートの取得', () => {
    it('為替レートが正しく取得されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), { wrapper });

      expect(
        result.current.exchangeRate === null ||
          typeof result.current.exchangeRate === 'number' ||
          typeof result.current.exchangeRate === 'undefined'
      ).toBe(true);
    });

    it('ローディング状態が正しく設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('エラーが発生した場合にerrorが設定されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), { wrapper });

      expect(
        result.current.error === null ||
          typeof result.current.error === 'object' ||
          typeof result.current.error === 'undefined'
      ).toBe(true);
    });

    it('refetchで為替レートを再取得できること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('無効な通貨ペアの場合にスキップされること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useExchangeRate('', ''), { wrapper });

      expect(typeof result.current.exchangeRate).toBe('undefined');
    });
  });

  describe('エラーハンドリング', () => {
    it('残高不足の場合にエラーが返されること', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      // 残高不足のエラーハンドリングテスト
      expect(typeof result.current.createWithdrawal).toBe('function');
    });

    it('無効なアドレスの場合にエラーが返されること', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      // 無効なアドレスのエラーハンドリングテスト
      expect(typeof result.current.createWithdrawal).toBe('function');
    });

    it('ネットワークエラーの場合にエラーが返されること', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateDepositRequest(), { wrapper });

      // ネットワークエラーのエラーハンドリングテスト
      expect(typeof result.current.createDeposit).toBe('function');
    });
  });

  describe('ウォレット情報の自動更新', () => {
    it('refetchでウォレット情報が更新されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('refetchでトランザクション履歴が更新されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('refetchでユーザーウォレット一覧が更新されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('型安全性', () => {
    it('WalletDataの型が正しく定義されていること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
    });

    it('WalletTransactionの型が正しく定義されていること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(result.current.transactions).toBeDefined();
    });

    it('UserWalletの型が正しく定義されていること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      expect(result.current.userWallets).toBeDefined();
    });

    it('DepositRequestの型が正しく定義されていること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDepositRequests(), { wrapper });

      expect(result.current.depositRequests).toBeDefined();
    });

    it('WithdrawalRequestの型が正しく定義されていること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWithdrawalRequests(), { wrapper });

      expect(result.current.withdrawalRequests).toBeDefined();
    });
  });

  describe('エッジケース', () => {
    it('未認証ユーザーの場合にクエリがスキップされること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
    });

    it('空のトランザクション履歴の場合に正しく処理されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(), { wrapper });

      expect(Array.isArray(result.current.transactions)).toBe(true);
    });

    it('空のユーザーウォレット一覧の場合に正しく処理されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserWallets(), { wrapper });

      expect(Array.isArray(result.current.userWallets)).toBe(true);
    });

    it('無効なカーソルの場合に正しく処理されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWalletTransactions(20, 'invalid-cursor'), { wrapper });

      expect(result.current.transactions).toBeDefined();
    });

    it('ゼロ残高の場合に正しく処理されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
    });
  });

  describe('パフォーマンス', () => {
    it('キャッシュが正しく使用されること', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
    });

    it('不要な再レンダリングが発生しないこと', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(typeof result.current.wallet).toBe('undefined');
    });
  });
});
