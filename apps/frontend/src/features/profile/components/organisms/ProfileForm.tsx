/**
 * 🎯 プロフィールフォーム管理コンポーネント (Organism)
 *
 * 責任:
 * - React Hook Formを使用したプロフィール更新処理
 * - バリデーションとエラーハンドリングの統一
 * - フォーム状態管理
 * - ユーザーフィードバック
 * - 美しいデザインとユーザーエクスペリエンス
 */

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ProfileInfoForm } from '@/features/settings/components/molecules/ProfileInfoForm';
import { cn } from '@/lib/utils';
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// バリデーションスキーマ
const createProfileUpdateSchema = (t: (key: string, options?: { default: string }) => string) => {
  return z.object({
    displayName: z
      .string()
      .min(1, t('profile.displayName.required', { default: '表示名は必須です' }))
      .max(
        VALIDATION_LIMITS.profile.displayNameMax,
        t('profile.displayName.tooLong', { default: '表示名は50文字以内で入力してください' })
      ),
    bio: z
      .string()
      .max(
        VALIDATION_LIMITS.profile.bioMax,
        t('profile.bio.tooLong', { default: '自己紹介は500文字以内で入力してください' })
      )
      .optional(),
  });
};

type ProfileUpdateFormData = z.infer<ReturnType<typeof createProfileUpdateSchema>>;

export interface ProfileFormProps {
  /** 現在のユーザー情報 */
  user: {
    displayName?: string;
    bio?: string;
  };
  /** プロフィール更新処理 */
  onProfileUpdate: (data: ProfileUpdateFormData) => Promise<void>;
  /** 更新中フラグ */
  isUpdating: boolean;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * プロフィールフォーム管理コンポーネント（新しいAtomicデザインパターン適用）
 */
export function ProfileForm({ user, onProfileUpdate, isUpdating, className }: ProfileFormProps) {
  const { t } = useTranslation();

  // React Hook Form設定
  const profileUpdateSchema = createProfileUpdateSchema(t);
  const {
    handleSubmit,
    formState: { errors: _errors, isSubmitting: isFormSubmitting, isDirty: _isDirty },
    watch,
    reset,
    setValue,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: user.displayName || '',
      bio: user.bio || '',
    },
  });

  // ユーザー情報が変更された時にフォームをリセット
  useEffect(() => {
    reset({
      displayName: user.displayName || '',
      bio: user.bio || '',
    });
  }, [user.displayName, user.bio, reset]);

  // フォーム値の監視
  const displayNameValue = watch('displayName') || '';
  const bioValue = watch('bio') || '';

  // フォーム送信処理
  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      await onProfileUpdate({
        displayName: data.displayName.trim(),
        bio: data.bio?.trim() || '',
      });
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('settings.profile.updateError', { default: 'プロフィールの更新に失敗しました' })
      );
    }
  };

  // フィールド変更ハンドラー
  const _handleDisplayNameChange = (value: string) => {
    setValue('displayName', value, { shouldDirty: true });
  };

  const _handleBioChange = (value: string) => {
    setValue('bio', value, { shouldDirty: true });
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* 新しいAtomicデザインのプロフィールフォーム */}
      <ProfileInfoForm
        defaultValues={{
          displayName: displayNameValue,
          bio: bioValue,
        }}
        onSubmit={handleSubmit(onSubmit) as any}
        isSubmitting={isFormSubmitting || isUpdating}
      />
    </div>
  );
}
