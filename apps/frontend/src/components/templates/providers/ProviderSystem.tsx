/**
 * 🎯 統一プロバイダーシステム（責任分離・重複排除版）
 *
 * 責任:
 * 1. 全てのプロバイダーの統一管理
 * 2. 初期化順序の制御
 * 3. 重複初期化の防止
 * 4. 依存関係の明確化
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

// 個別プロバイダーの統合インポート
import { ToastProvider } from './ToastProvider';

// 削除されたプロバイダー: MediaClientProvider, GraphQLSubscriptionProvider, ContentCompletionProvider, UnifiedNotificationManager

// 統一プロバイダーシステムの状態管理
interface UnifiedProviderState {
  // 初期化状態
  isInitialized: boolean;
  isInitializing: boolean;

  // 各システムの状態
  authReady: boolean;
  mediaClientReady: boolean;
  subscriptionReady: boolean;
  notificationReady: boolean;

  // エラー状態
  error: string | null;
}

interface UnifiedProviderContextType extends UnifiedProviderState {
  // 初期化制御
  retryInitialization: () => void;
}

// コンテキストの作成
const UnifiedProviderContext = createContext<UnifiedProviderContextType | null>(null);

/**
 * 🎯 統一プロバイダーシステムフック
 */
export function useUnifiedProvider(): UnifiedProviderContextType {
  const context = useContext(UnifiedProviderContext);
  if (!context) {
    throw new Error('useUnifiedProvider must be used within UnifiedProviderSystem');
  }
  return context;
}

/**
 * 🎯 統一プロバイダーシステムコンポーネント（重複防止版）
 */
export function UnifiedProviderSystem({ children }: { children: React.ReactNode }) {
  // シンプルな初期化状態の管理
  const [state, setState] = useState<UnifiedProviderState>({
    isInitialized: false,
    isInitializing: false,
    authReady: false,
    mediaClientReady: false,
    subscriptionReady: false,
    notificationReady: false,
    error: null,
  });

  // シンプルな初期化処理
  const initializeSystem = useMemo(() => {
    return async () => {
      if (state.isInitialized || state.isInitializing) {
        return;
      }

      setState(prev => ({ ...prev, isInitializing: true, error: null }));

      try {
        // シンプルな初期化
        setState(prev => ({
          ...prev,
          authReady: true,
          mediaClientReady: true,
          subscriptionReady: true,
          notificationReady: true,
          isInitialized: true,
          isInitializing: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '初期化エラー';
        setState(prev => ({
          ...prev,
          isInitializing: false,
          error: errorMessage,
        }));
      }
    };
  }, [state.isInitialized, state.isInitializing]);

  // システム初期化の実行
  useEffect(() => {
    if (!state.isInitialized && !state.isInitializing) {
      initializeSystem();
    }
  }, [initializeSystem, state.isInitialized, state.isInitializing]);

  // 再初期化処理
  const retryInitialization = () => {
    setState({
      isInitialized: false,
      isInitializing: false,
      authReady: false,
      mediaClientReady: false,
      subscriptionReady: false,
      notificationReady: false,
      error: null,
    });
    initializeSystem();
  };

  // コンテキスト値の作成
  const contextValue: UnifiedProviderContextType = {
    ...state,
    retryInitialization,
  };

  // 初期化中の表示
  if (state.isInitializing) {
    return (
      <UnifiedProviderContext.Provider value={contextValue}>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600 dark:text-gray-400'>システムを初期化中...</p>
          </div>
        </div>
      </UnifiedProviderContext.Provider>
    );
  }

  // エラー時の表示
  if (state.error) {
    return (
      <UnifiedProviderContext.Provider value={contextValue}>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center max-w-md'>
            <div className='text-red-500 text-6xl mb-4'>⚠️</div>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              システム初期化エラー
            </h2>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>
              システムの初期化中にエラーが発生しました。
            </p>
            <button
              onClick={retryInitialization}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
            >
              再試行
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-gray-500 hover:text-gray-700'>
                  エラー詳細
                </summary>
                <pre className='mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-800 dark:text-gray-200 overflow-auto'>
                  {state.error}
                </pre>
              </details>
            )}
          </div>
        </div>
      </UnifiedProviderContext.Provider>
    );
  }

  // 正常時は統合プロバイダーで子コンポーネントをラップ（簡素化）
  return (
    <UnifiedProviderContext.Provider value={contextValue}>
      <ToastProvider>{children}</ToastProvider>
    </UnifiedProviderContext.Provider>
  );
}

/**
 * 🎯 統一プロバイダーシステムの状態確認フック
 */
export function useProviderSystemStatus() {
  const { isInitialized, authReady, mediaClientReady, subscriptionReady, notificationReady } =
    useUnifiedProvider();

  return {
    isReady: isInitialized,
    systems: {
      auth: authReady,
      mediaClient: mediaClientReady,
      subscription: subscriptionReady,
      notification: notificationReady,
    },
  };
}
