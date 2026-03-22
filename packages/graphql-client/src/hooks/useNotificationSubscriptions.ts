/**
 * 🎯 統一通知サブスクリプションフック
 *
 * 責任:
 * - GraphQLサブスクリプション専用管理
 * - 重複防止機能
 * - 統一通知マネージャーとの連携
 */

import { useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';

import { useAuth } from '../auth/AuthProvider.js';

// GraphQLサブスクリプション定義
const NOTIFICATION_ADDED_SUBSCRIPTION = gql`
  subscription NotificationAdded($userId: UUID!) {
    notificationAdded(userId: $userId) {
      id
      type
      content
      isRead
      createdAt
      referenceId
      user {
        id
        username
        displayName
      }
      actor {
        id
        username
        displayName
        profileImageId
      }
    }
  }
`;

const NOTIFICATION_COUNT_UPDATED_SUBSCRIPTION = gql`
  subscription NotificationCountUpdated($userId: UUID!) {
    notificationCountUpdated(userId: $userId)
  }
`;

export interface UseNotificationSubscriptionsOptions {
  onNotificationReceived?: (notification: unknown) => void;
  onCountUpdated?: (count: number) => void;
  enabled?: boolean;
}

/**
 * 🎯 統一通知サブスクリプションフック
 */
export function useNotificationSubscriptions(options: UseNotificationSubscriptionsOptions = {}) {
  const { onNotificationReceived, onCountUpdated, enabled = true } = options;
  const { user, isAuthenticated } = useAuth();

  // 重複防止用
  const processedNotificationIds = useRef(new Set<string>());
  const lastCountUpdate = useRef<number>(0);

  // 通知追加サブスクリプション
  const { data: notificationData, error: notificationError } = useSubscription(
    NOTIFICATION_ADDED_SUBSCRIPTION,
    {
      variables: { userId: user?.id },
      skip: !enabled || !isAuthenticated || !user?.id,
      onData: ({ data }) => {
        if (data?.data?.notificationAdded) {
          const notification = data.data.notificationAdded;

          // 重複チェック
          if (processedNotificationIds.current.has(notification.id)) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 重複通知をスキップ（サブスクリプション）:', notification.id);
            }
            return;
          }

          // 処理済みとしてマーク
          processedNotificationIds.current.add(notification.id);

          // コールバック実行
          onNotificationReceived?.(notification);

          if (process.env.NODE_ENV === 'development') {
            console.log('📨 通知サブスクリプション受信:', notification);
          }
        }
      },
      onError: error => {
        console.error('❌ 通知サブスクリプションエラー:', error);
      },
    }
  );

  // 通知カウント更新サブスクリプション
  const { data: countData, error: countError } = useSubscription(
    NOTIFICATION_COUNT_UPDATED_SUBSCRIPTION,
    {
      variables: { userId: user?.id },
      skip: !enabled || !isAuthenticated || !user?.id,
      onData: ({ data }) => {
        if (typeof data?.data?.notificationCountUpdated === 'number') {
          const count = data.data.notificationCountUpdated;

          // 重複チェック（短時間での同じカウント更新を防ぐ）
          const now = Date.now();
          if (now - lastCountUpdate.current < 1000 && count === lastCountUpdate.current) {
            return;
          }

          lastCountUpdate.current = now;

          // コールバック実行
          onCountUpdated?.(count);

          if (process.env.NODE_ENV === 'development') {
            console.log('📊 通知カウントサブスクリプション受信:', count);
          }
        }
      },
      onError: error => {
        console.error('❌ 通知カウントサブスクリプションエラー:', error);
      },
    }
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      processedNotificationIds.current.clear();
    };
  }, []);

  return {
    // 状態
    isConnected: !notificationError && !countError,
    notificationError,
    countError,

    // データ
    latestNotification: notificationData?.notificationAdded,
    latestCount: countData?.notificationCountUpdated,

    // 統計
    processedCount: processedNotificationIds.current.size,
  };
}

/**
 * 🎯 統一通知サブスクリプション管理フック（統合版）
 */
export function useUnifiedNotificationSubscriptions() {
  const { user, isAuthenticated } = useAuth();

  return useNotificationSubscriptions({
    enabled: isAuthenticated && !!user?.id,
    onNotificationReceived: notification => {
      // 統一通知マネージャーに通知を転送
      const event = new CustomEvent('unified-notification-received', {
        detail: notification,
      });
      window.dispatchEvent(event);
    },
    onCountUpdated: count => {
      // 統一通知マネージャーにカウント更新を転送
      const event = new CustomEvent('unified-notification-count-updated', {
        detail: count,
      });
      window.dispatchEvent(event);
    },
  });
}
