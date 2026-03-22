/**
 * 🎯 通知リストコンポーネント (Molecule)
 *
 * 責任:
 * - X風通知データの表示
 * - 通知タイプに応じたアイコンとスタイリング
 * - 未読/既読状態の管理
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import type { NotificationsQuery } from '@libark/graphql-client';

import { groupNotifications, type GroupedNotification } from '../../utils/notificationGrouping';
import { useNotificationAutoRead } from '../../hooks/useNotificationAutoRead';

import { XStyleNotificationItem } from './XStyleNotificationItem';

// GraphQLクエリの結果型を使用
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

export interface NotificationListProps {
  /** 通知データ */
  notifications: NotificationItem[];
  /** 通知クリック時のコールバック */
  onNotificationClick?: (notification: GroupedNotification) => void;
  /** 既読マーク時のコールバック */
  onMarkAsRead?: (notificationIds: string[]) => void;
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  error?: string;
  /** 空状態メッセージ */
  emptyMessage?: string;
  /** バリアント */
  variant?: 'default' | 'compact';
}

/**
 * 🎯 X風通知リストコンポーネント
 */
export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  emptyMessage,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();

  // 通知をグループ化
  const groupedNotifications = useMemo(() => {
    return groupNotifications(notifications);
  }, [notifications]);

  // X風自動既読処理
  const { observeNotification } = useNotificationAutoRead({
    onMarkAsRead: onMarkAsRead || (() => {}),
    enabled: !!onMarkAsRead,
  });

  // ローディング状態
  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Bell className='h-12 w-12 text-gray-400 mb-4' />
        <p className='text-gray-600 dark:text-gray-400'>{error}</p>
      </div>
    );
  }

  // 空状態
  if (!notifications || notifications.length === 0) {
    const defaultEmptyMessage =
      emptyMessage || t('notifications.noNotifications', { default: '通知がありません' });
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Bell className='h-12 w-12 text-gray-400 mb-4' />
        <p className='text-gray-600 dark:text-gray-400'>{defaultEmptyMessage}</p>
      </div>
    );
  }

  return (
    <div className='divide-y divide-gray-100 dark:divide-gray-800'>
      {groupedNotifications.map(groupedNotification => (
        <XStyleNotificationItem
          key={groupedNotification.id}
          notification={groupedNotification}
          onNotificationClick={onNotificationClick}
          onMarkAsRead={onMarkAsRead}
          onObserveElement={observeNotification}
        />
      ))}
    </div>
  );
};

NotificationList.displayName = 'NotificationList';
