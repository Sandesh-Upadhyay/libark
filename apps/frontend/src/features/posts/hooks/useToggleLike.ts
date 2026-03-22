/**
 * 投稿いいねトグルフック (Feature-specific)
 *
 * Timeline / Posts のいいね処理を統一し、楽観的更新（即時反映）を正しく実装する
 */

'use client';

import { useMutation, useApolloClient, gql } from '@apollo/client';

/**
 * 投稿フラグメントの型定義
 */
interface PostFragment {
  id: string;
  likesCount: number | null;
  isLikedByCurrentUser: boolean | null;
  __typename?: string;
}

/**
 * 投稿いいねトグルフック
 *
 * - optimisticResponse: キャッシュから現在値を読み取り、即時反映
 * - update: サーバーからの確定値をキャッシュに書き込み
 */
export const useToggleLike = () => {
  const client = useApolloClient();

  const [toggleLikeMutation] = useMutation(gql`
    mutation ToggleLike($postId: UUID!) {
      toggleLike(postId: $postId) {
        id
        likesCount
        isLikedByCurrentUser
      }
    }
  `);

  const toggleLike = (postId: string) => {
    // キャッシュから現在のPostを読み取る
    const post = client.cache.readFragment<PostFragment>({
      id: client.cache.identify({
        __typename: 'Post',
        id: postId,
      }),
      fragment: gql`
        fragment PostLikeFields on Post {
          id
          likesCount
          isLikedByCurrentUser
        }
      `,
    });

    // キャッシュにPostがない場合は楽観更新しない（安全側）
    if (!post) {
      return toggleLikeMutation({
        variables: { postId },
      });
    }

    // likesCountがnullの場合は0として扱う
    const currentLikesCount = post.likesCount ?? 0;
    // isLikedByCurrentUserがnullの場合はfalseとして扱う（未いいね状態）
    const currentIsLiked = post.isLikedByCurrentUser ?? false;

    return toggleLikeMutation({
      variables: { postId },
      optimisticResponse: {
        toggleLike: {
          __typename: 'Post',
          id: postId,
          likesCount: currentIsLiked ? currentLikesCount - 1 : currentLikesCount + 1,
          isLikedByCurrentUser: !currentIsLiked,
        },
      },
      update: (cache, { data }) => {
        if (!data?.toggleLike) return;

        // 確定値をキャッシュに書き込む
        cache.writeFragment({
          id: cache.identify({
            __typename: 'Post',
            id: data.toggleLike.id,
          }),
          fragment: gql`
            fragment PostLikeFields on Post {
              id
              likesCount
              isLikedByCurrentUser
            }
          `,
          data: {
            likesCount: data.toggleLike.likesCount,
            isLikedByCurrentUser: data.toggleLike.isLikedByCurrentUser,
          },
        });
      },
    });
  };

  return { toggleLike };
};
