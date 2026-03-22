'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Globe, Sparkles } from 'lucide-react';
import { useAppStore, useAuth } from '@libark/graphql-client';

import { AuthenticatedTabs } from '@/components/molecules/tabs/AuthenticatedTabs';
import { createTypedTabs } from '@/hooks/tabs';
import type { TimelineTabType } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface TimelineTabsProps {
  /** 追加のCSSクラス */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * タイムライン用タブコンポーネント
 *
 * 責任:
 * - タイムラインタブの定義と管理
 * - Zustand状態との連携
 * - 認証状態に応じた自動切り替え
 *
 * 特徴:
 * - 投稿機能に特化した設計
 * - 型安全なタブ管理
 * - 認証ロジックの分離
 *
 * @example
 * ```tsx
 * <TimelineTabs className="mb-4" />
 * ```
 */
export const TimelineTabs: React.FC<TimelineTabsProps> = ({ className }) => {
  const { t } = useTranslation();
  const { isAuthenticated, isInitializing } = useAuth();

  // Zustandストアからタブ状態を取得
  const activeTab = (useAppStore(state => state.ui.timelineTab) as TimelineTabType) || 'ALL';
  const setTimelineTab = useAppStore(state => state.setTimelineTab) as (
    tab: TimelineTabType
  ) => void;

  // 型安全なタブ定義
  const tabs = createTypedTabs({
    FOLLOWING: {
      label: t('timeline.following'),
      icon: Users,
      // requiresAuth: true, // プロパティが存在しないためコメントアウト
    },
    RECOMMENDED: {
      label: t('timeline.recommended'),
      icon: Sparkles,
    },
    ALL: {
      label: t('timeline.all'),
      icon: Globe,
    },
  });

  // 認証されていない場合は'ALL'タブに自動切り替え
  React.useEffect(() => {
    if (!isAuthenticated && activeTab === 'FOLLOWING') {
      setTimelineTab('ALL');
    }
  }, [isAuthenticated, activeTab, setTimelineTab]);

  // タブ変更処理
  const handleTabChange = React.useCallback(
    (value: string) => {
      setTimelineTab(value as TimelineTabType);
    },
    [setTimelineTab]
  );

  return (
    <AuthenticatedTabs
      tabs={tabs as import('@/types').AuthenticatedTabItem[]}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      className={className}
      sticky={true}
      isInitializing={isInitializing}
    />
  );
};

export default TimelineTabs;
