/**
 * 🎯 メインページ（登録ページ）- Xスタイル
 *
 * 責任:
 * - メインランディングページとしての機能
 * - 新規ユーザーの登録促進
 * - ソーシャルログイン対応
 * - ブランドアピール
 *
 * 特徴:
 * - Xライクなデザイン
 * - フルスクリーンレイアウト
 * - ナビゲーション非表示
 * - レスポンシブデザイン
 */

import React, { useState } from 'react';

import { Logo, Button } from '@/components/atoms';
import { SocialLoginButtons } from '@/features/auth/components/molecules/SocialLoginButtons';
import { LoginDialog } from '@/components/organisms/LoginDialog';
import { RegisterDialog } from '@/components/organisms/RegisterDialog';

const RegisterPage: React.FC = () => {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} login clicked`);
    // TODO: ソーシャルログイン実装
  };

  const handleLoginClick = () => {
    setIsLoginDialogOpen(true);
  };

  const handleLoginDialogClose = () => {
    setIsLoginDialogOpen(false);
  };

  const handleLoginSuccess = () => {
    // ログイン成功時の処理 - ナビゲーションはuseAuthFormが担当
    console.log('Login successful');
    setIsLoginDialogOpen(false);
  };

  const handleRegisterClick = () => {
    setIsRegisterDialogOpen(true);
  };

  const handleRegisterDialogClose = () => {
    setIsRegisterDialogOpen(false);
  };

  const handleRegisterSuccess = () => {
    // 登録成功時の処理 - ナビゲーションはuseAuthFormが担当
    console.log('Register successful');
    setIsRegisterDialogOpen(false);
  };

  const handleSwitchToRegister = () => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  };

  return (
    <div className='min-h-screen bg-background flex'>
      {/* 左側: ブランドエリア（60%） */}
      <div className='hidden lg:flex lg:flex-[3] bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center relative overflow-hidden'>
        {/* 背景装飾 */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div
            className='absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse'
            style={{ zIndex: 1 }}
            aria-hidden='true'
          />
          <div
            className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000'
            style={{ zIndex: 1 }}
            aria-hidden='true'
          />
        </div>

        {/* ブランドコンテンツ - 大きなロゴのみ */}
        <div className='relative z-10 text-center'>
          <Logo size='xl' className='mx-auto scale-[3] transform' />
        </div>
      </div>

      {/* 右側: 登録エリア（40%） */}
      <div className='flex-1 lg:flex-[2] flex items-center justify-center px-4 py-8'>
        <div className='w-full max-w-sm space-y-6'>
          {/* モバイル用ロゴ */}
          <div className='lg:hidden text-center mb-8'>
            <Logo size='nav' className='mx-auto' />
          </div>

          {/* メインコンテンツ */}
          <div className='space-y-6'>
            <div className='text-center lg:text-left'>
              <h2 className='text-2xl lg:text-3xl font-bold text-foreground mb-2'>
                今すぐ参加しましょう。
              </h2>
            </div>

            {/* ソーシャルログインボタン */}
            <div className='space-y-3'>
              <SocialLoginButtons
                providers={['google']}
                onProviderClick={handleSocialLogin}
                variant='large'
              />
            </div>

            {/* 区切り線 */}
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>または</span>
              </div>
            </div>

            {/* アカウント作成ボタン */}
            <Button
              variant='default'
              size='lg'
              className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold'
              onClick={handleRegisterClick}
              data-testid='open-register-dialog-button'
            >
              アカウントを作成
            </Button>

            {/* 利用規約 */}
            <p className='text-xs text-muted-foreground leading-relaxed'>
              アカウントを登録することにより、
              <a href='/terms' className='text-primary hover:underline'>
                利用規約
              </a>
              と
              <a href='/privacy' className='text-primary hover:underline'>
                プライバシーポリシー
              </a>
              （
              <a href='/cookies' className='text-primary hover:underline'>
                Cookieの使用
              </a>
              を含む）に同意したとみなされます。
            </p>

            {/* ログインボタン */}
            <div className='space-y-3 pt-4'>
              <p className='text-sm text-foreground font-medium'>アカウントをお持ちの場合</p>
              <Button
                variant='outline'
                size='lg'
                className='w-full border-border text-primary hover:bg-primary/5'
                onClick={handleLoginClick}
                data-testid='open-login-dialog-button'
              >
                ログイン
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ログインダイアログ */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={handleLoginDialogClose}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* 登録ダイアログ */}
      <RegisterDialog
        isOpen={isRegisterDialogOpen}
        onClose={handleRegisterDialogClose}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default RegisterPage;
