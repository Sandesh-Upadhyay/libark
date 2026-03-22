/**
 * 🎯 X風通知アイテムコンポーネント (Molecule)
 *
 * 責任:
 * - X（旧Twitter）風の通知デザイン
 * - アバター表示とリッチテキスト
 * - ホバー効果とインタラクション
 */

import React, { useRef, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Bell, CheckCircle, AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { GroupedNotification } from '../../utils/notificationGrouping';
import { generateNotificationText } from '../../utils/notificationGrouping';
import { MultipleAvatars } from '../atoms/MultipleAvatars';


export interface XStyleNotificationItemProps {
  notification: GroupedNotification;
  onNotificationClick?: (notification: GroupedNotification) => void;
  onMarkAsRead?: (notificationIds: string[]) => void;
  /** X風自動既読処理用の監視関数 */
  onObserveElement?: (element: HTMLElement, notificationId: string, isRead: boolean) => void;
}

/**
 * 通知タイプに応じたアイコンとカラーを取得
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'LIKE':
      return { icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500/10' };
    case 'COMMENT':
      return { icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
    case 'FOLLOW':
      return { icon: UserPlus, color: 'text-green-500', bgColor: 'bg-green-500/10' };
    // POST_PROCESSING_COMPLETEDは削除済み（Postは即座に処理されるため不要）
    case 'AVATAR_PROCESSING_COMPLETED':
    case 'COMMENT_PROCESSING_COMPLETED':
      return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' };
    case 'POST_PROCESSING_FAILED':
    case 'AVATAR_PROCESSING_FAILED':
    case 'COMMENT_PROCESSING_FAILED':
      return { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' };
    default:
      return { icon: Bell, color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
  }
};

/**
 * 時間をフォーマット
 */
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return '今';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分`;
  } else if (diffInHours < 24) {
    return `${diffInHours}時間`;
  } else if (diffInDays < 7) {
    return `${diffInDays}日`;
  } else {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  }
};

/**
 * 🎯 X風通知アイテムコンポーネント
 */
export const XStyleNotificationItem: React.FC<XStyleNotificationItemProps> = ({
  notification,
  onNotificationClick,
  onMarkAsRead,
  onObserveElement,
}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { icon: IconComponent, color, bgColor } = getNotificationIcon(notification.type);
  const notificationText = generateNotificationText(notification);
  const timeText = formatTime(notification.createdAt);

  // X風自動既読処理: 要素が表示されたら監視開始
  useEffect(() => {
    if (elementRef.current && onObserveElement) {
      onObserveElement(elementRef.current, notification.id, notification.isRead);
    }
  }, [notification.id, notification.isRead, onObserveElement]);

  const handleClick = () => {
    // X風仕様: 表示時に既読になるため、クリック時の既読処理は不要
    // ただし、念のため未読の場合は既読にマーク（フォールバック）
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.notificationIds);
    }

    // 通知クリックコールバック（ナビゲーション）
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <article
      ref={elementRef}
      role='article'
      tabIndex={0}
      data-notification-id={notification.id}
      data-is-read={notification.isRead}
      className={cn(
        'relative flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-200',
        'hover:bg-gray-50/50 dark:hover:bg-gray-900/30',
        'border-b border-gray-100/50 dark:border-gray-800/50',
        !notification.isRead && 'bg-blue-50/20 dark:bg-blue-900/5'
      )}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 未読インジケーター */}
      {!notification.isRead && (
        <div className='absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full' />
      )}

      {/* アクションアイコン */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          bgColor
        )}
      >
        <IconComponent className={cn('w-4 h-4', color)} />
      </div>

      {/* メインコンテンツ */}
      <div className='flex-1 min-w-0'>
        {/* X風レイアウト: アバター、テキスト、日付 */}
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-3 flex-1 min-w-0'>
            {/* 複数ユーザーアバター */}
            {notification.actors.length > 0 && (
              <MultipleAvatars
                actors={notification.actors}
                size='sm'
                maxVisible={3}
                className='flex-shrink-0'
              />
            )}

            {/* 通知テキスト */}
            <div className='flex-1 min-w-0'>
              <div className='text-sm leading-5 text-foreground'>{notificationText}</div>
            </div>
          </div>

          {/* X風日付表示 - 右上に配置 */}
          <div className='flex-shrink-0 ml-2'>
            <time
              dateTime={notification.createdAt}
              className='text-xs leading-4 text-muted-foreground'
            >
              {timeText}
            </time>
          </div>
        </div>

        {/* 投稿内容プレビュー（該当する場合） */}
        {(notification.type === 'LIKE' || notification.type === 'COMMENT') &&
          notification.referenceId &&
          notification.content && (
            <div className='mt-2 ml-11'>
              <div className='text-sm line-clamp-3 leading-5 text-muted-foreground'>
                {notification.content}
              </div>
            </div>
          )}
      </div>
    </article>
  );
};
