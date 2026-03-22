/**
 * 🚪 LoginForm - ログインフォームコンポーネント (Organism)
 *
 * 認証機能のログインフォーム部分を抽出したコンポーネント
 * Feature-based Architecture + Atomic Design のハイブリッド構成
 */

import React from 'react';
import { LogIn, Mail, Lock } from 'lucide-react';

import { UnifiedFormField } from '@/components/atoms';
import type { LoginFormProps } from '@/features/auth/types';

import { AuthFormWrapper } from './components/AuthFormWrapper';
import { AuthSubmitButton } from './components/AuthSubmitButton';
import { useLogin } from './useLogin';

/**
 * 🚪 LoginForm コンポーネント
 *
 * 使用例:
 * ```tsx
 * <LoginForm
 *   onSuccess={(user) => console.log('ログイン成功:', user)}
 *   redirectPath="/home"
 * />
 * ```
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  redirectPath = '/home',
  className,
  compact: _compact = false,
}) => {
  // ログイン専用フック使用
  const { form, isLoading, onSubmit, t } = useLogin({
    redirectPath,
    onSuccess,
    onError,
  });

  return (
    <AuthFormWrapper form={form} onSubmit={onSubmit} testId='login-form' className={className}>
      {/* メールアドレス/ユーザー名フィールド */}
      <div data-testid='email-field'>
        <UnifiedFormField
          name='email'
          control={form.control}
          label={t('auth.login.email.label', 'ユーザー名またはメールアドレス')}
          placeholder={t('auth.login.email.placeholder', 'ユーザー名またはメールアドレスを入力')}
          type='text'
          leftIcon={<Mail className='w-4 h-4' />}
          required
        />
      </div>

      {/* パスワードフィールド */}
      <div data-testid='password-field'>
        <UnifiedFormField
          name='password'
          control={form.control}
          label={t('auth.login.password.label', 'パスワード')}
          placeholder={t('auth.login.password.placeholder', 'パスワードを入力')}
          type='password'
          leftIcon={<Lock className='w-4 h-4' />}
          showPasswordToggle
          required
        />
      </div>

      {/* ログインボタン */}
      <AuthSubmitButton
        isLoading={isLoading}
        icon={LogIn}
        text='login.submit'
        loadingText='login.submitting'
        testId='login-submit-button'
        t={t}
      />

      {/* フッターリンク（compactモードでは非表示） */}
      {/* 登録リンクはLoginDialog内のナビゲーション部分に統一 */}
    </AuthFormWrapper>
  );
};

LoginForm.displayName = 'LoginForm';
