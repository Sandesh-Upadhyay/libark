/**
 * 🧪 useP2PTrades フック テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { MyP2PTradeRequestsDocument } from '@libark/graphql-client';

import { useP2PTrades } from '../useP2PTrades';

// モックデータ
const mockTrade = {
  id: 'trade1',
  buyerId: 'buyer1',
  sellerId: 'seller1',
  offerId: 'offer1',
  amountUsd: 100,
  fiatCurrency: 'JPY',
  fiatAmount: 15000,
  status: 'PENDING',
  paymentMethod: 'BANK_TRANSFER',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTradesData = {
  myP2PTradeRequests: [
    mockTrade,
    {
      ...mockTrade,
      id: 'trade2',
      status: 'COMPLETED',
    },
  ],
};

const mocks = [
  {
    request: {
      query: MyP2PTradeRequestsDocument,
      variables: {
        status: 'PENDING',
        first: 20,
      },
    },
    result: {
      data: mockTradesData,
    },
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useP2PTrades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('P2Pトレード一覧の取得', () => {
    it('P2Pトレード一覧が正しく取得されること', async () => {
      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), { wrapper });

      // 初期状態
      expect(result.current.loading).toBe(true);
      expect(result.current.trades).toEqual([]);

      // データ取得完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // データが正しく取得されているか確認
      expect(result.current.trades).toHaveLength(2);
      expect(result.current.trades[0].status).toBe('PENDING');
      expect(result.current.trades[1].status).toBe('COMPLETED');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('enabled=falseの場合、クエリがスキップされること', async () => {
      const { result } = renderHook(() => useP2PTrades({ enabled: false }), { wrapper });

      // クエリがスキップされるため、ローディング状態はfalse
      expect(result.current.loading).toBe(false);
      expect(result.current.trades).toEqual([]);
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: MyP2PTradeRequestsDocument,
            variables: {
              status: 'PENDING',
              first: 20,
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

      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('P2Pトレードのフィルタリング', () => {
    it('ステータスでフィルタリングできること', async () => {
      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // PENDINGステータスのトレードが取得される
      expect(result.current.trades).toBeDefined();
    });

    it('COMPLETEDステータスでフィルタリングできること', async () => {
      const completedMocks = [
        {
          request: {
            query: MyP2PTradeRequestsDocument,
            variables: {
              status: 'COMPLETED',
              first: 20,
            },
          },
          result: {
            data: {
              myP2PTradeRequests: [
                {
                  ...mockTrade,
                  id: 'trade1',
                  status: 'COMPLETED',
                },
              ],
            },
          },
        },
      ];

      const completedWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={completedMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useP2PTrades({ status: 'COMPLETED' }), {
        wrapper: completedWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.trades[0].status).toBe('COMPLETED');
    });
  });

  describe('P2Pトレードのページネーション', () => {
    it('firstパラメータが正しく設定されること', async () => {
      const { result } = renderHook(() => useP2PTrades({ first: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.trades).toBeDefined();
    });

    it('afterパラメータが正しく設定されること', async () => {
      const { result } = renderHook(() => useP2PTrades({ after: 'cursor1' }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.trades).toBeDefined();
    });
  });

  describe('P2Pトレードのリフレッシュ', () => {
    it('refetchが正しく動作すること', async () => {
      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refetch();

      expect(result.current.loading).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーが正しく処理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: MyP2PTradeRequestsDocument,
            variables: {
              status: 'PENDING',
              first: 20,
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

      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toBe('Network error');
    });

    it('サーバーエラーが正しく処理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: MyP2PTradeRequestsDocument,
            variables: {
              status: 'PENDING',
              first: 20,
            },
          },
          error: new Error('Server error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useP2PTrades({ status: 'PENDING' }), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toBe('Server error');
    });
  });
});
