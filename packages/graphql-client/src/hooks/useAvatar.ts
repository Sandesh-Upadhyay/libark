/**
 * 🚀 統一アバターアップロードフック (Phase 3 - 統一システムのみ)
 *
 * 機能:
 * - 新しい統一メディアアップロードシステムを使用
 * - レガシーシステムは完全に削除
 * - 型安全性とエラーハンドリング
 */

import { useState, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';

import {
  DeleteUserAvatarDocument,
  UpdateUserAvatarDocument,
  MediaType,
} from '../generated/graphql';
import { useAuth } from '../auth/AuthProvider.js';
import { OptimisticUpdates } from '../utils/optimisticUpdates';

import { useUploadMedia } from './useUploadMedia';

export interface AvatarConfig {
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (mediaId: string) => void;
  onDeleteComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AvatarUploadResult {
  success: boolean;
  mediaId: string;
  profileImageId?: string;
  downloadUrl: string;
  message: string;
}

export interface AvatarReturn {
  // アップロード関連
  uploadAvatar: (file: File) => Promise<AvatarUploadResult>;
  isUploading: boolean;
  uploadProgress?: number;

  // 削除関連
  deleteAvatar: () => Promise<void>;
  isDeleting: boolean;

  // エラー関連
  error?: string | null;
  clearError: () => void;
}

/**
 * 🚀 アバターアップロードフック
 * Phase 3: 新しい統一システムのみを使用
 */
export function useAvatar(config: AvatarConfig = {}): AvatarReturn {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // 正常に動作している投稿画像システムを使用（プリサインURL方式）
  const {
    uploadMedia,
    isUploading,
    progress: uploadProgress,
    error,
  } = useUploadMedia({
    mediaType: MediaType.Avatar,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onProgress: config.onUploadProgress,
    onError: (errorMessage: string) => {
      const errorObj = new Error(errorMessage);
      config.onError?.(errorObj);
    },
    onSuccess: result => {
      console.log('✅ [UnifiedAvatar] アップロード成功:', result);
      config.onUploadComplete?.(result.mediaId);
    },
  });

  // アバター更新・削除機能
  const [updateUserAvatar] = useMutation(UpdateUserAvatarDocument);
  const [deleteUserAvatar] = useMutation(DeleteUserAvatarDocument);

  /**
   * アバター画像をアップロード
   */
  const uploadAvatar = useCallback(
    async (file: File): Promise<AvatarUploadResult> => {
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      try {
        // 1. ファイルをアップロード
        const result = await uploadMedia(file);

        // 2. ユーザーのprofileImageIdを更新（楽観的更新）
        const { data: updateData } = await updateUserAvatar({
          variables: {
            input: { mediaId: result.mediaId },
          },
          optimisticResponse: {
            updateUserAvatar: {
              __typename: 'UserUpdatePayload',
              success: true,
              message: 'アバター更新中...',
              user: {
                __typename: 'User',
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                bio: user.bio,
                profileImageId: result.mediaId, // 新しいmediaIdで即座に更新
                coverImageId: user.coverImageId,

                isVerified: user.isVerified,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: new Date().toISOString(),
                lastLoginAt: user.lastLoginAt,
              },
            },
          },
          update: (cache, { data }) => {
            if (data?.updateUserAvatar?.success && data.updateUserAvatar.user) {
              // 統一パターンでユーザー情報を更新
              OptimisticUpdates.safe(
                cache,
                OptimisticUpdates.updateUser(user.id, {
                  profileImageId: result.mediaId,
                  updatedAt: new Date().toISOString(),
                }),
                'アバター更新'
              );

              // 2. userByUsernameクエリのキャッシュも更新（安全な方法）
              try {
                const USER_BY_USERNAME_QUERY = gql`
                  query UserByUsername($username: String!) {
                    userByUsername(username: $username) {
                      id
                      username
                      email
                      displayName
                      bio
                      profileImageId
                      coverImageId
                      role
                      isVerified
                      isActive
                      createdAt
                      updatedAt
                      lastLoginAt
                      postsCount
                      followersCount
                      followingCount
                    }
                  }
                `;

                // 既存のキャッシュデータを読み取り
                const existingData = cache.readQuery({
                  query: USER_BY_USERNAME_QUERY,
                  variables: { username: user.username },
                }) as { userByUsername?: Record<string, unknown> } | null;

                // 既存データがある場合のみ更新
                if (existingData?.userByUsername && data.updateUserAvatar.user) {
                  cache.writeQuery({
                    query: USER_BY_USERNAME_QUERY,
                    variables: { username: user.username },
                    data: {
                      userByUsername: {
                        ...existingData.userByUsername,
                        ...data.updateUserAvatar.user,
                        __typename: 'User',
                      },
                    },
                  });
                  console.log('✅ [UnifiedAvatar] userByUsernameキャッシュ更新完了');
                }
              } catch (error) {
                console.warn('userByUsernameキャッシュ更新をスキップ:', error);
              }

              // 3. 投稿リストのユーザー情報も更新
              cache.modify({
                fields: {
                  posts(existingPosts, { readField }) {
                    if (existingPosts?.edges) {
                      return {
                        ...existingPosts,
                        edges: existingPosts.edges.map(
                          (edge: { node: { id: string; user?: { avatar?: string } } }) => {
                            const postUserId = readField('id', readField('user', edge.node));
                            if (postUserId === user.id) {
                              return {
                                ...edge,
                                node: {
                                  ...edge.node,
                                  user: {
                                    ...((readField('user', edge.node) as Record<string, unknown>) ||
                                      {}),
                                    profileImageId: result.mediaId,
                                  },
                                },
                              };
                            }
                            return edge;
                          }
                        ),
                      };
                    }
                    return existingPosts;
                  },
                },
              });
            }
          },
        });

        if (!updateData?.updateUserAvatar?.success) {
          throw new Error(
            updateData?.updateUserAvatar?.message || 'アバター情報の更新に失敗しました'
          );
        }

        console.log('✅ [UnifiedAvatar] アバター更新完了:', {
          mediaId: result.mediaId,
          profileImageId: updateData.updateUserAvatar.user?.profileImageId,
        });

        return {
          success: true,
          mediaId: result.mediaId,
          profileImageId: updateData.updateUserAvatar.user?.profileImageId,
          downloadUrl: result.downloadUrl || '',
          message: 'アバター画像をアップロードしました',
        };
      } catch (error) {
        console.error('❌ [UnifiedAvatar] アップロード失敗:', error);

        throw error;
      }
    },
    [user, uploadMedia, updateUserAvatar, config]
  );

  /**
   * アバター画像を削除
   */
  const deleteAvatar = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setIsDeleting(true);

    try {
      const { data } = await deleteUserAvatar({
        optimisticResponse: {
          deleteUserAvatar: {
            __typename: 'UserUpdatePayload',
            success: true,
            message: 'アバター削除中...',
            user: {
              __typename: 'User',
              id: user.id,
              username: user.username,
              email: user.email,
              displayName: user.displayName,
              bio: user.bio,
              profileImageId: null, // 即座にnullに更新
              coverImageId: user.coverImageId,

              isVerified: user.isVerified,
              isActive: user.isActive,
              createdAt: user.createdAt,
              updatedAt: new Date().toISOString(),
              lastLoginAt: user.lastLoginAt,
            },
          },
        },
        update: (cache, { data }) => {
          if (data?.deleteUserAvatar?.success && data.deleteUserAvatar.user) {
            // 1. meクエリのキャッシュを直接更新
            cache.modify({
              id: cache.identify({ __typename: 'User', id: user.id }),
              fields: {
                profileImageId: () => null,
                updatedAt: () => new Date().toISOString(),
              },
            });

            // 2. userByUsernameクエリのキャッシュも更新（安全な方法）
            try {
              const USER_BY_USERNAME_QUERY = gql`
                query UserByUsername($username: String!) {
                  userByUsername(username: $username) {
                    id
                    username
                    email
                    displayName
                    bio
                    profileImageId
                    coverImageId
                    role
                    isVerified
                    isActive
                    createdAt
                    updatedAt
                    lastLoginAt
                    postsCount
                    followersCount
                    followingCount
                  }
                }
              `;

              // 既存のキャッシュデータを読み取り
              const existingData = cache.readQuery({
                query: USER_BY_USERNAME_QUERY,
                variables: { username: user.username },
              }) as { userByUsername?: Record<string, unknown> } | null;

              // 既存データがある場合のみ更新
              if (existingData?.userByUsername && data.deleteUserAvatar.user) {
                cache.writeQuery({
                  query: USER_BY_USERNAME_QUERY,
                  variables: { username: user.username },
                  data: {
                    userByUsername: {
                      ...existingData.userByUsername,
                      ...data.deleteUserAvatar.user,
                      __typename: 'User',
                    },
                  },
                });
                console.log('✅ [UnifiedAvatar] userByUsernameキャッシュ更新完了（削除）');
              }
            } catch (error) {
              console.warn('userByUsernameキャッシュ更新をスキップ:', error);
            }

            // 3. 投稿リストのユーザー情報も更新
            cache.modify({
              fields: {
                posts(existingPosts, { readField }) {
                  if (existingPosts?.edges) {
                    return {
                      ...existingPosts,
                      edges: existingPosts.edges.map(
                        (edge: { node: { id: string; user?: { avatar?: string } } }) => {
                          const postUserId = readField('id', readField('user', edge.node));
                          if (postUserId === user.id) {
                            return {
                              ...edge,
                              node: {
                                ...edge.node,
                                user: {
                                  ...((readField('user', edge.node) as Record<string, unknown>) ||
                                    {}),
                                  profileImageId: null,
                                },
                              },
                            };
                          }
                          return edge;
                        }
                      ),
                    };
                  }
                  return existingPosts;
                },
              },
            });
          }
        },
      });

      if (!data?.deleteUserAvatar?.success) {
        throw new Error(data?.deleteUserAvatar?.message || 'アバター削除に失敗しました');
      }

      console.log('✅ [UnifiedAvatar] アバター削除成功');
      config.onDeleteComplete?.();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('アバター削除に失敗しました');
      console.error('❌ [UnifiedAvatar] アバター削除失敗:', errorObj);

      // Apollo Clientの楽観的更新が自動的にロールバックするため、追加処理不要

      config.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsDeleting(false);
    }
  }, [user, deleteUserAvatar, config]);

  // エラークリア関数
  const clearError = useCallback(() => {
    // useUploadMediaにはclearError関数がないため、何もしない
    // エラーは次回のアップロード時に自動的にクリアされる
  }, []);

  return {
    // アップロード関連
    uploadAvatar,
    isUploading,
    uploadProgress,

    // 削除関連
    deleteAvatar,
    isDeleting,

    // エラー関連
    error,
    clearError,
  };
}
