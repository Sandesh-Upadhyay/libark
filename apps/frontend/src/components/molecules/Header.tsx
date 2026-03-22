/**
 * 🎯 統一ヘッダーコンポーネント (Molecule)
 *
 * 責任:
 * - メッセージページと設定ページで共通のヘッダーデザイン
 * - 戻るボタン、タイトル、アクションボタンの統一表示
 * - モバイル・デスクトップでの一貫したUX
 *
 * 特徴:
 * - 統一されたパディング（px-4 py-4）
 * - 統一されたボタンサイズ（h-8 w-8 p-0）
 * - レスポンシブ対応
 * - アクセシビリティ対応
 */

'use client';

import React, { type JSX } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import type { HeaderProps as BaseHeaderProps } from '@/types';

export interface HeaderProps extends BaseHeaderProps {
  /** 左側の追加コンテンツ（アバターなど） */
  leftContent?: React.ReactNode;
  /** モバイルでのみ戻るボタンを表示 */
  mobileBackOnly?: boolean;
}

/**
 * 🎯 ヘッダーコンポーネント
 *
 * メッセージページと設定ページで共通のヘッダーデザインを提供
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  backButtonLabel = '戻る',
  rightAction,
  leftContent,
  className,
  showBorder = false,
  mobileBackOnly = false,
  variant = 'default',
  headingLevel = 'h3',
}) => {
  // スタイルバリアントに基づくクラス設定
  const titleClasses =
    variant === 'x-style' ? 'text-xl font-bold text-foreground' : 'text-sm font-medium';

  const containerClasses =
    variant === 'x-style'
      ? subtitle
        ? 'px-4 py-2 h-12 flex items-center justify-between'
        : 'px-4 py-3 h-12 flex items-center justify-between'
      : 'px-4 py-4 h-12 flex items-center justify-between';

  // 動的ヘッダータグの作成
  const HeadingTag = headingLevel as keyof JSX.IntrinsicElements;

  return (
    <div className={cn(containerClasses, showBorder && 'border-b border-border/30', className)}>
      {/* 左側コンテンツ */}
      <div className='flex items-center gap-2'>
        {/* 戻るボタン */}
        {showBackButton && onBackClick && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onBackClick}
            className={cn('h-8 w-8 p-0 flex-shrink-0', mobileBackOnly && 'md:hidden')}
            aria-label={backButtonLabel}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
        )}

        {/* 左側追加コンテンツ（アバターなど） */}
        {leftContent}

        {/* タイトルとサブタイトル */}
        <div className='flex flex-col'>
          <HeadingTag className={titleClasses}>{title}</HeadingTag>
          {subtitle && <p className='text-sm text-muted-foreground'>{subtitle}</p>}
        </div>
      </div>

      {/* 右側アクション - 常にdivを表示してレイアウトを統一 */}
      <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center'>{rightAction}</div>
    </div>
  );
};

export default Header;
