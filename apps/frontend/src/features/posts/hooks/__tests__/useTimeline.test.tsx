/**
 * 📰 useTimelineフック テスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { TimelineDocument } from '@libark/graphql-client';

import { useTimeline } from '../useTimeline';

// モックデータ
const mockTimelineData = {
  timeline: {
    edges: [
      {
        node: {
          id: '1',
          content: 'Test post 1',
          createdAt: '2024-01-01T00:00:00Z',
          visibility: 'PUBLIC',
          isProcessing: false,
          likesCount: 5,
          commentsCount: 2,
          user: {
            id: 'user1',
            username: 'testuser1',
            displayName: 'Test User 1',
            profileImageId: null,
            isVerified: false,
          },
          media: [],
        },
        cursor: 'cursor1',
      },
      {
        node: {
          id: '2',
          content: 'Test post 2',
          createdAt: '2024-01-02T00:00:00Z',
          visibility: 'PUBLIC',
          isProcessing: false,
          likesCount: 3,
          commentsCount: 1,
          user: {
            id: 'user2',
            username: 'testuser2',
            displayName: 'Test User 2',
            profileImageId: null,
            isVerified: false,
          },
          media: [],
        },
        cursor: 'cursor2',
      },
    ],
    pageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor2',
    },
    totalCount: 10,
    timelineType: 'ALL',
  },
};

const mocks = [
  {
    request: {
      query: TimelineDocument,
      variables: {
        type: 'ALL',
        first: 20,
      },
    },
    result: {
      data: mockTimelineData,
    },
  },
  {
    request: {
      query: TimelineDocument,
      variables: {
        type: 'FOLLOWING',
        first: 20,
      },
    },
    result: {
      data: {
        ...mockTimelineData,
        timeline: {
          ...mockTimelineData.timeline,
          timelineType: 'FOLLOWING',
          edges: [mockTimelineData.timeline.edges[0]], // フォロー中は1件のみ
          totalCount: 1,
        },
      },
    },
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe.skip('useTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch timeline data successfully', async () => {
    const { result } = renderHook(() => useTimeline({ type: 'ALL', limit: 20 }), { wrapper });

    // 初期状態
    expect(result.current.loading).toBe(true);
    expect(result.current.posts).toEqual([]);

    // データ取得完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // データが正しく取得されているか確認
    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts[0].content).toBe('Test post 1');
    expect(result.current.posts[1].content).toBe('Test post 2');
    expect(result.current.totalCount).toBe(10);
    expect(result.current.timelineType).toBe('ALL');
    expect(result.current.hasNextPage).toBe(true);
  });

  it('should handle FOLLOWING timeline type', async () => {
    const { result } = renderHook(() => useTimeline({ type: 'FOLLOWING', limit: 20 }), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // フォロー中タイムラインのデータが正しく取得されているか確認
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].content).toBe('Test post 1');
    expect(result.current.totalCount).toBe(1);
    expect(result.current.timelineType).toBe('FOLLOWING');
  });

  it('should handle loading states correctly', async () => {
    const { result } = renderHook(() => useTimeline({ type: 'ALL', limit: 20 }), { wrapper });

    // 初期ローディング状態
    expect(result.current.loading).toBe(true);
    expect(result.current.loadingMore).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loadingMore).toBe(false);
  });

  it('should provide correct action functions', async () => {
    const { result } = renderHook(() => useTimeline({ type: 'ALL', limit: 20 }), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // アクション関数が提供されているか確認
    expect(typeof result.current.loadMore).toBe('function');
    expect(typeof result.current.toggleLike).toBe('function');
    expect(typeof result.current.deletePost).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle error states', async () => {
    const errorMocks = [
      {
        request: {
          query: TimelineDocument,
          variables: {
            type: 'ALL',
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

    const { result } = renderHook(() => useTimeline({ type: 'ALL', limit: 20 }), {
      wrapper: errorWrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.posts).toEqual([]);
  });
});
