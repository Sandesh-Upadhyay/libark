/**
 * 🚀 統一メディアアップロードフック - Phase 2実装
 *
 * 全てのメディアタイプ（POST、AVATAR、COVER、OGP）で統一されたアップロード処理
 * Phase 1で構築した基盤システムを活用した新しい統一実装
 *
 * 置き換え対象:
 * - useUnifiedAvatar
 * - useProxyUpload
 * - useUploadUnifiedMedia
 * - usePresignedImageUpload
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { MediaValidator, UnifiedUploadError, UPLOAD_ERROR_CODES } from '@libark/core-shared';

import { useAuth } from '../auth/AuthProvider.js';
import { MediaStatus, MediaType as GraphQLMediaType } from '../generated/graphql.js';

// ================================
// GraphQL定義
// ================================

const UPLOAD_MEDIA_UNIFIED = gql`
  mutation UploadMediaUnified($input: UnifiedUploadInput!) {
    uploadMediaUnified(input: $input) {
      success
      mediaId
      filename
      contentType
      size
      downloadUrl
      status
      message
    }
  }
`;

// ================================
// 型定義
// ================================

export type MediaType = GraphQLMediaType;

export interface UnifiedMediaUploadConfig {
  mediaType: MediaType;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: UnifiedUploadResult) => void;
  onError?: (error: UnifiedUploadError) => void;
  onStatusChange?: (status: UploadStatus) => void;
}

export interface UnifiedUploadResult {
  mediaId: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  status: MediaStatus;
}

export type UploadStatus =
  | 'idle'
  | 'validating'
  | 'converting'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

export interface UnifiedUploadState {
  isUploading: boolean;
  progress: number;
  status: UploadStatus;
  error: UnifiedUploadError | null;
}

// ================================
// メインフック
// ================================

export function useUnifiedMediaUpload(config: UnifiedMediaUploadConfig) {
  const { user } = useAuth();
  const [state, setState] = useState<UnifiedUploadState>({
    isUploading: false,
    progress: 0,
    status: 'idle',
    error: null,
  });

  const [uploadMediaUnified] = useMutation(UPLOAD_MEDIA_UNIFIED);

  // 状態更新ヘルパー
  const updateState = useCallback(
    (updates: Partial<UnifiedUploadState>) => {
      setState(prev => {
        const newState = { ...prev, ...updates };
        config.onStatusChange?.(newState.status);
        return newState;
      });
    },
    [config]
  );

  // ファイルをBase64に変換
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = () =>
        reject(
          new UnifiedUploadError(
            UPLOAD_ERROR_CODES.PROCESSING_ERROR,
            'ファイルの読み込みに失敗しました'
          )
        );
      reader.readAsDataURL(file);
    });
  }, []);

  // 統一アップロード実行
  const uploadFile = useCallback(
    async (file: File): Promise<UnifiedUploadResult> => {
      if (!user) {
        const authError = UnifiedUploadError.fromAuthentication();
        config.onError?.(authError);
        throw authError;
      }

      try {
        // 初期化
        updateState({
          isUploading: true,
          progress: 0,
          status: 'validating',
          error: null,
        });

        // Phase 1の統一バリデーションシステムを使用
        const validationResult = MediaValidator.validateFile(file, config.mediaType);
        if (!validationResult.isValid) {
          throw new UnifiedUploadError(
            UPLOAD_ERROR_CODES.VALIDATION_ERROR,
            validationResult.error || 'バリデーションエラー',
            validationResult.details
          );
        }

        // 進捗: バリデーション完了
        updateState({ progress: 20, status: 'converting' });
        config.onProgress?.(20);

        // ファイルをBase64に変換
        const fileData = await fileToBase64(file);

        updateState({ progress: 40, status: 'uploading' });
        config.onProgress?.(40);

        // 統一アップロードAPI呼び出し
        const { data, errors } = await uploadMediaUnified({
          variables: {
            input: {
              filename: file.name,
              contentType: file.type,
              size: file.size,
              mediaType: config.mediaType,
              fileData,
            },
          },
        });

        updateState({ progress: 90, status: 'processing' });
        config.onProgress?.(90);

        // デバッグ用ログ
        console.log('🔍 [UnifiedMediaUpload] GraphQL応答:', { data, errors });

        if (errors && errors.length > 0) {
          console.error('❌ [UnifiedMediaUpload] GraphQLエラー:', errors);
          errors.forEach((error, index) => {
            console.error(`エラー ${index + 1}:`, error.message, error);
          });
        }

        if (!data?.uploadMediaUnified) {
          console.error('❌ [UnifiedMediaUpload] 無効な応答:', { data, errors });
          const errorMessage = errors?.[0]?.message || 'サーバーからの応答が無効です';
          throw new UnifiedUploadError(UPLOAD_ERROR_CODES.SERVER_ERROR, errorMessage);
        }

        const result = data.uploadMediaUnified;

        if (!result.success) {
          throw new UnifiedUploadError(
            UPLOAD_ERROR_CODES.SERVER_ERROR,
            result.message || 'アップロードに失敗しました'
          );
        }

        // 完了
        updateState({
          isUploading: false,
          progress: 100,
          status: 'complete',
          error: null,
        });

        config.onProgress?.(100);
        config.onSuccess?.(result);

        return result;
      } catch (error) {
        const unifiedError =
          error instanceof UnifiedUploadError
            ? error
            : new UnifiedUploadError(
                UPLOAD_ERROR_CODES.UNKNOWN_ERROR,
                error instanceof Error ? error.message : 'アップロードに失敗しました'
              );

        updateState({
          isUploading: false,
          progress: 0,
          status: 'error',
          error: unifiedError,
        });

        config.onError?.(unifiedError);
        throw unifiedError;
      }
    },
    [user, config, uploadMediaUnified, updateState, fileToBase64]
  );

  // 複数ファイルのアップロード
  const uploadFiles = useCallback(
    async (files: File[]): Promise<UnifiedUploadResult[]> => {
      // Phase 1の統一バリデーションシステムを使用
      const validationResult = MediaValidator.validateFiles(files, config.mediaType);
      if (!validationResult.isValid) {
        const error = new UnifiedUploadError(
          UPLOAD_ERROR_CODES.VALIDATION_ERROR,
          validationResult.error || 'バリデーションエラー',
          validationResult.details
        );
        config.onError?.(error);
        throw error;
      }

      const results: UnifiedUploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file);
        results.push(result);

        // 全体の進捗を計算
        const overallProgress = ((i + 1) / files.length) * 100;
        config.onProgress?.(overallProgress);
      }

      return results;
    },
    [uploadFile, config]
  );

  // エラーのクリア
  const clearError = useCallback(() => {
    updateState({ error: null, status: 'idle' });
  }, [updateState]);

  // アップロードのキャンセル（将来の拡張用）
  const cancelUpload = useCallback(() => {
    updateState({
      isUploading: false,
      progress: 0,
      status: 'idle',
      error: null,
    });
  }, [updateState]);

  return {
    // メイン機能
    uploadFile,
    uploadFiles,

    // 状態
    ...state,

    // ユーティリティ
    clearError,
    cancelUpload,

    // 便利なゲッター
    canUpload: !state.isUploading && !!user,
    hasError: !!state.error,
    isComplete: state.status === 'complete',
  };
}

// ================================
// 特定用途向けヘルパーフック
// ================================

/**
 * アバター画像アップロード専用フック
 * useUnifiedAvatarの置き換え
 */
export function useAvatarUpload(config?: Partial<UnifiedMediaUploadConfig>) {
  return useUnifiedMediaUpload({
    mediaType: GraphQLMediaType.Avatar,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}

/**
 * 投稿画像アップロード専用フック
 * useUploadPostMediaの置き換え
 */
export function usePostImageUpload(config?: Partial<UnifiedMediaUploadConfig>) {
  return useUnifiedMediaUpload({
    mediaType: GraphQLMediaType.Post,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 4,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ...config,
  });
}

/**
 * カバー画像アップロード専用フック
 */
export function useCoverImageUpload(config?: Partial<UnifiedMediaUploadConfig>) {
  return useUnifiedMediaUpload({
    mediaType: GraphQLMediaType.Cover,
    maxFileSize: 8 * 1024 * 1024, // 8MB
    maxFiles: 1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}

/**
 * OGP画像アップロード専用フック
 */
export function useOgpImageUpload(config?: Partial<UnifiedMediaUploadConfig>) {
  return useUnifiedMediaUpload({
    mediaType: GraphQLMediaType.Ogp,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}
