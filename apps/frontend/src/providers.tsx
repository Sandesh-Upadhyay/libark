/**
 * 🎯 統合アプリケーションプロバイダー（Vite版・責任分離・重複排除版）
 *
 * 責任:
 * 1. 基盤システムの初期化（一度のみ）
 * 2. 統一プロバイダーシステムの提供
 * 3. 重複初期化の防止
 * 4. i18n初期化
 */

import React, { useEffect, useRef } from 'react';
import { AppProvider } from '@libark/graphql-client';

import { ToastProvider } from '@/components/templates/providers/ToastProvider';
import { AppDataProvider } from '@/providers/AppDataProvider';
// REST APIクライアント関連のインポートは削除されました（GraphQL-only環境のため）

// import { UnifiedProviderSystem } from '@/components/templates/providers/UnifiedProviderSystem';
// import { initializeConsoleFilter } from '@/lib/console-filter';

// i18n設定をインポート（初期化のため）
import './i18n/config';

/**
 * 🎯 統合アプリケーションプロバイダー（Vite版・責任分離・重複排除版）
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // 初期化状態の管理（重複防止）
  const initializationRef = useRef({
    consoleFilter: false,
  });

  // MediaRestClientの初期化は削除されました（GraphQL-only環境のため）

  // コンソールフィルターの初期化（一度のみ）
  useEffect(() => {
    if (initializationRef.current.consoleFilter) {
      return; // 既に初期化済み
    }

    // initializeConsoleFilter();
    initializationRef.current.consoleFilter = true;
  }, []);

  return (
    <AppProvider config={{}}>
      <AppDataProvider>
        <ToastProvider>{children}</ToastProvider>
      </AppDataProvider>
    </AppProvider>
  );
}
