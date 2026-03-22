/**
 * 🧪 スキーマモジュールテスト
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  // Enums
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
  type PostVisibility,
  type MediaType,

  // Common schemas
  PaginationSchema,
  CursorPaginationSchema,
  SortSchema,
  DateRangeSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  type Pagination,

  // User schemas
  UserBaseSchema,
  UserCreateSchema,
  LoginSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  type User,

  // User settings schemas
  UserSettingsSchema,
  UserSettingsCreateSchema,
  UserSettingsUpdateSchema,

  // Post schemas
  PostBaseSchema,
  PostCreateSchema,
  PostUpdateSchema,
  PostListQuerySchema,
  PostListCursorQuerySchema,
  type Post,

  // Media schemas
  MediaBaseSchema,
  MediaUploadSchema,
  MediaUpdateSchema,
  MediaListQuerySchema,
  type Media,

  // Message schemas
  ConversationTypeSchema,
  MessageTypeSchema,
  ParticipantRoleSchema,
  MessageCreateSchema,
  ConversationCreateSchema,
  MessageListQuerySchema,
  MarkAsReadSchema,

  // Comment schemas
  CommentBaseSchema,
  CommentCreateSchema,
  CommentUpdateSchema,
  CommentListQuerySchema,

  // Notification schemas
  NotificationBaseSchema,
  NotificationCreateSchema,
  NotificationListQuerySchema,
  NotificationMarkReadSchema,

  // Two-Factor Authentication schemas
  TwoFactorSetupSchema,
  TwoFactorEnableSchema,
  TwoFactorDisableSchema,
  TwoFactorVerifySchema,
  TwoFactorRegenerateBackupCodesSchema,
  BackupCodesSchema,
  TwoFactorStatusSchema,
} from '../schemas/index.js';

describe('スキーマモジュール', () => {
  describe('Enumスキーマのバリデーション', () => {
    it('MediaStatusSchemaが有効な値を検証する', () => {
      expect(() => MediaStatusSchema.parse('PENDING')).not.toThrow();
      expect(() => MediaStatusSchema.parse('PROCESSING')).not.toThrow();
      expect(() => MediaStatusSchema.parse('COMPLETED')).not.toThrow();
      expect(() => MediaStatusSchema.parse('FAILED')).not.toThrow();
    });

    it('MediaStatusSchemaが無効な値を拒否する', () => {
      expect(() => MediaStatusSchema.parse('INVALID')).toThrow();
    });

    it('MediaVariantSchemaが有効な値を検証する', () => {
      expect(() => MediaVariantSchema.parse('ORIGINAL')).not.toThrow();
      expect(() => MediaVariantSchema.parse('THUMB')).not.toThrow();
      expect(() => MediaVariantSchema.parse('MEDIUM')).not.toThrow();
      expect(() => MediaVariantSchema.parse('LARGE')).not.toThrow();
      expect(() => MediaVariantSchema.parse('BLUR')).not.toThrow();
      expect(() => MediaVariantSchema.parse('OGP')).not.toThrow();
    });

    it('PostVisibilitySchemaが有効な値を検証する', () => {
      expect(() => PostVisibilitySchema.parse('PUBLIC')).not.toThrow();
      expect(() => PostVisibilitySchema.parse('FOLLOWERS')).not.toThrow();
      expect(() => PostVisibilitySchema.parse('PRIVATE')).not.toThrow();
    });

    it('NotificationTypeSchemaが有効な値を検証する', () => {
      expect(() => NotificationTypeSchema.parse('LIKE')).not.toThrow();
      expect(() => NotificationTypeSchema.parse('COMMENT')).not.toThrow();
      expect(() => NotificationTypeSchema.parse('FOLLOW')).not.toThrow();
    });

    it('MediaTypeSchemaが有効な値を検証する', () => {
      expect(() => MediaTypeSchema.parse('POST')).not.toThrow();
      expect(() => MediaTypeSchema.parse('AVATAR')).not.toThrow();
      expect(() => MediaTypeSchema.parse('COVER')).not.toThrow();
      expect(() => MediaTypeSchema.parse('OGP')).not.toThrow();
    });
  });

  describe('Enum定数', () => {
    it('MEDIA_STATUS定数が定義されている', () => {
      expect(MEDIA_STATUS).toBeDefined();
      expect(MEDIA_STATUS.PENDING).toBe('PENDING');
      expect(MEDIA_STATUS.PROCESSING).toBe('PROCESSING');
      expect(MEDIA_STATUS.COMPLETED).toBe('COMPLETED');
      expect(MEDIA_STATUS.FAILED).toBe('FAILED');
    });

    it('MEDIA_VARIANT定数が定義されている', () => {
      expect(MEDIA_VARIANT).toBeDefined();
      expect(MEDIA_VARIANT.ORIGINAL).toBe('ORIGINAL');
      expect(MEDIA_VARIANT.THUMB).toBe('THUMB');
      expect(MEDIA_VARIANT.MEDIUM).toBe('MEDIUM');
      expect(MEDIA_VARIANT.LARGE).toBe('LARGE');
      expect(MEDIA_VARIANT.BLUR).toBe('BLUR');
      expect(MEDIA_VARIANT.OGP).toBe('OGP');
    });

    it('POST_VISIBILITY定数が定義されている', () => {
      expect(POST_VISIBILITY).toBeDefined();
      expect(POST_VISIBILITY.PUBLIC).toBe('PUBLIC');
      expect(POST_VISIBILITY.FOLLOWERS).toBe('FOLLOWERS');
      expect(POST_VISIBILITY.PRIVATE).toBe('PRIVATE');
    });

    it('MEDIA_TYPE定数が定義されている', () => {
      expect(MEDIA_TYPE).toBeDefined();
      expect(MEDIA_TYPE.POST).toBe('POST');
      expect(MEDIA_TYPE.AVATAR).toBe('AVATAR');
      expect(MEDIA_TYPE.COVER).toBe('COVER');
      expect(MEDIA_TYPE.OGP).toBe('OGP');
    });
  });

  describe('共通スキーマのバリデーション', () => {
    it('PaginationSchemaが有効なページネーションを検証する', () => {
      const pagination = { page: 1, limit: 20 };
      expect(() => PaginationSchema.parse(pagination)).not.toThrow();
    });

    it('PaginationSchemaが無効なページ番号を拒否する', () => {
      const pagination = { page: -1, limit: 20 };
      expect(() => PaginationSchema.parse(pagination)).toThrow();
    });

    it('PaginationSchemaが無効なリミットを拒否する', () => {
      const pagination = { page: 1, limit: 0 };
      expect(() => PaginationSchema.parse(pagination)).toThrow();
    });

    it('CursorPaginationSchemaが有効なカーソルページネーションを検証する', () => {
      const pagination = { cursor: 'abc123', limit: 20 };
      expect(() => CursorPaginationSchema.parse(pagination)).not.toThrow();
    });

    it('SortSchemaが有効なソートを検証する', () => {
      const sort = { field: 'createdAt', order: 'desc' as const };
      expect(() => SortSchema.parse(sort)).not.toThrow();
    });

    it('DateRangeSchemaが有効な日付範囲を検証する', () => {
      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      expect(() => DateRangeSchema.parse(dateRange)).not.toThrow();
    });

    it('ApiResponseSchemaが有効なAPIレスポンスを検証する', () => {
      const response = { success: true, data: { id: 1 } };
      const schema = ApiResponseSchema(z.object({ id: z.number() }));
      expect(() => schema.parse(response)).not.toThrow();
    });

    it('PaginatedResponseSchemaが有効なページネーションレスポンスを検証する', () => {
      const response = {
        success: true,
        data: {
          items: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: 20,
            total: 100,
            totalPages: 5,
            hasNext: true,
            hasPrev: false,
          },
        },
      };
      const schema = PaginatedResponseSchema(z.object({ id: z.number() }));
      expect(() => schema.parse(response)).not.toThrow();
    });

    it('ErrorResponseSchemaが有効なエラーレスポンスを検証する', () => {
      const response = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {},
        },
      };
      expect(() => ErrorResponseSchema.parse(response)).not.toThrow();
    });

    it('SuccessResponseSchemaが有効な成功レスポンスを検証する', () => {
      const response = {
        success: true,
        message: 'Operation successful',
        data: { id: 1 },
      };
      const schema = SuccessResponseSchema(z.object({ id: z.number() }));
      expect(() => schema.parse(response)).not.toThrow();
    });
  });

  describe('ユーザースキーマのバリデーション', () => {
    it('UserBaseSchemaが有効なユーザーベースを検証する', () => {
      const user = {
        id: '12345678-1234-1234-1234-123456789012',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        bio: null,
        profileImageId: null,
        coverImageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        isVerified: true,
        isActive: true,
      };
      expect(() => UserBaseSchema.parse(user)).not.toThrow();
    });

    it('UserCreateSchemaが有効なユーザー作成を検証する', () => {
      const user = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
      };
      expect(() => UserCreateSchema.parse(user)).not.toThrow();
    });

    it('UserCreateSchemaが無効なメールアドレスを拒否する', () => {
      const user = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'SecurePass123!',
      };
      expect(() => UserCreateSchema.parse(user)).toThrow();
    });

    it('UserCreateSchemaが弱いパスワードを拒否する', () => {
      const user = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };
      expect(() => UserCreateSchema.parse(user)).toThrow();
    });

    it('LoginSchemaが有効なログインを検証する', () => {
      const login = { email: 'test@example.com', password: 'SecurePass123!' };
      expect(() => LoginSchema.parse(login)).not.toThrow();
    });

    it('PasswordResetRequestSchemaが有効なパスワードリセット要求を検証する', () => {
      const request = { email: 'test@example.com' };
      expect(() => PasswordResetRequestSchema.parse(request)).not.toThrow();
    });

    it('PasswordResetSchemaが有効なパスワードリセットを検証する', () => {
      const reset = {
        token: 'reset-token-123',
        password: 'NewSecurePass123!',
      };
      expect(() => PasswordResetSchema.parse(reset)).not.toThrow();
    });
  });

  describe('ユーザー設定スキーマのバリデーション', () => {
    it('UserSettingsSchemaが有効なユーザー設定を検証する', () => {
      const settings = {
        userId: '12345678-1234-1234-1234-123456789012',
        theme: 'dark' as const,
        animationsEnabled: true,
        locale: 'ja',
        contentFilter: 'all' as const,
        displayMode: 'card' as const,
        timezone: 'Asia/Tokyo',
        updatedAt: new Date(),
      };
      expect(() => UserSettingsSchema.parse(settings)).not.toThrow();
    });

    it('UserSettingsCreateSchemaが有効な設定作成を検証する', () => {
      const settings = {
        theme: 'dark' as const,
        language: 'ja',
        notifications: { email: true, push: false },
      };
      expect(() => UserSettingsCreateSchema.parse(settings)).not.toThrow();
    });

    it('UserSettingsUpdateSchemaが有効な設定更新を検証する', () => {
      const settings = { theme: 'light' as const };
      expect(() => UserSettingsUpdateSchema.parse(settings)).not.toThrow();
    });
  });

  describe('投稿スキーマのバリデーション', () => {
    it('PostBaseSchemaが有効な投稿ベースを検証する', () => {
      const post = {
        id: '12345678-1234-1234-1234-123456789012',
        userId: '12345678-1234-1234-1234-123456789012',
        content: 'Test post',
        isProcessing: false,
        visibility: 'PUBLIC' as const,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      expect(() => PostBaseSchema.parse(post)).not.toThrow();
    });

    it('PostCreateSchemaが有効な投稿作成を検証する', () => {
      const post = {
        content: 'Test post content',
        visibility: 'PUBLIC' as const,
      };
      expect(() => PostCreateSchema.parse(post)).not.toThrow();
    });

    it('PostUpdateSchemaが有効な投稿更新を検証する', () => {
      const post = { content: 'Updated content' };
      expect(() => PostUpdateSchema.parse(post)).not.toThrow();
    });

    it('PostListQuerySchemaが有効な投稿リストクエリを検証する', () => {
      const query = { page: 1, limit: 20 };
      expect(() => PostListQuerySchema.parse(query)).not.toThrow();
    });

    it('PostListCursorQuerySchemaが有効なカーソルクエリを検証する', () => {
      const query = { cursor: 'abc123', limit: 20 };
      expect(() => PostListCursorQuerySchema.parse(query)).not.toThrow();
    });
  });

  describe('メディアスキーマのバリデーション', () => {
    it('MediaBaseSchemaが有効なメディアベースを検証する', () => {
      const media = {
        id: '12345678-1234-1234-1234-123456789012',
        postId: null,
        userId: '12345678-1234-1234-1234-123456789012',
        filename: 'test.jpg',
        s3Key: 'uploads/test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        width: 800,
        height: 600,
        type: 'POST',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(() => MediaBaseSchema.parse(media)).not.toThrow();
    });

    it('MediaUploadSchemaが有効なメディアアップロードを検証する', () => {
      const media = {
        filename: 'test.jpg',
        s3Key: 'uploads/test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        type: 'POST',
      };
      expect(() => MediaUploadSchema.parse(media)).not.toThrow();
    });

    it('MediaUpdateSchemaが有効なメディア更新を検証する', () => {
      const media = { status: 'COMPLETED' as const };
      expect(() => MediaUpdateSchema.parse(media)).not.toThrow();
    });

    it('MediaListQuerySchemaが有効なメディアリストクエリを検証する', () => {
      const query = { page: 1, limit: 20 };
      expect(() => MediaListQuerySchema.parse(query)).not.toThrow();
    });
  });

  describe('メッセージスキーマのバリデーション', () => {
    it('ConversationTypeSchemaが有効な会話タイプを検証する', () => {
      expect(() => ConversationTypeSchema.parse('DIRECT')).not.toThrow();
      expect(() => ConversationTypeSchema.parse('GROUP')).not.toThrow();
    });

    it('MessageTypeSchemaが有効なメッセージタイプを検証する', () => {
      expect(() => MessageTypeSchema.parse('TEXT')).not.toThrow();
      expect(() => MessageTypeSchema.parse('IMAGE')).not.toThrow();
      expect(() => MessageTypeSchema.parse('VIDEO')).not.toThrow();
    });

    it('ParticipantRoleSchemaが有効な参加者ロールを検証する', () => {
      expect(() => ParticipantRoleSchema.parse('ADMIN')).not.toThrow();
      expect(() => ParticipantRoleSchema.parse('MEMBER')).not.toThrow();
    });

    it('MessageCreateSchemaが有効なメッセージ作成を検証する', () => {
      const message = {
        conversationId: '12345678-1234-1234-1234-123456789012',
        content: 'Test message',
        type: 'TEXT' as const,
      };
      expect(() => MessageCreateSchema.parse(message)).not.toThrow();
    });

    it('ConversationCreateSchemaが有効な会話作成を検証する', () => {
      const conversation = {
        type: 'DIRECT' as const,
        participantIds: [
          '12345678-1234-1234-1234-123456789012',
          '22345678-1234-1234-1234-123456789012',
        ],
      };
      expect(() => ConversationCreateSchema.parse(conversation)).not.toThrow();
    });

    it('MessageListQuerySchemaが有効なメッセージリストクエリを検証する', () => {
      const query = { conversationId: '12345678-1234-1234-1234-123456789012', first: 50 };
      expect(() => MessageListQuerySchema.parse(query)).not.toThrow();
    });

    it('MarkAsReadSchemaが有効な既読マークを検証する', () => {
      const mark = { conversationId: '12345678-1234-1234-1234-123456789012' };
      expect(() => MarkAsReadSchema.parse(mark)).not.toThrow();
    });
  });

  describe('コメントスキーマのバリデーション', () => {
    it('CommentBaseSchemaが有効なコメントベースを検証する', () => {
      const comment = {
        id: '12345678-1234-1234-1234-123456789012',
        postId: '12345678-1234-1234-1234-123456789012',
        userId: '12345678-1234-1234-1234-123456789012',
        content: 'Test comment',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      console.log('Comment data:', JSON.stringify(comment));
      const result = CommentBaseSchema.parse(comment);
      console.log('Parse result:', result);
      expect(() => CommentBaseSchema.parse(comment)).not.toThrow();
    });

    it('CommentCreateSchemaが有効なコメント作成を検証する', () => {
      const comment = {
        postId: '12345678-1234-1234-1234-123456789012',
        content: 'Test comment',
      };
      expect(() => CommentCreateSchema.parse(comment)).not.toThrow();
    });

    it('CommentUpdateSchemaが有効なコメント更新を検証する', () => {
      const comment = { content: 'Updated comment' };
      expect(() => CommentUpdateSchema.parse(comment)).not.toThrow();
    });

    it('CommentListQuerySchemaが有効なコメントリストクエリを検証する', () => {
      const query = { postId: '12345678-1234-1234-1234-123456789012', page: 1, limit: 20 };
      expect(() => CommentListQuerySchema.parse(query)).not.toThrow();
    });
  });

  describe('通知スキーマのバリデーション', () => {
    it('NotificationBaseSchemaが有効な通知ベースを検証する', () => {
      const notification = {
        id: '12345678-1234-1234-1234-123456789012',
        userId: '12345678-1234-1234-1234-123456789012',
        type: 'LIKE' as const,
        actorId: '12345678-1234-1234-1234-123456789012',
        referenceId: '12345678-1234-1234-1234-123456789012',
        content: 'Someone liked your post',
        isRead: false,
        createdAt: new Date(),
        readAt: null,
      };
      expect(() => NotificationBaseSchema.parse(notification)).not.toThrow();
    });

    it('NotificationCreateSchemaが有効な通知作成を検証する', () => {
      const notification = {
        userId: '12345678-1234-1234-1234-123456789012',
        type: 'LIKE' as const,
        actorId: '12345678-1234-1234-1234-123456789012',
        postId: '12345678-1234-1234-1234-123456789012',
      };
      expect(() => NotificationCreateSchema.parse(notification)).not.toThrow();
    });

    it('NotificationListQuerySchemaが有効な通知リストクエリを検証する', () => {
      const query = { userId: '12345678-1234-1234-1234-123456789012', page: 1, limit: 20 };
      expect(() => NotificationListQuerySchema.parse(query)).not.toThrow();
    });

    it('NotificationMarkReadSchemaが有効な通知既読マークを検証する', () => {
      const mark = {
        notificationIds: [
          '12345678-1234-1234-1234-123456789012',
          '22345678-1234-1234-1234-123456789012',
          '32345678-1234-1234-1234-123456789012',
        ],
      };
      expect(() => NotificationMarkReadSchema.parse(mark)).not.toThrow();
    });
  });

  describe('2FAスキーマのバリデーション', () => {
    it('TwoFactorSetupSchemaが有効な2FA設定を検証する', () => {
      const setup = { password: 'MySecurePassword123!' };
      expect(() => TwoFactorSetupSchema.parse(setup)).not.toThrow();
    });

    it('TwoFactorEnableSchemaが有効な2FA有効化を検証する', () => {
      const enable = {
        totpCode: '123456',
        password: 'MySecurePassword123!',
      };
      expect(() => TwoFactorEnableSchema.parse(enable)).not.toThrow();
    });

    it('TwoFactorDisableSchemaが有効な2FA無効化を検証する', () => {
      const disable = {
        password: 'MySecurePassword123!',
        code: '123456',
      };
      expect(() => TwoFactorDisableSchema.parse(disable)).not.toThrow();
    });

    it('TwoFactorVerifySchemaが有効な2FA検証を検証する', () => {
      const verify = { code: '123456' };
      expect(() => TwoFactorVerifySchema.parse(verify)).not.toThrow();
    });

    it('TwoFactorRegenerateBackupCodesSchemaが有効なバックアップコード再生成を検証する', () => {
      const regenerate = {
        password: 'MySecurePassword123!',
        totpCode: '123456',
      };
      expect(() => TwoFactorRegenerateBackupCodesSchema.parse(regenerate)).not.toThrow();
    });

    it('BackupCodesSchemaが有効なバックアップコードを検証する', () => {
      const codes = {
        codes: ['ABCD1234', 'EFGH5678', 'IJKL9012'],
        generatedAt: new Date(),
      };
      expect(() => BackupCodesSchema.parse(codes)).not.toThrow();
    });

    it('TwoFactorStatusSchemaが有効な2FAステータスを検証する', () => {
      const status = {
        enabled: true,
        enabledAt: new Date(),
        backupCodesCount: 10,
      };
      expect(() => TwoFactorStatusSchema.parse(status)).not.toThrow();
    });
  });

  describe('スキーマの型チェック', () => {
    it('スキーマから正しく型が推論される', () => {
      const mediaStatus: MediaStatus = 'COMPLETED';
      const postVisibility: PostVisibility = 'PUBLIC';
      const mediaType: MediaType = 'POST';

      expect(mediaStatus).toBe('COMPLETED');
      expect(postVisibility).toBe('PUBLIC');
      expect(mediaType).toBe('POST');
    });

    it('Pagination型が正しく定義されている', () => {
      const pagination: Pagination = { page: 1, limit: 20 };
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(20);
    });

    it('User型が正しく定義されている', () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        displayName: 'Test User',
        bio: null,
        profileImageId: null,
        coverImageId: null,
        lastLoginAt: null,
        isVerified: true,
        isActive: true,
        passwordHash: 'hashed',
      };
      expect(user.id).toBe('1');
    });

    it('Post型が正しく定義されている', () => {
      const post: Post = {
        id: '1',
        content: 'Test post',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isProcessing: false,
        visibility: 'PUBLIC',
        isDeleted: false,
        deletedAt: null,
      };
      expect(post.id).toBe('1');
    });

    it('Media型が正しく定義されている', () => {
      const media: Media = {
        id: '1',
        type: 'POST',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '1',
        postId: null,
        s3Key: 'test.jpg',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        width: 800,
        height: 600,
      };
      expect(media.id).toBe('1');
    });
  });

  describe('スキーマの変換', () => {
    it('スキーマが正しくデータを変換する', () => {
      const pagination = PaginationSchema.parse({ page: '1', limit: '20' });
      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
    });

    it('スキーマがデフォルト値を適用する', () => {
      const pagination = PaginationSchema.parse({});
      expect(pagination.page).toBeDefined();
      expect(pagination.limit).toBeDefined();
    });

    it('スキーマが余分なフィールドを削除する', () => {
      const pagination = PaginationSchema.parse({
        page: 1,
        limit: 20,
        extra: 'field',
      });
      expect(pagination).not.toHaveProperty('extra');
    });
  });

  describe('エッジケースのテスト', () => {
    it('空文字列のバリデーション', () => {
      const user = {
        username: '',
        email: 'test@example.com',
        password: 'SecurePass123!',
      };
      expect(() => UserCreateSchema.parse(user)).toThrow();
    });

    it('非常に長い文字列のバリデーション', () => {
      const post = {
        content: 'a'.repeat(10000),
        visibility: 'PUBLIC' as const,
      };
      expect(() => PostCreateSchema.parse(post)).not.toThrow();
    });

    it('特殊文字を含む文字列のバリデーション', () => {
      const user = {
        username: 'test<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'SecurePass123!',
      };
      expect(() => UserCreateSchema.parse(user)).toThrow();
    });

    it('null値のバリデーション', () => {
      const post = {
        content: null as any,
        visibility: 'PUBLIC' as const,
      };
      expect(() => PostCreateSchema.parse(post)).toThrow();
    });

    it('undefined値のバリデーション', () => {
      const post = {
        content: undefined as any,
        visibility: 'PUBLIC' as const,
      };
      expect(() => PostCreateSchema.parse(post)).not.toThrow();
    });
  });
});
