/**
 * 🔒 環境変数スキーマ定義
 *
 * Zodを使用した型安全な環境変数バリデーション
 * 起動時に全ての必須環境変数をチェックし、型安全性を保証
 */

import { z } from 'zod';

import { SUPPORTED_IMAGE_FORMATS } from './constants.js';

// バリデーション関連の定数
const MIN_SECRET_LENGTH = 10;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const RADIX_DECIMAL = 10;
const _ENCRYPTION_KEY_LENGTH = 64;
const _ENCRYPTION_IV_LENGTH = 32;
const MAX_UPLOAD_SIZE_MB = 100;
const MAX_UPLOAD_FILES = 20;
const _MIN_TIMEOUT_MS = 100;
const MIN_CONNECTION_TIMEOUT_MS = 1000;

/**
 * 🌍 環境タイプ
 */
export const NodeEnvSchema = z.enum(['development', 'production', 'test']).default('development');

/**
 * 🔑 JWT認証設定スキーマ
 */
export const AuthConfigSchema = z.object({
  // JWT設定
  JWT_SECRET: z
    .string()
    .min(MIN_SECRET_LENGTH, `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`),
  JWT_EXPIRES_IN: z.string().default('4h'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(
      MIN_SECRET_LENGTH,
      `REFRESH_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} characters`
    ),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
});

/**
 * 🗄️ データベース設定スキーマ
 */
export const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
});

/**
 * 🌐 サーバー設定スキーマ
 */
export const ServerConfigSchema = z.object({
  PORT: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_PORT).max(MAX_PORT))
    .default('8000'),
  CORS_ORIGINS: z
    .string()
    .transform((val: string) => val.split(','))
    .default('http://localhost:3000'),
});

/**
 * ☁️ S3設定スキーマ（マルチプロバイダー対応版）
 */
export const S3ConfigSchema = z.object({
  S3_ACCESS_KEY: z
    .string()
    .min(1, 'S3_ACCESS_KEY is required')
    .refine(
      val =>
        ![
          'your_access_key',
          'DO00EXAMPLE9ACCESSKEY',
          'AKIAIOSFODNN7EXAMPLE',
          'minioadmin',
        ].includes(val),
      'S3_ACCESS_KEY must be set to your actual S3 provider access key'
    ),
  S3_SECRET_KEY: z
    .string()
    .min(1, 'S3_SECRET_KEY is required')
    .refine(
      val =>
        ![
          'your_secret_key',
          'exampleSecretKeyForDigitalOceanSpaces123456789',
          'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          'minioadmin',
        ].includes(val),
      'S3_SECRET_KEY must be set to your actual S3 provider secret key'
    ),
  S3_BUCKET: z
    .string()
    .min(1, 'S3_BUCKET is required')
    .regex(
      /^[a-z0-9.-]+$/,
      'S3_BUCKET must contain only lowercase letters, numbers, dots, and hyphens'
    ),
  S3_REGION: z
    .string()
    .min(1, 'S3_REGION is required')
    .refine(val => val.length >= 2, 'S3_REGION must be a valid region identifier'),
  S3_ENDPOINT: z
    .string()
    .url('S3_ENDPOINT must be a valid URL')
    .refine(
      val => val.startsWith('http://') || val.startsWith('https://'),
      'S3_ENDPOINT must start with http:// or https://'
    ),
  S3_PUBLIC_URL: z.string().url('S3_PUBLIC_URL must be a valid URL').optional().or(z.literal('')),
  S3_CDN_DOMAIN: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      val =>
        !val || val.startsWith('http://') || val.startsWith('https://') || !val.includes('://'),
      'S3_CDN_DOMAIN must be a valid URL or domain name'
    ),
});

// 🚫 ImageEncryptionSchema は削除されました（プリサインドS3システムに移行済み）
// Zenkoが透明暗号化を処理するため、アプリケーション層での暗号化設定は不要です

/**
 * 🌐 フロントエンド公開設定スキーマ
 */
export const PublicConfigSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.string().url().default('http://localhost:8000'),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_WEBSOCKET_PATH: z.string().default('/graphql'),
  NEXT_PUBLIC_MEDIA_URL: z.string().url().default('https://libark.sgp1.digitaloceanspaces.com'),
  NEXT_PUBLIC_S3_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_CDN_DOMAIN: z.string().optional(),
});

/**
 * 🔗 Redis設定スキーマ
 */
export const RedisConfigSchema = z.object({
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_PORT).max(MAX_PORT))
    .default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

/**
 * 📤 アップロード設定スキーマ
 */
export const UploadConfigSchema = z.object({
  // ファイルサイズ制限（MB単位）- 統一定数のデフォルト値を使用
  UPLOAD_MAX_FILE_SIZE_MB: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_PORT).max(MAX_UPLOAD_SIZE_MB))
    .default('100'), // UPLOAD_CONSTANTS.MAX_FILE_SIZE_MBと同じ値

  // 最大ファイル数
  UPLOAD_MAX_FILES: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_PORT).max(MAX_UPLOAD_FILES))
    .default('10'),

  // 許可するファイル形式
  UPLOAD_ALLOWED_TYPES: z
    .string()
    .transform((val: string) => val.split(',').map(type => type.trim()))
    .default(SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.join(',')),

  // アップロードレート制限（1分間の最大回数）
  UPLOAD_RATE_LIMIT_MAX: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_PORT))
    .default('10'),
});

/**
 * 🔌 GraphQLサブスクリプション設定スキーマ
 *
 * GraphQLサブスクリプション専用のWebSocket設定
 */
export const WebSocketConfigSchema = z.object({
  WEBSOCKET_PATH: z.string().default('/graphql'),
  WEBSOCKET_ENABLED: z
    .string()
    .transform((val: string) => val === 'true')
    .default('true'),
  WEBSOCKET_CORS_ORIGINS: z.string().default('*'),
  WEBSOCKET_MAX_CONNECTIONS: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_PORT))
    .default('1000'),
  WEBSOCKET_DEBUG: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  WEBSOCKET_CONNECTION_TIMEOUT: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_CONNECTION_TIMEOUT_MS))
    .default('30000'),
  WEBSOCKET_AUTHENTICATION_TIMEOUT: z
    .string()
    .transform((val: string) => parseInt(val, RADIX_DECIMAL))
    .pipe(z.number().min(MIN_CONNECTION_TIMEOUT_MS))
    .default('15000'),
});

/**
 * 🎯 統合環境変数スキーマ
 */
export const EnvSchema = z.object({
  // 基本設定
  NODE_ENV: NodeEnvSchema,

  // 認証設定
  ...AuthConfigSchema.shape,

  // データベース設定
  ...DatabaseConfigSchema.shape,

  // サーバー設定
  ...ServerConfigSchema.shape,

  // S3設定
  ...S3ConfigSchema.shape,

  // 🚫 画像暗号化設定は削除されました（プリサインドS3システムに移行済み）

  // フロントエンド公開設定
  ...PublicConfigSchema.shape,

  // Redis設定
  ...RedisConfigSchema.shape,

  // アップロード設定
  ...UploadConfigSchema.shape,

  // WebSocket設定
  ...WebSocketConfigSchema.shape,

  // デバッグ設定
  DEBUG_IMAGES: z
    .string()
    .transform((val: string) => val === 'true')
    .default('false'),
});

/**
 * 🎯 型定義エクスポート
 */
export type EnvConfig = z.infer<typeof EnvSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type S3Config = z.infer<typeof S3ConfigSchema>;
// 🚫 ImageEncryptionConfig は削除されました（プリサインドS3システムに移行済み）
export type PublicConfig = z.infer<typeof PublicConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type UploadConfig = z.infer<typeof UploadConfigSchema>;
export type WebSocketConfig = z.infer<typeof WebSocketConfigSchema>;
