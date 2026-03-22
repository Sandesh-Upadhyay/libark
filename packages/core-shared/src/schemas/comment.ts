import { z } from 'zod';

// コメントベーススキーマ
export const CommentBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  isDeleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// コメントスキーマ
export const CommentSchema = CommentBaseSchema;

// コメント作成用スキーマ
export const CommentCreateSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

// コメント更新用スキーマ
export const CommentUpdateSchema = z.object({
  content: z.string().min(1).max(1000),
});

// コメント一覧取得用クエリスキーマ
export const CommentListQuerySchema = z.object({
  postId: z.string().uuid(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// コメント詳細（ユーザー情報付き）
export const CommentWithUserSchema = CommentBaseSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    profileImageId: z.string().nullable(),
  }),
});

// 型エクスポート
export type Comment = z.infer<typeof CommentSchema>;
export type CommentCreate = z.infer<typeof CommentCreateSchema>;
export type CommentUpdate = z.infer<typeof CommentUpdateSchema>;
export type CommentListQuery = z.infer<typeof CommentListQuerySchema>;
export type CommentWithUser = z.infer<typeof CommentWithUserSchema>;
