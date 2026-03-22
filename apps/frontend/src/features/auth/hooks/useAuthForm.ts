/**
 * 🔐 統一認証フォームフック
 *
 * ログインと登録で共通のフォームロジックを提供
 * - ジェネリック型による柔軟性
 * - 統一されたエラーハンドリング
 * - 統一されたローディング状態管理
 * - 統一されたリダイレクト処理
 */

import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import type { UserInfoFragment } from '@libark/graphql-client';

import type { AuthFormConfig, AuthFormResult, AuthFormHookConfig } from '@/features/auth/types';

/**
 * 🎯 統一認証フォームフック
 *
 * ログインと登録の共通ロジックを抽象化したジェネリックフック
 *
 * @template TFormData フォームデータの型
 * @template TInput APIリクエストの型
 */
export function useAuthForm<TFormData extends FieldValues, TInput extends Record<string, unknown>>(
  config: AuthFormConfig<TFormData>,
  hookConfig: AuthFormHookConfig<TFormData, TInput>
): AuthFormResult<TFormData> {
  const { redirectPath = '/home', onSuccess, onError } = config;
  const {
    schema,
    defaultValues,
    authAction,
    isAuthLoading,
    transformFormData,
    createErrorHandler,
  } = hookConfig;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 成功時の遅延リダイレクトが残っていると、失敗時でも遷移が走る/DOMが壊れる原因になるため掃除する
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
      navigateTimeoutRef.current = null;
    };
  }, []);

  // React Hook Form の設定
  const form = useForm<TFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  const isLoading = isSubmitting || isAuthLoading;

  // エラーハンドラーを作成
  const errorHandler = createErrorHandler(setError, onError);

  // 統一認証処理
  const handleAuth = async (data: TFormData): Promise<void> => {
    // Multiple submission guard
    if (isSubmitting) {
      console.warn('🔐 [DEBUG] useAuthForm: Already submitting, ignoring duplicate submission');
      return;
    }

    try {
      console.log('🔐 [DEBUG] useAuthForm: 認証処理開始');

      // フォームデータをAPIリクエスト形式に変換
      const input = transformFormData(data);
      console.log('🔐 [DEBUG] useAuthForm: フォームデータ変換完了', {
        hasInput: !!input,
      });

      // 認証アクション実行
      const result = await authAction(input);
      console.log('🔐 [DEBUG] useAuthForm: 認証アクション完了', {
        success: result.success,
        hasError: !!result.error,
        requiresTwoFactor: result.requiresTwoFactor,
        message: result.message,
      });

      // 成功判定とレスポンス処理
      if (result.success && result.data) {
        // 成功時の処理
        console.log('🔐 [DEBUG] useAuthForm: 認証成功 - handleAuthSuccess呼び出し');
        await handleAuthSuccess(result.data, result.message);
      } else if (result.requiresTwoFactor) {
        // 2FA要求時は何もしない（エラーではない）
        // 2FA認証ダイアログは別途開かれる
        console.log('🔐 [DEBUG] useAuthForm: 2FA認証が必要 - エラートーストをスキップ');
      } else {
        // 失敗時の処理（GraphQLエラーレスポンス）
        const errorMessage = result.error || result.message || '認証に失敗しました';
        console.log('🔐 [DEBUG] useAuthForm: 認証失敗 - handleAuthFailure呼び出し', {
          errorMessage,
        });
        await handleAuthFailure(errorMessage);
      }
    } catch (error) {
      // 例外エラーの処理
      console.error('🔐 [DEBUG] useAuthForm: 認証処理で例外発生', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      await errorHandler(error);
    }
  };

  // 認証成功時の処理
  const handleAuthSuccess = async (user: UserInfoFragment, message?: string): Promise<void> => {
    console.log('🔐 [DEBUG] useAuthForm: handleAuthSuccess開始', {
      userId: user?.id,
      username: user?.username,
      redirectPath,
    });

    // 成功コールバック
    onSuccess?.(user);

    // 成功トーストの表示
    if (message) {
      try {
        const { toast } = await import('@/lib/toast');
        toast.success(message);
      } catch (toastError) {
        console.warn('⚠️ 成功トースト表示をスキップ:', toastError);
      }
    }

    // リダイレクト処理（少し遅延を入れてダイアログが閉じるのを待つ）
    console.log('🔐 [DEBUG] useAuthForm: 500ms後にナビゲーション開始');
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current);
    }
    navigateTimeoutRef.current = setTimeout(() => {
      console.log('🔐 [DEBUG] useAuthForm: ナビゲーション実行:', redirectPath);
      navigate(redirectPath);
    }, 500);
  };

  // 認証失敗時の処理
  const handleAuthFailure = async (errorMessage: string): Promise<void> => {
    // 失敗時は、前回成功のタイマー等があれば必ず止める
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current);
      navigateTimeoutRef.current = null;
    }
    const error = new Error(errorMessage);
    await errorHandler(error);
  };

  return {
    // フォーム関連
    form,
    register,
    handleSubmit,
    errors,
    isSubmitting,

    // 認証関連
    isLoading,
    onSubmit: handleAuth,

    // 翻訳
    t,
  };
}

/**
 * 🔧 フォームデータ変換ヘルパー
 */
export const createFormDataTransformer = {
  /**
   * ログイン用変換関数
   */
  login: <T extends { email: string; password: string }>(data: T) => ({
    email: data.email,
    password: data.password,
  }),

  /**
   * 登録用変換関数
   */
  register: <
    T extends {
      username: string;
      email: string;
      password: string;
      displayName?: string;
      timezone?: string;
    },
  >(
    data: T
  ) => ({
    username: data.username,
    email: data.email,
    password: data.password,
    displayName: data.displayName || undefined,  // Maps empty string to undefined
    timezone: data.timezone || detectBrowserTimezone(), // Auto-detect if not provided
  }),
};

/**
 * ブラウザのタイムゾーンを自動検出
 */
function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo';
  } catch {
    return 'Asia/Tokyo'; // フォールバック
  }
}
