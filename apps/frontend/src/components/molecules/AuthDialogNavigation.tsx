/**
 * 📝 AuthDialogNavigation - 認証ダイアログ共通ナビゲーション
 *
 * 責任:
 * - ログイン⇔登録の切り替えリンクを統一されたスタイルで提供
 * - 一貫したデザインシステムの適用
 *
 * 特徴:
 * - Tailwindによる統一されたスタイリング
 * - アクセシビリティ対応
 * - テスト用属性の提供
 */

import React from 'react';

interface AuthDialogNavigationProps {
  /** ナビゲーションのタイプ */
  type: 'login' | 'register';
  /** 切り替えボタンのクリックハンドラー */
  onSwitch?: () => void;
}

export const AuthDialogNavigation: React.FC<AuthDialogNavigationProps> = ({ type, onSwitch }) => {
  if (!onSwitch) return null;

  const isLogin = type === 'login';
  const text = isLogin ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は';
  const testId = isLogin ? 'switch-to-register-button' : 'switch-to-login-button';

  return (
    <div className='text-center text-sm border-t border-border pt-4'>
      <div className='text-muted-foreground'>
        {text}{' '}
        <button
          type='button'
          onClick={onSwitch}
          className='text-primary hover:underline font-medium transition-colors duration-200'
          data-testid={testId}
        >
          こちら
        </button>
      </div>
    </div>
  );
};
