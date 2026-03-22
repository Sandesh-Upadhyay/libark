/**
 * 📰 投稿リストフィルターコンポーネント
 *
 * 投稿リストのタブナビゲーション機能
 * 新しいTimelineTabsコンポーネントのラッパー
 */

import React from 'react';

import { TimelineTabs } from '../molecules/TimelineTabs';

// ============================================================================
// TYPES
// ============================================================================

interface PostListFiltersProps {
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * 投稿リストフィルターコンポーネント
 *
 * 責任:
 * - TimelineTabsコンポーネントのラッパー
 * - 後方互換性の提供
 *
 * 注意: このコンポーネントは後方互換性のために残されています。
 * 新しいコードでは直接TimelineTabsを使用してください。
 */
export const PostListFilters: React.FC<PostListFiltersProps> = ({ className }) => {
  return <TimelineTabs className={className} />;
};

export default PostListFilters;
