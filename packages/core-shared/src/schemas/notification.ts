import { z } from 'zod';

import { NotificationTypeSchema } from './enums.js';

// 通知ベーススキーマ
export const NotificationBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  actorId: z.string().uuid().nullable(),
  referenceId: z.string().uuid().nullable(),
  content: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.date(),
  readAt: z.date().nullable(),
});

// 通知スキーマ
export const NotificationSchema = NotificationBaseSchema;

// 通知作成用スキーマ
export const NotificationCreateSchema = z.object({
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  actorId: z.string().uuid().optional(),
  referenceId: z.string().uuid().optional(),
  content: z.string().optional(),
});

// 通知一覧取得用クエリスキーマ
export const NotificationListQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  isRead: z.boolean().optional(),
  type: NotificationTypeSchema.optional(),
});

// 通知詳細（アクター情報付き）
export const NotificationWithActorSchema = NotificationBaseSchema.extend({
  actor: z
    .object({
      id: z.string().uuid(),
      username: z.string(),
      displayName: z.string().nullable(),
      profileImageId: z.string().nullable(),
    })
    .nullable(),
});

// 通知マーク既読用スキーマ
export const NotificationMarkReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
  markAllAsRead: z.boolean().default(false),
});

// 型エクスポート
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationCreate = z.infer<typeof NotificationCreateSchema>;
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
export type NotificationWithActor = z.infer<typeof NotificationWithActorSchema>;
export type NotificationMarkRead = z.infer<typeof NotificationMarkReadSchema>;
