/**
 * 🎯 グローバルローディング状態管理フック
 *
 * アプリケーション全体のローディング状態を統一管理
 * 複数のローディング状態を一元化し、UXを向上
 */

import { createContext, useContext } from 'react';

import { PERFORMANCE_CONSTANTS } from '../constants.js';

export interface LoadingContextType {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  loadingMessage?: string;
  setLoadingMessage: (message?: string) => void;
  loadingProgress?: number;
  setLoadingProgress: (progress?: number) => void;
}

// グローバルローディングコンテキスト
export const LoadingContext = createContext<LoadingContextType | null>(null);

/**
 * 🎯 グローバルローディングフック
 */
export function useGlobalLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }

  /**
   * 非同期処理をローディング状態で包む
   */
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    message?: string,
    showProgress = false
  ): Promise<T> => {
    context.setGlobalLoading(true);
    context.setLoadingMessage(message);

    if (showProgress) {
      context.setLoadingProgress(0);
    }

    try {
      const result = await asyncFn();

      if (showProgress) {
        context.setLoadingProgress(PERFORMANCE_CONSTANTS.LOADING_DISPLAY_DELAY);
        // 完了表示を少し見せる
        await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONSTANTS.LOADING_TIMEOUT));
      }

      return result;
    } finally {
      context.setGlobalLoading(false);
      context.setLoadingMessage(undefined);
      context.setLoadingProgress(undefined);
    }
  };

  /**
   * 複数の非同期処理を順次実行
   */
  const withSequentialLoading = async <T>(
    tasks: Array<{
      fn: () => Promise<T>;
      message?: string;
    }>
  ): Promise<T[]> => {
    const results: T[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const progress = ((i + 1) / tasks.length) * PERFORMANCE_CONSTANTS.LOADING_DISPLAY_DELAY;

      context.setGlobalLoading(true);
      context.setLoadingMessage(task.message || `処理中... (${i + 1}/${tasks.length})`);
      context.setLoadingProgress(progress);

      try {
        const result = await task.fn();
        results.push(result);
      } catch (error) {
        context.setGlobalLoading(false);
        context.setLoadingMessage(undefined);
        context.setLoadingProgress(undefined);
        throw error;
      }
    }

    context.setGlobalLoading(false);
    context.setLoadingMessage(undefined);
    context.setLoadingProgress(undefined);

    return results;
  };

  return {
    isLoading: context.isGlobalLoading,
    message: context.loadingMessage,
    progress: context.loadingProgress,
    setLoading: context.setGlobalLoading,
    setMessage: context.setLoadingMessage,
    setProgress: context.setLoadingProgress,
    withLoading,
    withSequentialLoading,
  };
}

/**
 * 🎯 ローディング状態の便利フック
 */
export function useLoadingState() {
  const { isLoading, message, progress } = useGlobalLoading();

  return {
    isLoading,
    message,
    progress,
    hasMessage: !!message,
    hasProgress: typeof progress === 'number',
  };
}
