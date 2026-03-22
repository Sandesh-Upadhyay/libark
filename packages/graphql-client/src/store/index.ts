/**
 * 🎯 統合状態管理ストア（GraphQL認証統一完了版）
 *
 * UI状態・設定・通知のみを管理:
 * - 通知状態
 * - ユーザー設定
 * - UI状態
 *
 * ✅ 認証状態は完全にGraphQL（useMeQuery）で統一管理
 * ✅ Zustandから認証関連コードを完全削除
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// 型定義（GraphQL生成型を使用）
import type { NotificationsQuery } from '../generated/graphql.js';

// GraphQLクエリの結果型を使用
type NotificationItem = NonNullable<NotificationsQuery['notifications']>[number];

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  animationsEnabled: boolean;
  locale: string;
  contentFilter: 'all' | 'following' | 'nsfw-safe';
  displayMode: 'card' | 'list';
  timezone: string;
}

// メッセージ関連の型定義
export interface MessageUser {
  id: string;
  username: string;
  displayName?: string | null;
  profileImageId?: string | null;
  isVerified?: boolean;
}

export interface MessageState {
  // 選択された会話ID（永続化対象）
  selectedConversationId: string | null;

  // 入力中のメッセージ内容（永続化対象）
  draftMessages: Record<string, string>; // conversationId -> message content

  // 新しいメッセージフォーム用の下書き（永続化対象）
  newMessageDraft: {
    recipientId: string | null;
    content: string;
  };

  // セッション内のみの状態（永続化対象外）
  ui: {
    showNewMessageForm: boolean;
    recipientSearch: string;
    selectedRecipient: MessageUser | null;
    isLoading: boolean;
    error: string | null;
    // モバイル表示制御（セッション内のみ）
    showConversationList: boolean;
  };

  // 最後にアクセスした時刻（永続化対象）
  lastAccessedAt: string | null;
}

// 統合状態の型定義（認証状態削除版）
export interface AppState {
  // 通知状態
  notifications: {
    items: NotificationItem[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
  };

  // ユーザー設定
  settings: UserSettings;

  // UI状態
  ui: {
    sidebarOpen: boolean;
    timelineTab: 'FOLLOWING' | 'RECOMMENDED' | 'ALL';
  };

  // メッセージ状態
  messages: MessageState;
}

// アクションの型定義（GraphQL統合版 - 認証関連削除）
export interface AppActions {
  // 通知アクション
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  markNotificationsAsRead: (ids: string[]) => void;
  setNotificationCount: (count: number) => void;
  clearNotifications: () => void;

  // 設定アクション
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;

  // UIアクション
  toggleSidebar: () => void;
  setTimelineTab: (tab: 'FOLLOWING' | 'RECOMMENDED' | 'ALL') => void;

  // メッセージアクション
  setSelectedConversation: (conversationId: string | null) => void;
  setDraftMessage: (conversationId: string, content: string) => void;
  clearDraftMessage: (conversationId: string) => void;
  setNewMessageDraft: (recipientId: string | null, content: string) => void;
  clearNewMessageDraft: () => void;
  setShowNewMessageForm: (show: boolean) => void;
  setRecipientSearch: (search: string) => void;
  setSelectedRecipient: (recipient: MessageUser | null) => void;
  setMessageLoading: (loading: boolean) => void;
  setMessageError: (error: string | null) => void;
  setShowConversationList: (show: boolean) => void;
  clearMessageState: () => void;
  cleanupOldDrafts: (maxAge?: number) => void;

  // リセット
  resetAll: () => void;
}

type AppStore = AppState & AppActions;

// デフォルト値
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  animationsEnabled: true,
  locale: 'ja',
  contentFilter: 'all',
  displayMode: 'card',
  timezone: 'Asia/Tokyo',
};

const DEFAULT_MESSAGE_STATE: MessageState = {
  selectedConversationId: null,
  draftMessages: {},
  newMessageDraft: {
    recipientId: null,
    content: '',
  },
  ui: {
    showNewMessageForm: false,
    recipientSearch: '',
    selectedRecipient: null,
    isLoading: false,
    error: null,
    showConversationList: true, // デフォルトでは会話一覧を表示
  },
  lastAccessedAt: null,
};

const INITIAL_STATE: AppState = {
  notifications: {
    items: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  },
  settings: DEFAULT_SETTINGS,
  ui: {
    sidebarOpen: false,
    timelineTab: 'ALL',
  },
  messages: DEFAULT_MESSAGE_STATE,
};

// SSR安全なストレージ
const createSafeStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

/**
 * 🎯 統合アプリケーションストア（Redux DevTools対応版）
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // 通知アクション
        setNotifications: items => {
          const unreadCount = items.filter(n => !n.isRead).length;
          set(
            state => ({
              notifications: {
                ...state.notifications,
                items,
                unreadCount,
                error: null,
              },
            }),
            false,
            'setNotifications'
          );
        },

        addNotification: notification => {
          set(
            state => {
              const exists = state.notifications.items.some(n => n.id === notification.id);
              if (exists) return state;

              const newItems = [notification, ...state.notifications.items];
              const unreadCount = newItems.filter(n => !n.isRead).length;

              return {
                notifications: {
                  ...state.notifications,
                  items: newItems,
                  unreadCount,
                },
              };
            },
            false,
            'addNotification'
          );
        },

        markNotificationsAsRead: ids => {
          set(
            state => {
              const updatedItems = state.notifications.items.map(notification =>
                ids.includes(notification.id) ? { ...notification, isRead: true } : notification
              );

              const unreadCount = updatedItems.filter(n => !n.isRead).length;

              return {
                notifications: {
                  ...state.notifications,
                  items: updatedItems,
                  unreadCount,
                },
              };
            },
            false,
            'markNotificationsAsRead'
          );
        },

        setNotificationCount: count => {
          set(
            state => ({
              notifications: {
                ...state.notifications,
                unreadCount: Math.max(0, count),
              },
            }),
            false,
            'setNotificationCount'
          );
        },

        clearNotifications: () => {
          set(
            () => ({
              notifications: {
                items: [],
                unreadCount: 0,
                isLoading: false,
                error: null,
              },
            }),
            false,
            'clearNotifications'
          );
        },

        // 設定アクション
        updateSettings: newSettings => {
          set(
            state => ({
              settings: { ...state.settings, ...newSettings },
            }),
            false,
            `updateSettings: ${JSON.stringify(newSettings)}`
          );

          // 言語設定が変更された場合、i18n と同期
          if (newSettings.locale && typeof window !== 'undefined') {
            // i18n の言語設定を更新
            import('i18next')
              .then(i18n => {
                if (i18n.default.language !== newSettings.locale) {
                  i18n.default.changeLanguage(newSettings.locale);
                }
              })
              .catch(console.warn);

            // localStorage の i18n 設定も更新
            localStorage.setItem('libark-language', newSettings.locale);
          }
        },

        resetSettings: () => {
          set(
            () => ({
              settings: DEFAULT_SETTINGS,
            }),
            false,
            'resetSettings'
          );
        },

        // UIアクション
        toggleSidebar: () => {
          set(
            state => ({
              ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
            }),
            false,
            'toggleSidebar'
          );
        },

        setTimelineTab: tab => {
          set(
            state => ({
              ui: { ...state.ui, timelineTab: tab },
            }),
            false,
            `setTimelineTab: ${tab}`
          );
        },

        // メッセージアクション
        setSelectedConversation: conversationId => {
          set(
            state => ({
              messages: {
                ...state.messages,
                selectedConversationId: conversationId,
                lastAccessedAt: new Date().toISOString(),
                ui: {
                  ...state.messages.ui,
                  showNewMessageForm: false, // 会話選択時は新規メッセージフォームを閉じる
                },
              },
            }),
            false,
            `setSelectedConversation: ${conversationId}`
          );
        },

        setDraftMessage: (conversationId, content) => {
          set(
            state => ({
              messages: {
                ...state.messages,
                draftMessages: {
                  ...state.messages.draftMessages,
                  [conversationId]: content,
                },
              },
            }),
            false,
            `setDraftMessage: ${conversationId}`
          );
        },

        clearDraftMessage: conversationId => {
          set(
            state => {
              const { [conversationId]: removed, ...remainingDrafts } =
                state.messages.draftMessages;
              return {
                messages: {
                  ...state.messages,
                  draftMessages: remainingDrafts,
                },
              };
            },
            false,
            `clearDraftMessage: ${conversationId}`
          );
        },

        setNewMessageDraft: (recipientId, content) => {
          set(
            state => ({
              messages: {
                ...state.messages,
                newMessageDraft: {
                  recipientId,
                  content,
                },
              },
            }),
            false,
            `setNewMessageDraft: ${recipientId}`
          );
        },

        clearNewMessageDraft: () => {
          set(
            state => ({
              messages: {
                ...state.messages,
                newMessageDraft: {
                  recipientId: null,
                  content: '',
                },
              },
            }),
            false,
            'clearNewMessageDraft'
          );
        },

        setShowNewMessageForm: show => {
          set(
            state => ({
              messages: {
                ...state.messages,
                selectedConversationId: show ? null : state.messages.selectedConversationId, // 新規メッセージフォーム表示時は会話選択を解除
                ui: {
                  ...state.messages.ui,
                  showNewMessageForm: show,
                },
              },
            }),
            false,
            `setShowNewMessageForm: ${show}`
          );
        },

        setRecipientSearch: search => {
          set(
            state => ({
              messages: {
                ...state.messages,
                ui: {
                  ...state.messages.ui,
                  recipientSearch: search,
                },
              },
            }),
            false,
            `setRecipientSearch: ${search}`
          );
        },

        setSelectedRecipient: recipient => {
          set(
            state => ({
              messages: {
                ...state.messages,
                ui: {
                  ...state.messages.ui,
                  selectedRecipient: recipient,
                },
              },
            }),
            false,
            `setSelectedRecipient: ${recipient?.id || 'null'}`
          );
        },

        setMessageLoading: loading => {
          set(
            state => ({
              messages: {
                ...state.messages,
                ui: {
                  ...state.messages.ui,
                  isLoading: loading,
                },
              },
            }),
            false,
            `setMessageLoading: ${loading}`
          );
        },

        setMessageError: error => {
          set(
            state => ({
              messages: {
                ...state.messages,
                ui: {
                  ...state.messages.ui,
                  error,
                },
              },
            }),
            false,
            `setMessageError: ${error || 'null'}`
          );
        },

        setShowConversationList: show => {
          set(
            state => ({
              messages: {
                ...state.messages,
                ui: {
                  ...state.messages.ui,
                  showConversationList: show,
                },
              },
            }),
            false,
            `setShowConversationList: ${show}`
          );
        },

        clearMessageState: () => {
          set(
            state => ({
              messages: {
                ...DEFAULT_MESSAGE_STATE,
                // 永続化対象は保持
                selectedConversationId: state.messages.selectedConversationId,
                draftMessages: state.messages.draftMessages,
                newMessageDraft: state.messages.newMessageDraft,
                lastAccessedAt: state.messages.lastAccessedAt,
              },
            }),
            false,
            'clearMessageState'
          );
        },

        cleanupOldDrafts: (maxAge = 7 * 24 * 60 * 60 * 1000) => {
          try {
            // デフォルト7日間のドラフトを削除
            set(
              state => {
                const now = Date.now();
                const lastAccessed = state.messages.lastAccessedAt
                  ? new Date(state.messages.lastAccessedAt).getTime()
                  : now;

                // 最後のアクセスから指定時間経過している場合はドラフトをクリア
                if (now - lastAccessed > maxAge) {
                  return {
                    messages: {
                      ...state.messages,
                      draftMessages: {},
                      newMessageDraft: {
                        recipientId: null,
                        content: '',
                      },
                    },
                  };
                }

                return state;
              },
              false,
              `cleanupOldDrafts: maxAge=${maxAge}`
            );
          } catch (error) {
            console.error('❌ [MessageStore] クリーンアップエラー:', error);
            // エラーが発生してもアプリケーションを停止させない
          }
        },

        // 全リセット
        resetAll: () => {
          set(INITIAL_STATE, false, 'resetAll');
        },
      }),
      {
        name: 'libark-user-settings', // HTML と統一
        storage: createJSONStorage(() => createSafeStorage()),
        partialize: state => ({
          settings: state.settings,
          ui: {
            timelineTab: state.ui.timelineTab,
          },
          messages: {
            selectedConversationId: state.messages.selectedConversationId,
            draftMessages: state.messages.draftMessages,
            newMessageDraft: state.messages.newMessageDraft,
            lastAccessedAt: state.messages.lastAccessedAt,
            // UI状態は永続化しない（セッション内のみ）
          },
        }),
        // 永続化の詳細設定
        version: 3, // ui.theme削除でバージョンアップ
        migrate: (persistedState: unknown, version: number) => {
          const state = persistedState as Partial<AppState>;
          // バージョン管理による安全なマイグレーション
          if (version === 0) {
            return {
              ...state,
              settings: {
                ...DEFAULT_SETTINGS,
                ...state.settings,
              },
              messages: DEFAULT_MESSAGE_STATE,
            };
          }
          if (version === 1) {
            // v1からv2への移行：メッセージ状態を追加
            return {
              ...state,
              messages: {
                ...DEFAULT_MESSAGE_STATE,
                ...state.messages,
              },
            };
          }
          if (version === 2) {
            // v2からv3への移行：ui.themeを削除
            const { ui, ...rest } = state as { ui?: { theme?: string } & Record<string, unknown> };
            const { theme, ...uiWithoutTheme } = ui || {};
            return {
              ...rest,
              ui: uiWithoutTheme,
              messages: {
                ...DEFAULT_MESSAGE_STATE,
                ...state.messages,
                ui: {
                  ...DEFAULT_MESSAGE_STATE.ui,
                  ...state.messages?.ui,
                },
              },
            };
          }
          // 既存の状態にデフォルト値をマージして安全性を確保
          return {
            ...state,
            messages: {
              ...DEFAULT_MESSAGE_STATE,
              ...state.messages,
              ui: {
                ...DEFAULT_MESSAGE_STATE.ui,
                ...state.messages?.ui,
              },
            },
          };
        },
        onRehydrateStorage: () => state => {
          // ストア復元後にメッセージ状態が正しく初期化されているか確認
          if (state && (!state.messages || !state.messages.ui)) {
            state.messages = {
              ...DEFAULT_MESSAGE_STATE,
              ...state.messages,
              ui: {
                ...DEFAULT_MESSAGE_STATE.ui,
                ...state.messages?.ui,
              },
            };
          }
        },
      }
    ),
    {
      name: 'LIBARK Store', // Redux DevToolsでの表示名
      enabled: process.env.NODE_ENV === 'development', // 開発環境でのみ有効
    }
  )
);

/**
 * 🎯 SSR安全な状態取得
 */
export function getAppState() {
  if (typeof window === 'undefined') {
    return INITIAL_STATE;
  }
  return useAppStore.getState();
}

/**
 * 🎯 メッセージ状態専用セレクターフック（パフォーマンス最適化）
 */
export function useMessageStore() {
  const messages = useAppStore(state => state.messages);
  const setSelectedConversation = useAppStore(state => state.setSelectedConversation);
  const setDraftMessage = useAppStore(state => state.setDraftMessage);
  const setNewMessageDraft = useAppStore(state => state.setNewMessageDraft);
  const clearNewMessageDraft = useAppStore(state => state.clearNewMessageDraft);
  const setShowNewMessageForm = useAppStore(state => state.setShowNewMessageForm);
  const setRecipientSearch = useAppStore(state => state.setRecipientSearch);
  const setSelectedRecipient = useAppStore(state => state.setSelectedRecipient);
  const setMessageLoading = useAppStore(state => state.setMessageLoading);
  const setMessageError = useAppStore(state => state.setMessageError);
  const setShowConversationList = useAppStore(state => state.setShowConversationList);
  const clearMessageState = useAppStore(state => state.clearMessageState);
  const cleanupOldDrafts = useAppStore(state => state.cleanupOldDrafts);

  return {
    messages,
    setSelectedConversation,
    setDraftMessage,
    setNewMessageDraft,
    clearNewMessageDraft,
    setShowNewMessageForm,
    setRecipientSearch,
    setSelectedRecipient,
    setMessageLoading,
    setMessageError,
    setShowConversationList,
    clearMessageState,
    cleanupOldDrafts,
  };
}

/**
 * 🔧 開発環境でのデバッグ用グローバル公開
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).libarkStore = useAppStore;
  (window as any).getAppState = getAppState;

  // Redux DevToolsでの確認用ヘルパー
  (window as any).debugStore = {
    getState: () => useAppStore.getState(),
    setState: (newState: Partial<AppState>) => useAppStore.setState(newState),
    resetStore: () => useAppStore.getState().resetAll(),
    // テーマ切り替えテスト用
    testTheme: (theme: 'light' | 'dark' | 'system') => {
      useAppStore.getState().updateSettings({ theme });
      console.log('🎨 テーマ変更テスト:', theme, useAppStore.getState().settings.theme);
    },
  };

  console.log('🔧 開発モード: ストアデバッグ機能が利用可能です');
  console.log('  - window.libarkStore: Zustandストア');
  console.log('  - window.debugStore: デバッグヘルパー');
  console.log('  - window.debugStore.testTheme("dark"): テーマ切り替えテスト');
}

/**
 * 🎯 設定の初期化と同期
 *
 * ページロード時にローカルストレージと i18n の設定を同期
 */
export function initializeSettings() {
  if (typeof window === 'undefined') return;

  try {
    const state = useAppStore.getState();
    const { settings } = state;

    // i18n の言語設定を同期
    import('i18next')
      .then(i18n => {
        // ローカルストレージから i18n の言語設定を取得
        const i18nLanguage = localStorage.getItem('libark-language') || 'ja';

        // Zustand ストアの locale と i18n の言語が異なる場合は同期
        if (settings.locale !== i18nLanguage) {
          // より新しい設定を優先（Zustand ストアの方が新しいと仮定）
          i18n.default.changeLanguage(settings.locale);
          localStorage.setItem('libark-language', settings.locale);
        } else if (i18n.default.language !== settings.locale) {
          // i18n の設定を Zustand ストアに反映
          useAppStore.getState().updateSettings({ locale: i18nLanguage });
        }
      })
      .catch(console.warn);
  } catch (error) {
    console.warn('設定の初期化に失敗しました:', error);
  }
}
