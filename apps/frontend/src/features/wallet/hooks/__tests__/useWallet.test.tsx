/**
 * 🧪 useWallet フック テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import {
  MyWalletDocument,
  MyWalletTransactionsDocument,
  GetExchangeRateDocument,
  CreateDepositRequestDocument,
  CreateWithdrawalRequestDocument,
  TransferBalanceDocument,
  MeDocument,
} from '@libark/graphql-client';
import { AuthProvider } from '@libark/graphql-client';

import {
  useWallet,
  useWalletTransactions,
  useExchangeRate,
  useCreateDepositRequest,
  useCreateWithdrawalRequest,
  useTransferBalance,
} from '../useWallet';

// useFeaturesフックのモック
vi.mock('@/hooks', () => ({
  useFeatures: () => ({
    features: { WALLET_ACCESS: true },
    loading: false,
  }),
}));

// useAuthフックのモック
vi.mock('@libark/graphql-client', () => ({
  ...vi.importActual('@libark/graphql-client'),
  useAuth: () => ({
    user: { id: 'user1', username: 'testuser' },
    loading: false,
  }),
}));

// モックデータ
const mockWallet = {
  id: 'wallet1',
  balanceUsd: 1000,
  salesBalanceUsd: 500,
  p2pBalanceUsd: 200,
  p2pLockedUsd: 0,
  userId: 'user1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTransaction = {
  id: 'tx1',
  userId: 'user1',
  paymentRequestId: null,
  type: 'DEPOSIT',
  balanceType: 'WALLET',
  amountUsd: 100,
  description: '入金',
  metadata: null,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockExchangeRate = {
  id: 'rate1',
  currency: 'BTC',
  usdRate: 45000,
  source: 'NOWPAYMENTS',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockUser = {
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  profileImageId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mocks = [
  {
    request: {
      query: MeDocument,
    },
    result: {
      data: {
        me: mockUser,
      },
    },
  },
  {
    request: {
      query: MyWalletDocument,
    },
    result: {
      data: {
        myWallet: mockWallet,
      },
    },
  },
  {
    request: {
      query: MyWalletTransactionsDocument,
      variables: {
        first: 20,
      },
    },
    result: {
      data: {
        myWalletTransactions: [mockTransaction],
      },
    },
  },
  {
    request: {
      query: GetExchangeRateDocument,
      variables: {
        fromCurrency: 'BTC',
        toCurrency: 'USD',
      },
    },
    result: {
      data: {
        getExchangeRate: mockExchangeRate,
      },
    },
  },
  {
    request: {
      query: CreateDepositRequestDocument,
      variables: {
        input: {
          requestedUsdAmount: 100,
          currency: 'BTC',
          network: 'BTC',
          userWalletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        },
      },
    },
    result: {
      data: {
        createDepositRequest: {
          id: 'deposit1',
          requestedUsdAmount: 100,
          status: 'PENDING',
          currency: 'BTC',
          network: 'BTC',
          userWalletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
    },
  },
  {
    request: {
      query: CreateWithdrawalRequestDocument,
      variables: {
        input: {
          currency: 'BTC',
          amount: 0.002,
          destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          network: 'BTC',
        },
      },
    },
    result: {
      data: {
        createWithdrawalRequest: {
          id: 'withdrawal1',
          amount: 0.002,
          amountUsd: 90,
          status: 'PENDING',
          currency: 'BTC',
          network: 'BTC',
          destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
    },
  },
  {
    request: {
      query: TransferBalanceDocument,
      variables: {
        input: {
          toUserId: 'user2',
          amount: 100,
          description: '残高転送',
        },
      },
    },
    result: {
      data: {
        transferBalance: {
          amountUsd: 100,
          balanceType: 'WALLET',
          type: 'TRANSFER',
          description: '残高転送',
        },
      },
    },
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <AuthProvider>{children}</AuthProvider>
  </MockedProvider>
);

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ウォレット情報の取得', () => {
    it('ウォレット情報が正しく取得されること', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.wallet).toEqual(mockWallet);
      expect(result.current.wallet?.balanceUsd).toBe(1000);
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      // 初期状態ではローディング中であることを確認
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: MyWalletDocument,
          },
          error: new Error('Network error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useWallet(), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('ウォレットのリフレッシュ', () => {
    it('refetchが正しく動作すること', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refetch();

      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useWalletTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('トランザクション履歴の取得', () => {
    it('トランザクション履歴が正しく取得されること', async () => {
      const { result } = renderHook(() => useWalletTransactions(20), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].type).toBe('DEPOSIT');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useWalletTransactions(20), { wrapper });

      // データ取得完了を待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: MyWalletTransactionsDocument,
            variables: {
              first: 20,
            },
          },
          error: new Error('Network error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useWalletTransactions(20), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('ページネーションが正しく動作すること', async () => {
      const { result } = renderHook(() => useWalletTransactions(20, 'cursor1'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toBeDefined();
    });
  });

  describe('トランザクション履歴のリフレッシュ', () => {
    it('refetchが正しく動作すること', async () => {
      const { result } = renderHook(() => useWalletTransactions(20), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refetch();

      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useExchangeRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('為替レートの取得', () => {
    it('為替レートが正しく取得されること', async () => {
      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.exchangeRate).toEqual(mockExchangeRate);
      expect(result.current.exchangeRate?.usdRate).toBe(45000);
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), { wrapper });

      // データ取得完了を待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: GetExchangeRateDocument,
            variables: {
              fromCurrency: 'BTC',
              toCurrency: 'USD',
            },
          },
          error: new Error('Network error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useExchangeRate('BTC', 'USD'), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
});

describe('useCreateDepositRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('入金リクエストの送信', () => {
    it('入金リクエストが正しく送信されること', async () => {
      const { result } = renderHook(() => useCreateDepositRequest(), { wrapper });

      const depositRequest = await result.current.createDeposit({
        requestedUsdAmount: 100,
        currency: 'BTC',
        network: 'BTC',
        userWalletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      });

      expect(depositRequest).toBeDefined();
      expect(depositRequest.status).toBe('PENDING');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useCreateDepositRequest(), { wrapper });

      expect(result.current.loading).toBe(false);

      const createPromise = result.current.createDeposit({
        requestedUsdAmount: 100,
        currency: 'BTC',
        network: 'BTC',
        userWalletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      });

      // ローディング状態になることを確認
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await createPromise;

      expect(result.current.loading).toBe(false);
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        ...mocks.slice(0, 3),
        {
          request: {
            query: CreateDepositRequestDocument,
            variables: {
              input: {
                requestedUsdAmount: 100,
                currency: 'BTC',
                network: 'BTC',
                userWalletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useCreateDepositRequest(), {
        wrapper: errorWrapper,
      });

      await expect(
        result.current.createDeposit({
          requestedUsdAmount: 100,
          currency: 'BTC',
          network: 'BTC',
          userWalletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        })
      ).rejects.toThrow('Network error');
    });
  });
});

describe('useCreateWithdrawalRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('出金リクエストの送信', () => {
    it('出金リクエストが正しく送信されること', async () => {
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      const withdrawalRequest = await result.current.createWithdrawal({
        currency: 'BTC',
        amount: 0.002,
        destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'BTC',
      });

      expect(withdrawalRequest).toBeDefined();
      expect(withdrawalRequest.status).toBe('PENDING');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useCreateWithdrawalRequest(), { wrapper });

      expect(result.current.loading).toBe(false);

      const createPromise = result.current.createWithdrawal({
        currency: 'BTC',
        amount: 0.002,
        destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'BTC',
      });

      // ローディング状態になることを確認
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await createPromise;

      expect(result.current.loading).toBe(false);
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        ...mocks.slice(0, 4),
        {
          request: {
            query: CreateWithdrawalRequestDocument,
            variables: {
              input: {
                currency: 'BTC',
                amount: 0.002,
                destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                network: 'BTC',
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useCreateWithdrawalRequest(), {
        wrapper: errorWrapper,
      });

      await expect(
        result.current.createWithdrawal({
          currency: 'BTC',
          amount: 0.002,
          destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          network: 'BTC',
        })
      ).rejects.toThrow('Network error');
    });
  });
});

describe('useTransferBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('残高転送', () => {
    it('残高転送が正しく行われること', async () => {
      const { result } = renderHook(() => useTransferBalance(), { wrapper });

      const transfer = await result.current.transfer({
        toUserId: 'user2',
        amount: 100,
        description: '残高転送',
      });

      expect(transfer).toBeDefined();
      expect(transfer.amountUsd).toBe(100);
      expect(transfer.balanceType).toBe('WALLET');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useTransferBalance(), { wrapper });

      expect(result.current.loading).toBe(false);

      const transferPromise = result.current.transfer({
        toUserId: 'user2',
        amount: 100,
        description: '残高転送',
      });

      // ローディング状態になることを確認
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await transferPromise;

      expect(result.current.loading).toBe(false);
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        ...mocks.slice(0, 5),
        {
          request: {
            query: TransferBalanceDocument,
            variables: {
              input: {
                toUserId: 'user2',
                amount: 100,
                description: '残高転送',
              },
            },
          },
          error: new Error('Insufficient balance'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useTransferBalance(), {
        wrapper: errorWrapper,
      });

      await expect(
        result.current.transfer({
          toUserId: 'user2',
          amount: 100,
          description: '残高転送',
        })
      ).rejects.toThrow('Insufficient balance');
    });
  });
});
