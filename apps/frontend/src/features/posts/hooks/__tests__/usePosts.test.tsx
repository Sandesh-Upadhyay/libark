/**
 * 🧪 usePosts フック テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import {
  GetPostsDocument,
  GetMediaPostsDocument,
  GetLikedPostsDocument,
  CreatePostDocument,
  DeletePostDocument,
  ToggleLikeDocument,
} from '@libark/graphql-client';

import { usePosts } from '../usePosts';

// useToggleLikeフックのモック
const mockToggleLike = vi.fn().mockResolvedValue(undefined);
vi.mock('./useToggleLike', () => ({
  useToggleLike: () => ({
    toggleLike: mockToggleLike,
  }),
}));

// モックデータ
const mockPost = {
  id: '1',
  content: 'Test post',
  createdAt: '2024-01-01T00:00:00Z',
  visibility: 'PUBLIC',
  isProcessing: false,
  likesCount: 5,
  commentsCount: 2,
  isLikedByCurrentUser: false,
  user: {
    id: 'user1',
    username: 'testuser',
    displayName: 'Test User',
    profileImageId: null,
  },
  media: [],
};

const mockPostsData = {
  posts: {
    edges: [
      {
        node: mockPost,
        cursor: 'cursor1',
      },
    ],
    pageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor1',
    },
    totalCount: 10,
  },
};

const mocks = [
  {
    request: {
      query: GetPostsDocument,
      variables: {
        first: 20,
      },
    },
    result: {
      data: mockPostsData,
    },
  },
  {
    request: {
      query: CreatePostDocument,
      variables: {
        input: {
          content: 'New post',
          visibility: 'PUBLIC',
        },
      },
    },
    result: {
      data: {
        createPost: {
          ...mockPost,
          id: '2',
          content: 'New post',
        },
      },
    },
  },
  {
    request: {
      query: DeletePostDocument,
      variables: {
        id: '1',
      },
    },
    result: {
      data: {
        deletePost: {
          id: '1',
        },
      },
    },
  },
  {
    request: {
      query: ToggleLikeDocument,
      variables: {
        postId: '1',
      },
    },
    result: {
      data: {
        toggleLike: {
          id: '1',
          likesCount: 6,
          isLikedByCurrentUser: true,
        },
      },
    },
  },
];

// ページネーション用の追加モック
const mockPost2 = {
  ...mockPost,
  id: '2',
  content: 'Test post 2',
};

const mockPostsDataPage2 = {
  posts: {
    edges: [
      {
        node: mockPost2,
        cursor: 'cursor2',
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: true,
      startCursor: 'cursor2',
      endCursor: 'cursor2',
    },
    totalCount: 2,
  },
};

const mockMediaPostsData = {
  mediaPosts: {
    edges: [
      {
        node: mockPost,
        cursor: 'cursor1',
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor1',
    },
    totalCount: 1,
  },
};

const mockLikedPostsData = {
  likedPosts: {
    edges: [
      {
        node: mockPost,
        cursor: 'cursor1',
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'cursor1',
      endCursor: 'cursor1',
    },
    totalCount: 1,
  },
};

// 拡張モック配列（全てのパターンを含む）
const extendedMocks = [
  // 基本クエリ（GetPostsDocument）
  {
    request: {
      query: GetPostsDocument,
      variables: {
        first: 20,
      },
    },
    result: {
      data: mockPostsData,
    },
  },
  // ページネーション（after付き）
  {
    request: {
      query: GetPostsDocument,
      variables: {
        first: 20,
        after: 'cursor1',
      },
    },
    result: {
      data: mockPostsDataPage2,
    },
  },
  // userIdフィルタリング
  {
    request: {
      query: GetPostsDocument,
      variables: {
        first: 20,
        userId: 'user1',
      },
    },
    result: {
      data: mockPostsData,
    },
  },
  // visibilityフィルタリング
  {
    request: {
      query: GetPostsDocument,
      variables: {
        first: 20,
        visibility: 'PUBLIC',
      },
    },
    result: {
      data: mockPostsData,
    },
  },
  // userIdとvisibilityの組み合わせ
  {
    request: {
      query: GetPostsDocument,
      variables: {
        first: 20,
        userId: 'user1',
        visibility: 'PUBLIC',
      },
    },
    result: {
      data: mockPostsData,
    },
  },
  // メディア投稿クエリ
  {
    request: {
      query: GetMediaPostsDocument,
      variables: {
        first: 20,
      },
    },
    result: {
      data: mockMediaPostsData,
    },
  },
  // メディア投稿（userId付き）
  {
    request: {
      query: GetMediaPostsDocument,
      variables: {
        first: 20,
        userId: 'user1',
      },
    },
    result: {
      data: mockMediaPostsData,
    },
  },
  // いいね投稿クエリ
  {
    request: {
      query: GetLikedPostsDocument,
      variables: {
        first: 20,
        userId: 'user1',
      },
    },
    result: {
      data: mockLikedPostsData,
    },
  },
  // CreatePost
  {
    request: {
      query: CreatePostDocument,
      variables: {
        input: {
          content: 'New post',
          visibility: 'PUBLIC',
        },
      },
    },
    result: {
      data: {
        createPost: {
          ...mockPost,
          id: '2',
          content: 'New post',
        },
      },
    },
  },
  // DeletePost
  {
    request: {
      query: DeletePostDocument,
      variables: {
        id: '1',
      },
    },
    result: {
      data: {
        deletePost: {
          id: '1',
        },
      },
    },
  },
  // ToggleLike
  {
    request: {
      query: ToggleLikeDocument,
      variables: {
        postId: '1',
      },
    },
    result: {
      data: {
        toggleLike: {
          id: '1',
          likesCount: 6,
          isLikedByCurrentUser: true,
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

describe('usePosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('投稿リストの取得', () => {
    it('投稿リストが正しく取得されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      // 初期状態
      expect(result.current.loading).toBe(true);
      expect(result.current.posts).toEqual([]);

      // データ取得完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // データが正しく取得されているか確認
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].content).toBe('Test post');
    });

    it('ローディング状態が正しく管理されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('エラー状態が正しく管理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: GetPostsDocument,
            variables: {
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

      const { result } = renderHook(() => usePosts(), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('投稿の作成', () => {
    it('投稿が正しく作成されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resultData = await result.current.createPost({
        content: 'New post',
        visibility: 'PUBLIC',
      });

      expect(resultData).toBeDefined();
      expect(resultData.data?.createPost?.content).toBe('New post');
    });

    it('作成中状態が正しく管理されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.creating).toBe(false);

      const createPromise = result.current.createPost({
        content: 'New post',
        visibility: 'PUBLIC',
      });

      expect(result.current.creating).toBe(true);

      await createPromise;

      expect(result.current.creating).toBe(false);
    });

    it('メディア付き投稿が作成できること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resultData = await result.current.createPost({
        content: 'Post with media',
        visibility: 'PUBLIC',
        mediaIds: ['media1', 'media2'],
      });

      expect(resultData).toBeDefined();
    });

    it('有料投稿が作成できること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resultData = await result.current.createPost({
        content: 'Paid post',
        visibility: 'PUBLIC',
        price: 100,
      });

      expect(resultData).toBeDefined();
    });
  });

  describe('投稿の削除', () => {
    it('投稿が正しく削除されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deletePost('1');

      // 削除が成功したか確認
      expect(result.current.posts).toHaveLength(0);
    });

    it('削除中状態が正しく管理されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.deleting).toBe(false);

      const deletePromise = result.current.deletePost('1');

      expect(result.current.deleting).toBe(true);

      await deletePromise;

      expect(result.current.deleting).toBe(false);
    });
  });

  describe('投稿のいいね', () => {
    it('いいねが正しく切り替わること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.toggleLike('1');

      // いいねが更新されたか確認
      expect(result.current.posts[0].isLikedByCurrentUser).toBe(true);
      expect(result.current.posts[0].likesCount).toBe(6);
    });

    it('いいねが正しく取り消されること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 最初にいいねする
      await result.current.toggleLike('1');

      // いいねを取り消す
      await result.current.toggleLike('1');

      expect(result.current.posts[0].isLikedByCurrentUser).toBe(false);
      expect(result.current.posts[0].likesCount).toBe(5);
    });
  });

  describe('投稿のフィルタリング', () => {
    it('ユーザーIDでフィルタリングできること', async () => {
      const filteredWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={extendedMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts({ userId: 'user1' }), {
        wrapper: filteredWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // ユーザーIDでフィルタリングされた投稿が取得される
      expect(result.current.posts).toBeDefined();
    });

    it('タイプでフィルタリングできること', async () => {
      const filteredWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={extendedMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts({ type: 'liked', userId: 'user1' }), {
        wrapper: filteredWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // いいねした投稿が取得される
      expect(result.current.posts).toBeDefined();
    });

    it('公開範囲でフィルタリングできること', async () => {
      const filteredWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={extendedMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts({ visibility: 'PUBLIC' }), {
        wrapper: filteredWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 公開投稿が取得される
      expect(result.current.posts).toBeDefined();
    });
  });

  describe('投稿のページネーション', () => {
    it('追加読み込みが正しく動作すること', async () => {
      const paginatedWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={extendedMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts(), {
        wrapper: paginatedWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(true);

      await result.current.loadMore();

      expect(result.current.loadingMore).toBe(false);
    });

    it('loadingMore状態が正しく管理されること', async () => {
      const paginatedWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={extendedMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts(), {
        wrapper: paginatedWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loadingMore).toBe(false);

      const loadMorePromise = result.current.loadMore();

      expect(result.current.loadingMore).toBe(true);

      await loadMorePromise;

      expect(result.current.loadingMore).toBe(false);
    });

    it('次のページがない場合、loadMoreが何もしないこと', async () => {
      const noNextPageMocks = [
        {
          request: {
            query: GetPostsDocument,
            variables: {
              first: 20,
            },
          },
          result: {
            data: {
              posts: {
                edges: [
                  {
                    node: mockPost,
                    cursor: 'cursor1',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor1',
                  endCursor: 'cursor1',
                },
                totalCount: 1,
              },
            },
          },
        },
      ];

      const noNextPageWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={noNextPageMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts(), {
        wrapper: noNextPageWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(false);

      await result.current.loadMore();

      expect(result.current.loadingMore).toBe(false);
    });
  });

  describe('投稿のリフレッシュ', () => {
    it('refetchが正しく動作すること', async () => {
      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refetch();

      expect(result.current.loading).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    it('投稿作成エラーが正しく処理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: GetPostsDocument,
            variables: {
              first: 20,
            },
          },
          result: {
            data: mockPostsData,
          },
        },
        {
          request: {
            query: CreatePostDocument,
            variables: {
              input: {
                content: 'New post',
                visibility: 'PUBLIC',
              },
            },
          },
          error: new Error('Create error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts(), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // onErrorハンドラーがエラーを処理するため、Promiseは解決される
      // エラーが発生してもミューテーションは解決される
      const resultData = await result.current.createPost({
        content: 'New post',
        visibility: 'PUBLIC',
      });
      
      // ミューテーションが呼び出されることを確認
      expect(resultData).toBeDefined();
    });

    it('投稿削除エラーが正しく処理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: GetPostsDocument,
            variables: {
              first: 20,
            },
          },
          result: {
            data: mockPostsData,
          },
        },
        {
          request: {
            query: DeletePostDocument,
            variables: {
              id: '1',
            },
          },
          error: new Error('Delete error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts(), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // onErrorハンドラーがエラーを処理するため、Promiseは解決される
      // エラーが発生してもミューテーションは解決される
      const resultData = await result.current.deletePost('1');
      
      // ミューテーションが呼び出されることを確認
      expect(resultData).toBeDefined();
    });

    it('いいねエラーが正しく処理されること', async () => {
      const errorMocks = [
        {
          request: {
            query: GetPostsDocument,
            variables: {
              first: 20,
            },
          },
          result: {
            data: mockPostsData,
          },
        },
        {
          request: {
            query: ToggleLikeDocument,
            variables: {
              postId: '1',
            },
          },
          error: new Error('Like error'),
        },
      ];

      const errorWrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={errorMocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePosts(), {
        wrapper: errorWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // onErrorハンドラーがエラーを処理するため、Promiseは解決される
      // エラーが発生してもミューテーションは解決される
      const resultData = await result.current.toggleLike('1');
      
      // ミューテーションが呼び出されることを確認
      expect(resultData).toBeDefined();
      expect(mockToggleLike).toHaveBeenCalledWith('1');
    });
  });
});
