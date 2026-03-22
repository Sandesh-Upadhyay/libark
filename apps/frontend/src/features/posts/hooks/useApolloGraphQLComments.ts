/**
 * 🎯 Apollo Client統一コメント管理フック (Feature-specific)
 *
 * GraphQLベースのコメント機能実装
 * キャッシュ統一によるリアルタイム更新対応
 * 投稿機能固有のフック
 */

'use client';

import { gql } from '@apollo/client';
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  type CreateCommentMutation,
  type CreateCommentMutationVariables,
} from '@libark/graphql-client';
import { OptimisticUpdates } from '@libark/graphql-client';

// createOptimisticUpdater は削除時のみ使用
import { toast } from '@/lib/toast';

// CommentCreateInput型はGraphQL生成型を使用

/**
 * 🎯 Apollo Client純粋コメント一覧フック
 */
export const useApolloGraphQLComments = (postId: string) => {
  const { data, loading, error, refetch, networkStatus } = useCommentsQuery({
    variables: {
      postId,
      first: 50,
    },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
    errorPolicy: 'all',
    skip: !postId,
  });

  // Apollo Clientネイティブなデータ形式で返す
  const comments = data?.comments || [];

  return {
    data: comments,
    isLoading: loading,
    error,
    refetch,
    networkStatus,
  };
};

/**
 * Apollo Clientコメント作成フック - 投稿と同じパターン（楽観的更新）
 */
export const useApolloGraphQLCreateComment = () => {
  const [createComment, { loading, error }] = useCreateCommentMutation({
    // 統一パターン：楽観的更新でキャッシュに即座追加
    update: (cache, result, options) => {
      const { data } = result;
      const { variables } = options;
      if (data?.createComment && variables?.input?.postId) {
        const newComment = data.createComment;
        const postId = variables.input.postId;

        // キャッシュに即座追加（投稿パターンと統一）
        OptimisticUpdates.addComment(newComment, postId)(cache);

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [Optimistic] コメントをキャッシュに即座追加:', {
            commentId: newComment.id,
            postId,
          });
        }
      }
    },
    onCompleted: (data: CreateCommentMutation) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ コメント作成完了:', {
          commentId: data?.createComment?.id,
        });
      }
      toast.success('コメントを投稿しました');
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Apollo コメント作成エラー:', error);
      }
      const errorMessage = error?.message || 'コメントの作成に失敗しました';
      toast.error(errorMessage);
    },
  });

  return {
    mutate: (input: CreateCommentMutationVariables['input']) =>
      createComment({ variables: { input } }),
    mutateAsync: (input: CreateCommentMutationVariables['input']) =>
      createComment({ variables: { input } }),
    isPending: loading,
    error,
  };
};

/**
 * Apollo Clientコメント削除フック - 投稿パターンに統一
 */
export const useApolloGraphQLDeleteComment = () => {
  const [deleteComment, { loading, error }] = useDeleteCommentMutation({
    update: (cache, result, options) => {
      const { data } = result;
      const { variables } = options;
      if (data?.deleteComment && variables?.id) {
        const commentId = variables.id;

        // 投稿IDを取得（可能な場合）
        let postId: string | null = null;
        try {
          const commentData = cache.readFragment({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fragment: gql`
              fragment CommentPost on Comment {
                post {
                  id
                }
              }
            `,
          });
          postId = (commentData as { post?: { id: string } })?.post?.id || null;
        } catch {
          // フラグメント読み取りエラーは無視
        }

        // 統一パターンでコメント削除
        OptimisticUpdates.removeComment(commentId, postId || undefined)(cache);

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ コメント削除楽観的更新完了:', { commentId, postId });
        }
      }
    },
    onCompleted: () => {
      console.log('✅ コメント削除完了');
      toast.success('コメントを削除しました');
    },
    onError: (error: Error) => {
      console.error('❌ コメント削除エラー:', error);
      const errorMessage = error?.message || 'コメントの削除に失敗しました';
      toast.error(errorMessage);
    },
  });

  return {
    mutate: (id: string) => deleteComment({ variables: { id } }),
    mutateAsync: (id: string) => deleteComment({ variables: { id } }),
    isPending: loading,
    error,
  };
};
