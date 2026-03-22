/**
 * 🧪 通知グループ化ユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';
import type { NotificationsQuery } from '@libark/graphql-client';

import { groupNotifications, generateNotificationText } from '../notificationGrouping';

// テスト用のモックデータ
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

const createMockNotification = (overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  id: 'test-id',
  type: 'LIKE',
  content: 'Test notification',
  isRead: false,
  createdAt: new Date().toISOString(),
  referenceId: null,
  actor: null,
  user: null,
  ...overrides,
});

const createMockActor = (id: string, username: string, displayName?: string) => ({
  id,
  username,
  displayName,
  profileImageUrl: null,
});

describe('通知グループ化ユーティリティ', () => {
  describe('groupNotifications', () => {
    it('同じ投稿への同じアクションをグループ化する', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user1', 'user1', 'ユーザー1'),
          createdAt: '2023-01-01T10:00:00Z',
        }),
        createMockNotification({
          id: '2',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user2', 'user2', 'ユーザー2'),
          createdAt: '2023-01-01T11:00:00Z',
        }),
        createMockNotification({
          id: '3',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user3', 'user3', 'ユーザー3'),
          createdAt: '2023-01-01T12:00:00Z',
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped).toHaveLength(1);
      expect(grouped[0]).toMatchObject({
        id: '3', // 最新の通知のID
        type: 'LIKE',
        referenceId: 'post1',
        actors: expect.arrayContaining([
          expect.objectContaining({ username: 'user1' }),
          expect.objectContaining({ username: 'user2' }),
          expect.objectContaining({ username: 'user3' }),
        ]),
        notificationIds: ['3', '2', '1'], // 時間順（最新が最初）
      });
    });

    it('異なる投稿への同じアクションは別々にグループ化する', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user1', 'user1'),
        }),
        createMockNotification({
          id: '2',
          type: 'LIKE',
          referenceId: 'post2',
          actor: createMockActor('user2', 'user2'),
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped).toHaveLength(2);
      expect(grouped[0].referenceId).toBe('post1');
      expect(grouped[1].referenceId).toBe('post2');
    });

    it('同じ投稿への異なるアクションは別々にグループ化する', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user1', 'user1'),
        }),
        createMockNotification({
          id: '2',
          type: 'COMMENT',
          referenceId: 'post1',
          actor: createMockActor('user2', 'user2'),
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped).toHaveLength(2);
      expect(grouped.find(g => g.type === 'LIKE')).toBeDefined();
      expect(grouped.find(g => g.type === 'COMMENT')).toBeDefined();
    });

    it('referenceIdがnullの通知は個別に表示する', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'AVATAR_PROCESSING_COMPLETED',
          referenceId: null,
          createdAt: '2024-01-01T10:00:00Z', // 古い時間
        }),
        createMockNotification({
          id: '2',
          type: 'AVATAR_PROCESSING_COMPLETED',
          referenceId: null,
          createdAt: '2024-01-01T11:00:00Z', // 新しい時間
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped).toHaveLength(2);
      // 時間順でソートされるため、新しい通知（id: '2'）が最初に来る
      expect(grouped[0].id).toBe('2');
      expect(grouped[1].id).toBe('1');
    });

    it('重複するアクターを除去する', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user1', 'user1'),
        }),
        createMockNotification({
          id: '2',
          type: 'LIKE',
          referenceId: 'post1',
          actor: createMockActor('user1', 'user1'), // 同じユーザー
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped).toHaveLength(1);
      expect(grouped[0].actors).toHaveLength(1);
      expect(grouped[0].actors[0].username).toBe('user1');
    });

    it('全て既読の場合はisReadがtrueになる', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'LIKE',
          referenceId: 'post1',
          isRead: true,
          actor: createMockActor('user1', 'user1'),
        }),
        createMockNotification({
          id: '2',
          type: 'LIKE',
          referenceId: 'post1',
          isRead: true,
          actor: createMockActor('user2', 'user2'),
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped[0].isRead).toBe(true);
    });

    it('一部未読の場合はisReadがfalseになる', () => {
      const notifications: NotificationItem[] = [
        createMockNotification({
          id: '1',
          type: 'LIKE',
          referenceId: 'post1',
          isRead: true,
          actor: createMockActor('user1', 'user1'),
        }),
        createMockNotification({
          id: '2',
          type: 'LIKE',
          referenceId: 'post1',
          isRead: false,
          actor: createMockActor('user2', 'user2'),
        }),
      ];

      const grouped = groupNotifications(notifications);

      expect(grouped[0].isRead).toBe(false);
    });
  });

  describe('generateNotificationText', () => {
    it('単一アクターのLIKE通知テキストを生成する', () => {
      const groupedNotification = {
        id: '1',
        type: 'LIKE',
        referenceId: 'post1',
        actors: [createMockActor('user1', 'user1', 'ユーザー1')],
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('ユーザー1さんがあなたのポストをいいねしました');
    });

    it('2人のアクターのLIKE通知テキストを生成する', () => {
      const groupedNotification = {
        id: '1',
        type: 'LIKE',
        referenceId: 'post1',
        actors: [
          createMockActor('user1', 'user1', 'ユーザー1'),
          createMockActor('user2', 'user2', 'ユーザー2'),
        ],
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1', '2'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('ユーザー1さんとユーザー2さんがあなたのポストをいいねしました');
    });

    it('3人以上のアクターのLIKE通知テキストを生成する', () => {
      const groupedNotification = {
        id: '1',
        type: 'LIKE',
        referenceId: 'post1',
        actors: [
          createMockActor('user1', 'user1', 'ユーザー1'),
          createMockActor('user2', 'user2', 'ユーザー2'),
          createMockActor('user3', 'user3', 'ユーザー3'),
        ],
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1', '2', '3'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('ユーザー1さんと他2人があなたのポストをいいねしました');
    });

    it('displayNameがない場合はusernameを使用する', () => {
      const groupedNotification = {
        id: '1',
        type: 'LIKE',
        referenceId: 'post1',
        actors: [createMockActor('user1', 'user1')], // displayNameなし
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('user1さんがあなたのポストをいいねしました');
    });

    it('COMMENT通知のテキストを生成する', () => {
      const groupedNotification = {
        id: '1',
        type: 'COMMENT',
        referenceId: 'post1',
        actors: [createMockActor('user1', 'user1', 'ユーザー1')],
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('ユーザー1さんがあなたのポストにコメントしました');
    });

    it('FOLLOW通知のテキストを生成する', () => {
      const groupedNotification = {
        id: '1',
        type: 'FOLLOW',
        referenceId: null,
        actors: [createMockActor('user1', 'user1', 'ユーザー1')],
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('ユーザー1さんがあなたをフォローしました');
    });

    it('システム通知のテキストを生成する', () => {
      const groupedNotification = {
        id: '1',
        type: 'AVATAR_PROCESSING_COMPLETED',
        referenceId: null,
        actors: [],
        content: 'Test content',
        createdAt: new Date().toISOString(),
        isRead: false,
        notificationIds: ['1'],
      };

      const text = generateNotificationText(groupedNotification);

      expect(text).toBe('プロフィール画像の処理が完了しました');
    });
  });
});
