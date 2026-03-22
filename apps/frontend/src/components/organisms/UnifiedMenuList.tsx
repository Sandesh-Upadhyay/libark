/**
 * 🎯 統一メニューリスト (Organism)
 *
 * 責任:
 * - 管理画面と設定画面で共通のメニューリスト表示
 * - 統一されたリストUI
 * - 権限チェック
 * - アクセシビリティ対応
 *
 * 特徴:
 * - AdminMenuListとSettingsMenuListの共通化
 * - 責任分離の徹底
 * - 統一されたデザインシステム
 * - モバイル対応
 * - Atomicデザイン原則に基づく設計
 */

'use client';

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { Settings } from 'lucide-react'; // 未使用のため削除

import { List } from '@/components/molecules/List';
import type { BaseMenuItem, BaseListProps, ClickableItemProps, IconType, BadgeInfo } from '@/types';

// ListItemの型定義をローカルで定義
interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: IconType;
  href?: string;
  badge?: BadgeInfo;
  isDisabled?: boolean;
}

interface UnifiedMenuListProps extends BaseListProps, ClickableItemProps {
  /** メニューのタイトル */
  title: string;
  /** メニューアイテムのリスト */
  items: BaseMenuItem[];
  /** 選択されたアイテムID */
  selectedItemId?: string;
  /** エラー */
  error?: Error;
  /** アイテムのCSSクラス */
  itemClassName?: string;
  /** バリアント */
  variant?: 'default' | 'compact' | 'detailed' | 'comfortable';
  /** ヘッダーバリアント */
  headerVariant?: 'default' | 'x-style' | 'minimal';
  /** ヘッダーレベル */
  headerLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** アイテムクリック時のコールバック（モバイル用） */
  onItemClick?: () => void;
}

/**
 * ListItem型ガード関数
 */
const isListItem = (item: unknown): item is ListItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    typeof (item as ListItem).id === 'string'
  );
};

/**
 * メニューアイテムをListItemに変換するヘルパー関数
 */
const convertMenuItemToListItem = (item: BaseMenuItem): ListItem => ({
  id: item.id,
  title: item.title || item.label,
  subtitle: item.subtitle,
  description: item.description,
  icon: item.icon,
  href: item.href,
  badge: item.badge,
  isDisabled: item.disabled,
});

/**
 * 🎯 統一メニューリストコンポーネント
 */
export const UnifiedMenuList: React.FC<UnifiedMenuListProps> = ({
  title,
  items,
  selectedItemId,
  onItemClick,
  loading = false,
  error,
  emptyState,
  className,
  itemClassName,
  variant = 'detailed',
  headerVariant = 'x-style',
  headerLevel = 'h2',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 表示可能なアイテムのフィルタリング
  const visibleItems = items.filter(item => item.visible !== false);

  // ListItem形式に変換
  const listItems = visibleItems.map(convertMenuItemToListItem);

  // 現在のパスから選択中のアイテムを判定
  const getSelectedItemId = (): string | undefined => {
    if (selectedItemId) return selectedItemId;

    const currentPath = location.pathname;

    // 完全一致を優先
    const exactMatch = visibleItems.find(item => item.href === currentPath);
    if (exactMatch) return exactMatch.id;

    // 部分一致（管理系・設定系のパス）
    if (currentPath.startsWith('/admin/')) {
      const adminPath = currentPath.replace('/admin/', '');
      const partialMatch = visibleItems.find(item => item.id === adminPath);
      if (partialMatch) return partialMatch.id;
    }

    if (currentPath.startsWith('/settings/')) {
      const settingsPath = currentPath.replace('/settings/', '');
      const partialMatch = visibleItems.find(item => item.id === settingsPath);
      if (partialMatch) return partialMatch.id;
    }

    return undefined;
  };

  // アイテムクリックハンドラー
  const handleItemClick = (item: unknown) => {
    if (isListItem(item) && item.href && !item.isDisabled) {
      navigate(item.href);
      // モバイルでアイテム選択時にメニューを非表示
      onItemClick?.();
    }
  };

  // デフォルトの空状態
  const defaultEmptyState = 'メニュー項目がありません';

  return (
    <List
      title={title}
      items={listItems}
      selectedItemId={getSelectedItemId()}
      onItemClick={handleItemClick}
      loading={loading}
      error={error}
      variant={variant}
      headerVariant={headerVariant}
      headerLevel={headerLevel}
      emptyState={emptyState || defaultEmptyState}
      className={className}
      itemClassName={itemClassName}
    />
  );
};

export default UnifiedMenuList;
