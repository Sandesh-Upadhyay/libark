/**
 * 🎯 管理画面メニューリスト (Organism)
 *
 * 責任:
 * - 管理機能の一覧表示
 * - 統一されたリストUI
 * - 管理者権限チェック
 * - アクセシビリティ対応
 *
 * 特徴:
 * - 統一MenuListコンポーネントを使用
 * - 責任分離の徹底
 * - 管理者専用機能
 * - モバイル対応
 */

'use client';

import React from 'react';
import { Shield } from 'lucide-react';

import { UnifiedMenuList } from '@/components/organisms/UnifiedMenuList';
import { usePermissions } from '@/hooks';
import { getAdminMenuItems } from '@/features/admin/config/admin-menu-items';

interface AdminMenuListProps {
  className?: string;
  onItemClick?: () => void;
}

/**
 * 🎯 管理画面メニューリストコンポーネント
 */
export const AdminMenuList: React.FC<AdminMenuListProps> = ({ className, onItemClick }) => {
  const { isAdmin } = usePermissions();

  const menuItems = getAdminMenuItems(isAdmin);

  // 管理者権限がない場合は空の状態を表示
  if (!isAdmin) {
    return (
      <UnifiedMenuList
        title='管理画面'
        items={[]}
        emptyState={
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Shield className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-medium text-foreground mb-2'>アクセス権限がありません</h3>
            <p className='text-sm text-muted-foreground'>管理者権限が必要です</p>
          </div>
        }
        className={className}
        onItemClick={onItemClick}
      />
    );
  }

  // AdminMenuItemをBaseMenuItemに変換
  const baseMenuItems = menuItems.map(item => ({
    id: item.id,
    title: item.title,
    label: item.label || item.title,
    subtitle: item.subtitle,
    description: item.description,
    icon: item.icon,
    href: item.href,
    disabled: item.disabled,
    badge: item.badge,
  }));

  return (
    <UnifiedMenuList
      title='管理画面'
      items={baseMenuItems}
      className={className}
      onItemClick={onItemClick}
    />
  );
};

export default AdminMenuList;
