/**
 * 🎯 統合GraphQLプロバイダー（責任分離版）
 *
 * Apollo Client + 状態管理を統合したプロバイダー
 * 認証は別のAuthProviderで管理
 */

'use client';

import React, { useEffect, type ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { getGraphQLClientConfig } from '@libark/core-shared';
import { LogCategory, unifiedLoggerHelpers as logger } from '@libark/core-shared';

import { getApolloClient } from '../apollo/index.js';
import { useAppStore, initializeSettings } from '../store/index.js';
import { AuthProvider } from '../auth/AuthProvider.js';

export interface GraphQLProviderProps {
  children: ReactNode;
  config?: {
    httpUrl?: string;
    wsUrl?: string;
    enableSubscriptions?: boolean;
    enableDevTools?: boolean;
  };
}

/**
 * 🎯 GraphQLプロバイダー（責任分離版）
 *
 * 責任:
 * - Apollo Clientの提供のみ
 * - 認証はAuthProviderに委譲
 */
export function GraphQLProvider({ children, config }: GraphQLProviderProps) {
  // 設定の取得
  const clientConfig = config || getGraphQLClientConfig();

  // Apollo Clientの取得
  const client = getApolloClient();

  // 初期化処理（ログ出力・設定同期）
  useEffect(() => {
    // 設定の初期化と同期
    initializeSettings();

    // 統一ログシステムによる初期化ログ（一度だけ出力）
    logger.init(LogCategory.INIT, 'GraphQLProvider', {
      httpUrl: clientConfig.httpUrl,
      wsUrl: clientConfig.wsUrl,
    });
  }, [clientConfig]);

  // Vite CSR環境のためSSRガード不要。Apolloクライアントが存在しない場合のみフォールバック
  if (!client) {
    return null;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

/**
 * 🎯 テーマプロバイダー
 *
 * テーマ設定の適用とシステムテーマの監視
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppStore();

  useEffect(() => {
    // テーマの適用
    const applyTheme = () => {
      const root = document.documentElement;

      let actualTheme = settings.theme;

      // システムテーマの場合は実際のテーマを判定
      if (settings.theme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // CSSクラスの適用
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);

      // カラースキームの設定
      root.style.colorScheme = actualTheme;
    };

    applyTheme();

    // システムテーマ変更の監視
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // アニメーション設定の適用
  useEffect(() => {
    const root = document.documentElement;

    if (settings.animationsEnabled) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }
  }, [settings.animationsEnabled]);

  return <>{children}</>;
}

/**
 * 🎯 統合アプリケーションプロバイダー
 *
 * 全ての必要なプロバイダーを統合
 */
export function AppProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: GraphQLProviderProps['config'];
}) {
  return (
    <GraphQLProvider config={config}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </GraphQLProvider>
  );
}

// デフォルトエクスポート
export default AppProvider;
