/**
 * 🎯 プロフィール関連のバリデーションスキーマ
 *
 * プロフィール編集フォームで使用する統一されたZodスキーマ
 * 型安全性と再利用性を重視した実装
 */

import { z } from 'zod';

import { VALIDATION_LIMITS } from '@/lib/constants/validation';

/**
 * プロフィール更新用バリデーションスキーマ
 *
 * @param t - 翻訳関数
 * @returns Zodスキーマ
 */
export const createProfileUpdateSchema = (
  t: (key: string, options?: { default: string }) => string
) => {
  return z.object({
    displayName: z
      .string()
      .min(1, t('settings.profile.displayName.required', { default: '表示名は必須です' }))
      .max(
        VALIDATION_LIMITS.profile.displayNameMax,
        t('settings.profile.displayName.tooLong', {
          default: '表示名は50文字以内で入力してください',
        })
      )
      .regex(
        /^[^\s].*[^\s]$|^[^\s]$/,
        t('settings.profile.displayName.trim', { default: '前後の空白は削除されます' })
      ),
    bio: z
      .string()
      .max(
        VALIDATION_LIMITS.profile.bioMax,
        t('settings.profile.bio.tooLong', { default: '自己紹介は500文字以内で入力してください' })
      )
      .optional()
      .transform(val => val?.trim() || ''),
  });
};

/**
 * プロフィール更新フォームデータの型定義
 */
export type ProfileUpdateFormData = z.infer<ReturnType<typeof createProfileUpdateSchema>>;

/**
 * プロフィール更新入力データの型定義（GraphQL用）
 */
export interface ProfileUpdateInput {
  displayName: string;
  bio: string;
}

/**
 * バリデーション定数（統一定数から取得）
 */
export const PROFILE_VALIDATION_CONSTANTS = {
  DISPLAY_NAME_MAX_LENGTH: VALIDATION_LIMITS.profile.displayNameMax,
  BIO_MAX_LENGTH: VALIDATION_LIMITS.profile.bioMax,
} as const;

/**
 * プロフィールフィールドの設定
 */
export const ProfileFieldConfig = {
  displayName: {
    label: '表示名',
    placeholder: '表示名を入力してください',
    helpText: '他のユーザーに表示される名前',
    maxLength: PROFILE_VALIDATION_CONSTANTS.DISPLAY_NAME_MAX_LENGTH,
  },
  bio: {
    label: '自己紹介',
    placeholder: '自己紹介を入力してください',
    helpText: 'あなたについて簡単に紹介してください',
    maxLength: PROFILE_VALIDATION_CONSTANTS.BIO_MAX_LENGTH,
  },
} as const;

/**
 * プロフィールデータのバリデーション
 *
 * @param displayName - 表示名
 * @param bio - 自己紹介
 * @returns バリデーション結果
 */
export const validateProfileData = (displayName: string, bio?: string) => {
  const errors: Record<string, string> = {};

  // 表示名のバリデーション
  if (!displayName || displayName.trim().length === 0) {
    errors.displayName = '表示名は必須です';
  } else if (displayName.length > PROFILE_VALIDATION_CONSTANTS.DISPLAY_NAME_MAX_LENGTH) {
    errors.displayName = `表示名は${PROFILE_VALIDATION_CONSTANTS.DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`;
  } else if (!/^[^\s].*[^\s]$|^[^\s]$/.test(displayName)) {
    errors.displayName = '前後の空白は削除されます';
  }

  // 自己紹介のバリデーション
  if (bio && bio.length > PROFILE_VALIDATION_CONSTANTS.BIO_MAX_LENGTH) {
    errors.bio = `自己紹介は${PROFILE_VALIDATION_CONSTANTS.BIO_MAX_LENGTH}文字以内で入力してください`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * プロフィールデータの正規化
 *
 * @param data - 入力データ
 * @returns 正規化されたデータ
 */
export const normalizeProfileData = (data: ProfileUpdateFormData): ProfileUpdateInput => {
  return {
    displayName: data.displayName.trim(),
    bio: data.bio?.trim() || '',
  };
};
