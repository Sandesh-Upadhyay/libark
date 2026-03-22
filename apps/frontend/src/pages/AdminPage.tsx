/**
 * 🎯 管理画面メインページ (リファクタリング版)
 *
 * 責任:
 * - 管理画面全体のレイアウト管理
 * - サブページ間のナビゲーション
 * - 認証ガード機能
 * - 改善されたモバイル対応
 *
 * 特徴:
 * - ResponsiveMenuLayoutを使用
 * - モバイルでのユーザビリティ向上
 * - 統一されたデザインシステム
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Guard } from '@/features/auth/components/organisms/Guard';
import { ResponsiveMenuLayout } from '@/components/templates/ResponsiveMenuLayout';
import { AdminMenuList } from '@/features/admin/components/organisms/AdminMenuList';

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 管理メニュー表示状態
  const [showAdminMenu, setShowAdminMenu] = useState(true);

  // メイン管理ページの場合、サイト機能管理にリダイレクト
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/site-features', { replace: true });
    }
  }, [location.pathname, navigate]);

  // 管理項目選択時にモバイルでメニューを非表示にする
  const handleMenuItemClick = () => {
    setShowAdminMenu(false);
  };

  return (
    <Guard type='admin'>
      <ResponsiveMenuLayout
        showMenu={showAdminMenu}
        onMenuToggle={setShowAdminMenu}
        backButtonLabel='管理メニューに戻る'
        menu={<AdminMenuList onItemClick={handleMenuItemClick} />}
      >
        <Outlet />
      </ResponsiveMenuLayout>
    </Guard>
  );
};

export default AdminPage;
