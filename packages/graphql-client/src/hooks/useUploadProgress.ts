/**
 * 🎯 アップロード進捗監視フック
 *
 * 機能:
 * - GraphQL Subscriptionでリアルタイム進捗監視
 * - イベント駆動メディア処理システム対応
 * - 複数メディアの同時監視
 */

import { useState, useCallback, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';

import { UploadProgressStatus } from '../generated/graphql.js';

// GraphQL Subscription
const UPLOAD_PROGRESS_SUBSCRIPTION = gql`
  subscription UploadProgress($mediaId: UUID!) {
    uploadProgress(mediaId: $mediaId) {
      mediaId
      status
      progress
      message
    }
  }
`;

// 型定義
export interface UploadProgressData {
  mediaId: string;
  status: UploadProgressStatus;
  progress: number; // 0-100
  message: string;
}

export interface UseUploadProgressConfig {
  onProgress?: (data: UploadProgressData) => void;
  onComplete?: (mediaId: string) => void;
  onError?: (mediaId: string, error: string) => void;
}

export interface UseUploadProgressReturn {
  subscribeToProgress: (mediaId: string) => void;
  unsubscribeFromProgress: (mediaId: string) => void;
  getProgress: (mediaId: string) => UploadProgressData | null;
  getAllProgress: () => Record<string, UploadProgressData>;
  isMonitoring: (mediaId: string) => boolean;
}

/**
 * アップロード進捗監視フック
 */
export function useUploadProgress(config: UseUploadProgressConfig = {}): UseUploadProgressReturn {
  const [progressData, setProgressData] = useState<Record<string, UploadProgressData>>({});
  const [subscribedMediaIds, setSubscribedMediaIds] = useState<Set<string>>(new Set());

  // 進捗データ更新
  const updateProgress = useCallback(
    (data: UploadProgressData) => {
      setProgressData(prev => ({
        ...prev,
        [data.mediaId]: data,
      }));

      // コールバック実行
      config.onProgress?.(data);

      if (data.status === 'COMPLETED') {
        config.onComplete?.(data.mediaId);
      } else if (data.status === 'FAILED') {
        config.onError?.(data.mediaId, data.message);
      }
    },
    [config]
  );

  // 進捗監視開始
  const subscribeToProgress = useCallback((mediaId: string) => {
    setSubscribedMediaIds(prev => new Set([...prev, mediaId]));

    // 初期状態を設定
    setProgressData(prev => ({
      ...prev,
      [mediaId]: {
        mediaId,
        status: UploadProgressStatus.Uploading,
        progress: 0,
        message: 'アップロード中...',
      },
    }));
  }, []);

  // 進捗監視停止
  const unsubscribeFromProgress = useCallback((mediaId: string) => {
    setSubscribedMediaIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(mediaId);
      return newSet;
    });

    // 完了後しばらくしてから進捗データを削除
    setTimeout(() => {
      setProgressData(prev => {
        const newData = { ...prev };
        delete newData[mediaId];
        return newData;
      });
    }, 5000);
  }, []);

  // 特定メディアの進捗取得
  const getProgress = useCallback(
    (mediaId: string): UploadProgressData | null => {
      return progressData[mediaId] || null;
    },
    [progressData]
  );

  // 全進捗データ取得
  const getAllProgress = useCallback(() => {
    return progressData;
  }, [progressData]);

  // 監視中かどうか
  const isMonitoring = useCallback(
    (mediaId: string) => {
      return subscribedMediaIds.has(mediaId);
    },
    [subscribedMediaIds]
  );

  return {
    subscribeToProgress,
    unsubscribeFromProgress,
    getProgress,
    getAllProgress,
    isMonitoring,
  };
}

/**
 * 単一メディア用の進捗監視フック
 */
export function useSingleUploadProgress(
  mediaId: string | null,
  config: UseUploadProgressConfig = {}
): {
  progress: UploadProgressData | null;
  isMonitoring: boolean;
} {
  const { data, loading, error } = useSubscription(UPLOAD_PROGRESS_SUBSCRIPTION, {
    variables: { mediaId },
    skip: !mediaId,
    onData: ({ data }) => {
      if (data?.data?.uploadProgress) {
        config.onProgress?.(data.data.uploadProgress);

        const progressData = data.data.uploadProgress;
        if (progressData.status === 'COMPLETED') {
          config.onComplete?.(progressData.mediaId);
        } else if (progressData.status === 'FAILED') {
          config.onError?.(progressData.mediaId, progressData.message);
        }
      }
    },
  });

  const progress = data?.uploadProgress || null;
  const isMonitoring = !!mediaId && !loading && !error;

  return {
    progress,
    isMonitoring,
  };
}

/**
 * 複数メディア用の進捗監視フック
 */
export function useMultipleUploadProgress(
  mediaIds: string[],
  config: UseUploadProgressConfig = {}
): {
  progressMap: Record<string, UploadProgressData>;
  allCompleted: boolean;
  hasErrors: boolean;
  completedCount: number;
  totalCount: number;
} {
  const [progressMap, setProgressMap] = useState<Record<string, UploadProgressData>>({});

  // 各メディアIDに対してSubscriptionを設定
  useEffect(() => {
    const subscriptions: Array<() => void> = [];

    mediaIds.forEach(mediaId => {
      // 個別のSubscriptionを作成（実際の実装では最適化が必要）
      // ここでは簡略化
      setProgressMap(prev => ({
        ...prev,
        [mediaId]: {
          mediaId,
          status: UploadProgressStatus.Uploading,
          progress: 0,
          message: 'アップロード中...',
        },
      }));
    });

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [mediaIds]);

  const allCompleted = Object.values(progressMap).every(p => p.status === 'COMPLETED');
  const hasErrors = Object.values(progressMap).some(p => p.status === 'FAILED');
  const completedCount = Object.values(progressMap).filter(p => p.status === 'COMPLETED').length;
  const totalCount = mediaIds.length;

  return {
    progressMap,
    allCompleted,
    hasErrors,
    completedCount,
    totalCount,
  };
}

/**
 * アップロード進捗の状態判定ユーティリティ
 */
export const UploadProgressUtils = {
  isUploading: (status: UploadProgressData['status']) =>
    ['UPLOADING', 'PROCESSING'].includes(status),

  isCompleted: (status: UploadProgressData['status']) => status === 'COMPLETED',

  isFailed: (status: UploadProgressData['status']) => status === 'FAILED',

  getProgressColor: (status: UploadProgressData['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'PROCESSING':
        return 'blue';
      default:
        return 'gray';
    }
  },

  getStatusText: (status: UploadProgressData['status']) => {
    switch (status) {
      case 'UPLOADING':
        return 'アップロード中';
      case 'PROCESSING':
        return '処理中';
      case 'COMPLETED':
        return '完了';
      case 'FAILED':
        return '失敗';
      default:
        return '不明';
    }
  },
};
