/**
 * 🎯 モバイル対応レスポンシブレイアウト (Template)
 *
 * 責任:
 * - メッセージページと設定ページで共通のモバイル対応レイアウト
 * - サイドバーの表示・非表示制御
 * - レスポンシブデザインの統一
 * - モバイル・デスクトップでの一貫したUX
 *
 * 特徴:
 * - メッセージページのロジックを完全に共通化
 * - 固定レイアウト（fixed inset-0）
 * - 左サイドバー分のスペース確保
 * - モバイルナビゲーション対応パディング
 */

'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface MobileResponsiveLayoutProps {
  /** サイドバーコンテンツ */
  sidebar: React.ReactNode;
  /** メインコンテンツ */
  children: React.ReactNode;
  /** サイドバーの表示状態（モバイル用） */
  showSidebar: boolean;
  /** カスタムクラス */
  className?: string;
  /** サイドバーのカスタムクラス */
  sidebarClassName?: string;
  /** メインコンテンツのカスタムクラス */
  contentClassName?: string;
}

/**
 * 🎯 モバイル対応レスポンシブレイアウトコンポーネント
 *
 * メッセージページと設定ページで共通のレイアウトロジックを提供
 */
export const MobileResponsiveLayout: React.FC<MobileResponsiveLayoutProps> = ({
  sidebar,
  children,
  showSidebar,
  className,
  sidebarClassName,
  contentClassName,
}) => {
  return (
    <div
      className={cn(
        'fixed inset-0 lg:left-16 xl:left-72 flex bg-background mobile-nav-padding',
        className
      )}
    >
      {/* サイドバー - モバイル対応 */}
      <div
        className={cn(
          `${showSidebar ? 'block' : 'hidden md:block'} w-full md:w-auto flex-shrink-0`,
          sidebarClassName
        )}
      >
        {sidebar}
      </div>

      {/* メインコンテンツ */}
      <div className={cn('flex flex-col flex-1 bg-background', contentClassName)}>{children}</div>
    </div>
  );
};

export default MobileResponsiveLayout;
