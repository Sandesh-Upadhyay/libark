/**
 * 🔐 LoginDialog - ログインダイアログコンポーネント
 *
 * 責任:
 * - モーダルダイアログでログインフォームを表示
 * - ログイン処理の実行
 * - ダイアログの開閉制御
 *
 * 特徴:
 * - モーダルオーバーレイ
 * - ESCキーで閉じる
 * - 外側クリックで閉じる
 * - アニメーション付き
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button, Logo } from '@/components/atoms';
import { LoginForm } from '@/features/auth/LoginForm';
import { SocialLoginButtons } from '@/features/auth/components/molecules/SocialLoginButtons';
import { AuthDialogNavigation } from '@/components/molecules/AuthDialogNavigation';
import { TwoFactorVerification } from '@/features/auth/components/TwoFactorVerification';
import {
  useTwoFactorIsOpen,
  useTwoFactorTempUserId,
  useTwoFactorLoading,
  useTwoFactorError,
  useTwoFactorVerify,
  useTwoFactorClose,
} from '@/stores/twoFactor';
import { useTwoFactorVerifier } from '@/features/auth/utils/twoFactorAuth';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  // 2FA認証ストア（個別selector使用）
  const twoFactorIsOpen = useTwoFactorIsOpen();
  const tempUserId = useTwoFactorTempUserId();
  const twoFactorLoading = useTwoFactorLoading();
  const twoFactorError = useTwoFactorError();
  const verify = useTwoFactorVerify();
  const closeTwoFactorDialog = useTwoFactorClose();

  // GraphQL 2FA認証関数
  const twoFactorVerifier = useTwoFactorVerifier();

  // 2FA認証実行関数
  const handleTwoFactorVerify = async (code: string): Promise<boolean> => {
    return await verify(code, twoFactorVerifier);
  };

  // デバッグログ - 2FA状態変更を監視
  useEffect(() => {
    console.log('🔐 [DEBUG] LoginDialog 2FA状態変更:', {
      isOpen: twoFactorIsOpen,
      tempUserId,
      loading: twoFactorLoading,
      error: twoFactorError,
    });
  }, [twoFactorIsOpen, tempUserId, twoFactorLoading, twoFactorError]);
  // ESCキーでダイアログを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} login clicked`);
    // TODO: ソーシャルログイン実装
  };

  const handleLoginSuccess = () => {
    // ログイン成功コールバックを実行（ダイアログ閉鎖はonLoginSuccess経由で親が管理）
    onLoginSuccess?.();
  };

  // 2FA認証成功時の処理
  const handleTwoFactorSuccess = async () => {
    // 2FA認証成功時は認証状態を確認してからログイン成功処理
    try {
      // 少し待ってから認証状態を確認（refetchが完了するまで）
      await new Promise(resolve => setTimeout(resolve, 100));

      // ログイン成功処理を実行
      handleLoginSuccess();
    } catch (error) {
      console.error('🔐 [DEBUG] 2FA成功後の処理エラー:', error);
    }
  };

  // 2FA認証キャンセル時の処理
  const handleTwoFactorCancel = () => {
    // 2FA認証ダイアログを閉じてログインフォームに戻る
    closeTwoFactorDialog();
  };

  // ダイアログを閉じる処理（2FA状態もリセット）
  const handleClose = () => {
    closeTwoFactorDialog();
    onClose();
  };

  const dialogContent = (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={handleClose}
          />

          {/* ダイアログコンテンツ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className='relative bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'
            role='dialog'
            data-testid='login-dialog'
          >
            {/* ヘッダー */}
            <div className='flex items-center justify-between p-6 border-b border-border'>
              <div className='flex items-center space-x-3'>
                {/* 2FA認証時は戻るボタンを表示 */}
                {twoFactorIsOpen && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleTwoFactorCancel}
                    className='h-8 w-8 p-0 mr-2'
                    data-testid='back-to-login-button'
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                )}
                <Logo size='sm' />
                <h2 className='text-xl font-semibold text-foreground'>
                  {twoFactorIsOpen ? '二要素認証' : 'ログイン'}
                </h2>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClose}
                className='h-8 w-8 p-0'
                data-testid='close-login-dialog-button'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {/* コンテンツ */}
            <div className='p-6 space-y-6'>
              {!twoFactorIsOpen ? (
                <div key='login-content' className='space-y-4'>
                  {/* ログインフォーム */}
                  <div className='space-y-4'>
                    <LoginForm redirectPath='/home' onSuccess={handleLoginSuccess} compact={true} />

                    {/* パスワード忘れリンク（ログインボタン直下） */}
                    <div className='text-center'>
                      <a
                        href='/forgot-password'
                        className='text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors duration-200'
                        data-testid='dialog-forgot-password-link'
                      >
                        パスワードを忘れた方はこちら
                      </a>
                    </div>
                  </div>

                  {/* ソーシャルログイン */}
                  <SocialLoginButtons
                    providers={['google']}
                    onProviderClick={handleSocialLogin}
                    variant='default'
                  />

                  {/* 統一されたナビゲーション */}
                  <AuthDialogNavigation type='login' onSwitch={onSwitchToRegister} />
                </div>
              ) : (
                <div key='2fa-content' className='space-y-4'>
                  {/* 2FA認証フォーム */}
                  <div className='space-y-4'>
                    <div className='text-center text-sm text-muted-foreground mb-4'>
                      認証アプリで生成された6桁のコードを入力してください
                    </div>
                    <TwoFactorVerification
                      isOpen={twoFactorIsOpen}
                      tempUserId={tempUserId}
                      loading={twoFactorLoading}
                      onVerify={handleTwoFactorVerify}
                      onSuccess={handleTwoFactorSuccess}
                      onCancel={handleTwoFactorCancel}
                      embedded={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
};
