/**
 * 🔐 認証関連のユーティリティ関数
 *
 * 認証フローで使用する共通的な処理を提供
 * ページコンポーネントから認証ロジックを分離
 */

import { type User } from '@libark/graphql-client';
import { type NavigateFunction } from 'react-router-dom';
import { envUtils } from '@libark/core-shared';

/**
 * 🔒 リダイレクト先URLの安全性チェック
 *
 * 外部URLへのリダイレクトを防ぎ、同一オリジンのみ許可
 */
export function validateRedirectUrl(
  returnTo: string | null,
  defaultPath: string = '/home'
): string {
  if (!returnTo) {
    return defaultPath;
  }

  try {
    // 相対パスの場合はそのまま返す
    if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }

    // 絶対URLの場合は同一オリジンかチェック
    if (typeof window !== 'undefined') {
      const url = new URL(returnTo, window.location.origin);

      // 同一オリジンかつ相対パスの場合のみ許可
      if (url.origin === window.location.origin && url.pathname.startsWith('/')) {
        return url.pathname + url.search + url.hash;
      }
    }
  } catch {
    // URLが無効な場合はデフォルトにフォールバック
  }

  return defaultPath;
}

/**
 * 🔄 認証後のリダイレクト処理
 *
 * ログイン・登録成功後の統一されたリダイレクト処理
 * React Router のクライアントサイドルーティングを使用
 */
export function handleAuthRedirect(
  redirectPath: string,
  user?: User,
  options: {
    usePhysicalRedirect?: boolean;
    delay?: number;
    router?: NavigateFunction;
  } = {}
): void {
  const { usePhysicalRedirect = false, delay = 0, router } = options;

  // 開発環境でのみログ出力
  if (envUtils.isDevelopment()) {
    console.log('🔄 認証後リダイレクト:', {
      user: user?.username,
      redirectPath,
      usePhysicalRedirect,
      hasRouter: !!router,
    });
  }

  const performRedirect = () => {
    if (router) {
      // React Router クライアントサイドルーティング（推奨）
      router(redirectPath, { replace: true });
    } else if (usePhysicalRedirect) {
      // 物理遷移でブラウザ全体を再ロード
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ router が利用できないため物理リダイレクトを使用:', redirectPath);
      }
      window.location.href = redirectPath;
    } else {
      // フォールバック: 物理的なページ遷移
      if (envUtils.isDevelopment()) {
        console.warn('⚠️ router が利用できないため物理リダイレクトを使用:', redirectPath);
      }
      window.location.href = redirectPath;
    }
  };

  if (delay > 0) {
    setTimeout(performRedirect, delay);
  } else {
    performRedirect();
  }
}

// 注意: 認証エラーハンドリングは /features/auth/utils/authErrorHandler.ts に統一されました
// 古いgetLoginErrorMessage関数は削除され、新しい統一エラーハンドラーを使用してください
