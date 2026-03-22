/**
 * 🛡️ CSRF保護フック
 *
 * 責任:
 * - CSRFトークンの取得・管理
 * - GraphQLミューテーションへの自動トークン付与
 * - トークンの自動更新
 * - エラーハンドリング
 */

import { useState, useEffect, useCallback } from 'react';
import { useApolloClient } from '@apollo/client';

// CSRF設定
const CSRF_CONFIG = {
  tokenEndpoint: '/csrf-token',
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token',
  refreshInterval: 30 * 60 * 1000, // 30分
};

// CSRFトークン情報
interface CSRFTokenInfo {
  token: string;
  headerName: string;
  cookieName: string;
}

// CSRFフックの戻り値
interface UseCSRFReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  getHeaders: () => Record<string, string>;
}

/**
 * CSRF保護フック
 */
export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apolloClient = useApolloClient();

  /**
   * CSRFトークンを取得
   */
  const fetchToken = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(CSRF_CONFIG.tokenEndpoint, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data: CSRFTokenInfo = await response.json();
      setToken(data.token);

      // Apollo Link は作成時にCSRFヘッダを注入するため、ここでは状態更新のみ
      console.log('🛡️ CSRF token updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Failed to fetch CSRF token:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [apolloClient]);

  /**
   * トークンを手動で更新
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    await fetchToken();
  }, [fetchToken]);

  /**
   * リクエストヘッダーを取得
   */
  const getHeaders = useCallback((): Record<string, string> => {
    if (!token) {
      return {};
    }

    return {
      [CSRF_CONFIG.headerName]: token,
    };
  }, [token]);

  // 初期化時にトークンを取得
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // 定期的にトークンを更新
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchToken();
    }, CSRF_CONFIG.refreshInterval);

    return () => clearInterval(interval);
  }, [token, fetchToken]);

  // ページの可視性が変わった時にトークンを更新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token) {
        fetchToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, fetchToken]);

  return {
    token,
    isLoading,
    error,
    refreshToken,
    getHeaders,
  };
}

/**
 * CSRFトークンをCookieから取得
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_CONFIG.cookieName) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * fetch APIでCSRFトークンを自動付与
 */
export function createCSRFProtectedFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = getCSRFTokenFromCookie();

    const headers = new Headers(init?.headers);
    if (token) {
      headers.set(CSRF_CONFIG.headerName, token);
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: 'include',
    });
  };
}

// デフォルトのCSRF保護fetch
export const csrfFetch = createCSRFProtectedFetch();
