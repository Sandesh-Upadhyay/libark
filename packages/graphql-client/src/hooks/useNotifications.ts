/**
 * 🔔 統合通知フック（WebSocketサブスクリプション専用）
 *
 * 通知状態管理とGraphQL通知処理を統合
 * ポーリングは削除し、WebSocketサブスクリプションのみ使用
 */

import { useCallback } from 'react';
import type { ApolloError } from '@apollo/client';

import { useAppStore } from '../store/index.js';
import {
  useNotificationsQuery,
  useMarkNotificationsAsReadMutation,
  type QueryNotificationsArgs,
  type NotificationsQuery,
  type MarkNotificationsAsReadMutation,
} from '../generated/graphql.js';
import { NOTIFICATION_CONSTANTS } from '../constants.js';

// GraphQLクエリの結果型を使用
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

export interface UseNotificationsOptions {
  limit?: number;
  enabled?: boolean;
  // pollInterval?: number; // WebSocketサブスクリプション使用のため削除
}

// NotificationData型はGraphQL生成型のNotificationを使用

/**
 * 🎯 統合通知フック（WebSocketサブスクリプション専用）
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = NOTIFICATION_CONSTANTS.FETCH_INTERVAL,
    enabled = true,
    // pollInterval削除 - WebSocketサブスクリプション使用
  } = options;

  const {
    notifications,
    setNotifications,
    addNotification,
    markNotificationsAsRead,
    clearNotifications,
  } = useAppStore();

  // 通知一覧取得（初回のみ、WebSocketサブスクリプションでリアルタイム更新）
  const { loading, error, refetch } = useNotificationsQuery({
    variables: { first: limit } as QueryNotificationsArgs,
    skip: !enabled,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    // pollInterval削除 - WebSocketサブスクリプション使用
    onCompleted: (data: NotificationsQuery) => {
      if (data?.notifications) {
        setNotifications(data.notifications);
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ 通知取得エラー:', error);
    },
  });

  // 既読処理ミューテーション
  const [markAsReadMutation, { loading: markingAsRead }] = useMarkNotificationsAsReadMutation({
    onCompleted: (data: MarkNotificationsAsReadMutation) => {
      if (data?.markNotificationsAsRead) {
        const readIds = data.markNotificationsAsRead.map((n: { id: string }) => n.id);
        markNotificationsAsRead(readIds);
        console.log('✅ 通知既読処理完了:', readIds.length);
      }
    },
    onError: (error: ApolloError) => {
      console.error('❌ 通知既読処理エラー:', error);
    },
  });

  // 既読処理
  const markAsRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      // 楽観的更新
      markNotificationsAsRead(ids);

      try {
        await markAsReadMutation({
          variables: { ids },
        });
      } catch (error) {
        console.error('既読処理失敗:', error);
        // エラー時は refetch で状態を復元
        refetch();
      }
    },
    [markAsReadMutation, markNotificationsAsRead, refetch]
  );

  // 全て既読
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.items.filter(n => !n.isRead).map(n => n.id);

    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications.items, markAsRead]);

  // 通知追加（リアルタイム用）
  const addNewNotification = useCallback(
    (notification: NotificationItem) => {
      addNotification(notification);
    },
    [addNotification]
  );

  // ポーリング制御（WebSocketサブスクリプション使用のため削除）
  // const startNotificationPolling = useCallback(() => {
  //   if (enabled) {
  //     startPolling(pollInterval);
  //   }
  // }, [enabled, pollInterval, startPolling]);

  // const stopNotificationPolling = useCallback(() => {
  //   stopPolling();
  // }, [stopPolling]);

  // 手動更新
  const refreshNotifications = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('通知更新エラー:', error);
    }
  }, [refetch]);

  return {
    // 状態
    notifications: notifications.items,
    unreadCount: notifications.unreadCount,
    isLoading: loading || notifications.isLoading,
    isMarkingAsRead: markingAsRead,
    error: error?.message || notifications.error,

    // アクション
    markAsRead,
    markAllAsRead,
    addNotification: addNewNotification,
    refreshNotifications,
    clearNotifications,

    // ポーリング制御（WebSocketサブスクリプション使用のため削除）
    // startPolling: startNotificationPolling,
    // stopPolling: stopNotificationPolling,

    // 便利なプロパティ
    hasUnread: notifications.unreadCount > 0,
    isEmpty: notifications.items.length === 0,
  };
}

/**
 * 🎯 通知カウントのみを取得するフック（軽量版）
 */
export function useNotificationCount() {
  const { notifications } = useAppStore();
  return {
    count: notifications.unreadCount,
    hasUnread: notifications.unreadCount > 0,
  };
}

/**
 * 🎯 リアルタイム通知用のフック
 */
export function useRealtimeNotifications() {
  const { addNotification, setNotificationCount } = useAppStore();

  // WebSocket経由で通知を受信した時の処理
  const handleNotificationReceived = useCallback(
    (notification: NotificationItem) => {
      addNotification(notification);
    },
    [addNotification]
  );

  // 未読カウント更新
  const updateUnreadCount = useCallback(
    (count: number) => {
      setNotificationCount(count);
    },
    [setNotificationCount]
  );

  return {
    handleNotificationReceived,
    updateUnreadCount,
  };
}
