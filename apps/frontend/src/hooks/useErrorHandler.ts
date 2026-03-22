/**
 * 🎯 統一エラーハンドリングフック
 *
 * 責任:
 * - 統一エラーハンドリング
 * - ユーザーフレンドリーなエラーメッセージ
 * - リトライ機能
 * - エラーログ記録
 */

import { useState, useCallback } from 'react';

import { ERROR_MESSAGES, PERFORMANCE_CONFIG, getEnvironmentConfig } from '@/config/media-config';

// ================================
// 型定義
// ================================

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;
}

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface UseErrorHandlerReturn {
  error: ErrorInfo | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  canRetry: boolean;
}

// ================================
// エラー分類
// ================================

/**
 * エラーの種類を判定
 */
function categorizeError(error: unknown): {
  category: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  retryable: boolean;
  userMessage: string;
} {
  const errorObj = error as {
    message?: string;
    code?: string | number;
    status?: string | number;
    toString?: () => string;
  };
  const errorMessage = errorObj?.message || errorObj?.toString?.() || '';
  const errorCode = errorObj?.code || errorObj?.status;

  // ネットワークエラー
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorCode === 'NETWORK_ERROR'
  ) {
    return {
      category: 'network',
      retryable: true,
      userMessage: ERROR_MESSAGES.NETWORK_ERROR,
    };
  }

  // 認証エラー
  if (
    errorCode === 401 ||
    errorCode === 403 ||
    errorMessage.includes('認証') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized')
  ) {
    return {
      category: 'auth',
      retryable: false,
      userMessage:
        errorCode === 401 ? ERROR_MESSAGES.AUTH_EXPIRED : ERROR_MESSAGES.PERMISSION_DENIED,
    };
  }

  // バリデーションエラー
  if (
    errorCode === 400 ||
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('サイズ') ||
    errorMessage.includes('形式')
  ) {
    return {
      category: 'validation',
      retryable: false,
      userMessage: errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
    };
  }

  // サーバーエラー
  if (
    (typeof errorCode === 'number' && errorCode >= 500) ||
    errorMessage.includes('server') ||
    errorMessage.includes('internal')
  ) {
    return {
      category: 'server',
      retryable: true,
      userMessage: ERROR_MESSAGES.SERVER_ERROR,
    };
  }

  // 不明なエラー
  return {
    category: 'unknown',
    retryable: false,
    userMessage: errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
  };
}

/**
 * 指数バックオフでの遅延計算
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const baseDelay = config.baseDelay || PERFORMANCE_CONFIG.retry.baseDelay;
  const maxDelay = config.maxDelay || PERFORMANCE_CONFIG.retry.maxDelay;
  const backoffMultiplier = config.backoffMultiplier || 2;

  const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * 遅延実行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================
// メインフック
// ================================

/**
 * 🎯 エラーハンドリングフック
 */
export function useErrorHandler(
  retryFunction?: () => Promise<void>,
  retryConfig: RetryConfig = {}
): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const envConfig = getEnvironmentConfig();
  const maxAttempts = retryConfig.maxAttempts || PERFORMANCE_CONFIG.retry.maxAttempts;

  /**
   * エラーハンドリング
   */
  const handleError = useCallback(
    (error: unknown, context?: string) => {
      const { category, retryable, userMessage } = categorizeError(error);

      const errorObj2 = error as {
        code?: string | number;
        status?: string | number;
        stack?: string;
      };
      const errorInfo: ErrorInfo = {
        message: userMessage,
        code: String(errorObj2?.code || errorObj2?.status || ''),
        details: envConfig.showDetailedErrors
          ? {
              originalError: error,
              context,
              stack: errorObj2?.stack,
            }
          : undefined,
        timestamp: new Date(),
        retryable,
        retryCount,
      };

      setError(errorInfo);

      // 開発環境でのログ出力
      if (envConfig.enableDebugLogs) {
        console.error('🚨 [UnifiedErrorHandler] エラー発生:', {
          category,
          retryable,
          userMessage,
          originalError: error,
          context,
          retryCount,
        });
      }

      // エラーログの記録（本番環境では外部サービスに送信）
      if (!envConfig.enableDebugLogs) {
        // TODO: 外部エラー監視サービス（Sentry等）への送信
        console.error('Error logged:', {
          message: userMessage,
          category,
          timestamp: errorInfo.timestamp,
          context,
        });
      }
    },
    [retryCount, envConfig]
  );

  /**
   * エラークリア
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * リトライ実行
   */
  const retry = useCallback(async () => {
    if (!retryFunction || !error?.retryable || retryCount >= maxAttempts) {
      return;
    }

    setIsRetrying(true);

    try {
      // 指数バックオフでの遅延
      const delayMs = calculateDelay(retryCount + 1, retryConfig);
      await delay(delayMs);

      // リトライ実行
      await retryFunction();

      // 成功時はエラーをクリア
      clearError();

      if (envConfig.enableDebugLogs) {
        console.log('✅ [UnifiedErrorHandler] リトライ成功:', {
          attempt: retryCount + 1,
          delay: delayMs,
        });
      }
    } catch (retryError) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (newRetryCount >= maxAttempts) {
        // 最大試行回数に達した場合
        handleError(retryError, 'リトライ最大回数到達');
      } else {
        // まだリトライ可能な場合
        handleError(retryError, `リトライ ${newRetryCount}/${maxAttempts}`);
      }

      if (envConfig.enableDebugLogs) {
        console.warn('⚠️ [UnifiedErrorHandler] リトライ失敗:', {
          attempt: newRetryCount,
          maxAttempts,
          error: retryError,
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }, [
    retryFunction,
    error,
    retryCount,
    maxAttempts,
    retryConfig,
    handleError,
    clearError,
    envConfig,
  ]);

  /**
   * リトライ可能かどうか
   */
  const canRetry = Boolean(
    retryFunction && error?.retryable && retryCount < maxAttempts && !isRetrying
  );

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry,
    canRetry,
  };
}

// ================================
// 特化型フック
// ================================

/**
 * 🎯 画像アップロード専用エラーハンドリングフック
 */
export function useImageUploadErrorHandler(
  uploadFunction?: () => Promise<void>
): UseErrorHandlerReturn {
  return useErrorHandler(uploadFunction, {
    maxAttempts: 3,
    baseDelay: 2000, // 2秒
    maxDelay: 10000, // 10秒
  });
}

/**
 * 🎯 ネットワーク専用エラーハンドリングフック
 */
export function useNetworkErrorHandler(
  networkFunction?: () => Promise<void>
): UseErrorHandlerReturn {
  return useErrorHandler(networkFunction, {
    maxAttempts: 5,
    baseDelay: 1000, // 1秒
    maxDelay: 8000, // 8秒
  });
}

/**
 * 🎯 GraphQL専用エラーハンドリングフック
 */
export function useGraphQLErrorHandler(
  graphqlFunction?: () => Promise<void>
): UseErrorHandlerReturn {
  return useErrorHandler(graphqlFunction, {
    maxAttempts: 3,
    baseDelay: 1500, // 1.5秒
    maxDelay: 6000, // 6秒
  });
}
