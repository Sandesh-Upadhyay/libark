import { z } from 'zod';

// ユーザーベーススキーマ
export const UserBaseSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(30),
  email: z.string().email().max(255),
  displayName: z.string().max(50).nullable(),
  bio: z.string().nullable(),
  profileImageId: z.string().uuid().nullable(),
  coverImageId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().nullable(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
});

// パスワードハッシュを含む完全なユーザースキーマ（サーバーサイド用）
export const UserSchema = UserBaseSchema.extend({
  passwordHash: z.string().max(255),
});

// パブリック用ユーザースキーマ（パスワードハッシュを除外）
export const UserPublicSchema = UserBaseSchema;

// ユーザー作成用スキーマ
export const UserCreateSchema = z.object({
  username: z.string().min(1).max(30),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  displayName: z.string().max(50).optional().or(z.literal('')),
  bio: z.string().optional(),
});

// ユーザー更新用スキーマ
export const UserUpdateSchema = z
  .object({
    displayName: z.string().max(50),
    bio: z.string(),
    profileImageId: z.string().uuid(),
    coverImageId: z.string().uuid(),
  })
  .partial();

// ログイン用スキーマ（ユーザー名またはメールアドレス対応）
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'ユーザー名またはメールアドレスを入力してください')
    .refine(
      value => {
        // メールアドレスまたはユーザー名の形式をチェック
        const isEmail = z.string().email().safeParse(value).success;
        const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(value);
        return isEmail || isUsername;
      },
      {
        message: '有効なメールアドレスまたはユーザー名を入力してください',
      }
    ),
  password: z.string().min(1),
});

// パスワードリセット用スキーマ
export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const PasswordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

// 型エクスポート
export type User = z.infer<typeof UserSchema>;
export type UserPublic = z.infer<typeof UserPublicSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordReset = z.infer<typeof PasswordResetSchema>;
