'use client';

import { useState, useCallback, useMemo } from 'react';

import type { TabItem } from '@/components/atoms';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTabsOptions<T extends string = string> {
  /** デフォルトのアクティブタブ */
  defaultTab: T;
  /** タブ変更時のコールバック */
  onTabChange?: (tab: T) => void;
}

export interface UseTabsReturn<T extends string = string> {
  /** 現在のアクティブタブ */
  activeTab: T;
  /** タブを変更する関数 */
  setActiveTab: (tab: T) => void;
  /** タブ変更ハンドラー（TabNavigationに渡す用） */
  handleTabChange: (value: string) => void;
}

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
 * @example
 * ```tsx
 * const { activeTab, handleTabChange } = useTabs({
 *   defaultTab: 'posts' as const,
 *   onTabChange: (tab) => console.log(tab)
 * });
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

// ============================================================================
// TAB FILTERING UTILITIES
// ============================================================================

export interface TabFilterOptions {
  /** 認証状態 */
  isAuthenticated?: boolean;
  /** 初期化中かどうか */
  isInitializing?: boolean;
  /** カスタムフィルター関数 */
  customFilter?: (tab: TabItem) => boolean;
}

/**
 * タブフィルタリングフック
 *
 * 責任:
 * - 認証状態に基づくタブフィルタリング
 * - カスタムフィルターの適用
 * - 表示可能なタブの決定
 */
export function useFilteredTabs(tabs: TabItem[], options: TabFilterOptions = {}): TabItem[] {
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

      // デフォルトフィルタリング
      return !tab.disabled;
    });
  }, [tabs, isAuthenticated, isInitializing, customFilter]);
}

// ============================================================================
// TYPED TAB CREATORS
// ============================================================================

/**
 * 型安全なタブ作成ヘルパー
 */
export function createTypedTabs<T extends string>(
  tabs: Record<T, Omit<TabItem, 'value'>>
): Array<TabItem & { value: T }> {
  return Object.entries(tabs).map(([value, tab]) => ({
    ...(tab as any),
    value: value as T,
  })) as Array<TabItem & { value: T }>;
}
