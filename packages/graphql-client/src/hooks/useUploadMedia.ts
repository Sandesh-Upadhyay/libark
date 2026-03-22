/**
 * 🚀 統一メディアアップロードフック（責任分離対応版）
 *
 * 全画像タイプ（POST/AVATAR/COVER/OGP）で統一されたアップロード処理
 * バックエンドGraphQL API経由でアップロード、S3ゲートウェイへの直接アクセスを排除
 */

import { useState, useCallback } from 'react';

import {
  MediaType as GraphQLMediaType,
  MediaStatus as GraphQLMediaStatus,
} from '../generated/graphql.js';

import { useProxyUpload, type ProxyUploadHookResponse } from './useProxyUpload';
import { type UnifiedUploadResult } from './useMediaUpload';

// 統一メディアタイプ定義（シンプル命名）
type MediaType = GraphQLMediaType;

// ================================
// 型定義（シンプル命名）
// ================================

export interface UploadConfig {
  mediaType: MediaType;
  maxFileSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
  onSuccess?: (result: ProxyUploadHookResponse) => void;
  onError?: (error: string) => void;
}

export interface UploadResult {
  success: boolean;
  mediaId: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  encrypted: boolean;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// ================================
// デフォルト設定
// ================================

const DEFAULT_CONFIG: Partial<UploadConfig> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
};

// ================================
// メインフック
// ================================

export function useUploadMedia(config: UploadConfig) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  // 不要な関数を削除（プロキシアップロードフックで処理）

  // プロキシアップロードフックを使用
  const { uploadFile: proxyUploadFile } = useProxyUpload({
    kind: config.mediaType,
    maxFileSize: config.maxFileSize,
    allowedTypes: config.allowedTypes,
    onProgress: progress => {
      setState(prev => ({ ...prev, progress }));
      config.onProgress?.(progress);
    },
    onError: error => {
      setState(prev => ({ ...prev, error, isUploading: false }));
      config.onError?.(error);
    },
  });

  // 統一アップロード関数（プロキシアップロード対応）
  const uploadUnifiedMedia = useCallback(
    async (file: File): Promise<UnifiedUploadResult> => {
      try {
        // プロキシアップロードを実行
        const result = await proxyUploadFile(file);

        // 成功コールバックを呼び出し
        config.onSuccess?.(result);

        // UnifiedUploadResult形式に変換
        return {
          ...result,
          status: GraphQLMediaStatus.Ready,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
        throw error;
      }
    },
    [config, proxyUploadFile]
  );

  return {
    uploadMedia: uploadUnifiedMedia, // 新しい名前
    uploadUnifiedMedia, // 後方互換性のため
    state,
    // 便利なヘルパー
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
  };
}

// ================================
// 特定用途向けヘルパーフック
// ================================

// 投稿画像アップロード
export function useUploadPostMedia(config?: Partial<UploadConfig>) {
  return useUploadMedia({
    mediaType: GraphQLMediaType.Post,
    ...config,
  });
}

// アバター画像アップロード
export function useUploadAvatarMedia(config?: Partial<UploadConfig>) {
  return useUploadMedia({
    mediaType: GraphQLMediaType.Avatar,
    maxFileSize: 5 * 1024 * 1024, // 5MB（アバターは小さめ）
    ...config,
  });
}

// カバー画像アップロード
export function useUploadCoverMedia(config?: Partial<UploadConfig>) {
  return useUploadMedia({
    mediaType: GraphQLMediaType.Cover,
    ...config,
  });
}

// OGP画像アップロード
export function useUploadOgpMedia(config?: Partial<UploadConfig>) {
  return useUploadMedia({
    mediaType: GraphQLMediaType.Ogp,
    ...config,
  });
}
