/**
 * コメントいいねトグルフック (Feature-specific)
 *
 * 投稿いいねと同じパターン
 * 投稿機能固有のフック
 */

'use client';

import { useToggleCommentLikeMutation } from '@libark/graphql-client';

import { toast } from '@/lib/toast';

/**
 * コメントいいねトグルフック - 投稿いいねと同じパターン
 */
export const useToggleCommentLike = () => {
  const [toggleCommentLike, { loading, error }] = useToggleCommentLikeMutation({
    // 楽観的更新でキャッシュを即座に更新
    update: (cache, { data }, { variables }) => {
      if (data?.toggleCommentLike && variables?.commentId) {
        const commentId = variables.commentId;
        const updatedComment = data.toggleCommentLike;

        try {
          // コメントキャッシュを更新
          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fields: {
              likesCount() {
                return updatedComment.likesCount;
              },
              isLikedByCurrentUser() {
                return updatedComment.isLikedByCurrentUser;
              },
            },
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [Optimistic] コメントいいね楽観的更新:', {
              commentId,
              likesCount: updatedComment.likesCount,
              isLiked: updatedComment.isLikedByCurrentUser,
            });
          }
        } catch (cacheError) {
          console.warn('⚠️ コメントいいね楽観的更新エラー:', cacheError);
        }
      }
    },
    onCompleted: data => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ コメントいいねトグル完了:', {
          commentId: data?.toggleCommentLike?.id,
          likesCount: data?.toggleCommentLike?.likesCount,
          isLiked: data?.toggleCommentLike?.isLikedByCurrentUser,
        });
      }
      // 投稿いいねと同じパターン：成功時はトーストなし（UX向上）
    },
    onError: error => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Apollo コメントいいねエラー:', error);
      }
      const errorMessage = error?.message || 'いいねの処理に失敗しました';
      toast.error(errorMessage);
    },
  });

  return {
    toggleCommentLike,
    isLoading: loading,
    error,
  };
};
