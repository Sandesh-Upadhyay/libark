/**
 * 🛡️ 統一ガードコンポーネント (Organism)
 *
 * 責任:
 * - 認証状態のチェック
 * - 管理者権限のチェック
 * - 適切なリダイレクト処理
 * - ローディング状態の管理
 *
 * 特徴:
 * - シンプルで一貫したAPI
 * - 型安全な権限チェック
 * - 最小限の依存関係
 * - クリーンな実装
 */

'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@libark/graphql-client';

import { usePermissions } from '@/hooks';
import { LoadingSpinner } from '@/components/atoms';

/**
 * ガードタイプ定義
 */
export type GuardType = 'auth' | 'admin';

/**
 * Guard Props
 */
export interface GuardProps {
  /** ガードタイプ */
  type?: GuardType;
  /** 保護するコンテンツ */
  children: React.ReactNode;
  /** リダイレクト先 */
  redirectTo?: string;
  /** ローディング時のフォールバック */
  fallback?: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 🛡️ 統一ガードコンポーネント
 *
 * 認証・認可を統一的に管理するシンプルなコンポーネント
 *
 * 使用例:
 * ```tsx
 * // 認証が必要なページ
 * <Guard type="auth">
 *   <MessagesPage />
 * </Guard>
 *
 * // 管理者権限が必要なページ
 * <Guard type="admin">
 *   <AdminPage />
 * </Guard>
 * ```
 */
export const Guard: React.FC<GuardProps> = ({
  type = 'auth',
  children,
  redirectTo,
  fallback,
  className,
}) => {
  const { isAuthenticated, isInitializing, clientReady } = useAuth();
  const { isAdmin, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();

  // Memoize redirect destination to prevent recalculation
  const finalRedirectTo = useMemo(
    () => redirectTo || (type === 'admin' ? '/' : '/'),
    [redirectTo, type]
  );

  // Memoize state checks to prevent unnecessary effect runs
  const isLoadingState = useMemo(
    () => isInitializing || !clientReady || (type === 'admin' && permissionsLoading),
    [isInitializing, clientReady, type, permissionsLoading]
  );

  const shouldRedirect = useMemo(() => {
    if (isLoadingState) return false;
    if (!isAuthenticated) return true;
    if (type === 'admin' && !isAdmin) return true;
    return false;
  }, [isLoadingState, isAuthenticated, isAdmin, type]);

  // Stable navigation callback
  const handleRedirect = useCallback(
    (reason: string) => {
      console.log('🔐 [DEBUG] Guard: リダイレクト実行', {
        reason,
        finalRedirectTo,
        isAuthenticated,
        isAdmin,
        type,
      });
      navigate(finalRedirectTo, { replace: true });
    },
    [navigate, finalRedirectTo, isAuthenticated, isAdmin, type]
  );

  // 🔧 Effect: Handle redirects when state changes (cleaned up)
  useEffect(() => {
    // Loading state check - must be done first
    if (isLoadingState) {
      console.log('🔐 [DEBUG] Guard: ローディング中', {
        isInitializing,
        clientReady,
        permissionsLoading,
      });
      return;
    }

    // All checks done - determine if redirect is needed
    if (!isAuthenticated) {
      handleRedirect('認証されていないユーザー');
    } else if (type === 'admin' && !isAdmin) {
      handleRedirect('管理者権限がないユーザー');
    } else {
      console.log('🔐 [DEBUG] Guard: 認証OK - コンテンツ表示');
    }
  }, [isLoadingState, isAuthenticated, isAdmin, type, handleRedirect]);

  // 🔧 Loading state rendering
  if (isLoadingState) {
    return (
      <div key='guard-loading' className={className}>
        {fallback || (
          <div className='min-h-screen flex items-center justify-center'>
            <LoadingSpinner size='lg' />
          </div>
        )}
      </div>
    );
  }

  // 🔧 Not authenticated or not authorized
  if (shouldRedirect) {
    return null;
  }

  // 🔧 Authenticated and authorized - show content
  return (
    <div key='guard-content' className={className}>
      {children}
    </div>
  );
};

// displayNameを設定
Guard.displayName = 'Guard';
