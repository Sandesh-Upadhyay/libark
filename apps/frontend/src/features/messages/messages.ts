/**
 * 💬 メッセージ関連GraphQLクエリ・ミューテーション・サブスクリプション
 * GraphQL Code Generatorで生成されたクエリを使用
 */

import {
  // クエリ
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetConversationMessagesQuery,
  useGetMessageStatsQuery,
  useSearchUsersQuery,

  // ミューテーション
  useSendMessageMutation,
  useCreateConversationMutation,
  useMarkAsReadMutation,
  useUpdateConversationMutation,
  useDeleteMessageMutation,
  useHideMessageMutation,

  // サブスクリプション
  useMessageAddedSubscription,
  useMessageReadSubscription,
  useConversationUpdatedSubscription,

  // 型定義
  type GetConversationsQuery,
  type GetConversationMessagesQuery,
  type SendMessageMutation,
  type DeleteMessageMutation,
  type HideMessageMutation,
  type SearchUsersQuery,
  type MessageInfoFragment,
  type ConversationInfoFragment,

  // 入力型
  type DeleteMessageInput,
  type HideMessageInput,
  type SendMessageInput,

  // Document定数
  GetConversationsDocument,
  GetConversationMessagesDocument,
  SendMessageDocument,
  SearchUsersDocument,
  MessageAddedDocument,
  ConversationUpdatedDocument,
  DeleteMessageDocument,
  HideMessageDocument,

  // その他の型
  type User as GraphQLUser,
  type Message as GraphQLMessage,
  type MessageStats as GraphQLMessageStats,
  type Conversation as GraphQLConversation,
} from '@libark/graphql-client';

// ================================
// 型定義（生成された型を使用）
// ================================

// 型エイリアスをエクスポート
export type Conversation = GraphQLConversation;
export type Message = GraphQLMessage;
export type User = GraphQLUser;
export type MessageStats = GraphQLMessageStats;

// 入力型のエクスポート
export type { DeleteMessageInput, HideMessageInput, SendMessageInput };

// レスポンス型のエクスポート
export type DeleteMessageResponse = DeleteMessageMutation;
export type HideMessageResponse = HideMessageMutation;
export type SendMessageResponse = SendMessageMutation;
export type SearchUsersResponse = SearchUsersQuery;
export type GetConversationsResponse = GetConversationsQuery;
export type GetConversationMessagesResponse = GetConversationMessagesQuery;

// ================================
// フック関数（生成されたフックを再エクスポート）
// ================================

// クエリフック
export {
  useGetConversationsQuery as useConversations,
  useGetConversationQuery as useConversation,
  useGetConversationMessagesQuery as useConversationMessages,
  useGetMessageStatsQuery as useMessageStats,
  useSearchUsersQuery as useSearchUsers,
};

// ミューテーションフック
export {
  useSendMessageMutation as useSendMessage,
  useCreateConversationMutation as useCreateConversation,
  useMarkAsReadMutation as useMarkAsRead,
  useUpdateConversationMutation as useUpdateConversation,
  useDeleteMessageMutation as useDeleteMessage,
  useHideMessageMutation as useHideMessage,
};

// サブスクリプションフック
export {
  useMessageAddedSubscription as useMessageAdded,
  useMessageReadSubscription as useMessageRead,
  useConversationUpdatedSubscription as useConversationUpdated,
};

// Document定数のエクスポート（後方互換性のため）
export {
  GetConversationsDocument as GET_CONVERSATIONS,
  GetConversationMessagesDocument as GET_CONVERSATION_MESSAGES,
  SendMessageDocument as SEND_MESSAGE,
  SearchUsersDocument as SEARCH_USERS,
  MessageAddedDocument as MESSAGE_ADDED_SUBSCRIPTION,
  ConversationUpdatedDocument as CONVERSATION_UPDATED_SUBSCRIPTION,
};

// ミューテーションDocument（後方互換性のため）
export { DeleteMessageDocument as DELETE_MESSAGE, HideMessageDocument as HIDE_MESSAGE };

// ================================
// ユーティリティ関数
// ================================

/**
 * メッセージの送信者が現在のユーザーかどうかを判定
 */
export const isMessageFromCurrentUser = (message: Message, currentUserId: string): boolean => {
  return message.senderId === currentUserId;
};

/**
 * 会話の最後のメッセージを取得
 */
export const getLastMessage = (
  conversation: ConversationInfoFragment
): MessageInfoFragment | null => {
  return conversation.lastMessage || null;
};

/**
 * 会話の未読メッセージ数を取得
 */
export const getUnreadCount = (conversation: ConversationInfoFragment): number => {
  return conversation.unreadCount || 0;
};

/**
 * 会話の参加者一覧を取得（現在のユーザーを除く）
 */
export const getOtherParticipants = (
  conversation: ConversationInfoFragment,
  currentUserId: string
): GraphQLUser[] => {
  return (conversation.activeParticipants?.filter(user => user.id !== currentUserId) ||
    []) as GraphQLUser[];
};

/**
 * 会話のタイトルを生成（1対1の場合は相手の名前、グループの場合はタイトル）
 */
export const getConversationTitle = (
  conversation: ConversationInfoFragment,
  currentUserId: string
): string => {
  if (conversation.title) {
    return conversation.title;
  }

  const otherParticipants = getOtherParticipants(conversation, currentUserId);
  if (otherParticipants.length === 1) {
    return otherParticipants[0].displayName || otherParticipants[0].username;
  }

  return `${otherParticipants.length}人のグループ`;
};

/**
 * メッセージの時刻フォーマット
 */
export const formatMessageTime = (createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('ja-JP', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

/**
 * メッセージが編集されているかどうかを判定
 */
export const isMessageEdited = (message: Message): boolean => {
  return !!message.editedAt;
};

/**
 * メッセージが削除されているかどうかを判定
 */
export const isMessageDeleted = (message: Message): boolean => {
  return !!message.deletedAt;
};

// ================================
// 定数
// ================================

export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
} as const;

export const CONVERSATION_TYPES = {
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
} as const;

export const PARTICIPANT_ROLES = {
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN',
} as const;

// ================================
// デフォルトエクスポート（後方互換性のため）
// ================================

export default {
  // フック
  useConversations: useGetConversationsQuery,
  useConversation: useGetConversationQuery,
  useConversationMessages: useGetConversationMessagesQuery,
  useMessageStats: useGetMessageStatsQuery,
  useSearchUsers: useSearchUsersQuery,
  useSendMessage: useSendMessageMutation,
  useCreateConversation: useCreateConversationMutation,
  useMarkAsRead: useMarkAsReadMutation,
  useUpdateConversation: useUpdateConversationMutation,
  useDeleteMessage: useDeleteMessageMutation,
  useHideMessage: useHideMessageMutation,
  useMessageAdded: useMessageAddedSubscription,
  useMessageRead: useMessageReadSubscription,
  useConversationUpdated: useConversationUpdatedSubscription,

  // ユーティリティ
  isMessageFromCurrentUser,
  getLastMessage,
  getUnreadCount,
  getOtherParticipants,
  getConversationTitle,
  formatMessageTime,
  isMessageEdited,
  isMessageDeleted,

  // 定数
  MESSAGE_TYPES,
  CONVERSATION_TYPES,
  PARTICIPANT_ROLES,
};
