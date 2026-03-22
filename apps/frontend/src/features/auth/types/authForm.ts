/**
 * 🔐 認証フォーム共通型定義
 *
 * ログインと登録フォームで共通の型定義を提供
 * - ジェネリック型による柔軟性
 * - 統一されたコンフィグ型
 * - 型安全な認証フォーム実装
 */

import type { UserInfoFragment } from '@libark/graphql-client';
import type { AuthResponse } from '@libark/core-shared';
import type { UseFormReturn, UseFormSetError, FieldValues, DefaultValues } from 'react-hook-form';
import type { TFunction } from 'i18next';
import type { ZodSchema } from 'zod';

/**
 * 認証フォーム基本設定
 */
export interface AuthFormConfig<TFormData extends FieldValues> {
  /** リダイレクト先パス */
  redirectPath?: string;
  /** 成功時コールバック */
  onSuccess?: (user: UserInfoFragment) => void;
  /** エラー時コールバック */
  onError?: (error: unknown) => void;
}

/**
 * 認証フォーム結果
 */
export interface AuthFormResult<TFormData extends FieldValues> {
  /** React Hook Formインスタンス */
  form: UseFormReturn<TFormData>;
  /** フィールド登録関数 */
  register: UseFormReturn<TFormData>['register'];
  /** フォーム送信ハンドラー */
  handleSubmit: UseFormReturn<TFormData>['handleSubmit'];
  /** フォームエラー */
  errors: UseFormReturn<TFormData>['formState']['errors'];
  /** 送信中フラグ */
  isSubmitting: boolean;
  /** ローディング中フラグ（送信中 + 認証中） */
  isLoading: boolean;
  /** フォーム送信関数 */
  onSubmit: (data: TFormData) => Promise<void>;
  /** 翻訳関数 */
  t: TFunction;
}

/**
 * 認証アクション関数の型
 */
export type AuthAction<TInput, TResult = AuthResponse<UserInfoFragment>> = (
  input: TInput
) => Promise<TResult>;

/**
 * 認証フォームフック設定
 */
export interface AuthFormHookConfig<TFormData extends FieldValues, TInput> {
  /** バリデーションスキーマ */
  schema: ZodSchema<TFormData>;
  /** デフォルト値 */
  defaultValues: DefaultValues<TFormData>;
  /** 認証アクション関数 */
  authAction: AuthAction<TInput, AuthResponse<UserInfoFragment>>;
  /** 認証ローディング状態 */
  isAuthLoading: boolean;
  /** フォームデータをAPIリクエスト形式に変換 */
  transformFormData: (data: TFormData) => TInput;
  /** エラーハンドラーファクトリー */
  createErrorHandler: (
    setError: UseFormSetError<TFormData>,
    onError?: (error: unknown) => void
  ) => (error: unknown) => Promise<void>;
}

/**
 * 認証フォームプロパティ基底型
 */
export interface BaseAuthFormProps {
  /** 成功時コールバック */
  onSuccess?: (user: UserInfoFragment) => void;
  /** エラー時コールバック */
  onError?: (error: unknown) => void;
  /** リダイレクト先パス */
  redirectPath?: string;
  /** CSSクラス名 */
  className?: string;
  /** コンパクトモード */
  compact?: boolean;
}

/**
 * ログインフォームプロパティ
 */
export interface LoginFormProps extends BaseAuthFormProps {
  // ログイン固有のプロパティがあれば追加
}

/**
 * 登録フォームプロパティ
 */
export interface RegisterFormProps extends BaseAuthFormProps {
  /** ログインクリック時コールバック */
  onLoginClick?: () => void;
}
