'use client';

import React, { useState, useCallback, useMemo } from 'react';

// スタイルは直接Tailwindクラスを使用
import { cn } from '@/lib/utils';
import { TextExpandButton } from '@/components/atoms';

interface PostContentProps {
  /** 投稿内容 */
  content?: string | null;
  /** 切り詰め文字数（デフォルト: 280） */
  truncateLength?: number;
  /** インタラクティブ要素のクリック防止ハンドラー */
  onInteractiveClick?: (e: React.MouseEvent) => void;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * PostContent - 投稿内容コンポーネント (Molecule)
 *
 * 責任:
 * - 投稿テキストの表示
 * - 長文の切り詰めと展開機能
 * - テキストの適切なフォーマット
 *
 * 特徴:
 * - 280文字で自動切り詰め
 * - 「もっと見る」「折りたたむ」機能
 * - 改行とスペースの保持
 * - レスポンシブデザイン
 */
export const PostContent: React.FC<PostContentProps> = ({
  content,
  truncateLength = 280,
  onInteractiveClick,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // インタラクティブクリック防止ハンドラー
  const handleInteractiveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onInteractiveClick) {
        onInteractiveClick(e);
      }
    },
    [onInteractiveClick]
  );

  // 投稿の展開/折りたたみ
  const toggleExpanded = useCallback(
    (e: React.MouseEvent) => {
      handleInteractiveClick(e);
      setIsExpanded(prev => !prev);
    },
    [handleInteractiveClick]
  );

  // 投稿内容の表示制御
  const shouldTruncate = content && content.length > truncateLength;
  const displayContent = useMemo(() => {
    if (!content) return '';
    if (!shouldTruncate || isExpanded) return content;
    return content.slice(0, truncateLength) + '...';
  }, [content, shouldTruncate, isExpanded, truncateLength]);

  // 内容がない場合は何も表示しない
  if (!content) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className='text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words word-break overflow-wrap-anywhere'>
        {displayContent}
      </p>
      {shouldTruncate && <TextExpandButton isExpanded={isExpanded} onClick={toggleExpanded} />}
    </div>
  );
};

export type { PostContentProps };
