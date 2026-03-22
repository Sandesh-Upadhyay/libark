/**
 * 🎯 プロフィールヘッダーコンポーネント (Organism)
 *
 * 責任:
 * - カバー画像、アバター、基本情報の表示
 * - Xライクなプロフィールレイアウト
 * - レスポンシブデザイン対応
 * - アクセシビリティ対応
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';


import { UserAvatar } from '@/components/molecules/UserAvatar';
import { ImageDisplay } from '@/components/atoms';
import { Button } from '@/components/atoms';
// スタイルは直接Tailwindクラスを使用
import { cn } from '@/lib/utils';

import { ProfileStats } from '../molecules/ProfileStats';

interface ProfileHeaderProps {
  /** プロフィール情報 */
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    profileImageId: string | null;
    coverImageId: string | null;
    postsCount?: number;
    followersCount?: number;
    followingCount?: number;
    isVerified?: boolean;
  };
  /** フォロー状態 */
  isFollowing?: boolean;
  /** 自分のプロフィールかどうか */
  isOwnProfile?: boolean;
  /** フォローボタンクリック時のハンドラー */
  onFollowToggle?: () => void;
  /** プロフィール編集ボタンクリック時のハンドラー */
  onEditProfile?: () => void;
  /** 統計項目クリック時のハンドラー */
  onStatsClick?: (type: 'followers' | 'following') => void;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * プロフィールヘッダーコンポーネント
 *
 * 現代的なプロフィールページのヘッダー部分を表示
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isFollowing = false,
  isOwnProfile = false,
  onFollowToggle,
  onEditProfile,
  onStatsClick,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn(className)}>
      {/* X風統合ヘッダー */}
      <div className='relative'>
        {/* カバー画像（Xと同じアスペクト比3:1） */}
        <div className='relative w-full bg-gradient-to-r from-slate-600 to-slate-700'>
          <div className='w-full' style={{ paddingBottom: '33.3333%' }}>
            <div className='absolute inset-0'>
              <ImageDisplay
                src={profile.coverImageId}
                alt={`${profile.displayName || profile.username}のカバー画像`}
                className='w-full h-full object-cover'
                priority={true}
                fallbackConfig={{
                  type: 'cover',
                  displayName: profile.displayName,
                  username: profile.username,
                }}
                showLoading={false}
                noWrapper={true}
              />
            </div>
          </div>
        </div>

        {/* プロフィール画像（Xスタイル：カバー画像に重なる） */}
        <div className='absolute -bottom-16 left-4'>
          <div className='w-32 h-32 border-4 border-background rounded-full overflow-hidden bg-background'>
            <UserAvatar
              username={profile.username}
              displayName={profile.displayName || undefined}
              profileImageId={profile.profileImageId || undefined}
              size='2xl'
              className='w-full h-full'
            />
          </div>
        </div>

        {/* アクションボタン（Xスタイル：右側に配置） */}
        <div className='absolute -bottom-12 right-4 flex items-center gap-2'>
          {isOwnProfile ? (
            <Button onClick={onEditProfile} variant='outline' size='sm' className='rounded-full'>
              {t('profile.editProfile', { default: 'プロフィールを編集' })}
            </Button>
          ) : (
            <Button
              onClick={onFollowToggle}
              variant={isFollowing ? 'outline' : 'default'}
              size='sm'
              className='rounded-full'
            >
              {isFollowing
                ? t('profile.unfollow', { default: 'フォロー解除' })
                : t('profile.follow', { default: 'フォロー' })}
            </Button>
          )}
        </div>
      </div>

      {/* プロフィール情報（アバターの下に配置） */}
      <div className='pt-20 px-4'>
        {/* 表示名とユーザー名 */}
        <div className='mb-3'>
          <h1 className='text-xl font-bold text-foreground mb-1'>
            {profile.displayName || profile.username}
          </h1>
          <p className='text-muted-foreground'>@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className='mb-4'>
            <p className='text-foreground whitespace-pre-wrap break-words leading-relaxed'>
              {profile.bio}
            </p>
          </div>
        )}

        {/* 統計情報（投稿数を除外） */}
        <ProfileStats
          followersCount={profile.followersCount}
          followingCount={profile.followingCount}
          onStatsClick={onStatsClick}
          size='md'
          className='mt-4'
        />
      </div>
    </div>
  );
};

/**
 * メモ化されたプロフィールヘッダー
 */
export const MemoizedProfileHeader = React.memo(ProfileHeader);

export default ProfileHeader;
