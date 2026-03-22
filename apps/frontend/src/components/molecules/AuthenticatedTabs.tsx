'use client';

import React from 'react';
import { useAuth } from '@libark/graphql-client';

import { TabNavigation, type TabItem, type TabNavigationProps } from '@/components/atoms';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticatedTabItem extends TabItem {
  /** 認証が必要かどうか */
  requiresAuth?: boolean;
}

export interface AuthenticatedTabsProps extends Omit<TabNavigationProps, 'tabs'> {
  /** 認証対応タブアイテムの配列 */
  tabs: AuthenticatedTabItem[];
  /** 初期化中かどうか */
  isInitializing?: boolean;
}

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
 * 使用例:
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
  const visibleTabs = tabs.filter(tab => {
    if (tab.requiresAuth && !isAuthenticated) {
      return false;
    }
    return true;
  });

  return <TabNavigation {...props} tabs={visibleTabs} />;
};

export default AuthenticatedTabs;
