'use client';

import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/atoms';

interface MenuButtonProps {
  /** 削除ハンドラー */
  onDelete?: () => void;
  /** インタラクティブ要素のクリック防止ハンドラー */
  onInteractiveClick?: (e: React.MouseEvent) => void;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * MenuButton - 統一ドロップダウンを使用したメニューボタンコンポーネント (Atom)
 *
 * 責任:
 * - メニューボタンの表示
 * - 統一ドロップダウンメニュー
 * - 削除機能の提供
 *
 * 特徴:
 * - 統一ドロップダウンコンポーネントを使用
 * - 他のドロップダウンと一貫したデザイン
 * - シンプルな実装
 */
export const MenuButton: React.FC<MenuButtonProps> = ({
  onDelete,
  onInteractiveClick,
  className,
}) => {
  // インタラクティブクリック防止ハンドラー
  const handleInteractiveClick = (_e: React.MouseEvent) => {
    _e.stopPropagation();
    if (onInteractiveClick) {
      onInteractiveClick(_e);
    }
  };

  // 削除ボタンのクリックハンドラー
  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div onClick={handleInteractiveClick} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='投稿メニュー'>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          {onDelete && (
            <DropdownMenuItem onClick={handleDeleteClick}>
              <Trash2 />
              <span>削除</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export type { MenuButtonProps };
