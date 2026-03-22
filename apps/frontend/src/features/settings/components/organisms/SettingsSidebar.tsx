/**
 * 🎯 モダン設定サイドバー (Organism)
 *
 * 責任:
 * - 設定機能のナビゲーション
 * - 汎用NavigationSidebarを使用
 * - 設定専用メニュー項目の定義
 * - 管理者権限チェック
 *
 * 特徴:
 * - 汎用コンポーネントの再利用
 * - 設定特化の設定
 * - 権限管理
 */

'use client';

import React from 'react';
import { User, Bell, Shield, Wallet, Palette, Settings } from 'lucide-react';

import { usePermissions } from '@/hooks';
import { NavigationSidebar, type NavigationMenuItem } from '@/components/molecules';

interface SettingsSidebarProps {
  className?: string;
}

/**
 * 設定専用メニュー項目
 */
const settingsMenuItems: NavigationMenuItem[] = [
  {
    id: 'account',
    label: 'アカウント',
    href: '/settings/account',
    icon: User,
    description: 'プロフィール設定',
  },
  {
    id: 'notifications',
    label: '通知',
    href: '/settings/notifications',
    icon: Bell,
    description: '通知設定',
  },
  {
    id: 'privacy',
    label: 'プライバシー',
    href: '/settings/privacy',
    icon: Shield,
    description: 'セキュリティ設定',
  },
  {
    id: 'wallet',
    label: 'ウォレット',
    href: '/settings/wallet',
    icon: Wallet,
    description: 'ウォレット設定',
  },
  {
    id: 'appearance',
    label: '外観',
    href: '/settings/appearance',
    icon: Palette,
    description: 'テーマとレイアウト',
  },
  {
    id: 'admin',
    label: '管理',
    href: '/admin',
    icon: Settings,
    badge: 'Admin',
    description: 'システム管理',
    requireAdmin: true,
  },
];

/**
 * 🎯 設定画面用サイドバーコンポーネント (Organism)
 *
 * 汎用NavigationSidebarを使用した設定特化サイドバー
 */
export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ className }) => {
  const { isAdmin } = usePermissions();

  return (
    <NavigationSidebar
      title='設定'
      description='アカウントとシステム設定'
      headerIcon={Settings}
      menuItems={settingsMenuItems}
      isAdmin={isAdmin}
      className={className}
    />
  );
};

export default SettingsSidebar;
