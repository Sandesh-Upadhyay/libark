'use client';

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// スタイルは直接Tailwindクラスを使用
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { TimeDisplay } from '@/components/molecules/TimeDisplay';
import { getVisibilityOption, type PostVisibility } from '@/lib/constants/visibility';

interface PostHeaderProps {
  /** 投稿者情報 */
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    profileImageId?: string | null;
  };
  /** 投稿作成日時 */
  createdAt: string;
  /** 投稿の公開範囲 */
  visibility?: PostVisibility;
  /** ユーザープロフィールクリックハンドラー */
  onUserClick?: (e: React.MouseEvent) => void;
  /** インタラクティブ要素のクリック防止ハンドラー */
  onInteractiveClick?: (e: React.MouseEvent) => void;
  /** リアルタイム更新を有効にするかどうか デフォルト: true */
  enableRealTimeUpdate?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * PostHeader - 投稿ヘッダーコンポーネント (Molecule)
 *
 * 責任:
 * - ユーザー情報の表示
 * - 時間表示
 * - ユーザープロフィールへの遷移
 *
 * 特徴:
 * - シンプルなレイアウト
 * - アクセシビリティ対応
 * - レスポンシブデザイン
 */
export const PostHeader: React.FC<PostHeaderProps> = ({
  user,
  createdAt,
  visibility,
  onUserClick,
  onInteractiveClick,
  enableRealTimeUpdate = true,
  className,
}) => {
  const navigate = useNavigate();

  // デフォルトのユーザークリックハンドラー
  const handleUserClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onUserClick) {
        onUserClick(e);
      } else {
        navigate(`/profile/${user.username}`);
      }
    },
    [onUserClick, navigate, user.username]
  );

  // デフォルトのインタラクティブクリック防止ハンドラー
  const handleInteractiveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onInteractiveClick) {
        onInteractiveClick(e);
      }
    },
    [onInteractiveClick]
  );

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      {/* ユーザー情報エリア */}
      <div
        onClick={handleUserClick}
        className='flex-1 min-w-0 rounded-xl p-2 -m-2 transition-colors duration-200 cursor-pointer'
      >
        <div className='flex items-center'>
          {/* アバター */}
          <UserAvatar
            username={user.username}
            displayName={user.displayName ?? undefined}
            profileImageId={user.profileImageId || undefined}
            size='md'
            interactive={false}
            lazy={true} // リスト表示では遅延読み込み
          />

          {/* ユーザー情報テキスト */}
          <div className='flex-1 min-w-0 flex flex-col ml-3'>
            {/* 表示名 */}
            {user.displayName && (
              <span className='text-sm font-medium text-foreground leading-tight truncate'>
                {user.displayName}
              </span>
            )}

            {/* ユーザー名とVisibilityアイコン */}
            <div className='flex items-center gap-1'>
              <span className='text-xs text-muted-foreground leading-tight truncate'>
                @{user.username}
              </span>
              {visibility &&
                (() => {
                  const visibilityOption = getVisibilityOption(visibility);
                  const IconComponent = visibilityOption.icon;
                  return (
                    <IconComponent
                      className='flex-shrink-0 h-3 w-3'
                      title={visibilityOption.label}
                    />
                  );
                })()}
            </div>
          </div>
        </div>
      </div>

      {/* 右上時間表示エリア */}
      <div className='flex-shrink-0 ml-3'>
        <TimeDisplay
          date={createdAt}
          enableRealTimeUpdate={enableRealTimeUpdate}
          onInteractiveClick={() => handleInteractiveClick({} as React.MouseEvent)}
          size='sm'
          align='end'
          className='text-muted-foreground'
        />
      </div>
    </div>
  );
};

export type { PostHeaderProps };
