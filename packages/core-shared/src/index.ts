/**
 * 🎯 @libark/core-shared - 共有基盤パッケージ
 *
 * LIBARK プラットフォームの共有機能
 * - 設定管理 (config)
 * - スキーマ定義 (schemas)
 * - イベント定義 (events)
 * - 型定義 (types)
 * - ユーティリティ (utils)
 */

// 🔧 設定管理
// parseS3Keyは静的メソッドなので、S3KeyGenerator.parseS3Keyとしてアクセス
import { S3KeyGenerator } from './utils/index.js';

export * from './config/index.js';
export * from './config/variantConfig.js';
export { authConfig } from './config/auth.config.js';
export { getRedisConfig } from './config/redis.config.js';
export { envUtils } from './config/environment-strategy.js';
export { getS3ConfigForService } from './config/s3-unified.config.js';
export type { UnifiedS3Config } from './config/s3-unified.config.js';
export { getGraphQLClientConfig } from './config/client.js';
export { serverConfig } from './config/server.js';
export {
  S3_CONSTANTS,
  NETWORK_CONSTANTS,
  UPLOAD_CONSTANTS,
  SUPPORTED_IMAGE_FORMATS,
  PAGINATION_CONSTANTS,
} from './config/constants.js';
export { getVariantConfigs, getSpecialVariantConfigs } from './config/variantConfig.js';

// 🔐 認証型定義（明示的エクスポート）
export type {
  AuthResponse,
  AuthenticatedUser,
  AuthResult,
  AuthErrorCode,
  JWTPayload,
} from './types/auth.js';
export { SecurityEventType, logSecurityEvent } from './types/auth.js';
export { AuthError, AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES } from './types/auth.js';

// 📝 ログシステム
export * from './logger/index.js';
export { logger, createLogger } from './logger/index.js';
export {
  UnifiedLogger,
  UnifiedLogLevel,
  LogCategory,
  unifiedLogger,
  unifiedLoggerHelpers,
} from './logger/unified-logger.js';
export type { LogOptions, UnifiedLoggerConfig } from './logger/unified-logger.js';

// 📋 スキーマ定義
export * from './schemas/index.js';
export {
  UserCreateSchema,
  LoginSchema,
  UserSettingsUpdateSchema,
  TwoFactorSetupSchema,
  TwoFactorEnableSchema,
  TwoFactorDisableSchema,
  TwoFactorRegenerateBackupCodesSchema,
} from './schemas/index.js';
export type {
  User,
  UserPublic,
  UserCreate,
  UserUpdate,
  Login,
  TwoFactorSetup,
  TwoFactorEnable,
  TwoFactorDisable,
  TwoFactorRegenerateBackupCodes,
} from './schemas/index.js';

// 📡 イベント定義（重複を避けて個別エクスポート）
export { UNIFIED_EVENTS, NotificationFactory } from './events/index.js';
export { NotificationType } from './events/index.js';
export type {
  INotificationData,
  ICreateNotificationData,
  INotificationFilter,
  NotificationTypeValue,
  INotificationCount,
  IProcessingNotificationInput,
} from './events/index.js';

// 🚀 メディアアップロードシステム
export * from './validation/mediaValidation.js';
export { MediaValidator, validateImageMetadata } from './validation/mediaValidation.js';
export * from './errors/uploadErrors.js';

// 🎯 メディア処理システム
export * from './types/mediaProcessing.js';
export type {
  MediaProcessingJobData,
  MediaProcessingVariantConfig,
  UploadProgressData,
  ImageMetadata,
  S3UploadMetadata,
} from './types/mediaProcessing.js';

// ユーティリティ（重複を避けて個別エクスポート）
export {
  // S3キー生成ユーティリティ
  S3KeyGenerator,
  generateS3Key,
  generateVariantS3Key,
  normalizeMediaType,
  sanitizeFilename,
  convertToClientUrl,
  VARIANT_TYPES,
  // メディアURL生成ユーティリティ
  generateMediaUrl,
  generateThumbnailUrl,
  getS3GatewayUrl,
  generatePublicMediaUrl,
  getMediaUrlDebugInfo,
  // タイムゾーン検出ユーティリティ
  detectTimezoneFromIP,
  extractClientIP,
  isValidTimezone,
  getDefaultTimezoneByCountry,
  detectUserTimezone,
  DEFAULT_TIMEZONES_BY_REGION,
} from './utils/index.js';
export const parseS3Key = S3KeyGenerator.parseS3Key;

export type {
  S3KeyParams,
  S3KeyInfo,
  VariantType as UtilsVariantType, // 別名でエクスポート
  MediaType as UtilsMediaType, // 別名でエクスポート
} from './utils/index.js';

// 🚨 エラーハンドリング
export {
  UnifiedUploadError,
  UPLOAD_ERROR_CODES,
  isUnifiedUploadError,
} from './errors/uploadErrors.js';

// セキュリティ（共有可能な部分）
// OGP署名機能はNode.jsのcryptoモジュールを使用するため、core-serverに移動済み
// CSRFはサーバー専用機能のため、core-serverに移動済み
