/**
 * 🔔 通知システム統一型定義
 *
 * 責任:
 * - 通知タイプの統一管理
 * - 型安全性の確保
 * - ビジネスロジックの分離
 */

import { z } from 'zod';

// 🎯 通知システム定数
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// 通知タイプ列挙型
export const NotificationType = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  FOLLOW: 'FOLLOW',
  POST_PROCESSING_COMPLETED: 'POST_PROCESSING_COMPLETED', // 廃止済み（Postは即座に処理されるため不要）
  POST_PROCESSING_FAILED: 'POST_PROCESSING_FAILED',
  COMMENT_PROCESSING_COMPLETED: 'COMMENT_PROCESSING_COMPLETED',
  COMMENT_PROCESSING_FAILED: 'COMMENT_PROCESSING_FAILED',
  AVATAR_PROCESSING_COMPLETED: 'AVATAR_PROCESSING_COMPLETED',
  AVATAR_PROCESSING_FAILED: 'AVATAR_PROCESSING_FAILED',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

// 後方互換性のためのエイリアス
export type NotificationData = INotificationData;

// 通知データインターフェース
export interface INotificationData {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  content: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
  actorId?: string | null;
  referenceId?: string | null;
  actor?: INotificationActor | null;
}

export interface INotificationActor {
  id: string;
  username: string;
  displayName?: string | null;
  profileImageId?: string | null;
}

// 通知作成データ
export interface ICreateNotificationData {
  userId: string;
  type: NotificationTypeValue;
  content: string;
  actorId?: string;
  referenceId?: string;
}

// 通知フィルター
export interface INotificationFilter {
  isRead?: boolean;
  type?: NotificationTypeValue;
  limit?: number;
  after?: string;
}

// 通知カウント
export interface INotificationCount {
  total: number;
  unread: number;
}

// Zodスキーマ
export const NotificationDataSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  content: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
  readAt: z.date().nullable().optional(),
  actorId: z.string().uuid().nullable().optional(),
  referenceId: z.string().uuid().nullable().optional(),
});

export const CreateNotificationDataSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  content: z.string(),
  actorId: z.string().uuid().optional(),
  referenceId: z.string().uuid().optional(),
});

export const NotificationFilterSchema = z.object({
  isRead: z.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
  after: z.string().optional(),
});
