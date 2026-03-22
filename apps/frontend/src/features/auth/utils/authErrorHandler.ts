/**
 * 🚨 認証エラーハンドリングユーティリティ
 *
 * ログインと登録で共通のエラーハンドリングロジックを提供
 * - エラーメッセージの内容に応じたフィールド設定
 * - 統一されたトーストエラー表示
 * - 型安全なエラーハンドリング
 */

import type { UseFormSetError, FieldPath, FieldValues } from 'react-hook-form';

/**
 * エラーフィールドマッピング設定
 */
interface ErrorFieldMapping {
  keywords: string[];
  field: string;
}

/**
 * 認証エラーハンドリング設定
 */
export interface AuthErrorHandlerConfigEvent<TFormData extends FieldValues> {
  setError: UseFormSetError<TFormData>;
  errorFieldMappings: ErrorFieldMapping[];
  defaultField: FieldPath<TFormData>;
  onError?: (error: Error) => void;
}

/**
 * 🎯 認証エラーハンドラー
 *
 * エラーメッセージの内容に応じて適切なフィールドにエラーを設定し、
 * トーストでもエラーを表示する統一されたエラーハンドリング
 */
export async function handleAuthError<TFormData extends FieldValues>(
  error: unknown,
  config: AuthErrorHandlerConfigEvent<TFormData>
): Promise<void> {
  const { setError, errorFieldMappings, defaultField, onError } = config;

  // エラーメッセージの抽出
  const message = error instanceof Error ? error.message : 'エラーが発生しました';

  // エラーメッセージの内容に応じて適切なフィールドを特定
  let targetField = defaultField;
  for (const mapping of errorFieldMappings) {
    if (mapping.keywords.some((keyword: string) => message.includes(keyword))) {
      targetField = mapping.field as FieldPath<TFormData>;
      break;
    }
  }

  // フィールドにエラーを設定
  setError(targetField, { type: 'manual', message });

  // トーストでもエラーを表示
  try {
    const { toast } = await import('@/lib/toast');
    toast.error(message);
  } catch (toastError) {
    console.warn('⚠️ エラートースト表示をスキップ:', toastError);
  }

  // エラーコールバック実行
  onError?.(error instanceof Error ? error : new Error(message));
}

/**
 * 🔧 ログイン用エラーフィールドマッピング
 */
export const LOGIN_ERROR_FIELD_MAPPINGS: ErrorFieldMapping[] = [
  {
    keywords: ['ユーザー名', 'メールアドレス', 'アカウント'],
    field: 'email', // ログインではemailフィールドがユーザー名/メールアドレス両方を受け付ける
  },
  {
    keywords: ['パスワード'],
    field: 'password',
  },
];

/**
 * 🔧 登録用エラーフィールドマッピング
 */
export const REGISTER_ERROR_FIELD_MAPPINGS: ErrorFieldMapping[] = [
  {
    keywords: ['ユーザー名'],
    field: 'username',
  },
  {
    keywords: ['メールアドレス'],
    field: 'email',
  },
  {
    keywords: ['パスワード'],
    field: 'password',
  },
  {
    keywords: ['表示名'],
    field: 'displayName',
  },
];

/**
 * 🎯 ログイン用エラーハンドラーファクトリー
 */
export function createLoginErrorHandler<TFormData extends FieldValues>(
  setError: UseFormSetError<TFormData>,
  onError?: (error: unknown) => void
) {
  return async (error: unknown) =>
    handleAuthError(error, {
      setError,
      errorFieldMappings: LOGIN_ERROR_FIELD_MAPPINGS,
      defaultField: 'email' as FieldPath<TFormData>,
      onError,
    });
}

/**
 * 🎯 登録用エラーハンドラーファクトリー
 */
export function createRegisterErrorHandler<TFormData extends FieldValues>(
  setError: UseFormSetError<TFormData>,
  onError?: (error: unknown) => void
) {
  return async (error: unknown) =>
    handleAuthError(error, {
      setError,
      errorFieldMappings: REGISTER_ERROR_FIELD_MAPPINGS,
      defaultField: 'email' as FieldPath<TFormData>,
      onError,
    });
}
