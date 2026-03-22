/**
 * 🎯 プロフィール情報フォームコンポーネント (Molecule)
 *
 * 責任:
 * - プロフィール情報の入力フォーム
 * - バリデーション状態の表示
 * - 文字数カウント
 * - 統一されたフォームデザイン
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, User } from 'lucide-react';

import { SectionShell } from '@/components/molecules/SectionShell';
import { UnifiedFormField, Form, Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

/**
 * プロフィール情報フォームのスキーマ
 */
const profileInfoSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(VALIDATION_LIMITS.profile.displayNameMax, '表示名は50文字以内で入力してください'),
  bio: z
    .string()
    .max(VALIDATION_LIMITS.profile.bioMax, '自己紹介は500文字以内で入力してください')
    .optional(),
});

type ProfileInfoFormData = z.infer<typeof profileInfoSchema>;

export interface ProfileInfoFormProps {
  /** 初期値 */
  defaultValues?: {
    displayName?: string;
    bio?: string;
  };
  /** フォーム送信ハンドラー */
  onSubmit: (data: ProfileInfoFormData) => void | Promise<void>;
  /** 送信中かどうか */
  isSubmitting?: boolean;
  /** 追加のクラス名 */
  className?: string;
}

export const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  defaultValues = { displayName: '', bio: '' },
  onSubmit,
  isSubmitting = false,
  className,
}) => {
  const { t } = useTranslation();

  const form = useForm<ProfileInfoFormData>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues,
  });

  const watchedDisplayName = form.watch('displayName') || '';
  const watchedBio = form.watch('bio') || '';

  const handleSubmit = async (data: ProfileInfoFormData) => {
    await onSubmit(data);
  };

  return (
    <SectionShell showHeader={false} variant='settings' className={cn('space-y-8', className)}>
      {/* セクションヘッダー */}
      <div className='text-center space-y-4'>
        <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg'>
          <Sparkles className='w-6 h-6 text-primary' />
        </div>
        <div>
          <h3 className='text-xl font-bold text-foreground'>
            {t('settings.profile.basicInfo', { default: 'プロフィール情報' })}
          </h3>
          <p className='text-muted-foreground mt-1'>
            {t('settings.profile.basicInfoDescription', {
              default: '表示名と自己紹介を設定できます',
            })}
          </p>
        </div>
      </div>

      {/* フォーム */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* 表示名フィールド */}
          <UnifiedFormField
            name='displayName'
            control={form.control}
            label={t('settings.profile.displayName', { default: '表示名' })}
            description={t('settings.profile.displayNameDescription', {
              default: '他のユーザーに表示される名前です',
            })}
            type='text'
            leftIcon={<User className='h-4 w-4' />}
            placeholder={t('settings.profile.displayNamePlaceholder', {
              default: '表示名を入力してください',
            })}
            maxLength={50}
            characterCount={{
              current: watchedDisplayName.length,
              max: 50,
            }}
            required
          />

          {/* 自己紹介フィールド */}
          <UnifiedFormField
            name='bio'
            control={form.control}
            label={t('settings.profile.bio', { default: '自己紹介' })}
            description={t('settings.profile.bioDescription', {
              default: '改行も含めて500文字まで入力できます',
            })}
            type='textarea'
            placeholder={t('settings.profile.bioPlaceholder', {
              default: '自己紹介を入力してください',
            })}
            rows={5}
            maxLength={500}
            characterCount={{
              current: watchedBio.length,
              max: 500,
            }}
          />

          {/* 送信ボタン */}
          <div className='flex justify-end pt-6 border-t border-border/50'>
            <Button
              type='submit'
              disabled={isSubmitting || !form.formState.isDirty}
              className='h-14 px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl'
            >
              {isSubmitting ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  {t('settings.profile.saving', { default: '保存中...' })}
                </>
              ) : (
                <>
                  <Check className='mr-2 h-4 w-4' />
                  {form.formState.isDirty
                    ? t('settings.profile.saveChanges', { default: '変更を保存' })
                    : t('settings.profile.saved', { default: '保存しました' })}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </SectionShell>
  );
};
