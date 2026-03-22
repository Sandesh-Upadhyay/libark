/**
 * 📰 タイムライン管理フック
 *
 * 責任:
 * - TimelineTypeに基づく投稿取得
 * - 無限スクロール対応
 * - キャッシュ最適化
 * - エラーハンドリング
 */

import { useState } from 'react';
import { useApolloClient, useQuery, gql } from '@apollo/client';
import { TimelineType } from '@libark/graphql-client';

import { useToggleLike } from './useToggleLike';

// タイムラインクエリの定義
const TIMELINE_QUERY = gql`
  query Timeline($type: TimelineType!, $first: Int!, $after: String) {
    timeline(type: $type, first: $first, after: $after) {
      edges {
        node {
          id
          content
          visibility
          price
          paidAt
          createdAt
          updatedAt
          isProcessing
          user {
            id
            username
            displayName
            profileImageId
          }
          media {
            id
            filename
            s3Key
            mimeType
            fileSize
            width
            height
            status
            url
            thumbnailUrl
            variants {
              id
              type
              s3Key
              width
              height
              fileSize
              quality
              url
            }
          }
          likesCount
          commentsCount
          isLikedByCurrentUser
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      timelineType
    }
  }
`;

interface TimelineOptions {
  type: TimelineType;
  limit?: number;
}

/**
 * タイムライン管理フック
 */
export const useTimeline = ({ type, limit = 20 }: TimelineOptions) => {
  // 追加読み込み中の状態管理
  const [loadingMore, setLoadingMore] = useState(false);

  // Apollo Clientを取得
  const client = useApolloClient();

  // タイムライン取得（キャッシュ最適化）
  const { data, loading, error, fetchMore, refetch } = useQuery(TIMELINE_QUERY, {
    variables: {
      type,
      first: limit,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
  });

  // 投稿データの取得
  const posts = data?.timeline?.edges?.map((edge: { node: unknown }) => edge.node) || [];
  const hasNextPage = data?.timeline?.pageInfo?.hasNextPage || false;
  const totalCount = data?.timeline?.totalCount || 0;

  // 追加読み込み
  const loadMore = async () => {
    if (!hasNextPage || loadingMore || loading) return;

    const endCursor = data?.timeline?.pageInfo?.endCursor;
    if (!endCursor) return;

    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          after: endCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.timeline) return prev;

          return {
            timeline: {
              ...fetchMoreResult.timeline,
              edges: [...(prev.timeline?.edges || []), ...fetchMoreResult.timeline.edges],
            },
          };
        },
      });
    } catch (err) {
      console.error('タイムライン追加読み込みエラー:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // いいね切り替え（統一フック使用）
  const { toggleLike } = useToggleLike();

  // 投稿削除（既存のusePosts実装を参考）
  const deletePost = async (postId: string) => {
    try {
      const { DeletePostDocument } = await import('@libark/graphql-client');

      await client.mutate({
        mutation: DeletePostDocument,
        variables: { id: postId },
        refetchQueries: [
          {
            query: TIMELINE_QUERY,
            variables: { type, first: limit },
          },
        ],
        awaitRefetchQueries: false,
      });
    } catch (err) {
      console.error('投稿削除エラー:', err);
      throw err;
    }
  };

  return {
    // データ
    posts,
    totalCount,
    timelineType: data?.timeline?.timelineType,

    // 状態
    loading,
    loadingMore,
    error,
    hasNextPage,

    // アクション
    loadMore,
    toggleLike,
    deletePost,
    refetch,
  };
};
