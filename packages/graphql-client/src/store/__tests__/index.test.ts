/**
 * 🧪 統合アプリケーションストア ユニットテスト
 *
 * UI状態・設定・通知・メッセージの管理機能をテストします
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useAppStore, useMessageStore, getAppState, type NotificationItem } from '../index';

// localStorageをモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// i18nextをモック
vi.mock('i18next', () => ({
  default: {
    language: 'ja',
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('🎯 useAppStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useAppStore.getState().resetAll();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.notifications.items).toEqual([]);
      expect(result.current.notifications.unreadCount).toBe(0);
      expect(result.current.notifications.isLoading).toBe(false);
      expect(result.current.notifications.error).toBe(null);

      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.locale).toBe('ja');
      expect(result.current.settings.animationsEnabled).toBe(true);

      expect(result.current.ui.sidebarOpen).toBe(false);
      expect(result.current.ui.timelineTab).toBe('ALL');

      expect(result.current.messages.selectedConversationId).toBe(null);
      expect(result.current.messages.draftMessages).toEqual({});
      expect(result.current.messages.ui.showNewMessageForm).toBe(false);
    });
  });

  describe('通知アクション', () => {
    it('setNotifications が通知を設定する', () => {
      const { result } = renderHook(() => useAppStore());

      const notifications: NotificationItem[] = [
        {
          id: '1',
          type: 'LIKE',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
        {
          id: '2',
          type: 'COMMENT',
          isRead: true,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
      ];

      act(() => {
        result.current.setNotifications(notifications);
      });

      expect(result.current.notifications.items).toEqual(notifications);
      expect(result.current.notifications.unreadCount).toBe(1);
      expect(result.current.notifications.error).toBe(null);
    });

    it('addNotification が新しい通知を追加する', () => {
      const { result } = renderHook(() => useAppStore());

      const notification1: NotificationItem = {
        id: '1',
        type: 'LIKE',
        isRead: false,
        createdAt: new Date().toISOString(),
      } as NotificationItem;

      const notification2: NotificationItem = {
        id: '2',
        type: 'COMMENT',
        isRead: false,
        createdAt: new Date().toISOString(),
      } as NotificationItem;

      act(() => {
        result.current.addNotification(notification1);
      });

      expect(result.current.notifications.items).toHaveLength(1);
      expect(result.current.notifications.unreadCount).toBe(1);

      act(() => {
        result.current.addNotification(notification2);
      });

      expect(result.current.notifications.items).toHaveLength(2);
      expect(result.current.notifications.unreadCount).toBe(2);
    });

    it('addNotification が重複する通知を追加しない', () => {
      const { result } = renderHook(() => useAppStore());

      const notification: NotificationItem = {
        id: '1',
        type: 'LIKE',
        isRead: false,
        createdAt: new Date().toISOString(),
      } as NotificationItem;

      act(() => {
        result.current.addNotification(notification);
      });

      act(() => {
        result.current.addNotification(notification);
      });

      expect(result.current.notifications.items).toHaveLength(1);
    });

    it('markNotificationsAsRead が通知を既読にする', () => {
      const { result } = renderHook(() => useAppStore());

      const notifications: NotificationItem[] = [
        {
          id: '1',
          type: 'LIKE',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
        {
          id: '2',
          type: 'COMMENT',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
      ];

      act(() => {
        result.current.setNotifications(notifications);
      });

      expect(result.current.notifications.unreadCount).toBe(2);

      act(() => {
        result.current.markNotificationsAsRead(['1']);
      });

      expect(result.current.notifications.items[0].isRead).toBe(true);
      expect(result.current.notifications.items[1].isRead).toBe(false);
      expect(result.current.notifications.unreadCount).toBe(1);
    });

    it('setNotificationCount が未読カウントを設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setNotificationCount(5);
      });

      expect(result.current.notifications.unreadCount).toBe(5);

      act(() => {
        result.current.setNotificationCount(-1);
      });

      expect(result.current.notifications.unreadCount).toBe(0);
    });

    it('clearNotifications が通知をクリアする', () => {
      const { result } = renderHook(() => useAppStore());

      const notifications: NotificationItem[] = [
        {
          id: '1',
          type: 'LIKE',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
      ];

      act(() => {
        result.current.setNotifications(notifications);
      });

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications.items).toEqual([]);
      expect(result.current.notifications.unreadCount).toBe(0);
      expect(result.current.notifications.isLoading).toBe(false);
      expect(result.current.notifications.error).toBe(null);
    });
  });

  describe('設定アクション', () => {
    it('updateSettings が設定を更新する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      expect(result.current.settings.theme).toBe('dark');

      act(() => {
        result.current.updateSettings({ locale: 'en', animationsEnabled: false });
      });

      expect(result.current.settings.locale).toBe('en');
      expect(result.current.settings.animationsEnabled).toBe(false);
    });

    it('resetSettings が設定をデフォルトにリセットする', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateSettings({
          theme: 'dark',
          locale: 'en',
          animationsEnabled: false,
        });
      });

      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.locale).toBe('ja');
      expect(result.current.settings.animationsEnabled).toBe(true);
    });
  });

  describe('UIアクション', () => {
    it('toggleSidebar がサイドバーの状態を切り替える', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.ui.sidebarOpen).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarOpen).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarOpen).toBe(false);
    });

    it('setTimelineTab がタイムラインタブを設定する', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.ui.timelineTab).toBe('ALL');

      act(() => {
        result.current.setTimelineTab('FOLLOWING');
      });

      expect(result.current.ui.timelineTab).toBe('FOLLOWING');

      act(() => {
        result.current.setTimelineTab('RECOMMENDED');
      });

      expect(result.current.ui.timelineTab).toBe('RECOMMENDED');
    });
  });

  describe('メッセージアクション', () => {
    it('setSelectedConversation が選択された会話を設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSelectedConversation('conversation-1');
      });

      expect(result.current.messages.selectedConversationId).toBe('conversation-1');
      expect(result.current.messages.lastAccessedAt).toBeTruthy();
      expect(result.current.messages.ui.showNewMessageForm).toBe(false);
    });

    it('setDraftMessage がドラフトメッセージを設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setDraftMessage('conversation-1', 'テストメッセージ');
      });

      expect(result.current.messages.draftMessages['conversation-1']).toBe('テストメッセージ');

      act(() => {
        result.current.setDraftMessage('conversation-2', '別のメッセージ');
      });

      expect(result.current.messages.draftMessages['conversation-2']).toBe('別のメッセージ');
      expect(result.current.messages.draftMessages['conversation-1']).toBe('テストメッセージ');
    });

    it('clearDraftMessage がドラフトメッセージをクリアする', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setDraftMessage('conversation-1', 'テストメッセージ');
        result.current.setDraftMessage('conversation-2', '別のメッセージ');
      });

      act(() => {
        result.current.clearDraftMessage('conversation-1');
      });

      expect(result.current.messages.draftMessages['conversation-1']).toBeUndefined();
      expect(result.current.messages.draftMessages['conversation-2']).toBe('別のメッセージ');
    });

    it('setNewMessageDraft が新規メッセージドラフトを設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setNewMessageDraft('user-1', '新規メッセージ');
      });

      expect(result.current.messages.newMessageDraft.recipientId).toBe('user-1');
      expect(result.current.messages.newMessageDraft.content).toBe('新規メッセージ');
    });

    it('clearNewMessageDraft が新規メッセージドラフトをクリアする', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setNewMessageDraft('user-1', '新規メッセージ');
      });

      act(() => {
        result.current.clearNewMessageDraft();
      });

      expect(result.current.messages.newMessageDraft.recipientId).toBe(null);
      expect(result.current.messages.newMessageDraft.content).toBe('');
    });

    it('setShowNewMessageForm が新規メッセージフォームの表示を制御する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSelectedConversation('conversation-1');
      });

      expect(result.current.messages.selectedConversationId).toBe('conversation-1');

      act(() => {
        result.current.setShowNewMessageForm(true);
      });

      expect(result.current.messages.ui.showNewMessageForm).toBe(true);
      expect(result.current.messages.selectedConversationId).toBe(null);

      act(() => {
        result.current.setShowNewMessageForm(false);
      });

      expect(result.current.messages.ui.showNewMessageForm).toBe(false);
    });

    it('setRecipientSearch が受信者検索文字列を設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setRecipientSearch('test');
      });

      expect(result.current.messages.ui.recipientSearch).toBe('test');
    });

    it('setSelectedRecipient が選択された受信者を設定する', () => {
      const { result } = renderHook(() => useAppStore());

      const recipient = {
        id: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
      };

      act(() => {
        result.current.setSelectedRecipient(recipient);
      });

      expect(result.current.messages.ui.selectedRecipient).toEqual(recipient);

      act(() => {
        result.current.setSelectedRecipient(null);
      });

      expect(result.current.messages.ui.selectedRecipient).toBe(null);
    });

    it('setMessageLoading がローディング状態を設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setMessageLoading(true);
      });

      expect(result.current.messages.ui.isLoading).toBe(true);

      act(() => {
        result.current.setMessageLoading(false);
      });

      expect(result.current.messages.ui.isLoading).toBe(false);
    });

    it('setMessageError がエラー状態を設定する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setMessageError('エラーが発生しました');
      });

      expect(result.current.messages.ui.error).toBe('エラーが発生しました');

      act(() => {
        result.current.setMessageError(null);
      });

      expect(result.current.messages.ui.error).toBe(null);
    });

    it('setShowConversationList が会話一覧の表示を制御する', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.messages.ui.showConversationList).toBe(true);

      act(() => {
        result.current.setShowConversationList(false);
      });

      expect(result.current.messages.ui.showConversationList).toBe(false);
    });

    it('clearMessageState がメッセージUI状態をクリアする', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setDraftMessage('conversation-1', 'テスト');
        result.current.setNewMessageDraft('user-1', '新規');
        result.current.setMessageLoading(true);
        result.current.setMessageError('エラー');
        result.current.setShowNewMessageForm(true);
        result.current.setRecipientSearch('test');
        result.current.setSelectedConversation('conversation-1');
      });

      act(() => {
        result.current.clearMessageState();
      });

      expect(result.current.messages.ui.isLoading).toBe(false);
      expect(result.current.messages.ui.error).toBe(null);
      expect(result.current.messages.ui.showNewMessageForm).toBe(false);
      expect(result.current.messages.ui.recipientSearch).toBe('');
      expect(result.current.messages.ui.selectedRecipient).toBe(null);

      // 永続化対象は保持される
      expect(result.current.messages.selectedConversationId).toBe('conversation-1');
      expect(result.current.messages.draftMessages['conversation-1']).toBe('テスト');
      expect(result.current.messages.newMessageDraft.recipientId).toBe('user-1');
    });

    it('cleanupOldDrafts が古いドラフトをクリアする', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setDraftMessage('conversation-1', 'テスト');
        result.current.setNewMessageDraft('user-1', '新規');
      });

      // 古いアクセス時刻を設定
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10日前

      act(() => {
        useAppStore.setState({
          messages: {
            ...result.current.messages,
            lastAccessedAt: oldDate.toISOString(),
          },
        });
      });

      act(() => {
        result.current.cleanupOldDrafts(7 * 24 * 60 * 60 * 1000); // 7日
      });

      expect(result.current.messages.draftMessages).toEqual({});
      expect(result.current.messages.newMessageDraft.recipientId).toBe(null);
      expect(result.current.messages.newMessageDraft.content).toBe('');
    });

    it('cleanupOldDrafts が最近のドラフトを保持する', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setDraftMessage('conversation-1', 'テスト');
        result.current.setNewMessageDraft('user-1', '新規');
      });

      // 最近のアクセス時刻を設定
      act(() => {
        result.current.setSelectedConversation('conversation-1');
      });

      act(() => {
        result.current.cleanupOldDrafts(7 * 24 * 60 * 60 * 1000); // 7日
      });

      expect(result.current.messages.draftMessages['conversation-1']).toBe('テスト');
      expect(result.current.messages.newMessageDraft.recipientId).toBe('user-1');
    });
  });

  describe('リセットアクション', () => {
    it('resetAll が全ての状態を初期状態にリセットする', () => {
      const { result } = renderHook(() => useAppStore());

      const notifications: NotificationItem[] = [
        {
          id: '1',
          type: 'LIKE',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
      ];

      act(() => {
        result.current.setNotifications(notifications);
        result.current.updateSettings({ theme: 'dark' });
        result.current.toggleSidebar();
        result.current.setSelectedConversation('conversation-1');
      });

      expect(result.current.notifications.items).toHaveLength(1);
      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.ui.sidebarOpen).toBe(true);
      expect(result.current.messages.selectedConversationId).toBe('conversation-1');

      act(() => {
        result.current.resetAll();
      });

      expect(result.current.notifications.items).toEqual([]);
      expect(result.current.notifications.unreadCount).toBe(0);
      expect(result.current.settings.theme).toBe('system');
      expect(result.current.ui.sidebarOpen).toBe(false);
      expect(result.current.messages.selectedConversationId).toBe(null);
    });
  });

  describe('連続実行のテスト', () => {
    it('通知の追加→既読→クリアのシーケンスを実行する', () => {
      const { result } = renderHook(() => useAppStore());

      const notifications: NotificationItem[] = [
        {
          id: '1',
          type: 'LIKE',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
        {
          id: '2',
          type: 'COMMENT',
          isRead: false,
          createdAt: new Date().toISOString(),
        } as NotificationItem,
      ];

      // 1. 通知を追加
      act(() => {
        result.current.setNotifications(notifications);
      });

      expect(result.current.notifications.unreadCount).toBe(2);

      // 2. 既読にする
      act(() => {
        result.current.markNotificationsAsRead(['1', '2']);
      });

      expect(result.current.notifications.unreadCount).toBe(0);

      // 3. クリアする
      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications.items).toEqual([]);
    });

    it('メッセージのドラフト→送信→クリアのシーケンスを実行する', () => {
      const { result } = renderHook(() => useAppStore());

      // 1. ドラフトを設定
      act(() => {
        result.current.setDraftMessage('conversation-1', 'テストメッセージ');
      });

      expect(result.current.messages.draftMessages['conversation-1']).toBe('テストメッセージ');

      // 2. ドラフトをクリア（送信後）
      act(() => {
        result.current.clearDraftMessage('conversation-1');
      });

      expect(result.current.messages.draftMessages['conversation-1']).toBeUndefined();
    });

    it('設定の更新→リセット→再更新のシーケンスを実行する', () => {
      const { result } = renderHook(() => useAppStore());

      // 1. 設定を更新
      act(() => {
        result.current.updateSettings({ theme: 'dark', locale: 'en' });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.locale).toBe('en');

      // 2. リセット
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.locale).toBe('ja');

      // 3. 再更新
      act(() => {
        result.current.updateSettings({ theme: 'light' });
      });

      expect(result.current.settings.theme).toBe('light');
    });
  });
});

describe('🎯 useMessageStore', () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
  });

  it('メッセージ関連の状態とアクションを返す', () => {
    const { result } = renderHook(() => useMessageStore());

    expect(result.current.messages).toBeDefined();
    expect(typeof result.current.setSelectedConversation).toBe('function');
    expect(typeof result.current.setDraftMessage).toBe('function');
    expect(typeof result.current.setNewMessageDraft).toBe('function');
    expect(typeof result.current.clearNewMessageDraft).toBe('function');
    expect(typeof result.current.setShowNewMessageForm).toBe('function');
    expect(typeof result.current.setRecipientSearch).toBe('function');
    expect(typeof result.current.setSelectedRecipient).toBe('function');
    expect(typeof result.current.setMessageLoading).toBe('function');
    expect(typeof result.current.setMessageError).toBe('function');
    expect(typeof result.current.setShowConversationList).toBe('function');
    expect(typeof result.current.clearMessageState).toBe('function');
    expect(typeof result.current.cleanupOldDrafts).toBe('function');
  });

  it('メッセージアクションが正しく動作する', () => {
    const { result } = renderHook(() => useMessageStore());

    act(() => {
      result.current.setDraftMessage('conversation-1', 'テスト');
    });

    expect(result.current.messages.draftMessages['conversation-1']).toBe('テスト');

    // useAppStoreから直接clearDraftMessageを呼び出す
    act(() => {
      useAppStore.getState().clearDraftMessage('conversation-1');
    });

    expect(result.current.messages.draftMessages['conversation-1']).toBeUndefined();
  });
});

describe('🎯 getAppState', () => {
  it('SSR安全に状態を取得する', () => {
    const state = getAppState();

    expect(state.notifications.items).toEqual([]);
    expect(state.notifications.unreadCount).toBe(0);
    expect(state.settings.theme).toBe('system');
    expect(state.ui.sidebarOpen).toBe(false);
    expect(state.messages.selectedConversationId).toBe(null);
  });

  it('変更された状態を取得する', () => {
    useAppStore.getState().updateSettings({ theme: 'dark' });

    const state = getAppState();

    expect(state.settings.theme).toBe('dark');
  });
});
