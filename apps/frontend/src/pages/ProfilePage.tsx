import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, type User } from '@libark/graphql-client';
import { gql, useMutation, useQuery, type ApolloCache } from '@apollo/client';

import { toast } from '@/lib/toast';
import { ProfileHeader, ProfileEditModal } from '@/features/profile/components/organisms';
import { ProfileTabs } from '@/features/profile/components/molecules/ProfileTabs';
import { useUserByUsername } from '@/features/profile/hooks';
import { Button, Alert, AlertDescription } from '@/components/atoms';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';

// GraphQLクエリとミューテーション
const IS_FOLLOWING_QUERY = gql`
  query IsFollowing($userId: UUID!) {
    isFollowing(userId: $userId)
  }
`;

const FOLLOW_USER_MUTATION = gql`
  mutation FollowUser($userId: UUID!) {
    followUser(userId: $userId) {
      success
      message
    }
  }
`;

const UNFOLLOW_USER_MUTATION = gql`
  mutation UnfollowUser($userId: UUID!) {
    unfollowUser(userId: $userId) {
      success
      message
    }
  }
`;

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: ProfileUpdateInput!) {
    updateProfile(input: $input) {
      id
      username
      displayName
      bio
      profileImageId
      coverImageId
    }
  }
`;

// タイムラインクエリ（キャッシュ更新用）
const TIMELINE_QUERY = gql`
  query Timeline($type: TimelineType!, $first: Int!, $after: String) {
    timeline(type: $type, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          visibility
          isProcessing
          likesCount
          commentsCount
          user {
            id
            username
            displayName
            profileImageId
            isVerified
          }
          media {
            id
            url
            thumbnailUrl
            mimeType
            width
            height
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
      timelineType
    }
  }
`;

/**
 * useParamsの戻り値を型安全に取得するヘルパー関数
 */
function getStringParam(param: string | string[] | undefined): string | null {
  if (typeof param === 'string') {
    return param;
  }
  return null;
}

const ProfilePage: React.FC = () => {
  const params = useParams();
  const username = getStringParam(params.username);
  const navigate = useNavigate();
  const { user: _user } = useAuth() as { user: User | null };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 🎯 自分のプロフィールかどうかを判定
  const isOwnProfile = _user?.username === username;

  // 🔑 自分のプロフィールの場合はmeクエリを使用、他人の場合のみuserByUsernameクエリを使用
  const {
    data,
    loading: isLoading,
    error,
  } = useUserByUsername(username || '', {
    skip: isOwnProfile, // 自分のプロフィールの場合はクエリをスキップ
  });

  // フォロー状態を取得
  const { data: followData, refetch: _refetchFollowStatus } = useQuery(IS_FOLLOWING_QUERY, {
    variables: { userId: data?.userByUsername?.id },
    skip: !data?.userByUsername?.id || isOwnProfile || !_user,
  });

  const isFollowing = followData?.isFollowing || false;

  // フォロー専用Toastシステム（削除済み - 直接toastを使用）

  // プロフィール更新ミューテーション
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);

  // フォローミューテーション
  const [followUser] = useMutation(FOLLOW_USER_MUTATION, {
    optimisticResponse: {
      followUser: {
        __typename: 'FollowPayload',
        success: true,
        message: 'FOLLOW_SUCCESS',
        follow: {
          __typename: 'Follow',
          id: 'temp-follow-id',
          createdAt: new Date().toISOString(),
        },
      },
    },
    refetchQueries: [
      {
        query: TIMELINE_QUERY,
        variables: { type: 'FOLLOWING', first: 20 },
      },
    ],
    awaitRefetchQueries: true,
    update: (
      cache: ApolloCache<unknown>,
      { data }: { data?: { followUser?: { success?: boolean } } },
      { variables }: { variables?: { userId?: string } }
    ) => {
      if (data?.followUser?.success && variables?.userId) {
        // フォロー状態クエリのキャッシュを更新
        cache.writeQuery({
          query: IS_FOLLOWING_QUERY,
          variables: { userId: variables.userId },
          data: { isFollowing: true },
        });

        // ユーザーのフォロワー数を楽観的に更新
        cache.modify({
          id: cache.identify({ __typename: 'User', id: variables.userId }),
          fields: {
            followersCount(existingCount = 0) {
              return existingCount + 1;
            },
          },
        });
      }
    },
    onCompleted: data => {
      if (data.followUser.success) {
        toast.success('フォローしました');
      } else {
        toast.error('フォローに失敗しました');
      }
    },
    onError: error => {
      console.error('Follow error:', error);
      toast.error('フォローに失敗しました');
    },
  });

  // アンフォローミューテーション
  const [unfollowUser] = useMutation(UNFOLLOW_USER_MUTATION, {
    optimisticResponse: {
      unfollowUser: {
        __typename: 'UnfollowPayload',
        success: true,
        message: 'UNFOLLOW_SUCCESS',
      },
    },
    refetchQueries: [
      {
        query: TIMELINE_QUERY,
        variables: { type: 'FOLLOWING', first: 20 },
      },
    ],
    awaitRefetchQueries: true,
    update: (
      cache: ApolloCache<unknown>,
      { data }: { data?: { unfollowUser?: { success?: boolean } } },
      { variables }: { variables?: { userId?: string } }
    ) => {
      if (data?.unfollowUser?.success && variables?.userId) {
        // フォロー状態クエリのキャッシュを更新
        cache.writeQuery({
          query: IS_FOLLOWING_QUERY,
          variables: { userId: variables.userId },
          data: { isFollowing: false },
        });

        // ユーザーのフォロワー数を楽観的に更新
        cache.modify({
          id: cache.identify({ __typename: 'User', id: variables.userId }),
          fields: {
            followersCount(existingCount = 0) {
              return Math.max(0, existingCount - 1);
            },
          },
        });
      }
    },
    onCompleted: data => {
      if (data.unfollowUser.success) {
        toast.success('フォローを解除しました');
      } else {
        toast.error('フォロー解除に失敗しました');
      }
    },
    onError: error => {
      console.error('Unfollow error:', error);
      toast.error('フォロー解除に失敗しました');
    },
  });

  // プロフィール編集モーダル処理
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const _handleProfileUpdate = async (profileData: { displayName: string; bio?: string }) => {
    try {
      const result = await updateProfile({
        variables: {
          input: {
            displayName: profileData.displayName,
            bio: profileData.bio || '',
          },
        },
      });

      if (result.data?.updateProfile) {
        toast.success('プロフィールを更新しました');
        // キャッシュを更新してUIに反映
        // Apollo Clientが自動的にキャッシュを更新する
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error; // ProfileEditModalでエラーハンドリング
    }
  };

  // フォロー/アンフォロー処理
  const handleFollowToggle = async () => {
    if (!_user || !data?.userByUsername?.id) {
      toast.warning('ログインが必要です');
      return;
    }

    try {
      if (isFollowing) {
        await unfollowUser({ variables: { userId: data.userByUsername.id } });
      } else {
        await followUser({ variables: { userId: data.userByUsername.id } });
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    }
  };

  // usernameが取得できない場合の早期リターン
  if (!username) {
    return (
      <div className='px-4 py-6'>
        <div className='flex flex-col items-center justify-center min-h-[50vh]'>
          <Alert>
            <AlertDescription>無効なプロフィールURLです。</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // 🎯 プロフィールデータの取得: 自分の場合はmeクエリ、他人の場合はuserByUsernameクエリ
  const profile = isOwnProfile ? _user : data?.userByUsername;

  // 統計項目クリック処理
  const handleStatsClick = (type: 'followers' | 'following') => {
    // TODO: 統計詳細ページへの遷移を実装
    console.log(`${type} clicked`);
  };

  // 戻るボタンのハンドラー
  const handleBackClick = () => {
    navigate(-1); // ブラウザの戻る機能を使用
  };

  // ローディング中
  if (isLoading) {
    return (
      <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
        <div className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-muted-foreground'>読み込み中...</p>
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  // エラーまたはユーザーが見つからない場合
  if (error || !profile) {
    return (
      <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold'>プロフィール</h1>
            <Button onClick={() => navigate('/home')} variant='outline'>
              ホームに戻る
            </Button>
          </div>
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <p className='text-destructive mb-2'>
                {error?.message || 'ユーザーが見つかりませんでした。'}
              </p>
              <p className='text-muted-foreground'>
                指定されたユーザーは存在しないか、削除された可能性があります。
              </p>
            </div>
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  return (
    <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
      <div>
        {/* X風プロフィールヘッダー */}
        <Header
          title={profile.displayName || profile.username}
          subtitle={`${profile.postsCount || 0}件のポスト`}
          showBackButton={true}
          onBackClick={handleBackClick}
          backButtonLabel='戻る'
          variant='x-style'
          headingLevel='h2'
          showBorder={true}
        />

        {/* プロフィールヘッダー */}
        <ProfileHeader
          profile={profile}
          isFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          onFollowToggle={handleFollowToggle}
          onEditProfile={handleEditProfile}
          onStatsClick={handleStatsClick}
        />

        {/* プロフィールタブ */}
        <div className='mt-4'>
          <ProfileTabs profile={profile} defaultTab='posts' />
        </div>

        {/* プロフィール編集モーダル */}
        {isOwnProfile && (
          <ProfileEditModal
            open={isEditModalOpen}
            onClose={handleCloseEditModal}
            user={profile}
            onSuccess={() => {
              setIsEditModalOpen(false);
            }}
          />
        )}
      </div>
    </PageLayoutTemplate>
  );
};

export default ProfilePage;
