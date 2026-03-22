/**
 * 🎯 X風通知自動既読フック
 *
 * 責任:
 * - Intersection Observer APIを使用したスクロール時自動既読
 * - 表示領域に入った通知の自動既読処理
 * - パフォーマンス最適化
 */

import { useEffect, useRef, useCallback } from 'react';

export interface NotificationAutoReadOptions {
  /** 既読処理関数 */
  onMarkAsRead: (notificationIds: string[]) => void;
  /** 有効/無効 */
  enabled?: boolean;
  /** 表示時間の閾値（ミリ秒） */
  threshold?: number;
}

/**
 * 🎯 X風通知自動既読フック
 */
export const useNotificationAutoRead = ({
  onMarkAsRead,
  enabled = true,
  threshold = 500, // 500ms表示されたら既読
}: NotificationAutoReadOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processedRef = useRef<Set<string>>(new Set());

  // 通知要素を監視対象に追加
  const observeNotification = useCallback(
    (element: HTMLElement, notificationId: string, isRead: boolean) => {
      if (!enabled || isRead || processedRef.current.has(notificationId)) {
        return;
      }

      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              const notificationId = entry.target.getAttribute('data-notification-id');
              const isRead = entry.target.getAttribute('data-is-read') === 'true';

              if (!notificationId || isRead || processedRef.current.has(notificationId)) {
                return;
              }

              if (entry.isIntersecting) {
                // 表示領域に入った場合、一定時間後に既読にする
                const timeout = setTimeout(() => {
                  if (!processedRef.current.has(notificationId)) {
                    console.log('🔔 X風仕様: スクロール時自動既読処理', notificationId);
                    onMarkAsRead([notificationId]);
                    processedRef.current.add(notificationId);
                  }
                  timeoutsRef.current.delete(notificationId);
                }, threshold);

                timeoutsRef.current.set(notificationId, timeout);
              } else {
                // 表示領域から出た場合、タイマーをクリア
                const timeout = timeoutsRef.current.get(notificationId);
                if (timeout) {
                  clearTimeout(timeout);
                  timeoutsRef.current.delete(notificationId);
                }
              }
            });
          },
          {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.5, // 50%表示されたら
          }
        );
      }

      observerRef.current.observe(element);
    },
    [enabled, onMarkAsRead, threshold]
  );

  // 通知要素の監視を停止
  const unobserveNotification = useCallback((element: HTMLElement) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  // 処理済み通知をリセット（新しい通知が来た時など）
  const resetProcessed = useCallback(() => {
    processedRef.current.clear();
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      // 全てのタイマーをクリア
      timeoutsRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      timeoutsRef.current.clear();

      // Observerを停止
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // 処理済みリストをクリア
      processedRef.current.clear();
    };
  }, []);

  return {
    observeNotification,
    unobserveNotification,
    resetProcessed,
  };
};
