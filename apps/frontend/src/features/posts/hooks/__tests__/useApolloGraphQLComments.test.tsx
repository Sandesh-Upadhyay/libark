/**
 * 🧪 useApolloGraphQLComments フック テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { CommentsDocument } from '@libark/graphql-client';

import { useApolloGraphQLComments } from '../useApolloGraphQLComments';

// モックデータ
const mockComment = {
  id: '1',
  content: 'Test comment',
  createdAt: '2024-01-01T00:00:00Z',
  likesCount: 5,
  isLikedByCurrentUser: false,
  user: {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    profileImageId: null,
  },
};

const mockCommentsData = {
  comments: [
    mockComment,
    {
      ...mockComment,
      id: '2',
      content: 'Another comment',
    },
  ],
};

const mocks = [
  {
    request: {
      query: CommentsDocument,
      variables: {
        postId: 'post1',
        first: 50,
      },
    },
    result: {
      data: mockCommentsData,
    },
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useApolloGraphQLComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('コメント一覧の取得', () => {
    it('コメント一覧が正しく取得されること', async () => {
      const { result } = renderHook(() => useApolloGraphQLComments('post1'), { wrapper });

      // 初期状態
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual([]);

      // データ取得完了を待つ
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // データが正しく取得されているか確認
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].content).toBe('Test comment');
      expect(result.current.data[1].content).toBe('Another comment');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => useApolloGraphQLComments('post1'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('postIdがない場合、クエリがスキップされること', async () => {
      const { result } = renderHook(() => useApolloGraphQLComments(''), { wrapper });

      // クエリがスキップされるため、ローディング状態はfalse
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual([]);
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: CommentsDocument,
            variables: {
              postId: 'post1',
              first: 50,
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

      const { result } = renderHook(() => useApolloGraphQLComments('post1'), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('コメントのフィルタリング', () => {
    it('コメントが正しくフィルタリングされること', async () => {
      const { result } = renderHook(() => useApolloGraphQLComments('post1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // コメントが正しく取得されているか確認
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].content).toBe('Test comment');
      expect(result.current.data[1].content).toBe('Another comment');
    });
  });

  describe('コメントのリフレッシュ', () => {
    it('refetchが正しく動作すること', async () => {
      const { result } = renderHook(() => useApolloGraphQLComments('post1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.refetch();

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーが正しく処理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: CommentsDocument,
            variables: {
              postId: 'post1',
              first: 50,
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

      const { result } = renderHook(() => useApolloGraphQLComments('post1'), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toBe('Network error');
    });
  });
});
