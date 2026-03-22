import { z } from 'zod';

import { MediaStatusSchema, MediaTypeSchema } from './enums.js';

// メディアベーススキーマ（Prismaスキーマ準拠）
export const MediaBaseSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  s3Key: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  type: MediaTypeSchema,
  status: MediaStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// メディアスキーマ
export const MediaSchema = MediaBaseSchema;

// メディア作成用スキーマ
export const MediaUploadSchema = z.object({
  postId: z.string().uuid().nullable().optional(),
  filename: z.string().min(1).max(255),
  s3Key: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  type: MediaTypeSchema,
});

// メディア更新用スキーマ
export const MediaUpdateSchema = z
  .object({
    filename: z.string().min(1).max(255),
    s3Key: z.string().min(1).max(500),
    mimeType: z.string().min(1).max(100),
    fileSize: z.number().int().positive(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    status: MediaStatusSchema,
    type: MediaTypeSchema,
  })
  .partial();

// メディア処理ステータス更新用スキーマ
export const MediaProcessingUpdateSchema = z
  .object({
    id: z.string().uuid(),
    status: MediaStatusSchema,
    fileSize: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .partial();

// メディア一覧取得用スキーマ
export const MediaListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  postId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: MediaStatusSchema.optional(),
  type: MediaTypeSchema.optional(),
});

// 型エクスポート
export type Media = z.infer<typeof MediaSchema>;
export type MediaUpload = z.infer<typeof MediaUploadSchema>;
export type MediaUpdate = z.infer<typeof MediaUpdateSchema>;
export type MediaProcessingUpdate = z.infer<typeof MediaProcessingUpdateSchema>;
export type MediaListQuery = z.infer<typeof MediaListQuerySchema>;
