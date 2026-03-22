/**
 * 🎯 CommentButton - コメントボタンコンポーネント (Atom)
 *
 * 責任:
 * - コメント機能のボタン表示
 * - 統一されたスタイリング
 * - アクセシビリティ対応
 *
 * 特徴:
 * - 単一責任原則に基づく設計
 * - 再利用可能な設計
 * - LikeButtonと統一されたAPI
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';

export interface CommentButtonProps {
  /** 投稿ID */
  postId: string;
  /** コメント数 */
  commentsCount: number;
  /** コメントクリックハンドラー */
  onComment?: (postId: string) => void;
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
 * 🎯 CommentButton - コメントボタンコンポーネント
 */
export const CommentButton: React.FC<CommentButtonProps> = ({
  postId,
  commentsCount,
  onComment,
  disabled = false,
  size = 'sm',
  className,
  onInteractiveClick,
}) => {
  // コメントクリックハンドラー
  const handleCommentClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // インタラクティブクリック処理
      if (onInteractiveClick) {
        onInteractiveClick(e);
      }

      // コメント処理
      if (onComment) {
        onComment(postId);
      }
    },
    [onComment, postId, onInteractiveClick]
  );

  // コメント数の表示
  const commentCount = useMemo(() => {
    return commentsCount || 0;
  }, [commentsCount]);

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
      onClick={handleCommentClick}
      disabled={disabled}
      className={cn(sizeClasses[size], 'text-muted-foreground hover:text-foreground', className)}
      aria-label={`コメント ${commentCount}件`}
    >
      <MessageCircle className={iconSizeClasses[size]} />
      {commentCount > 0 && (
        <span className={cn(textSizeClasses[size], 'font-medium tabular-nums')}>
          {commentCount}
        </span>
      )}
    </Button>
  );
};

// export type { CommentButtonProps }; // 重複エクスポートのためコメントアウト
