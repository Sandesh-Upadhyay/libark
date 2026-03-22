import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import {
  MobileBottomNavigation,
  MobileHeader,
  LeftSidebar,
  RightSidebar,
} from '@/features/navigation';

/**
 * React Router用のクライアントレイアウトコンポーネント
 * Next.jsのlayout.tsxに相当する機能を提供
 *
 * 責任分離:
 * - レイアウト構造の提供のみ
 * - 各コンポーネントが自身の表示制御を管理
 * - レスポンシブナビゲーション（デスクトップ：上部、モバイル：下部）
 * - 統一的なナビゲーション対応パディング管理
 * - 右サイドバー表示制御（メッセージページ・ウォレットページでは非表示）
 */
export const ClientLayout: React.FC = () => {
  const location = useLocation();

  // 右サイドバーを非表示にするページの判定
  const isMessagesPage = location.pathname.startsWith('/messages');
  const isWalletPage = location.pathname.startsWith('/wallet');
  const isSettingsPage = location.pathname.startsWith('/settings');
  const isAdminPage = location.pathname.startsWith('/admin');
  const shouldHideRightSidebar = isMessagesPage || isWalletPage || isSettingsPage || isAdminPage;

  return (
    <div className='min-h-screen flex flex-col'>
      {/* 統一ナビゲーション */}
      <MobileHeader className='lg:hidden' />
      <LeftSidebar className='hidden lg:flex xl:hidden' width='md' showText={false} />
      <LeftSidebar className='hidden xl:flex' width='md' showText={true} />

      {/* 右側サイドバー（デスクトップのみ、メッセージ・ウォレット・設定・アドミンページ以外） */}
      {!shouldHideRightSidebar && <RightSidebar className='hidden xl:flex' width='md' />}

      {/* メインコンテンツ - ナビゲーション・サイドバーを考慮したパディング */}
      <main
        className={`flex-1 mobile-nav-padding ${
          shouldHideRightSidebar ? 'lg:ml-16 xl:ml-72' : 'lg:ml-16 xl:ml-72 xl:mr-72'
        }`}
      >
        <Outlet />
      </main>

      {/* モバイル用下部ナビゲーション */}
      <MobileBottomNavigation className='lg:hidden' />
    </div>
  );
};
