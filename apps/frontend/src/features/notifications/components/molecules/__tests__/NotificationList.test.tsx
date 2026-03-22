/**
 * 🧪 NotificationList コンポーネント テスト
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import type { NotificationsQuery } from '@libark/graphql-client';

import { NotificationList } from '../NotificationList';
import { useNotificationAutoRead } from '../../hooks/useNotificationAutoRead';

// Mock useNotificationAutoRead
vi.mock('../../hooks/useNotificationAutoRead', () => ({
  useNotificationAutoRead: vi.fn(),
}));

// テスト用のモックデータ
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

const createMockActor = (id: string, username: string, displayName?: string) => ({
  id,
  username,
  displayName,
  profileImageUrl: null,
});

const createMockNotification = (overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  id: 'test-id',
  type: 'LIKE',
  content: 'Test notification',
  isRead: false,
  createdAt: new Date().toISOString(),
  referenceId: 'post1',
  actor: createMockActor('user1', 'user1', 'ユーザー1'),
  user: null,
  ...overrides,
});

const mockNotifications: NotificationItem[] = [
  createMockNotification({
    id: '1',
    type: 'LIKE',
    referenceId: 'post1',
    actor: createMockActor('user1', 'user1', 'ユーザー1'),
    createdAt: '2024-01-01T10:00:00Z',
  }),
  createMockNotification({
    id: '2',
    type: 'COMMENT',
    referenceId: 'post1',
    actor: createMockActor('user2', 'user2', 'ユーザー2'),
    createdAt: '2024-01-01T11:00:00Z',
  }),
  createMockNotification({
    id: '3',
    type: 'FOLLOW',
    referenceId: null,
    actor: createMockActor('user3', 'user3', 'ユーザー3'),
    createdAt: '2024-01-01T12:00:00Z',
  }),
];

describe('NotificationList', () => {
  const mockObserveNotification = vi.fn();
  const mockOnMarkAsRead = vi.fn();
  const mockOnNotificationClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotificationAutoRead as any).mockReturnValue({
      observeNotification: mockObserveNotification,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('通知リストの表示', () => {
    it('通知リストが正しく表示されること', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('ユーザー1さんがあなたのポストをいいねしました')).toBeInTheDocument();
      expect(
        screen.getByText('ユーザー2さんがあなたのポストにコメントしました')
      ).toBeInTheDocument();
      expect(screen.getByText('ユーザー3さんがあなたをフォローしました')).toBeInTheDocument();
    });

    it('空の通知リストが表示されること', () => {
      render(
        <NotificationList
          notifications={[]}
          emptyMessage='通知はありません'
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('通知はありません')).toBeInTheDocument();
    });

    it('ローディング状態が表示されること', () => {
      render(
        <NotificationList
          notifications={[]}
          isLoading={true}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('エラー状態が表示されること', () => {
      render(
        <NotificationList
          notifications={[]}
          error='通知の取得に失敗しました'
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('通知の取得に失敗しました')).toBeInTheDocument();
    });
  });

  describe('通知の既読化', () => {
    it('未読通知が正しく表示されること', () => {
      const unreadNotifications = mockNotifications.map(n => ({ ...n, isRead: false }));

      render(
        <NotificationList
          notifications={unreadNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      // 未読インジケーターが表示される
      const unreadIndicators = screen
        .getAllByRole('article')
        .filter(el => el.classList.contains('bg-blue-50/20'));
      expect(unreadIndicators).toHaveLength(3);
    });

    it('既読通知が正しく表示されること', () => {
      const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }));

      render(
        <NotificationList
          notifications={readNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      // 未読インジケーターが表示されない
      const unreadIndicators = screen
        .queryAllByRole('article')
        .filter(el => el.classList.contains('bg-blue-50/20'));
      expect(unreadIndicators).toHaveLength(0);
    });

    it('通知クリック時にonNotificationClickが呼ばれること', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const firstNotification = screen.getByRole('article');
      fireEvent.click(firstNotification);

      expect(mockOnNotificationClick).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    });

    it('通知クリック時にonMarkAsReadが呼ばれること', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const firstNotification = screen.getByRole('article');
      fireEvent.click(firstNotification);

      expect(mockOnMarkAsRead).toHaveBeenCalled();
    });
  });

  describe('通知のフィルタリング', () => {
    it('LIKEタイプの通知のみが表示されること', () => {
      const likeNotifications = mockNotifications.filter(n => n.type === 'LIKE');

      render(
        <NotificationList
          notifications={likeNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('ユーザー1さんがあなたのポストをいいねしました')).toBeInTheDocument();
      expect(
        screen.queryByText('ユーザー2さんがあなたのポストにコメントしました')
      ).not.toBeInTheDocument();
    });

    it('COMMENTタイプの通知のみが表示されること', () => {
      const commentNotifications = mockNotifications.filter(n => n.type === 'COMMENT');

      render(
        <NotificationList
          notifications={commentNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(
        screen.getByText('ユーザー2さんがあなたのポストにコメントしました')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('ユーザー1さんがあなたのポストをいいねしました')
      ).not.toBeInTheDocument();
    });

    it('未読通知のみが表示されること', () => {
      const mixedNotifications = [
        { ...mockNotifications[0], isRead: false },
        { ...mockNotifications[1], isRead: true },
        { ...mockNotifications[2], isRead: false },
      ];

      render(
        <NotificationList
          notifications={mixedNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const unreadIndicators = screen
        .getAllByRole('article')
        .filter(el => el.classList.contains('bg-blue-50/20'));
      expect(unreadIndicators).toHaveLength(2);
    });
  });

  describe('通知のページネーション', () => {
    it('大量の通知が正しく表示されること', () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) =>
        createMockNotification({
          id: `${i}`,
          actor: createMockActor(`user${i}`, `user${i}`, `ユーザー${i}`),
        })
      );

      render(
        <NotificationList
          notifications={manyNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('ユーザー0さんがあなたのポストをいいねしました')).toBeInTheDocument();
      expect(
        screen.getByText('ユーザー49さんがあなたのポストをいいねしました')
      ).toBeInTheDocument();
    });
  });

  describe('通知バッジの表示', () => {
    it('未読カウントが正しく表示されること', () => {
      const mixedNotifications = [
        { ...mockNotifications[0], isRead: false },
        { ...mockNotifications[1], isRead: false },
        { ...mockNotifications[2], isRead: true },
      ];

      render(
        <NotificationList
          notifications={mixedNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const unreadIndicators = screen
        .getAllByRole('article')
        .filter(el => el.classList.contains('bg-blue-50/20'));
      expect(unreadIndicators).toHaveLength(2);
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーメッセージが正しく表示されること', () => {
      render(
        <NotificationList
          notifications={[]}
          error='ネットワークエラーが発生しました'
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
    });

    it('空メッセージが正しく表示されること', () => {
      render(
        <NotificationList
          notifications={[]}
          emptyMessage='新しい通知はありません'
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      expect(screen.getByText('新しい通知はありません')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('通知アイテムが正しいARIA属性を持つこと', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const firstNotification = screen.getByRole('article');
      expect(firstNotification).toHaveAttribute('tabIndex', '0');
      expect(firstNotification).toHaveAttribute('data-notification-id', '1');
      expect(firstNotification).toHaveAttribute('data-is-read', 'false');
    });

    it('キーボード操作で通知を選択できること', () => {
      render(
        <NotificationList
          notifications={mockNotifications}
          onNotificationClick={mockOnNotificationClick}
          onMarkAsRead={mockOnMarkAsRead}
        />
      );

      const firstNotification = screen.getByRole('article');
      fireEvent.keyDown(firstNotification, { key: 'Enter' });

      expect(mockOnNotificationClick).toHaveBeenCalled();
    });
  });
});
