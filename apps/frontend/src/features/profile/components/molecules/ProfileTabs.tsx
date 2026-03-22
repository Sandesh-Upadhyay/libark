'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Image, Heart } from 'lucide-react';


import { PostList } from '@/features/posts/components/PostList';
import { TabNavigation } from '@/components/atoms/tabs/TabNavigation';
import { TabContent } from '@/components/atoms/tabs/TabContent';
import { useTabs, createTypedTabs } from '@/hooks/tabs';
import { cn } from '@/lib/utils';
import type { ProfileTabType } from '@/types';

import { MediaGridContainer } from '../organisms/MediaGridContainer';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileTabsProps {
  /** プロフィール情報 */
  profile: {
    id: string;
    username: string;
  };
  /** デフォルトのアクティブタブ */
  defaultTab?: ProfileTabType;
  /** タブ変更時のハンドラー */
  onTabChange?: (tab: ProfileTabType) => void;
  /** 追加のCSSクラス */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * プロフィール用タブコンポーネント
 *
 * 責任:
 * - プロフィールタブの定義と管理
 * - 投稿、メディア、いいねコンテンツの表示
 * - タブ状態の管理
 *
 * 特徴:
 * - プロフィール機能に特化した設計
 * - 型安全なタブ管理
 * - 再利用可能なコンポーネント構成
 *
 * @example
 * ```tsx
 * <ProfileTabs
 *   profile={{ id: 'user123', username: 'john' }}
 *   defaultTab="posts"
 *   onTabChange={(tab) => console.log(tab)}
 * />
 * ```
 */
export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  profile,
  defaultTab = 'posts',
  onTabChange,
  className,
}) => {
  const { t } = useTranslation();

  // タブ状態管理
  const { activeTab, handleTabChange } = useTabs({
    defaultTab,
    onTabChange,
  });

  // 型安全なタブ定義
  const tabs = createTypedTabs({
    posts: {
      label: t('profile.posts', { default: '投稿' }),
      icon: MessageSquare,
    },
    media: {
      label: t('profile.media', { default: 'メディア' }),
      icon: Image,
    },
    likes: {
      label: t('profile.likes', { default: 'いいね' }),
      icon: Heart,
    },
  });

  return (
    <div className={cn('w-full', className)}>
      {/* タブナビゲーション */}
      <TabNavigation
        tabs={tabs as import('@/types').TabItem[]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sticky={true}
      />

      {/* タブコンテンツ */}
      <div className='w-full'>
        {/* 投稿タブ */}
        <TabContent value='posts' activeTab={activeTab}>
          <PostList userId={profile.id} postType='posts' />
        </TabContent>

        {/* メディアタブ */}
        <TabContent value='media' activeTab={activeTab}>
          <MediaGridContainer
            userId={profile.id}
            columns={{ sm: 2, md: 3, lg: 4, xl: 5 }}
            gap='md'
            thumbnailSize='lg'
            aspectRatio='square'
            enableInfiniteScroll={true}
            enableHover={true}
            rounded='md'
            emptyMessage={t('profile.noMedia', { default: 'まだメディアがありません' })}
          />
        </TabContent>

        {/* いいねタブ */}
        <TabContent value='likes' activeTab={activeTab}>
          <PostList userId={profile.id} postType='liked' />
        </TabContent>
      </div>
    </div>
  );
};

/**
 * メモ化されたプロフィールタブ
 */
export const MemoizedProfileTabs = React.memo(ProfileTabs);

export default ProfileTabs;
