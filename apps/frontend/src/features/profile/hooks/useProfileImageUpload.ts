/**
 * 🎯 プロフィール画像アップロード用カスタムフック
 *
 * 責任:
 * - プロフィール画像とカバー画像のアップロード処理
 * - useAvatarフックとの統合
 * - エラーハンドリングと状態管理
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAvatar, useCover } from '@libark/graphql-client';

export interface ProfileImageUploadConfig {
  /** アップロード完了時のコールバック */
  onUploadComplete?: (type: 'avatar' | 'cover', mediaId: string) => void;
  /** エラー発生時のコールバック */
  onError?: (error: Error) => void;
}

export interface ProfileImageUploadReturn {
  /** プロフィール画像アップロード処理 */
  uploadProfileImage: (file: File) => Promise<void>;
  /** カバー画像アップロード処理 */
  uploadCoverImage: (file: File) => Promise<void>;
  /** アップロード中かどうか */
  isUploading: boolean;
  /** アップロード進捗 */
  progress: number;
  /** エラー情報 */
  error: string | null;
}

/**
 * プロフィール画像アップロード用カスタムフック
 */
export function useProfileImageUpload(
  config: ProfileImageUploadConfig = {}
): ProfileImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // プロフィール画像用アップロードフック
  const {
    uploadAvatar: uploadAvatarMedia,
    isUploading: isAvatarUploading,
    uploadProgress: avatarProgress,
    error: avatarError,
  } = useAvatar({
    onUploadProgress: (progressValue: number) => {
      setProgress(progressValue);
    },
    onUploadComplete: async (result: unknown) => {
      try {
        const resultWithId = result as { id: string };
        config.onUploadComplete?.('avatar', resultWithId.id);
        toast.success('プロフィール画像を更新しました');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'アバター更新に失敗しました';
        setError(errorMessage);
        config.onError?.(new Error(errorMessage));
        toast.error(errorMessage);
      }
    },
    onError: (error: unknown) => {
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'アバター更新に失敗しました';
      setError(errorMessage);
      config.onError?.(error as Error);
      toast.error(errorMessage);
    },
  });

  // カバー画像用アップロードフック
  const {
    uploadCover: uploadCoverMedia,
    isUploading: isCoverUploading,
    uploadProgress: coverProgress,
    error: coverError,
  } = useCover({
    onUploadProgress: (progressValue: number) => {
      setProgress(progressValue);
    },
    onUploadComplete: async (mediaId: unknown) => {
      try {
        config.onUploadComplete?.('cover', String(mediaId));
        toast.success('カバー画像を更新しました');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'カバー画像更新に失敗しました';
        setError(errorMessage);
        config.onError?.(new Error(errorMessage));
        toast.error(errorMessage);
      }
    },
    onError: (error: unknown) => {
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'カバー画像更新に失敗しました';
      setError(errorMessage);
      config.onError?.(error as Error);
      toast.error(errorMessage);
    },
  });

  // プロフィール画像アップロード処理
  const uploadProfileImage = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        // ファイルバリデーション
        if (!file.type.startsWith('image/')) {
          throw new Error('画像ファイルを選択してください');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('ファイルサイズは5MB以下にしてください');
        }

        console.log('プロフィール画像アップロード開始:', file.name);

        // 統一メディアアップロードシステムを使用
        const result = await uploadAvatarMedia(file);
        console.log('プロフィール画像アップロード完了:', result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'プロフィール画像のアップロードに失敗しました';
        setError(errorMessage);
        config.onError?.(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [uploadAvatarMedia, config]
  );

  // カバー画像アップロード処理
  const uploadCoverImage = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        // ファイルバリデーション
        if (!file.type.startsWith('image/')) {
          throw new Error('画像ファイルを選択してください');
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error('ファイルサイズは10MB以下にしてください');
        }

        // カバー画像用の統一メディアアップロード
        const result = await uploadCoverMedia(file);
        console.log('カバー画像アップロード完了:', result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'カバー画像のアップロードに失敗しました';
        setError(errorMessage);
        config.onError?.(new Error(errorMessage));
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [uploadCoverMedia, config]
  );

  return {
    uploadProfileImage,
    uploadCoverImage,
    isUploading: isUploading || isAvatarUploading || isCoverUploading,
    progress: Math.max(progress || 0, avatarProgress || 0, coverProgress || 0),
    error:
      (typeof error === 'string' ? error : null) ||
      (typeof avatarError === 'string' ? avatarError : null) ||
      (typeof coverError === 'string' ? coverError : null) ||
      null,
  };
}
