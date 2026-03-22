import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Guard } from '@/features/auth/components/organisms/Guard';
import { ResponsiveMenuLayout } from '@/components/templates/ResponsiveMenuLayout';
import { SettingsMenuList } from '@/features/settings/components/organisms/SettingsMenuList';

/**
 * 🎯 設定ページ (リファクタリング版)
 *
 * 責任:
 * - 設定ページ全体のレイアウト管理
 * - サブページ間のナビゲーション
 * - 認証ガード機能
 * - 改善されたモバイル対応
 *
 * 特徴:
 * - ResponsiveMenuLayoutを使用
 * - モバイルでのユーザビリティ向上
 * - 統一されたデザインシステム
 */

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 設定メニュー表示状態
  const [showSettingsMenu, setShowSettingsMenu] = useState(true);

  // メイン設定ページの場合、アカウント設定にリダイレクト
  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/account', { replace: true });
    }
  }, [location.pathname, navigate]);

  // 設定項目選択時にモバイルでメニューを非表示にする
  const handleMenuItemClick = () => {
    setShowSettingsMenu(false);
  };

  return (
    <Guard type='auth'>
      <ResponsiveMenuLayout
        showMenu={showSettingsMenu}
        onMenuToggle={setShowSettingsMenu}
        backButtonLabel='設定メニューに戻る'
        menu={<SettingsMenuList onItemClick={handleMenuItemClick} />}
      >
        <Outlet />
      </ResponsiveMenuLayout>
    </Guard>
  );
};

export default SettingsPage;
