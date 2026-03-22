/**
 * 🎯 useRegister - 登録専用フック（統一版）
 *
 * useAuthFormベースの統一された登録フック
 * - 共通エラーハンドリング
 * - 統一されたローディング状態管理
 * - 統一されたリダイレクト処理
 */

import { useAuth } from '@libark/graphql-client';

import type { AuthFormConfig } from '@/features/auth/types';

import { registerSchema, type RegisterFormData } from './validations';
import { useAuthForm, createFormDataTransformer } from './hooks/useAuthForm';
import { createRegisterErrorHandler } from './utils/authErrorHandler';

export function useRegister(config: AuthFormConfig<RegisterFormData> = {}) {
  const { register: registerUser, isLoading: isAuthLoading } = useAuth();

  // 統一認証フォームフックを使用
  return useAuthForm(config, {
    schema: registerSchema,
    defaultValues: { username: '', email: '', password: '', displayName: '' } as const,
    authAction: registerUser,
    isAuthLoading,
    transformFormData: createFormDataTransformer.register,
    createErrorHandler: createRegisterErrorHandler,
  });
}
