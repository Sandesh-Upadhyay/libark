'use client';

import { useState, useCallback, useMemo } from 'react';

import type { UseTabsOptions, UseTabsReturn } from '@/types';

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * タブ状態管理フック
 *
 * 責任:
 * - タブの状態管理
 * - 型安全なタブ変更
 * - コールバック処理
 *
 * 特徴:
 * - 型安全性を重視
 * - メモ化による最適化
 * - 再利用可能な設計
 *
 * @example
 * ```tsx
 * const { activeTab, handleTabChange } = useTabs({
 *   defaultTab: 'posts' as const,
 *   onTabChange: (tab) => console.log(tab)
 * });
 *
 * <TabNavigation
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={handleTabChange}
 * />
 * ```
 */
export function useTabs<T extends string = string>({
  defaultTab,
  onTabChange,
}: UseTabsOptions<T>): UseTabsReturn<T> {
  const [activeTab, setActiveTab] = useState<T>(defaultTab);

  // タブ変更処理（型安全）
  const handleSetActiveTab = useCallback(
    (tab: T) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  // TabNavigationコンポーネント用のハンドラー
  const handleTabChange = useCallback(
    (value: string) => {
      handleSetActiveTab(value as T);
    },
    [handleSetActiveTab]
  );

  return useMemo(
    () => ({
      activeTab,
      setActiveTab: handleSetActiveTab,
      handleTabChange,
    }),
    [activeTab, handleSetActiveTab, handleTabChange]
  );
}

export default useTabs;
