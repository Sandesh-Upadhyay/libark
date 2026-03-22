'use client';

/**
 * UserDisplay - ユーザー情報表示コンポーネント (Molecule)
 *
 * 責任:
 * - Avatar + User の組み合わせ
 * - ユーザー固有の画像処理
 * - レイアウト管理
 *
 * 特徴:
 * - アトミックデザインを遵守
 * - 単一責任の原則
 * - 柔軟な表示オプション
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { UserText } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { UserAvatar } from '@/components/molecules/UserAvatar';
import type { UserInfoProps as BaseUserInfoProps } from '@/types';

/**
 * UserDisplay バリアント定義（ESLintルール準拠）
 */
const userDisplayVariants = cva('flex items-center transition-all duration-200', {
  variants: {
    layout: {
      horizontal: 'flex-row',
      vertical: 'flex-col text-center',
    },
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
    },
    interactive: {
      true: 'cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    layout: 'horizontal',
    size: 'sm',
    interactive: false,
  },
});

export interface UserDisplayProps
  extends Omit<BaseUserInfoProps, 'layout' | 'onClick'>, VariantProps<typeof userDisplayVariants> {
  /** アバター設定 */
  avatarVariant?: 'default' | 'primary' | 'secondary' | 'outline';
  /** テキスト設定 */
  textSize?: 'xs' | 'sm' | 'md' | 'lg';
  /** 切り詰め */
  truncate?: boolean;
  /** カスタムalt属性 */
  alt?: string;
  /** 内部使用alt属性 */
  _alt?: string;
  /** クリックハンドラー */
  onClick?: () => void;
  /** CSSクラス */
  className?: string;
}

/**
 * 🎯 UserDisplay コンポーネント (Molecule)
 *
 * 責任:
 * - Avatar と User の組み合わせ
 * - ユーザー固有の画像処理
 * - レイアウト管理
 *
 * 特徴:
 * - アトミックデザインを遵守
 * - 柔軟な表示オプション
 * - 最適化された画像処理
 * - React.memo()によるパフォーマンス最適化
 */
const UserDisplayComponent = React.forwardRef<HTMLDivElement, UserDisplayProps>(
  (
    {
      username,
      displayName,
      profileImageId,
      showAvatar = true,
      showDisplayName = true,
      showUsername = false,
      avatarSize = 'sm',
      avatarVariant: _avatarVariant = 'default',
      textSize = 'sm',
      truncate = true,
      layout,
      size,
      interactive,
      className,
      _alt,
      onClick,
      ...props
    },
    ref
  ) => {
    // UserAvatarコンポーネントで画像処理は統一されているため、ここでは不要

    // 何も表示するものがない場合
    if (!showAvatar && !showDisplayName && !showUsername) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(userDisplayVariants({ layout, size, interactive }), className)}
        onClick={onClick}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
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
        aria-label={interactive ? `${displayName || username}のプロフィールを表示` : undefined}
        {...props}
      >
        {/* アバター */}
        {showAvatar && (
          <UserAvatar
            username={username}
            displayName={displayName}
            profileImageId={profileImageId}
            size={avatarSize}
            interactive={false}
          />
        )}

        {/* テキスト情報 */}
        {(showDisplayName || showUsername) && (
          <div
            className={cn(
              'flex flex-col min-w-0',
              layout === 'vertical' ? 'items-center mt-1' : 'items-start',
              showAvatar && layout === 'horizontal' && 'ml-3'
            )}
          >
            {showDisplayName && (
              <UserText
                text={displayName || username}
                size={textSize}
                truncate={truncate ? 'line' : 'none'}
              />
            )}
            {showUsername && (
              <UserText
                text={username}
                prefix='@'
                size={textSize === 'lg' ? 'md' : textSize === 'md' ? 'sm' : 'xs'}
                truncate={truncate ? 'line' : 'none'}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

UserDisplayComponent.displayName = 'UserDisplay';

// React.memo()でメモ化してパフォーマンスを最適化
export const UserDisplay = React.memo(UserDisplayComponent);

export { userDisplayVariants };
