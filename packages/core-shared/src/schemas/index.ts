/**
 * 📋 統合スキーマ定義モジュール
 *
 * 旧 @libark/zod の機能を統合
 * 循環依存を回避するため、明示的なエクスポートに変更
 */

// Enums - 基盤となる列挙型（他に依存しない）
export {
  MediaStatusSchema,
  MediaVariantSchema,
  PostVisibilitySchema,
  NotificationTypeSchema,
  MediaTypeSchema,
  MEDIA_STATUS,
  MEDIA_VARIANT,
  POST_VISIBILITY,
  MEDIA_TYPE,
  type MediaStatus,
  type MediaVariant,
  type PostVisibility,
  type NotificationType,
  type MediaType,
} from './enums.js';

// Common schemas - 共通スキーマ（enumsに依存）
export {
  PaginationSchema,
  CursorPaginationSchema,
  SortSchema,
  DateRangeSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  CursorPaginatedResponseSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  type Pagination,
  type CursorPagination,
  type Sort,
  type DateRange,
  type ApiResponse,
  type PaginatedResponse,
  type CursorPaginatedResponse,
  type ErrorResponse,
  type SuccessResponse,
} from './common.js';

// User schemas - ユーザー関連（enumsに依存）
export {
  UserBaseSchema,
  UserSchema,
  UserPublicSchema,
  UserCreateSchema,
  UserUpdateSchema,
  LoginSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  type User,
  type UserPublic,
  type UserCreate,
  type UserUpdate,
  type Login,
  type PasswordResetRequest,
  type PasswordReset,
} from './user.js';

// User settings schemas - ユーザー設定関連
export {
  UserSettingsSchema,
  UserSettingsCreateSchema,
  UserSettingsUpdateSchema,
  type UserSettings,
  type UserSettingsCreate,
  type UserSettingsUpdate,
} from './user-settings.js';

// Post schemas - 投稿関連（enumsとcommonに依存）
export {
  PostBaseSchema,
  PostSchema,
  PostCreateSchema,
  PostUpdateSchema,
  PostDeleteSchema,
  PostListQuerySchema,
  PostListCursorQuerySchema,
  type Post,
  type PostCreate,
  type PostUpdate,
  type PostDelete,
  type PostListQuery,
  type PostListCursorQuery,
} from './post.js';

// Media schemas - メディア関連
export {
  MediaBaseSchema,
  MediaSchema,
  MediaUploadSchema,
  MediaUpdateSchema,
  MediaProcessingUpdateSchema,
  MediaListQuerySchema,
  type Media,
  type MediaUpload,
  type MediaUpdate,
  type MediaProcessingUpdate,
  type MediaListQuery,
} from './media.js';

// Message schemas - メッセージ関連
export {
  ConversationTypeSchema,
  MessageTypeSchema,
  ParticipantRoleSchema,
  ConversationSchema,
  ConversationParticipantSchema,
  MessageSchema,
  MessageReadSchema,
  MessageCreateSchema,
  ConversationCreateSchema,
  ConversationParticipantCreateSchema,
  MessageReadCreateSchema,
  MessageListQuerySchema,
  ConversationListQuerySchema,
  MarkAsReadSchema,
  ConversationUpdateSchema,
  ConversationMuteSchema,
  type ConversationType,
  type MessageType,
  type ParticipantRole,
  type Conversation,
  type ConversationParticipant,
  type Message,
  type MessageRead,
  type MessageCreate,
  type ConversationCreate,
  type ConversationParticipantCreate,
  type MessageReadCreate,
  type MessageListQuery,
  type ConversationListQuery,
  type MarkAsRead,
  type ConversationUpdate,
  type ConversationMute,
} from './message.js';

// Comment schemas - コメント関連
export {
  CommentBaseSchema,
  CommentSchema,
  CommentCreateSchema,
  CommentUpdateSchema,
  CommentListQuerySchema,
  CommentWithUserSchema,
  type Comment,
  type CommentCreate,
  type CommentUpdate,
  type CommentListQuery,
  type CommentWithUser,
} from './comment.js';

// Notification schemas - 通知関連（enumsに依存）
export {
  NotificationBaseSchema,
  NotificationSchema,
  NotificationCreateSchema,
  NotificationListQuerySchema,
  NotificationWithActorSchema,
  NotificationMarkReadSchema,
  type Notification,
  type NotificationCreate,
  type NotificationListQuery,
  type NotificationWithActor,
  type NotificationMarkRead,
} from './notification.js';

// Two-Factor Authentication schemas - 2FA関連
export {
  TwoFactorSetupSchema,
  TwoFactorEnableSchema,
  TwoFactorDisableSchema,
  TwoFactorVerifySchema,
  TwoFactorRegenerateBackupCodesSchema,
  TwoFactorSetupDataSchema,
  BackupCodesSchema,
  TwoFactorStatusSchema,
  type TwoFactorSetup,
  type TwoFactorEnable,
  type TwoFactorDisable,
  type TwoFactorVerify,
  type TwoFactorRegenerateBackupCodes,
  type TwoFactorSetupData,
  type BackupCodes,
  type TwoFactorStatus,
} from './twoFactor.js';
