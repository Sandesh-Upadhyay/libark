/**
 * 🚀 統一カバー画像アップロードフック
 *
 * 機能:
 * - 新しい統一メディアアップロードシステムを使用
 * - アバターアップロードロジックと統合
 * - 型安全性とエラーハンドリング
 */

import { useState, useCallback } from 'react';
import { useMutation, ApolloCache } from '@apollo/client';

import {
  UpdateUserCoverDocument,
  DeleteUserCoverDocument,
  type UserInfoFragment,
  MediaType,
} from '../generated/graphql';
import { useAuth } from '../auth/AuthProvider.js';
import { OptimisticUpdates } from '../utils/optimisticUpdates';

import { useUploadMedia } from './useUploadMedia';

// 生成されたクエリを使用（手動定義は削除）

// GraphQL生成型を使用

export interface CoverConfig {
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (mediaId: string) => void;
  onDeleteComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface CoverUploadResult {
  success: boolean;
  mediaId: string;
  coverImageId?: string;
  downloadUrl?: string; // optional型に変更
  message: string;
}

export interface CoverReturn {
  // アップロード関連
  uploadCover: (file: File) => Promise<CoverUploadResult>;
  isUploading: boolean;
  uploadProgress?: number;

  // 削除関連
  deleteCover: () => Promise<void>;
  isDeleting: boolean;

  // エラー関連
  error?: string | null;
}

// 🎯 共通キャッシュ更新関数
function updateUserCoverCache(
  cache: ApolloCache<unknown>,
  user: UserInfoFragment,
  newCoverImageId: string | null
) {
  // 統一パターンでユーザー情報を更新
  OptimisticUpdates.safe(
    cache,
    OptimisticUpdates.updateUser(user.id, {
      coverImageId: newCoverImageId,
      updatedAt: new Date().toISOString(),
    }),
    'カバー画像更新'
  );

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [UnifiedCover] 統一パターンでキャッシュ更新完了');
  }

  // 統一パターンで全てのユーザー関連キャッシュを更新
}

/**
 * 🚀 カバー画像アップロードフック
 */
export function useCover(config: CoverConfig = {}): CoverReturn {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // カバー画像用のメディアアップロード
  const {
    uploadMedia,
    isUploading,
    progress: uploadProgress,
    error,
  } = useUploadMedia({
    mediaType: MediaType.Cover,
    maxFileSize: 10 * 1024 * 1024, // 10MB（カバー画像は大きめ）
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onProgress: config.onUploadProgress,
    onError: (errorMessage: string) => {
      const errorObj = new Error(errorMessage);
      config.onError?.(errorObj);
    },
    onSuccess: result => {
      // アップロード成功ログのみ（onUploadCompleteは uploadCover 内で呼ぶ）
      console.log('✅ [UnifiedCover] アップロード成功:', result);
    },
  });

  // カバー画像更新・削除機能
  const [updateUserCover] = useMutation(UpdateUserCoverDocument);
  const [deleteUserCover] = useMutation(DeleteUserCoverDocument);

  // カバー画像アップロード関数
  const uploadCover = useCallback(
    async (file: File): Promise<CoverUploadResult> => {
      if (!user) {
        throw new Error('ログインが必要です');
      }

      try {
        // 1. ファイルをアップロード
        const result = await uploadMedia(file);

        // 2. ユーザーのcoverImageIdを更新（楽観的更新）
        const { data: updateData } = await updateUserCover({
          variables: {
            input: { mediaId: result.mediaId },
          },
          optimisticResponse: {
            updateUserCover: {
              __typename: 'UserUpdatePayload',
              success: true,
              message: 'カバー画像更新中...',
              user: {
                ...user,
                __typename: 'User',
                coverImageId: result.mediaId, // 新しいmediaIdで即座に更新
                updatedAt: new Date().toISOString(),
              },
            },
          },
          update: (cache, { data }) => {
            if (!data?.updateUserCover?.success || !data.updateUserCover.user) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ [UnifiedCover] キャッシュ更新をスキップ: 更新データが無効です');
              }
              return;
            }

            updateUserCoverCache(cache, user, result.mediaId);
          },
        });

        if (!updateData?.updateUserCover) {
          throw new Error('カバー画像情報の更新に失敗しました');
        }

        console.log('✅ [UnifiedCover] カバー画像更新完了:', {
          mediaId: result.mediaId,
          coverImageId: updateData.updateUserCover.user?.coverImageId,
        });

        // onUploadComplete を一度だけ呼び出し
        config.onUploadComplete?.(result.mediaId);

        return {
          success: true,
          mediaId: result.mediaId,
          coverImageId: updateData.updateUserCover.user?.coverImageId,
          downloadUrl: result.downloadUrl, // optional型なのでそのまま
          message: 'カバー画像をアップロードしました',
        };
      } catch (error) {
        // 開発環境では詳細ログ、本番環境では簡潔なログ
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [UnifiedCover] アップロード失敗:', error);
        } else {
          console.error('❌ [UnifiedCover] アップロード失敗');
        }

        // エラーコールバックを呼び出し
        const errorObj =
          error instanceof Error ? error : new Error('カバー画像アップロードに失敗しました');
        config.onError?.(errorObj);

        throw errorObj;
      }
    },
    [user, uploadMedia, updateUserCover, config]
  );

  // カバー画像削除関数
  const deleteCover = useCallback(async () => {
    if (!user) {
      throw new Error('ログインが必要です');
    }

    setIsDeleting(true);

    try {
      const { data } = await deleteUserCover({
        optimisticResponse: {
          deleteUserCover: {
            __typename: 'UserUpdatePayload',
            success: true,
            message: 'カバー画像削除中...',
            user: {
              ...user,
              __typename: 'User',
              coverImageId: null, // 即座にnullに更新
              updatedAt: new Date().toISOString(),
            },
          },
        },
        update: (cache, { data }) => {
          if (!data?.deleteUserCover?.success || !data.deleteUserCover.user) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ [UnifiedCover] 削除キャッシュ更新をスキップ: 更新データが無効です');
            }
            return;
          }

          updateUserCoverCache(cache, user, null);
        },
      });

      // 成功チェック
      if (!data?.deleteUserCover?.success) {
        throw new Error(data?.deleteUserCover?.message || 'カバー画像削除に失敗しました');
      }

      console.log('✅ [UnifiedCover] カバー画像削除成功');
      config.onDeleteComplete?.();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('カバー画像削除に失敗しました');
      console.error('❌ [UnifiedCover] カバー画像削除失敗:', errorObj);

      config.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsDeleting(false);
    }
  }, [user, deleteUserCover, config]);

  return {
    // アップロード関連
    uploadCover,
    isUploading,
    uploadProgress,

    // 削除関連
    deleteCover,
    isDeleting,

    // エラー関連
    error,
    // clearError削除：意味のない関数だったため
  };
}
