import { z } from 'zod';

// 🎯 メディアステータス
export const MediaStatusSchema = z.enum([
  'PROCESSING', // 処理中（アップロード〜バリアント生成）
  'READY', // 利用可能
  'FAILED', // 失敗
]);

export type MediaStatus = z.infer<typeof MediaStatusSchema>;

// 🎯 バリアントタイプ（シンプル命名）
export const VariantTypeSchema = z.enum([
  'THUMB', // サムネイル (300x300)
  'MEDIUM', // 中サイズ (800x800)
  'LARGE', // 大サイズ (1200x1200)
  'BLUR', // ブラー用 (20x20) - Paid画像用
  'OGP', // OGP画像 (1200x630) - 投稿画像用
]);

export type VariantType = z.infer<typeof VariantTypeSchema>;

// 🎯 メディアタイプ（シンプル命名）
export const MediaTypeSchema = z.enum([
  'POST', // 投稿画像
  'AVATAR', // アバター画像
  'COVER', // カバー画像
  'OGP', // OGP画像
]);

export type MediaType = z.infer<typeof MediaTypeSchema>;

/**
 * 🎯 メディアスキーマ（シンプル命名）
 */
export const MediaSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid().nullable(),

  // 基本情報
  filename: z.string().min(1).max(255),
  s3Key: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),

  // メディアタイプ
  type: MediaTypeSchema,

  // 処理・配信制御
  status: MediaStatusSchema,

  // タイムスタンプ
  createdAt: z.date(),
  updatedAt: z.date(),

  // バリアント
  variants: z.array(z.unknown()).optional(), // MediaVariantSchemaで定義
});

export type Media = z.infer<typeof MediaSchema>;

/**
 * 🎯 バリアントスキーマ（シンプル命名）
 */
export const MediaVariantSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
  type: VariantTypeSchema, // バリアントタイプ
  s3Key: z.string().min(1).max(500),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileSize: z.number().int().positive(),
  quality: z.number().int().min(1).max(100),
  createdAt: z.date(),
});

export type MediaVariant = z.infer<typeof MediaVariantSchema>;

/**
 * GraphQL用のMediaVariant schema (フロントエンド用)
 */
export const GraphQLMediaVariantSchema = z.object({
  id: z.string().uuid(),
  variantType: z.string(), // GraphQLでは文字列として送信
  s3Key: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  size: z.number().int().positive().optional(),
  quality: z.number().int().min(1).max(100).optional(),
  format: z.string().min(1),
  url: z.string().url().optional(),
  createdAt: z.string(), // GraphQLでは文字列として送信
});

export type GraphQLMediaVariant = z.infer<typeof GraphQLMediaVariantSchema>;

/**
 * 🎯 スキーマ検証関数（シンプル命名）
 */
export function validateMedia(data: unknown): Media {
  return MediaSchema.parse(data);
}

export function validateMediaVariant(data: unknown): MediaVariant {
  return MediaVariantSchema.parse(data);
}

export function validateGraphQLMediaVariant(data: unknown): GraphQLMediaVariant {
  return GraphQLMediaVariantSchema.parse(data);
}

export function validateVariantType(variantType: string): boolean {
  try {
    VariantTypeSchema.parse(variantType);
    return true;
  } catch {
    return false;
  }
}

export function validateMediaType(mediaType: string): boolean {
  try {
    MediaTypeSchema.parse(mediaType);
    return true;
  } catch {
    return false;
  }
}

export function validateMediaStatus(status: string): boolean {
  try {
    MediaStatusSchema.parse(status);
    return true;
  } catch {
    return false;
  }
}

/**
 * バリアント配列検証関数
 */
export function validateMediaVariants(data: unknown): MediaVariant[] {
  return z.array(MediaVariantSchema).parse(data);
}

export function validateGraphQLMediaVariants(data: unknown): GraphQLMediaVariant[] {
  return z.array(GraphQLMediaVariantSchema).parse(data);
}

/**
 * S3キー検証関数
 */
export function validateS3Key(s3Key: string): boolean {
  try {
    z.string().min(1).max(500).parse(s3Key);
    return true;
  } catch {
    return false;
  }
}

/**
 * 🎯 バリアントタイプマッピングは@libark/core-sharedの統一設定システムに移行済み
 *
 * 使用方法:
 * import { getVariantConfigs } from '@libark/core-shared';
 * const configs = getVariantConfigs('post');
 */

/**
 * 🎯 バリアント設定は@libark/core-sharedの統一設定システムに移行済み
 *
 * 使用方法:
 * import { getVariantConfigs, getSpecialVariantConfigs } from '@libark/core-shared';
 * const configs = getVariantConfigs('post');
 * const specialConfigs = getSpecialVariantConfigs();
 */
