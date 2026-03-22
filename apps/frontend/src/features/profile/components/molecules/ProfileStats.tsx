/**
 * 🎯 プロフィール統計コンポーネント (Molecule)
 *
 * 責任:
 * - プロフィール統計情報の統一表示
 * - フォロワー数、フォロー中数の表示
 * - レスポンシブレイアウト対応
 * - アクセシビリティ対応
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface ProfileStatsProps {
  /** フォロワー数 */
  followersCount?: number;
  /** フォロー中数 */
  followingCount?: number;
  /** レイアウト方向 */
  layout?: 'horizontal' | 'vertical';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 中央揃えかどうか */
  centered?: boolean;
  /** 追加のCSSクラス */
  className?: string;
  /** 統計項目クリック時のハンドラー */
  onStatsClick?: (type: 'followers' | 'following') => void;
}

interface StatItemProps {
  label: string;
  count: number;
  type: 'followers' | 'following';
  size: 'sm' | 'md' | 'lg';
  onClick?: (type: 'followers' | 'following') => void;
}

/**
 * 統計項目コンポーネント
 */
const StatItem: React.FC<StatItemProps> = ({ label, count, type, size, onClick }) => {
  const sizeClasses = {
    sm: {
      container: 'text-center',
      count: 'text-sm font-bold',
      label: 'text-xs text-muted-foreground',
    },
    md: {
      container: 'text-center',
      count: 'text-base font-bold',
      label: 'text-sm text-muted-foreground',
    },
    lg: {
      container: 'text-center',
      count: 'text-lg font-bold',
      label: 'text-sm text-muted-foreground',
    },
  };

  const _classes = sizeClasses[size];
  const isClickable = onClick !== undefined;

  const content = (
    <div
      className={cn(
        'inline-flex items-baseline gap-1',
        isClickable && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
    >
      <span className='font-bold text-foreground tabular-nums'>{count.toLocaleString()}</span>
      <span className='text-muted-foreground text-sm'>{label}</span>
    </div>
  );

  if (isClickable) {
    return (
      <button
        type='button'
        onClick={() => onClick(type)}
        className='focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm'
        aria-label={`${label}: ${count.toLocaleString()}`}
      >
        {content}
      </button>
    );
  }

  return content;
};

/**
 * プロフィール統計コンポーネント
 *
 * フォロワー数、フォロー中数を統一されたスタイルで表示
 */
export const ProfileStats: React.FC<ProfileStatsProps> = ({
  followersCount = 0,
  followingCount = 0,
  layout = 'horizontal',
  size = 'md',
  centered = false,
  className,
  onStatsClick,
}) => {
  const { t } = useTranslation();

  const layoutClasses = {
    horizontal: 'flex gap-4 sm:gap-6',
    vertical: 'flex flex-col gap-2',
  };

  const containerClasses = cn(layoutClasses[layout], centered && 'justify-center', className);

  return (
    <div className={containerClasses} role='group' aria-label='プロフィール統計'>
      <StatItem
        label={t('profile.followers', { default: 'フォロワー' })}
        count={followersCount}
        type='followers'
        size={size}
        onClick={onStatsClick}
      />
      <StatItem
        label={t('profile.following', { default: 'フォロー中' })}
        count={followingCount}
        type='following'
        size={size}
        onClick={onStatsClick}
      />
    </div>
  );
};

/**
 * メモ化されたプロフィール統計コンポーネント
 */
export const MemoizedProfileStats = React.memo(ProfileStats);

export default ProfileStats;
