import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCheck } from 'lucide-react';
import { useAuth, type User } from '@libark/graphql-client';
import { useNotifications } from '@libark/graphql-client';
import { useNavigate } from 'react-router-dom';
import type { NotificationsQuery } from '@libark/graphql-client';

import { NotificationList } from '@/features/notifications/components/molecules/NotificationList';
import type { GroupedNotification } from '@/features/notifications/utils/notificationGrouping';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { Button } from '@/components/atoms';

// GraphQLクエリの結果型を使用
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

/**
 * 🎯 通知ページコンポーネント
 *
 * 責任:
 * - 通知一覧の表示
 * - 既読アクション
 *
 * 特徴:
 * - 統一されたNotificationフックを使用
 * - NotificationListコンポーネントによる統一デザイン
 * - X風通知グループ化機能
 * - X風自動既読処理
 */
const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth() as { user: User | null };
  const navigate = useNavigate();

  // 統一通知フックを使用
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } =
    useNotifications({
      limit: 50,
      enabled: !!user?.id,
    });

  // X風仕様: 通知ページを開いた時に表示された通知を自動既読にする
  useEffect(() => {
    if (!isLoading && notifications && notifications.length > 0) {
      // 未読の通知IDを取得
      const unreadNotificationIds = notifications
        .filter(notification => !notification.isRead)
        .map(notification => notification.id);

      // 未読通知がある場合は自動既読にする
      if (unreadNotificationIds.length > 0) {
        console.log(
          '🔔 X風仕様: 通知ページ表示時に自動既読処理',
          unreadNotificationIds.length,
          '件'
        );
        markAsRead(unreadNotificationIds);
      }
    }
  }, [isLoading, notifications, markAsRead]);

  // 通知データの型変換
  const notificationItems = useMemo(() => {
    if (!Array.isArray(notifications)) {
      return [];
    }
    return notifications as NotificationItem[];
  }, [notifications]);

  // 通知クリックハンドラー（グループ対応）
  const handleNotificationClick = (notification: GroupedNotification) => {
    // 通知タイプに応じたナビゲーション
    if (notification.referenceId) {
      switch (notification.type) {
        case 'LIKE':
        case 'COMMENT':
          navigate(`/posts/${notification.referenceId}`);
          break;
        case 'FOLLOW':
          // 最初のアクターのプロフィールページへ
          if (notification.actors.length > 0 && notification.actors[0].username) {
            navigate(`/profile/${notification.actors[0].username}`);
          }
          break;
        default:
          // その他の通知は特にナビゲーションしない
          break;
      }
    }
  };

  // 全て既読にする処理
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('全て既読にする処理に失敗しました:', error);
    }
  };

  // 個別の既読処理（グループ対応）
  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await markAsRead(notificationIds);
    } catch (error) {
      console.error('既読処理に失敗しました:', error);
    }
  };

  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      {/* 通知コンテンツ - ウォレットページスタイル */}
      <div role='main' aria-label='通知管理'>
        {/* メインヘッダー */}
        <Header title={t('notifications.title', { default: '通知' })} />

        {/* アクションボタン */}
        {unreadCount > 0 && (
          <div className='sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex justify-end px-4 py-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleMarkAllAsRead}
              className='flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20'
            >
              <CheckCheck className='h-4 w-4' />
              {t('notifications.markAllAsRead', { default: '全て既読にする' })}
            </Button>
          </div>
        )}

        {/* X風通知一覧 */}
        <div className='bg-background'>
          <NotificationList
            notifications={notificationItems}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
            isLoading={isLoading}
            error={error || undefined}
            emptyMessage={t('notifications.noNotifications', { default: '通知はありません' })}
          />
        </div>
      </div>
    </PageLayoutTemplate>
  );
};

export default NotificationsPage;
