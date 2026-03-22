/**
 * 🔐 認証関連のバリデーションスキーマ
 *
 * ログイン・登録フォームで使用する統一されたZodスキーマ
 * 型安全性と再利用性を重視した実装
 */

import { z } from 'zod';

// 🎯 共通バリデーションルール
const ValidationRules = {
  // ユーザー名のバリデーション
  username: z
    .string()
    .min(1, 'ユーザー名を入力してください')
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(20, 'ユーザー名は20文字以下で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),

  // メールアドレスのバリデーション
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),

  // パスワードのバリデーション
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で、大文字・小文字・数字・記号を含む必要があります')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは8文字以上で、大文字・小文字・数字・記号を含む必要があります'
    ),

  // 表示名のバリデーション（任意フィールド用）
  displayName: z.string().max(50, '表示名は50文字以下で入力してください'),

  // タイムゾーンのバリデーション（IANA timezone形式）
  timezone: z
    .string()
    .regex(
      /^[A-Za-z_]+\/[A-Za-z_]+$/,
      'タイムゾーンは有効なIANA形式である必要があります（例：Asia/Tokyo）'
    )
    .optional()
    .or(z.literal('')),

  // ユーザー名またはメールアドレス（ログイン用）
  emailOrUsername: z
    .string()
    .min(1, 'ユーザー名またはメールアドレスを入力してください')
    .refine(
      value => {
        // メールアドレスまたはユーザー名の形式をチェック
        const isEmail = z.string().email().safeParse(value).success;
        const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(value);
        return isEmail || isUsername;
      },
      {
        message: '有効なメールアドレスまたはユーザー名を入力してください',
      }
    ),
} as const;

// 🚪 ログインフォームスキーマ
export const loginSchema = z.object({
  email: ValidationRules.emailOrUsername,
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

// 📝 登録フォームスキーマ
export const registerSchema = z.object({
  username: ValidationRules.username,
  email: ValidationRules.email,
  password: ValidationRules.password,
  displayName: z
    .string()
    .max(50, '表示名は50文字以下で入力してください')
    .optional()
    .or(z.literal('')),
  timezone: ValidationRules.timezone,
});

// 📝 登録フォームスキーマ（パスワード確認付き）
export const registerWithConfirmSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

// 🔑 パスワード変更スキーマ
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
    newPassword: ValidationRules.password,
    confirmNewPassword: z.string().min(1, '新しいパスワード確認を入力してください'),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: '新しいパスワードが一致しません',
    path: ['confirmNewPassword'],
  });

// 📧 パスワードリセット要求スキーマ
export const forgotPasswordSchema = z.object({
  email: ValidationRules.email,
});

// 🔄 パスワードリセットスキーマ
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'リセットトークンが必要です'),
    newPassword: ValidationRules.password,
    confirmNewPassword: z.string().min(1, '新しいパスワード確認を入力してください'),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: '新しいパスワードが一致しません',
    path: ['confirmNewPassword'],
  });

// 🎯 型定義のエクスポート
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterWithConfirmFormData = z.infer<typeof registerWithConfirmSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// 🔍 バリデーションヘルパー関数
export const validateEmail = (email: string): boolean => {
  return ValidationRules.email.safeParse(email).success;
};

export const validateUsername = (username: string): boolean => {
  return ValidationRules.username.safeParse(username).success;
};

export const validatePassword = (password: string): boolean => {
  return ValidationRules.password.safeParse(password).success;
};

// 🎯 パスワード強度チェック
export const checkPasswordStrength = (
  password: string
): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('8文字以上にしてください');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('小文字を含めてください');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('大文字を含めてください');

  if (/\d/.test(password)) score += 1;
  else feedback.push('数字を含めてください');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('記号を含めるとより安全です');

  return { score, feedback };
};

// 🎯 フォームフィールド設定
export const getFormFieldConfig = (field: string, t: (key: string, fallback: string) => string) => {
  const configs = {
    email: {
      label: t('auth.login.email.label', 'ユーザー名またはメールアドレス'),
      placeholder: t('auth.login.email.placeholder', 'ユーザー名またはメールアドレスを入力'),
      type: 'text' as const,
    },
    password: {
      label: t('auth.login.password.label', 'パスワード'),
      placeholder: t('auth.login.password.placeholder', 'パスワードを入力'),
      type: 'password' as const,
    },
    username: {
      label: t('auth.register.username.label', 'ユーザー名'),
      placeholder: t('auth.register.username.placeholder', 'ユーザー名を入力'),
      type: 'text' as const,
    },
    displayName: {
      label: t('auth.register.displayName.label', '表示名（任意）'),
      placeholder: t('auth.register.displayName.placeholder', '表示名を入力'),
      type: 'text' as const,
    },
  };

  return configs[field as keyof typeof configs];
};
