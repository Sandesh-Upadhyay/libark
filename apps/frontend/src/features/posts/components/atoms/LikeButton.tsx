/**
 * 🎯 LikeButton - いいねボタンコンポーネント (Atom)
 *
 * 責任:
 * - いいね機能の完全な管理
 * - 機能フラグによる表示制御
 * - 統一されたいいねロジック
 * - アクセシビリティ対応
 *
 * 特徴:
 * - 単一責任原則に基づく設計
 * - 機能フラグで完全に制御
 * - 再利用可能な設計
 * - 統一されたスタイリング
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';

import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { useFeatures } from '@/hooks';

import { useLikeButton } from '../../hooks/useLikeButton';

export interface LikeButtonProps {
  /** 投稿ID */
  postId: string;
  /** いいね数 */
  likesCount: number;
  /** 現在のユーザーがいいねしているか */
  isLiked: boolean;
  /** いいねトグルハンドラー */
  onToggleLike?: (postId: string) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** サイズ */
  size?: 'sm' | 'md';
  /** 追加のCSSクラス */
  className?: string;
  /** クリック時のイベント伝播制御 */
  onInteractiveClick?: (e: React.MouseEvent) => void;
}

/**
 * 🎯 LikeButton - いいねボタンコンポーネント
 *
 * 機能フラグで完全に制御され、無効時は非表示になります
 */
export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  likesCount,
  isLiked,
  onToggleLike,
  disabled = false,
  size = 'sm',
  className,
  onInteractiveClick,
}) => {
  // 🎯 フックは常に同じ順序で呼び出す必要がある
  const { features, loading: featureLoading } = useFeatures();
  const canLikePost = features.POST_LIKE;
  const { handleLikeClick: handleLikeClickCommon } = useLikeButton();

  // 🔍 デバッグログ
  console.log('🔍 [LikeButton] 機能フラグ状態:', {
    postId,
    canLikePost,
    featureLoading,
    isLiked,
    likesCount,
    features,
  });

  // いいね数の表示
  const likeCount = useMemo(() => {
    return likesCount || 0;
  }, [likesCount]);

  // いいねクリックハンドラー
  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      // インタラクティブクリック処理
      if (onInteractiveClick) {
        onInteractiveClick(e);
      }

      // 統一ロジックでいいね処理
      await handleLikeClickCommon(postId, onToggleLike, 'LikeButton');
    },
    [handleLikeClickCommon, postId, onToggleLike, onInteractiveClick]
  );

  // 機能が無効な場合は非表示（フック呼び出し後に判定）
  // ローディング中は表示を維持（ちらつき防止）
  if (!featureLoading && !canLikePost) {
    return null;
  }

  // サイズに応じたスタイル
  const sizeClasses = {
    sm: 'h-8 px-2 gap-1',
    md: 'h-10 px-3 gap-2',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
  };

  return (
    <Button
      variant='ghost'
      size={size}
      onClick={handleLikeClick}
      disabled={disabled || featureLoading || !canLikePost}
      className={cn(
        sizeClasses[size],
        isLiked
          ? 'text-destructive hover:text-destructive/80'
          : 'text-muted-foreground hover:text-foreground',
        (!canLikePost || featureLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={`いいね ${likeCount}件`}
      aria-pressed={isLiked}
      title={!canLikePost ? 'いいね機能は現在無効です' : undefined}
    >
      <Heart className={cn(iconSizeClasses[size], isLiked ? 'fill-current' : '')} />
      {likeCount > 0 && (
        <span className={cn(textSizeClasses[size], 'font-medium tabular-nums')}>{likeCount}</span>
      )}
    </Button>
  );
};

// export type { LikeButtonProps }; // 重複エクスポートのためコメントアウト
