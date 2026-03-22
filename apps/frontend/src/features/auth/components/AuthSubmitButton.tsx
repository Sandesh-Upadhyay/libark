/**
 * 🔐 認証フォーム送信ボタンコンポーネント
 *
 * ログインと登録フォームで共通の送信ボタンを提供
 * - 統一されたローディング状態表示
 * - 統一されたスタイリング
 * - アイコンとテキストの統一
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { TFunction } from 'i18next';

import { Button } from '@/components/atoms';

interface AuthSubmitButtonProps {
  /** ローディング中フラグ */
  isLoading: boolean;
  /** ボタンアイコン */
  icon: LucideIcon;
  /** ボタンテキスト */
  text: string;
  /** ローディング中テキスト */
  loadingText: string;
  /** data-testid */
  testId: string;
  /** 翻訳関数 */
  t: TFunction;
}

/**
 * 🔐 認証フォーム送信ボタン
 *
 * ログインと登録フォームで共通の送信ボタンUI
 */
export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  isLoading,
  icon: Icon,
  text,
  loadingText,
  testId,
  t,
}) => {
  return (
    <Button type='submit' className='w-full' disabled={isLoading} size='lg' data-testid={testId}>
      {isLoading ? (
        <>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
          {t(`auth.${loadingText}`, loadingText)}
        </>
      ) : (
        <>
          <Icon className='mr-2 h-4 w-4' />
          {t(`auth.${text}`, text)}
        </>
      )}
    </Button>
  );
};

AuthSubmitButton.displayName = 'AuthSubmitButton';
