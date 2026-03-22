'use client';

import React from 'react';
import { useAuth } from '@libark/graphql-client';

import { TabNavigation } from '@/components/atoms/tabs/TabNavigation';
import type { AuthenticatedTabsProps, AuthenticatedTabItem } from '@/types';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * 認証対応タブナビゲーションコンポーネント
 *
 * 責任:
 * - 認証状態に基づくタブフィルタリング
 * - 初期化中の表示制御
 * - 基本的なTabNavigationのラッパー
 *
 * 特徴:
 * - 認証ロジックの分離
 * - 基本コンポーネントの再利用
 * - 宣言的なAPI
 *
 * @example
 * ```tsx
 * const tabs: AuthenticatedTabItem[] = [
 *   { value: 'all', label: '全て', icon: Globe },
 *   { value: 'following', label: 'フォロー中', icon: Users, requiresAuth: true },
 * ];
 *
 * <AuthenticatedTabs
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={handleTabChange}
 * />
 * ```
 */
export const AuthenticatedTabs: React.FC<AuthenticatedTabsProps> = ({
  tabs,
  isInitializing = false,
  ...props
}) => {
  const { isAuthenticated } = useAuth();

  // 初期化中は何も表示しない
  if (isInitializing) {
    return null;
  }

  // 認証状態に基づいてタブをフィルタリング
  const visibleTabs = React.useMemo(() => {
    return tabs.filter((tab: AuthenticatedTabItem) => {
      if (tab.requiresAuth && !isAuthenticated) {
        return false;
      }
      return true;
    });
  }, [tabs, isAuthenticated]);

  return <TabNavigation {...props} tabs={visibleTabs} />;
};

export default AuthenticatedTabs;
