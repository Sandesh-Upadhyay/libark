import { z } from 'zod';

// Prismaのenumに対応するZodスキーマ
export const MediaStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);

export const MediaVariantSchema = z.enum(['ORIGINAL', 'THUMB', 'MEDIUM', 'LARGE', 'BLUR', 'OGP']);

export const PostVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE', 'FOLLOWERS', 'PAID']);

export const NotificationTypeSchema = z.enum([
  'LIKE',
  'COMMENT',
  'FOLLOW',
  'POST_PROCESSING_COMPLETED',
  'POST_PROCESSING_FAILED',
  'COMMENT_PROCESSING_COMPLETED',
  'COMMENT_PROCESSING_FAILED',
  'AVATAR_PROCESSING_COMPLETED',
  'AVATAR_PROCESSING_FAILED',
  'WALLET_DEPOSIT_COMPLETED',
  'WALLET_WITHDRAWAL_COMPLETED',
  'WALLET_WITHDRAWAL_FAILED',
  'P2P_TRADE_CREATED',
  'P2P_TRADE_MATCHED',
  'P2P_PAYMENT_SENT',
  'P2P_TRADE_COMPLETED',
  'P2P_TRADE_CANCELLED',
  'P2P_TRADE_TIMEOUT',
]);

export const MediaTypeSchema = z.enum(['POST', 'AVATAR', 'COVER', 'OGP']);

// 型エクスポート
export type MediaStatus = z.infer<typeof MediaStatusSchema>;
export type MediaVariant = z.infer<typeof MediaVariantSchema>;
export type PostVisibility = z.infer<typeof PostVisibilitySchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;

// 型安全な定数エクスポート
export const MEDIA_STATUS = {
  PENDING: 'PENDING' as const,
  PROCESSING: 'PROCESSING' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
} as const;

export const MEDIA_VARIANT = {
  ORIGINAL: 'ORIGINAL' as const,
  THUMB: 'THUMB' as const,
  MEDIUM: 'MEDIUM' as const,
  LARGE: 'LARGE' as const,
  BLUR: 'BLUR' as const,
  OGP: 'OGP' as const,
} as const;

export const POST_VISIBILITY = {
  PUBLIC: 'PUBLIC' as const,
  PRIVATE: 'PRIVATE' as const,
  FOLLOWERS: 'FOLLOWERS' as const,
  PAID: 'PAID' as const,
} as const;

export const MEDIA_TYPE = {
  POST: 'POST' as const,
  AVATAR: 'AVATAR' as const,
  COVER: 'COVER' as const,
  OGP: 'OGP' as const,
} as const;
