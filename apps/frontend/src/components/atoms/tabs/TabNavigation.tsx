'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import type { TabNavigationProps } from '@/types';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * 基本タブナビゲーションコンポーネント（X風デザイン）
 *
 * 責任:
 * - タブの表示
 * - クリックハンドリング
 * - アクセシビリティ対応
 *
 * 特徴:
 * - 単一責任の原則に従った設計
 * - 認証ロジックなどの外部依存なし
 * - 最大限の再利用性
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { value: 'tab1', label: 'タブ1', icon: SomeIcon },
 *   { value: 'tab2', label: 'タブ2', icon: AnotherIcon },
 * ];
 *
 * <TabNavigation
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={handleTabChange}
 *   sticky={true}
 * />
 * ```
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  sticky = false,
}) => {
  // タブ変更処理（無効なタブのクリックを防ぐ）
  const handleTabChange = React.useCallback(
    (value: string) => {
      const tab = tabs.find(t => t.value === value);
      if (!tab?.disabled) {
        onTabChange(value);
      }
    },
    [tabs, onTabChange]
  );

  return (
    <div
      className={cn(
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        sticky && 'sticky top-0 z-10',
        className
      )}
      role='tablist'
    >
      <div className='flex border-b border-border/30'>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              disabled={tab.disabled}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 px-4 h-12 text-sm font-medium transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-50',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              role='tab'
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.value}`}
              id={`tab-${tab.value}`}
              tabIndex={isActive ? 0 : -1}
            >
              {Icon && <Icon className='h-4 w-4' />}
              <span className='hidden sm:inline'>{tab.label}</span>
              {/* X風の下線インジケーター */}
              {isActive && (
                <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary rounded-full' />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
