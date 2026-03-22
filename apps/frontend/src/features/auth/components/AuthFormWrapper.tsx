/**
 * 🔐 認証フォーム共通ラッパーコンポーネント
 *
 * ログインと登録フォームで共通のレイアウトとスタイリングを提供
 * - 統一されたフォーム構造
 * - 統一されたスタイリング
 * - 統一されたローディング状態表示
 */

import React from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

import { Form } from '@/components/atoms';

interface AuthFormWrapperProps<TFormData extends FieldValues = Record<string, unknown>> {
  /** React Hook Formインスタンス */
  form: UseFormReturn<TFormData>;
  /** フォーム送信ハンドラー */
  onSubmit: (data: TFormData) => Promise<void>;
  /** フォームのdata-testid */
  testId: string;
  /** CSSクラス名 */
  className?: string;
  /** 子要素 */
  children: React.ReactNode;
}

/**
 * 🔐 認証フォーム共通ラッパー
 *
 * ログインと登録フォームで共通のフォーム構造を提供
 */
export function AuthFormWrapper<TFormData extends FieldValues = FieldValues>({
  form,
  onSubmit,
  testId,
  className,
  children,
}: AuthFormWrapperProps<TFormData>) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-6 ${className || ''}`}
        noValidate
        data-testid={testId}
      >
        {children}
      </form>
    </Form>
  );
}

AuthFormWrapper.displayName = 'AuthFormWrapper';
