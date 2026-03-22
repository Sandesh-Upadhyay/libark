/**
 * 🎯 設定メニューリスト (Organism)
 *
 * 責任:
 * - 設定項目の一覧表示
 * - 統一MenuListコンポーネントを使用
 * - 設定項目のナビゲーション
 * - 権限管理
 *
 * 特徴:
 * - 統一されたリストUI
 * - 責任分離の徹底
 * - 管理者権限チェック
 * - アクセシビリティ対応
 */

'use client';

import React from 'react';

import { UnifiedMenuList } from '@/components/organisms/UnifiedMenuList';
import { usePermissions } from '@/hooks';
import { getSettingsMenuItems } from '@/features/settings/config/settings-menu-items';

interface SettingsMenuListProps {
  className?: string;
  onItemClick?: () => void;
}

/**
 * 🎯 設定メニューリストコンポーネント
 */
export const SettingsMenuList: React.FC<SettingsMenuListProps> = ({ className, onItemClick }) => {
  const { isAdmin } = usePermissions();

  const menuItems = getSettingsMenuItems(isAdmin);

  return (
    <UnifiedMenuList
      title='設定'
      items={menuItems as any}
      className={className}
      onItemClick={onItemClick}
    />
  );
};

export default SettingsMenuList;
