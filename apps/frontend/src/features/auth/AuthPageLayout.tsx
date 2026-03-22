/**
 * 🔐 AuthPageLayout - 認証ページ共通レイアウト
 *
 * LoginPageとRegisterPageの共通レイアウト処理を統合
 * 責任分離の徹底とコード重複の削除を実現
 */

import React, { useEffect } from 'react';
import { Shield, Zap } from 'lucide-react';
import { useAuth } from '@libark/graphql-client';
import { useNavigate } from 'react-router-dom';

import { SocialLoginButtons } from './components/molecules/SocialLoginButtons';

// 型定義
interface AuthPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  socialProviders?: ('google' | 'github' | 'apple' | 'microsoft')[];
  onSocialProviderClick?: (provider: string) => void;
  showTrustIndicators?: boolean;
  redirectPath?: string;
}

/**
 * 🔐 AuthPageLayout コンポーネント
 *
 * 使用例:
 * ```tsx
 * <AuthPageLayout
 *   title="おかえりなさい"
 *   description="アカウントにサインインしてください"
 *   socialProviders={['google', 'github']}
 *   onSocialProviderClick={(provider) => console.log(provider)}
 * >
 *   <LoginForm />
 * </AuthPageLayout>
 * ```
 */
export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  title,
  description,
  children,
  socialProviders = ['google'],
  onSocialProviderClick,

  showTrustIndicators = true,
  redirectPath = '/home',
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 認証済みの場合はホームページにリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // デフォルトソーシャルログインハンドラー
  const handleSocialProviderClick = (provider: string) => {
    if (onSocialProviderClick) {
      onSocialProviderClick(provider);
    } else {
      console.log(`${provider} login clicked`);
      // TODO: ソーシャルログイン実装
    }
  };

  // 独立したフルスクリーンレイアウト（ナビゲーション非表示）
  return (
    <div
      className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4'
      data-testid='auth-page-layout'
    >
      <div className='w-full max-w-lg space-y-8' data-testid='auth-container'>
        {/* Logo Section */}
        <div className='text-center space-y-4' data-testid='auth-header'>
          <div className='flex justify-center'>
            <div className='h-8' />
          </div>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold text-foreground' data-testid='auth-title'>
              {title}
            </h1>
            <p className='text-muted-foreground' data-testid='auth-description'>
              {description}
            </p>
          </div>
        </div>

        {/* Form Container - シンプルなレイアウト */}
        <div className='space-y-6'>
          {/* フォームコンテンツ */}
          {children}

          {/* Social Login */}
          {socialProviders.length > 0 && (
            <SocialLoginButtons
              providers={socialProviders}
              onProviderClick={handleSocialProviderClick}
            />
          )}
        </div>

        {/* Trust Indicators */}
        {showTrustIndicators && (
          <div className='flex justify-center items-center gap-6 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Shield className='h-4 w-4 text-green-500' />
              <span>安全なログイン</span>
            </div>
            <div className='flex items-center gap-2'>
              <Zap className='h-4 w-4 text-blue-500' />
              <span>高速処理</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AuthPageLayout.displayName = 'AuthPageLayout';
