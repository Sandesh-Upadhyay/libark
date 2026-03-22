/**
 * 🎯 投稿公開範囲選択ドロップダウン (Molecule)
 *
 * 機能:
 * - PostVisibilitySelectorとDropdownMenuの組み合わせ
 * - 公開範囲選択のインタラクション
 * - 有料投稿の価格設定連携
 * - アクセシビリティ対応
 */

'use client';

import React, { useCallback } from 'react';
import { Check } from 'lucide-react';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/atoms';
import { cn } from '@/lib/utils';
import {
  VISIBILITY_OPTIONS,
  type PostVisibility,
  type VisibilityOption,
} from '@/lib/constants/visibility';

import { PostVisibilitySelector } from '../atoms/PostVisibilitySelector';

export interface PostVisibilityDropdownProps {
  /** 現在の公開範囲 */
  visibility: PostVisibility;
  /** 公開範囲変更時のコールバック */
  onVisibilityChange: (visibility: PostVisibility) => void;
  /** 無効化状態 */
  disabled?: boolean;
  /** 追加のCSSクラス */
  className?: string;
  /** ドロップダウンメニューの位置 */
  align?: 'start' | 'center' | 'end';
  /** ドロップダウンメニューのサイド */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * 投稿公開範囲選択ドロップダウン (Molecule)
 *
 * 特徴:
 * - 直感的なドロップダウンUI
 * - 各項目のアイコン + 説明表示
 * - 現在選択中の項目のハイライト
 * - キーボードナビゲーション対応
 * - 有料投稿の特別表示
 */
export const PostVisibilityDropdown: React.FC<PostVisibilityDropdownProps> = ({
  visibility,
  onVisibilityChange,
  disabled = false,
  className,
  align = 'start',
  side = 'bottom',
}) => {
  // 公開範囲選択ハンドラー
  const handleVisibilitySelect = useCallback(
    (selectedVisibility: PostVisibility) => {
      if (selectedVisibility !== visibility) {
        onVisibilityChange(selectedVisibility);
      }
    },
    [visibility, onVisibilityChange]
  );

  // ドロップダウンアイテムのレンダリング
  const renderDropdownItem = useCallback(
    (option: VisibilityOption) => {
      const IconComponent = option.icon;
      const isSelected = visibility === option.value;
      const isPaid = option.value === 'PAID';

      return (
        <DropdownMenuItem
          key={option.value}
          className={cn(
            'flex items-center gap-3 p-3 cursor-pointer',
            isSelected && 'bg-accent/50',
            isPaid && 'border-l-2 border-l-warning'
          )}
          onClick={() => handleVisibilitySelect(option.value)}
        >
          <div className='flex items-center gap-2 flex-1'>
            <IconComponent size={16} className={cn('flex-shrink-0', option.iconColor)} />
            <div className='flex-1 min-w-0'>
              <div className='font-medium text-sm'>{option.label}</div>
              <div className='text-xs text-muted-foreground truncate'>{option.description}</div>
              {isPaid && (
                <div className='text-xs text-warning-foreground mt-1'>
                  💰 購入者のみが画像を閲覧可能
                </div>
              )}
            </div>
          </div>
          {isSelected && <Check size={16} className='text-primary flex-shrink-0' />}
        </DropdownMenuItem>
      );
    },
    [visibility, handleVisibilitySelect]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={className}>
          <PostVisibilitySelector
            visibility={visibility}
            disabled={disabled}
            aria-label='公開範囲を選択'
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className='w-64 p-1' sideOffset={8}>
        {VISIBILITY_OPTIONS.map((option, index) => (
          <React.Fragment key={`visibility-${option.value}-${index}`}>
            {renderDropdownItem(option)}
            {/* 有料投稿の前に区切り線を追加 */}
            {index === VISIBILITY_OPTIONS.length - 2 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * メモ化されたPostVisibilityDropdown
 */
export const MemoizedPostVisibilityDropdown = React.memo(PostVisibilityDropdown);

// デフォルトエクスポート
export default MemoizedPostVisibilityDropdown;
