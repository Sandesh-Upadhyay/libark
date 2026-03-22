/**
 * 🎯 統一投稿管理フック
 *
 * 大規模リファクタリング版:
 * - GraphQLフラグメント使用
 * - シンプルなキャッシュ戦略
 * - 不要な抽象化レイヤー排除
 * - Apollo Client標準パターン活用
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GetPostsDocument,
  GetMediaPostsDocument,
  GetLikedPostsDocument,
  CreatePostDocument,
  DeletePostDocument,
  useGetPostQuery,
} from '@libark/graphql-client';
import { OptimisticUpdates } from '@libark/graphql-client';

import { toast } from '@/lib/toast';

import { useToggleLike } from './useToggleLike';


// 生成されたクエリを使用（GET_POSTSは削除）

// 生成されたクエリを使用（GET_MEDIA_POSTSは削除）

// 生成されたクエリを使用（手動定義クエリは全て削除）

// 生成されたミューテーションを使用（手動定義は削除）

// 型定義
export interface PostsOptions {
  userId?: string;
  type?: 'all' | 'liked' | 'media';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY';
  limit?: number;
}

export interface PostCreateInput {
  content?: string;
  visibility?: string;
  price?: number;
  mediaIds?: string[];
}

/**
 * 統一投稿管理フック
 *
 * 特徴:
 * - GraphQLフラグメント使用で重複排除
 * - refetchQueriesによるシンプルなキャッシュ更新
 * - 不要なデータ変換を排除
 * - Apollo Client標準パターン
 * - 無限スクロール用のloadingMore状態管理
 */
export const usePosts = ({ userId, type = 'all', visibility, limit = 20 }: PostsOptions = {}) => {
  // 追加読み込み中の状態管理
  const [loadingMore, setLoadingMore] = useState(false);

  // Apollo Clientを取得
  const client = useApolloClient();

  // typeに基づいて適切なクエリを選択
  const getQueryAndVariables = () => {
    switch (type) {
      case 'media':
        return {
          query: GetMediaPostsDocument,
          variables: { first: limit, userId },
          dataKey: 'mediaPosts',
        };
      case 'liked':
        if (!userId) {
          throw new Error('liked posts require userId');
        }
        return {
          query: GetLikedPostsDocument,
          variables: { first: limit, userId },
          dataKey: 'likedPosts',
        };
      default:
        return {
          query: GetPostsDocument,
          variables: { first: limit, userId, visibility },
          dataKey: 'posts',
        };
    }
  };

  const { query, variables, dataKey } = getQueryAndVariables();

  // 投稿一覧取得（キャッシュ最適化）
  const { data, loading, error, fetchMore, refetch } = useQuery(query, {
    variables,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
  });

  // 投稿作成（統一パターンの楽観的更新）
  const [createPostMutation, { loading: creating }] = useMutation(CreatePostDocument, {
    // 統一パターンでキャッシュに即座に追加
    update: (cache, { data }) => {
      if (data?.createPost) {
        const newPost = data.createPost;

        // 投稿一覧に追加（posts, mediaPosts, likedPosts クエリに反映）
        OptimisticUpdates.addPost(newPost)(cache);

        // Timeline にも追加（timeline クエリに反映）
        cache.modify({
          fields: {
            timeline(existingTimeline) {
              if (!existingTimeline?.edges) {
                return {
                  edges: [{ __typename: 'PostEdge', cursor: newPost.id, node: newPost }],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: newPost.id,
                    hasPreviousPage: false,
                    startCursor: newPost.id,
                  },
                  totalCount: 1,
                  timelineType: 'ALL',
                };
              }

              return {
                ...existingTimeline,
                edges: [
                  { __typename: 'PostEdge', cursor: newPost.id, node: newPost },
                  ...existingTimeline.edges,
                ],
                totalCount: (existingTimeline.totalCount || 0) + 1,
              };
            },
          },
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [Optimistic] 投稿作成楽観的更新:', {
            postId: newPost.id,
            isProcessing: newPost.isProcessing,
          });
        }
      }
    },
    onCompleted: data => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 投稿作成完了:', {
          postId: data?.createPost?.id,
          isProcessing: data?.createPost?.isProcessing,
        });
      }
      // 成功時はトーストなし（UX向上）
    },
    onError: error => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Apollo 投稿作成エラー:', error);
      }

      // 機能無効エラーの特別ハンドリング
      if (
        error?.graphQLErrors?.some(
          (e: { extensions?: { code?: string } }) => e.extensions?.code === 'FEATURE_DISABLED'
        )
      ) {
        toast.error('投稿作成機能は現在無効になっています');

        // 機能フラグキャッシュを強制更新
        client.refetchQueries({
          include: ['IsFeatureEnabled'],
        });
      } else {
        const errorMessage = error?.message || '投稿の作成に失敗しました';
        toast.error(errorMessage);
      }
    },
    // 楽観的更新により即座にUIが更新されるため、refetchQueriesは不要
  });

  // いいねトグル（統一フック使用）
  const { toggleLike } = useToggleLike();

  // 投稿削除（確実反映：refetch + 全体リセット）
  const [deletePostMutation, { loading: deleting }] = useMutation(DeletePostDocument, {
    update: (cache, { data }, { variables }) => {
      // 変数/IDが取得できる場合は対象ノードをキャッシュから取り除く
      const deletedId = variables?.id as string | undefined;
      if (deletedId) {
        try {
          cache.evict({ id: cache.identify({ __typename: 'Post', id: deletedId }) });
        } catch {}
      }
      // 一覧クエリのページ単位の削除反映（軽量）
      try {
        const key = dataKey as string;
        cache.modify({
          fields: {
            [key]: (existing: unknown) => {
              const existingData = existing as {
                edges: Array<{ node?: { id: string } }>;
                totalCount: number | unknown;
              };
              if (!existingData) return existingData;
              const edges = existingData.edges.filter(e => e?.node?.id !== deletedId);
              const totalCount =
                typeof existingData.totalCount === 'number'
                  ? Math.max(0, existingData.totalCount - 1)
                  : existingData.totalCount;
              return { ...existingData, edges, totalCount };
            },
          },
        });
      } catch {}
    },
    onCompleted: async () => {
      try {
        // 精密な refetch のみに限定
        await client.refetchQueries({ include: ['GetPosts', 'GetMediaPosts', 'GetLikedPosts'] });
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.warn('refetchQueries 失敗', e);
      }
    },
    awaitRefetchQueries: false,
    onError: error => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Apollo 投稿削除エラー:', error);
      }
      const errorMessage = error?.message || '投稿の削除に失敗しました';
      toast.error(errorMessage);
    },
  });

  // データ取得（不要な変換を排除）
  const posts =
    data?.[dataKey]?.edges?.map(
      ({ node }: { node: import('@libark/graphql-client').PostInfoFragment }) => node
    ) || [];
  const hasNextPage = data?.[dataKey]?.pageInfo?.hasNextPage || false;

  // アクション関数
  const createPost = async (input: PostCreateInput) => {
    // priceの正規化（最後の砦）：PAID時はnumber、PAID以外はundefined
    const normalizedInput: PostCreateInput = { ...input };

    if (input.visibility !== 'PAID') {
      // PAID以外はpriceを削除
      delete normalizedInput.price;
    } else {
      // PAID時はpriceをnumberに正規化
      if (typeof input.price === 'string') {
        const parsed = parseFloat(input.price);
        if (!isNaN(parsed) && parsed > 0) {
          normalizedInput.price = parsed;
        } else {
          // NaNや無効な値の場合はundefined（バリデーションエラーになるはず）
          delete normalizedInput.price;
        }
      } else if (typeof input.price === 'number' && (isNaN(input.price) || input.price <= 0)) {
        // 無効なnumberの場合は削除
        delete normalizedInput.price;
      }
    }

    return createPostMutation({ variables: { input: normalizedInput } });
  };

  const deletePost = async (id: string) => {
    return deletePostMutation({ variables: { id } });
  };

  const loadMore = async () => {
    if (hasNextPage && !loading && !loadingMore) {
      setLoadingMore(true);
      try {
        const result = await fetchMore({
          variables: {
            ...variables,
            after: data?.[dataKey]?.pageInfo?.endCursor,
          } as Record<string, unknown>,
        });
        return result;
      } catch (error) {
        console.error('追加読み込みエラー:', error);
        throw error;
      } finally {
        setLoadingMore(false);
      }
    }
  };

  return {
    // データ
    posts,

    // 状態
    loading,
    loadingMore,
    creating,
    deleting,
    error,
    hasNextPage,

    // アクション
    createPost,
    toggleLike,
    deletePost,
    loadMore,
    refetch,
  };
};

/**
 * 投稿詳細取得フック
 */
export const usePost = (postId: string) => {
  const { data, loading, error, refetch } = useGetPostQuery({
    variables: { id: postId },
    skip: !postId,
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  return {
    post: data?.post,
    loading,
    error,
    refetch,
  };
};
