/**
 * 📝 RegisterForm - 登録フォームコンポーネント (Organism)
 *
 * 認証機能の登録フォーム部分を抽出したコンポーネント
 * Feature-based Architecture + Atomic Design のハイブリッド構成
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, User, Lock } from 'lucide-react';

import { UnifiedFormField } from '@/components/atoms';
import type { RegisterFormProps } from '@/features/auth/types';

import { AuthFormWrapper } from './components/AuthFormWrapper';
import { AuthSubmitButton } from './components/AuthSubmitButton';
import { useRegister } from './useRegister';

/**
 * 📝 RegisterForm コンポーネント
 *
 * 使用例:
 * ```tsx
 * <RegisterForm
 *   onSuccess={(user) => console.log('登録成功:', user)}
 *   redirectPath="/home"
 * />
 * ```
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  onLoginClick,
  redirectPath = '/home',
  className,
  compact = false,
}) => {
  // 登録専用フック使用
  const { form, isLoading, onSubmit, t } = useRegister({
    redirectPath,
    onSuccess,
    onError,
  });

  return (
    <AuthFormWrapper form={form} onSubmit={onSubmit} testId='register-form' className={className}>
      {/* ユーザー名フィールド */}
      <div data-testid='username-field'>
        <UnifiedFormField
          name='username'
          control={form.control}
          label={t('auth.register.username.label', 'ユーザー名')}
          placeholder={t('auth.register.username.placeholder', 'ユーザー名を入力')}
          type='text'
          leftIcon={<User className='h-4 w-4' />}
          required
        />
      </div>

      {/* メールアドレスフィールド */}
      <div data-testid='register-email-field'>
        <UnifiedFormField
          name='email'
          control={form.control}
          label={t('auth.register.email.label', 'メールアドレス')}
          placeholder={t('auth.register.email.placeholder', 'メールアドレスを入力')}
          type='email'
          leftIcon={<Mail className='h-4 w-4' />}
          required
        />
      </div>

      {/* パスワードフィールド */}
      <div data-testid='register-password-field'>
        <UnifiedFormField
          name='password'
          control={form.control}
          label={t('auth.register.password.label', 'パスワード')}
          placeholder={t('auth.register.password.placeholder', 'パスワードを入力')}
          type='password'
          leftIcon={<Lock className='h-4 w-4' />}
          showPasswordToggle
          required
        />
      </div>

      {/* 表示名フィールド（オプション） */}
      <div data-testid='display-name-field'>
        <UnifiedFormField
          name='displayName'
          control={form.control}
          label={t('auth.register.displayName.label', '表示名（任意）')}
          placeholder={t('auth.register.displayName.placeholder', '表示名を入力')}
          type='text'
        />
      </div>

      {/* 登録ボタン */}
      <AuthSubmitButton
        isLoading={isLoading}
        icon={UserPlus}
        text='register.submit'
        loadingText='register.submitting'
        testId='register-submit-button'
        t={t}
      />

      {/* フッターリンク（compactモードでは非表示） */}
      {!compact && (
        <div className='text-center text-sm' data-testid='register-footer-links'>
          {onLoginClick ? (
            <button
              type='button'
              onClick={onLoginClick}
              className='text-primary hover:underline'
              data-testid='login-link-button'
            >
              {t('auth.register.hasAccount', 'すでにアカウントをお持ちの方はこちら')}
            </button>
          ) : (
            <Link to='/login' className='text-primary hover:underline' data-testid='login-link'>
              {t('auth.register.hasAccount', 'すでにアカウントをお持ちの方はこちら')}
            </Link>
          )}
        </div>
      )}
    </AuthFormWrapper>
  );
};

RegisterForm.displayName = 'RegisterForm';
