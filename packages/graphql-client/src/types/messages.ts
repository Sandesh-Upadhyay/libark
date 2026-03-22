/**
 * 🎯 メッセージ機能型定義
 *
 * GraphQL統一パッケージでのメッセージ関連型定義
 */

import type { UserInfoFragment } from '../generated/graphql.js';

export interface ConversationParticipant {
  user: UserInfoFragment;
  role?: string;
  isActive?: boolean;
  unreadCount?: number;
}

// Message型はGraphQL生成型を使用

export interface Conversation {
  id: string;
  title?: string;
  type: string;
  participantCount: number;
  unreadCount?: number;
  participants: ConversationParticipant[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
  };
  creator?: UserInfoFragment;
  activeParticipants?: UserInfoFragment[];
}

// MessageStats型はGraphQL生成型を使用

// 認証ユーザー情報はGraphQL生成型のUserを使用

// Comment型はGraphQL生成型を使用
