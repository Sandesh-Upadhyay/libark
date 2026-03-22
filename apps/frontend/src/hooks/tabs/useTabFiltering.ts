'use client';

import { useMemo } from 'react';

import type { TabItem, TabFilterOptions } from '@/types';

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * タブフィルタリングフック
 *
 * 責任:
 * - 認証状態に基づくタブフィルタリング
 * - カスタムフィルターの適用
 * - 表示可能なタブの決定
 *
 * 特徴:
 * - 純粋関数的な設計
 * - メモ化による最適化
 * - 拡張可能なフィルター機能
 *
 * @example
 * ```tsx
 * const visibleTabs = useTabFiltering(tabs, {
 *   isAuthenticated,
 *   isInitializing,
 *   customFilter: (tab) => !tab.disabled
 * });
 * ```
 */
export function useTabFiltering(tabs: TabItem[], options: TabFilterOptions = {}): TabItem[] {
  const { isAuthenticated = true, isInitializing = false, customFilter } = options;

  return useMemo(() => {
    if (isInitializing) {
      return [];
    }

    return tabs.filter(tab => {
      // カスタムフィルターがある場合は優先
      if (customFilter) {
        return customFilter(tab);
      }

      // デフォルトフィルタリング（無効なタブを除外）
      return !tab.disabled;
    });
  }, [tabs, isAuthenticated, isInitializing, customFilter]);
}

export default useTabFiltering;
