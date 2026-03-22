'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import type { TabContentProps } from '@/types';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * 基本タブコンテンツコンポーネント
 *
 * 責任:
 * - アクティブタブに応じたコンテンツの表示/非表示
 * - アクセシビリティ対応
 *
 * 特徴:
 * - 単一責任の原則に従った設計
 * - 外部依存なし
 * - 最大限の再利用性
 *
 * @example
 * ```tsx
 * <TabContent value='tab1' activeTab={activeTab}>
 *   <div>タブ1のコンテンツ</div>
 * </TabContent>
 * ```
 */
export const TabContent: React.FC<TabContentProps> = ({
  value,
  activeTab,
  className,
  children,
}) => {
  const isActive = activeTab === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      className={cn('w-full', className)}
      role='tabpanel'
      aria-labelledby={`tab-${value}`}
      id={`tabpanel-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

export default TabContent;
