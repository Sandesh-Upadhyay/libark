/**
 * 🚀 プロキシアップロードフック（責任分離対応）
 *
 * バックエンドのGraphQL API経由でファイルアップロードを実行
 * S3ゲートウェイへの直接アクセスを排除し、完全な責任分離を実現
 *
 * 🚀 S3 Gateway Presigned URL 移行対応
 * modeパラメータでGateway/Base64を切り替え可能
 */

import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

import { CREATE_UPLOAD_SESSION, COMPLETE_UPLOAD_SESSION } from '../mutations/media';
import { putToGateway, headerPairsToRecord, UploadProgress } from '../utils/upload';

// ================================
// GraphQL定義
// ================================

export const UPLOAD_FILE_PROXY = gql`
  mutation UploadFileProxy($input: ProxyUploadInput!) {
    uploadFileProxy(input: $input) {
      success
      mediaId
      filename
      contentType
      size
      downloadUrl
      encrypted
    }
  }
`;

// ================================
// 型定義
// ================================

export interface ProxyUploadInput {
  filename: string;
  contentType: string;
  size: number;
  mediaType: 'POST' | 'AVATAR' | 'COVER' | 'OGP';
  fileData: string; // Base64エンコードされたファイルデータ
}

export interface ProxyUploadHookResponse {
  success: boolean;
  mediaId: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  encrypted: boolean;
}

export interface ProxyUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface ProxyUploadConfig {
  kind?: 'POST' | 'AVATAR' | 'COVER' | 'OGP';
  mediaType?: 'POST' | 'AVATAR' | 'COVER' | 'OGP'; // kindの別名（後方互換性）
  maxFileSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
  onSuccess?: (result: ProxyUploadHookResponse) => void;
  onError?: (error: string) => void;
  mode?: 'gateway' | 'base64'; // デフォルトはgateway
}

// ================================
// メインフック
// ================================

export function useProxyUpload(config: ProxyUploadConfig) {
  const [state, setState] = useState<ProxyUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const [uploadFileProxy] = useMutation(UPLOAD_FILE_PROXY);
  const [createUploadSession] = useMutation(CREATE_UPLOAD_SESSION);
  const [completeUploadSession] = useMutation(COMPLETE_UPLOAD_SESSION);

  // kindとmediaTypeの統合（後方互換性）
  const kind = config.kind || config.mediaType;
  const configWithKind = { ...config, kind };

  // ファイルをBase64に変換
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64, の部分を除去
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // ファイルバリデーション
  const validateFile = useCallback(
    (file: File): string | null => {
      // ファイルサイズチェック
      const maxSize = configWithKind.maxFileSize || 10 * 1024 * 1024; // デフォルト10MB
      if (file.size > maxSize) {
        return `ファイルサイズが大きすぎます。最大${Math.round(maxSize / 1024 / 1024)}MBまでです。`;
      }

      // ファイルタイプチェック
      if (configWithKind.allowedTypes && !configWithKind.allowedTypes.includes(file.type)) {
        return `サポートされていないファイル形式です。対応形式: ${configWithKind.allowedTypes.join(', ')}`;
      }

      return null;
    },
    [configWithKind.maxFileSize, configWithKind.allowedTypes]
  );

  // 既存のbase64アップロードロジックをuploadViaBase64として抽出
  const uploadViaBase64 = useCallback(
    async (file: File): Promise<ProxyUploadHookResponse> => {
      try {
        // バリデーション
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        setState(prev => ({
          ...prev,
          isUploading: true,
          progress: 0,
          error: null,
        }));

        configWithKind.onProgress?.(10);

        // ファイルをBase64に変換
        setState(prev => ({ ...prev, progress: 20 }));
        configWithKind.onProgress?.(20);

        const fileData = await fileToBase64(file);

        setState(prev => ({ ...prev, progress: 40 }));
        configWithKind.onProgress?.(40);

        // GraphQL Mutationを実行
        const { data } = await uploadFileProxy({
          variables: {
            input: {
              filename: file.name,
              contentType: file.type,
              size: file.size,
              mediaType: configWithKind.kind,
              fileData,
            },
          },
        });

        setState(prev => ({ ...prev, progress: 90 }));
        configWithKind.onProgress?.(90);

        if (!data?.uploadFileProxy) {
          throw new Error('アップロードレスポンスが無効です');
        }

        const result = data.uploadFileProxy;

        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          error: null,
        }));

        configWithKind.onProgress?.(100);
        configWithKind.onSuccess?.(result);

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';

        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 0,
          error: errorMessage,
        }));

        configWithKind.onError?.(errorMessage);
        throw error;
      }
    },
    [configWithKind, uploadFileProxy, validateFile, fileToBase64]
  );

  // 🚀 Gateway経由のアップロード関数
  const uploadViaGateway = useCallback(
    async (file: File): Promise<ProxyUploadHookResponse> => {
      try {
        // バリデーション
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        setState(prev => ({
          ...prev,
          isUploading: true,
          progress: 0,
          error: null,
        }));

        configWithKind.onProgress?.(5);

        // 1. Session作成
        const { data: sessionData } = await createUploadSession({
          variables: {
            input: {
              kind: configWithKind.kind,
              filename: file.name,
              contentType: file.type,
              byteSize: file.size,
            },
          },
        });

        if (!sessionData?.createUploadSession) {
          throw new Error('UploadSessionの作成に失敗しました');
        }

        const { uploadId, uploadPath, uploadAuthToken, requiredHeaders } =
          sessionData.createUploadSession;

        configWithKind.onProgress?.(10);

        // 2. PUT Upload (XHR for progress)
        // requiredHeadersをRecord<string,string>に変換
        const headersRecord = headerPairsToRecord(requiredHeaders);

        // Authorizationヘッダーを追加（uploadAuthTokenは別で渡す）
        const headersWithAuth = {
          ...headersRecord,
          Authorization: `Bearer ${uploadAuthToken}`,
        };

        await putToGateway(uploadPath, file, {
          headers: headersWithAuth,
          onProgress: (progress: UploadProgress) => {
            // 10%から90%の範囲でプログレスを表示
            const scaledProgress = 10 + progress.percent * 0.8;
            setState(prev => ({ ...prev, progress: scaledProgress }));
            configWithKind.onProgress?.(scaledProgress);
          },
        });

        configWithKind.onProgress?.(90);

        // 3. Complete
        const { data: completeData } = await completeUploadSession({
          variables: { uploadId },
        });

        if (!completeData?.completeUploadSession) {
          throw new Error('UploadSessionの完了に失敗しました');
        }

        const media = completeData.completeUploadSession;

        const result: ProxyUploadHookResponse = {
          success: true,
          mediaId: media.id,
          filename: media.filename,
          contentType: media.mimeType,
          size: media.fileSize,
          downloadUrl: media.url || '',
          encrypted: false,
        };

        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          error: null,
        }));

        configWithKind.onProgress?.(100);
        configWithKind.onSuccess?.(result);

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';

        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 0,
          error: errorMessage,
        }));

        configWithKind.onError?.(errorMessage);
        throw error;
      }
    },
    [configWithKind, createUploadSession, completeUploadSession, validateFile]
  );

  // modeに基づいてアップロード方法を分岐
  const uploadFile = useCallback(
    async (file: File): Promise<ProxyUploadHookResponse> => {
      const mode = configWithKind.mode || 'gateway'; // デフォルトはgateway

      if (mode === 'gateway') {
        return uploadViaGateway(file);
      } else {
        // 既存のbase64アップロードロジック
        return uploadViaBase64(file);
      }
    },
    [configWithKind.mode, uploadViaGateway, uploadViaBase64]
  );

  return {
    uploadFile,
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
export function useProxyUploadPost(config?: Omit<ProxyUploadConfig, 'kind'>) {
  return useProxyUpload({
    kind: 'POST',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}

// アバター画像アップロード
export function useProxyUploadAvatar(config?: Omit<ProxyUploadConfig, 'kind'>) {
  return useProxyUpload({
    kind: 'AVATAR',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}

// カバー画像アップロード
export function useProxyUploadCover(config?: Omit<ProxyUploadConfig, 'kind'>) {
  return useProxyUpload({
    kind: 'COVER',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}

// OGP画像アップロード
export function useProxyUploadOgp(config?: Omit<ProxyUploadConfig, 'kind'>) {
  return useProxyUpload({
    kind: 'OGP',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...config,
  });
}
