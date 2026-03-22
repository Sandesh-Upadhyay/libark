/**
 * 🎯 LIBARK GraphQL Client - 統合版
 *
 * GraphQL + 状態管理 + 認証の統合パッケージ
 */

// Apollo Client Core
export {
  useQuery,
  useMutation,
  useSubscription,
  useLazyQuery,
} from '@apollo/client/react/hooks/index.js';
export { useApolloClient } from '@apollo/client';
export { ApolloProvider } from '@apollo/client/react/index.js';
export { gql, InMemoryCache, createHttpLink, from, split } from '@apollo/client/core/index.js';

// GraphQL Client
export {
  apolloClient,
  getApolloClient,
  clearApolloCache,
  evictPostFromCache,
  evictMediaFromCache,
  optimizeApolloMemory,
  resetApolloClient,
} from './apollo/index.js';

// 統合状態管理
export { useAppStore, getAppState, initializeSettings, useMessageStore } from './store/index.js';
export type {
  AppState,
  AppActions,
  UserSettings,
  MessageState,
  MessageUser,
} from './store/index.js';

// 認証システム
export { AuthProvider, useAuth } from './auth/AuthProvider.js';
export type { AuthState } from './auth/AuthProvider.js';

export {
  useNotifications,
  useNotificationCount,
  useRealtimeNotifications,
} from './hooks/useNotifications.js';
export {
  useNotificationSubscriptions,
  useUnifiedNotificationSubscriptions,
} from './hooks/useNotificationSubscriptions.js';
export { useUserSettings, useTheme, useSettingsInitializer } from './hooks/useUserSettings.js';

// グローバルローディングフック
export { useGlobalLoading, useLoadingState, LoadingContext } from './hooks/useGlobalLoading.js';
export type { LoadingContextType } from './hooks/useGlobalLoading.js';

// 統合プロバイダー
export { GraphQLProvider, ThemeProvider, AppProvider } from './providers/GraphQLProvider.js';

// Generated GraphQL & Legacy Hooks
export * from './generated/graphql';
export * from './hooks/index.js';

// GraphQLフラグメント
export * from './fragments/index.js';

// ユーティリティ
export * from './utils/index.js';

// Paid機能関連
export {
  PURCHASE_POST,
  UPDATE_POST_TO_PAID,
  type PurchasePostInput,
  type UpdatePostToPaidInput,
  type PostPurchase,
} from './mutations/paid.js';

// Media関連
export { CHECK_POST_PURCHASE_STATUS } from './mutations/media.js';

// Cache Management - PresignedUrlCacheManagerは削除済み
// Apollo Clientに統一

// Provider Singleton Management - 削除済み（簡素化）

// 統一ログシステム（@libark/core-sharedから使用）
// authLogger は削除済み - unifiedLoggerHelpers を使用してください

// Unified Notification Service - 削除済み（簡素化）

// 生成されたGraphQLクエリ・ミューテーション・サブスクリプション
export * from './generated/graphql.js';

// 型定義
export type { ConversationParticipant, Conversation } from './types/messages.js';

// GraphQL生成型を使用
export type { User, Message, MessageStats, Comment } from './generated/graphql.js';
