/**
 * 🎯 レスポンシブメニューレイアウト (Template)
 *
 * 責任:
 * - 管理画面と設定画面で共通のレスポンシブメニューレイアウト
 * - モバイルでのメニュー表示制御の改善
 * - 「戻る」ボタンによるナビゲーション
 * - デスクトップとモバイルでの一貫したUX
 *
 * 特徴:
 * - MobileResponsiveLayoutを拡張
 * - モバイルでメニューが即座に非表示になる問題を解決
 * - ユーザビリティの向上
 * - Atomicデザイン原則に基づく設計
 */

'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms';
import { useIsMobile } from '@/hooks';

export interface ResponsiveMenuLayoutProps {
  /** メニューコンテンツ */
  menu: React.ReactNode;
  /** メインコンテンツ */
  children: React.ReactNode;
  /** メニューの表示状態（モバイル用） */
  showMenu: boolean;
  /** メニュー表示状態の変更ハンドラー */
  onMenuToggle: (show: boolean) => void;
  /** メニューのタイトル */
  menuTitle?: string;
  /** 内部使用メニュータイトル */
  _menuTitle?: string;
  /** 「戻る」ボタンのラベル */
  backButtonLabel?: string;
  /** カスタムクラス */
  className?: string;
  /** メニューのカスタムクラス */
  menuClassName?: string;
  /** メインコンテンツのカスタムクラス */
  contentClassName?: string;
}

/**
 * 🎯 レスポンシブメニューレイアウトコンポーネント
 *
 * 管理画面と設定画面で共通のレイアウトロジックを提供
 * モバイルでのメニュー表示制御を改善し、ユーザビリティを向上
 */
export const ResponsiveMenuLayout: React.FC<ResponsiveMenuLayoutProps> = ({
  menu,
  children,
  showMenu,
  onMenuToggle,
  _menuTitle,
  backButtonLabel = 'メニューに戻る',
  className,
  menuClassName,
  contentClassName,
}) => {
  const isMobile = useIsMobile();

  // モバイルでメニューに戻るハンドラー
  const handleBackToMenu = () => {
    onMenuToggle(true);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 lg:left-16 xl:left-72 flex bg-background mobile-nav-padding',
        className
      )}
    >
      {/* メニューサイドバー */}
      <div
        className={cn(
          `${showMenu ? 'block' : 'hidden md:block'} w-full md:w-96 flex-shrink-0`,
          menuClassName
        )}
      >
        <div className='h-full flex flex-col bg-background border-r border-border'>{menu}</div>
      </div>

      {/* メインコンテンツ */}
      <div className={cn('flex flex-col flex-1 bg-background', contentClassName)}>
        {/* モバイル用「戻る」ボタン */}
        {isMobile && !showMenu && (
          <div className='flex items-center p-4 border-b border-border bg-background/95 backdrop-blur-sm'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleBackToMenu}
              className='flex items-center gap-2 text-muted-foreground hover:text-foreground'
            >
              <ArrowLeft className='h-4 w-4' />
              {backButtonLabel}
            </Button>
          </div>
        )}

        {/* メインコンテンツエリア */}
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </div>
    </div>
  );
};

export default ResponsiveMenuLayout;
