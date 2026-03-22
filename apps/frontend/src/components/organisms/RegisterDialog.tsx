/**
 * 📝 RegisterDialog - 登録ダイアログコンポーネント
 *
 * 責任:
 * - モーダルダイアログで登録フォームを表示
 * - 登録処理の実行
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
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button, Logo } from '@/components/atoms';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { SocialLoginButtons } from '@/features/auth/components/molecules/SocialLoginButtons';
import { AuthDialogNavigation } from '@/components/molecules/AuthDialogNavigation';

interface RegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterDialog: React.FC<RegisterDialogProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  // ESCキーでダイアログを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
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

  const handleRegisterSuccess = () => {
    // 登録成功コールバックを実行（ダイアログ閉鎖はonRegisterSuccess経由で親が管理）
    onRegisterSuccess?.();
  };

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* ダイアログコンテンツ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className='relative bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'
            role='dialog'
            data-testid='register-dialog'
          >
            {/* ヘッダー */}
            <div className='flex items-center justify-between p-6 border-b border-border'>
              <div className='flex items-center space-x-3'>
                <Logo size='sm' />
                <h2 className='text-xl font-semibold text-foreground'>アカウント作成</h2>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={onClose}
                className='h-8 w-8 p-0'
                data-testid='close-register-dialog-button'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {/* コンテンツ */}
            <div className='p-6 space-y-6'>
              {/* 登録フォーム */}
              <RegisterForm redirectPath='/home' onSuccess={handleRegisterSuccess} compact={true} />

              {/* ソーシャルログイン */}
              <SocialLoginButtons
                providers={['google']}
                onProviderClick={handleSocialLogin}
                variant='default'
              />

              {/* 統一されたナビゲーション */}
              <AuthDialogNavigation type='register' onSwitch={onSwitchToLogin} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
};
