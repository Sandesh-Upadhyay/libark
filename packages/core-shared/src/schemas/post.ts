import { z } from 'zod';

import { PostVisibilitySchema } from './enums.js';
import { CursorPaginationSchema } from './common.js';

// 投稿ベーススキーマ
export const PostBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().nullable(),
  isProcessing: z.boolean(),
  visibility: PostVisibilitySchema,
  isDeleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// 投稿スキーマ
export const PostSchema = PostBaseSchema;

// 投稿作成用スキーマ
export const PostCreateSchema = z.object({
  content: z.string().optional(),
  visibility: PostVisibilitySchema.default('PUBLIC'),
  mediaIds: z.array(z.string().uuid()).optional(),
});

// 投稿更新用スキーマ
export const PostUpdateSchema = z
  .object({
    content: z.string(),
    visibility: PostVisibilitySchema,
  })
  .partial();

// 投稿削除用スキーマ
export const PostDeleteSchema = z.object({
  id: z.string().uuid(),
});

// 投稿一覧取得用スキーマ（従来型ページネーション）
export const PostListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  visibility: PostVisibilitySchema.optional(),
  postType: z.enum(['posts', 'liked', 'media']).optional().default('posts'),
});

// 投稿一覧取得用スキーマ（無限クエリ対応）
export const PostListCursorQuerySchema = CursorPaginationSchema.extend({
  userId: z.string().uuid().optional(),
  visibility: PostVisibilitySchema.optional(),
  postType: z.enum(['posts', 'liked', 'media']).optional().default('posts'),
});

// 型エクスポート
export type Post = z.infer<typeof PostSchema>;
export type PostCreate = z.infer<typeof PostCreateSchema>;
export type PostUpdate = z.infer<typeof PostUpdateSchema>;
export type PostDelete = z.infer<typeof PostDeleteSchema>;
export type PostListQuery = z.infer<typeof PostListQuerySchema>;
export type PostListCursorQuery = z.infer<typeof PostListCursorQuerySchema>;
