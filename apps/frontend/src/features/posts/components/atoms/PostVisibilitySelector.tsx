/**
 * 🎯 投稿公開範囲選択ボタン (Atom)
 *
 * 機能:
 * - 現在の公開範囲に応じたアイコンを表示
 * - アクセシビリティ対応
 * - 統一されたスタイル
 * - ホバー・フォーカス状態の管理
 */

'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { getVisibilityOption, type PostVisibility } from '@/lib/constants/visibility';

export interface PostVisibilitySelectorProps {
  /** 現在の公開範囲 */
  visibility: PostVisibility;
  /** 無効化状態 */
  disabled?: boolean;
  /** 追加のCSSクラス */
  className?: string;
  /** アクセシビリティ用のラベル */
  'aria-label'?: string;
  /** クリック時のイベントハンドラー */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * 投稿公開範囲選択ボタン (Atom)
 *
 * 特徴:
 * - 現在の公開範囲に応じたアイコン表示
 * - シンプルなアイコンボタン（境界線なし）
 * - アクセシビリティ対応
 * - 統一されたスタイル
 * - レスポンシブデザイン
 */
export const PostVisibilitySelector: React.FC<PostVisibilitySelectorProps> = ({
  visibility,
  disabled = false,
  className,
  'aria-label': ariaLabel,
  onClick,
}) => {
  const visibilityOption = getVisibilityOption(visibility);
  const IconComponent = visibilityOption.icon;

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      disabled={disabled}
      className={cn('h-9 w-9', className)}
      onClick={onClick}
      aria-label={ariaLabel || `公開範囲: ${visibilityOption.label}`}
      title={`公開範囲: ${visibilityOption.label}`}
    >
      <div className='flex items-center gap-1'>
        <IconComponent className={cn('w-4 h-4 sm:w-5 sm:h-5', visibilityOption.iconColor)} />
        <ChevronDown className='w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground' />
      </div>
    </Button>
  );
};

/**
 * メモ化されたPostVisibilitySelector
 */
export const MemoizedPostVisibilitySelector = React.memo(PostVisibilitySelector);

// デフォルトエクスポート
export default MemoizedPostVisibilitySelector;
