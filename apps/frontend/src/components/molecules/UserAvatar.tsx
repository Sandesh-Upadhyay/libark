'use client';

/**
 * UserAvatar - シンプルなユーザーアバターコンポーネント (Molecule)
 *
 * 責任:
 * - ユーザー固有の画像処理
 * - フォールバック文字の自動生成
 * - ユーザー情報からの画像URL解決
 *
 * 特徴:
 * - BaseAvatarコンポーネントをベースに構築
 * - ユーザー情報から自動的にフォールバック生成
 * - シンプルな画像処理
 * - 過度な最適化なし
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms';
import { generateFallbackText, generateAltText } from '@/lib/utils/imageUtils';
import { cn } from '@/lib/utils';
import type { AvatarProps as BaseAvatarProps } from '@/types';

// シンプルなアバターサイズバリアント
const userAvatarVariants = cva('', {
  variants: {
    size: {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
      '2xl': 'h-20 w-20',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// フォールバック文字のサイズ
const fallbackTextVariants = cva('flex h-full w-full items-center justify-center font-medium', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/**
 * UserAvatar Props（統一版）
 */
export interface UserAvatarProps extends Omit<BaseAvatarProps, 'size' | 'onClick'> {
  /** アバターサイズ（CVA対応） */
  size?: VariantProps<typeof userAvatarVariants>['size'];
  /** 画像の優先読み込み（デフォルト: false） */
  priority?: boolean;
  /** 遅延読み込みを有効にするかどうか（デフォルト: false） */
  lazy?: boolean;
  /** インタラクティブかどうか */
  interactive?: boolean;
  /** クリックハンドラー */
  onClick?: () => void;
  /** CSSクラス */
  className?: string;

  // 非DOM props（DOM要素に渡されない）
  /** 作成日時 */
  createdAt?: string | Date;
  /** カバー画像ID */
  coverImageId?: string | null;
  /** フォロワー数 */
  followersCount?: number;
  /** フォロー数 */
  followingCount?: number;
  /** アクティブ状態 */
  isActive?: boolean;
  /** 認証済み状態 */
  isVerified?: boolean;
  /** 最終ログイン日時 */
  lastLoginAt?: string | Date;
  /** 投稿数 */
  postsCount?: number;
  /** 更新日時 */
  updatedAt?: string | Date;
}

/**
 * 🎯 UserAvatar コンポーネント (Molecule)
 *
 * 責任:
 * - ユーザー固有の画像処理
 * - フォールバック文字の自動生成
 *
 * 特徴:
 * - BaseAvatarをベースに構築
 * - 自動フォールバック生成
 * - 型安全な実装
 * - シンプルな実装
 * - React.memo()によるパフォーマンス最適化
 */
const UserAvatarComponent = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    {
      username,
      displayName,
      profileImageId,
      size = 'md',
      priority = false,
      interactive = false,
      lazy = false,
      className,
      onClick,
      // 非DOM propsを明示的に分離
      createdAt: _createdAt,
      coverImageId: _coverImageId,
      followersCount: _followersCount,
      followingCount: _followingCount,
      isActive: _isActive,
      isVerified: _isVerified,
      lastLoginAt: _lastLoginAt,
      postsCount: _postsCount,
      updatedAt: _updatedAt,
      ...domProps
    },
    ref
  ) => {
    // シンプルな値生成（useMemoは過度な最適化を避ける）
    const altText = generateAltText(displayName, username);
    const fallbackText = generateFallbackText(displayName, username);

    // 統一メディアURL生成システムを使用（環境変数対応）
    const imageUrl = profileImageId
      ? (() => {
          const isProduction =
            typeof window !== 'undefined' && window.location.hostname !== 'localhost';
          const baseUrl = isProduction
            ? 'https://libark.io'
            : typeof window !== 'undefined'
              ? window.location.origin
              : 'http://localhost';
          return `${baseUrl}/api/media/${profileImageId}`;
        })()
      : null;

    return (
      <Avatar
        ref={ref}
        className={cn(
          userAvatarVariants({ size }),
          interactive &&
            'cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 hover:opacity-80',
          className
        )}
        onClick={onClick}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        onKeyDown={
          interactive
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        aria-label={interactive ? altText : undefined}
        {...domProps}
      >
        {/* プロフィール画像（常に含める - 失敗時は自動的にフォールバックが表示される） */}
        <AvatarImage
          src={imageUrl || undefined}
          alt={altText}
          className='object-cover'
          loading={priority ? 'eager' : lazy ? 'lazy' : 'eager'}
          draggable={false}
        />

        {/* フォールバック文字（画像読み込み失敗時に自動表示） */}
        <AvatarFallback className={fallbackTextVariants({ size })}>
          {fallbackText.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }
);

UserAvatarComponent.displayName = 'UserAvatar';

// React.memo()でメモ化してパフォーマンスを最適化
export const UserAvatar = React.memo(UserAvatarComponent);
