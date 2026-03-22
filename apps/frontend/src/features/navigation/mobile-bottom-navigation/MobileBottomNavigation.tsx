/**
 * 🎯 モバイル下部ナビゲーション (Feature)
 *
 * 責任:
 * - モバイルデバイス専用の下部固定ナビゲーション
 * - アイコン中心のシンプルなナビゲーション
 * - 認証状態に応じた動的メニュー表示
 *
 * 特徴:
 * - 下部固定レイアウト
 * - アクセシビリティ対応
 * - 通知バッジ表示
 * - タッチフレンドリーなサイズ
 */

'use client';

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cva, type VariantProps } from 'class-variance-authority';
import { useNotificationCount } from '@libark/graphql-client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms';
import { useAuth, useFeatures } from '@/hooks';

import {
  getMobileBottomNavConfig,
  getUnreadCount,
  type UnreadCounts,
} from '../config/navigation-config';

/**
 * モバイル下部ナビゲーションのバリアント定義
 */
const mobileBottomNavVariants = cva(
  'fixed bottom-0 left-0 right-0 z-navigation bg-background/80 backdrop-blur-sm border-t border-border',
  {
    variants: {
      size: {
        sm: 'h-14',
        md: 'h-16',
        lg: 'h-18',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * ナビゲーションアイテムのバリアント定義
 */
const navItemVariants = cva(
  'flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-colors relative',
  {
    variants: {
      variant: {
        default: 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        active: 'text-primary bg-primary/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * モバイル下部ナビゲーションアイテムの型定義
 */
interface MobileNavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  requireAuth?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
}

/**
 * Props型定義
 */
export interface MobileBottomNavigationProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof mobileBottomNavVariants> {}

/**
 * モバイル下部ナビゲーションアイテムコンポーネント
 */
const MobileNavItemComponent: React.FC<{
  item: MobileNavItem;
  isActive: boolean;
  badgeCount?: number;
}> = ({ item, isActive, badgeCount = 0 }) => {
  const IconComponent = item.icon;

  return (
    <Link
      to={item.href}
      className={cn(navItemVariants({ variant: isActive ? 'active' : 'default' }))}
      aria-label={item.label}
    >
      <div className='relative'>
        <IconComponent className={cn('h-4 w-4 sm:h-5 sm:w-5', 'transition-colors')} />
        {item.showBadge && badgeCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full'
          >
            {badgeCount}
          </Badge>
        )}
      </div>
      <span className='text-xs font-medium truncate max-w-12'>{item.label}</span>
    </Link>
  );
};

/**
 * 🎯 モバイル下部ナビゲーションコンポーネント
 */
export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  size,
  className,
  ...props
}) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const { features } = useFeatures();

  // 通知数の取得
  const notificationData = useNotificationCount();

  const unreadCounts = useMemo(
    () => ({
      notifications: notificationData?.count || 0,
      messages: 0, // TODO: メッセージ数の実装
    }),
    [notificationData]
  );

  // モバイル用ナビゲーションアイテムの設定（統一設定を使用）
  const navMenuConfig = useMemo(
    () => getMobileBottomNavConfig(t, isAuthenticated, user, features),
    [t, isAuthenticated, user, features]
  );

  // ナビゲーションアイテムにバッジ情報を追加
  const mobileNavItems = useMemo((): MobileNavItem[] => {
    return navMenuConfig.map(item => ({
      id: item.id,
      icon: item.icon,
      label: item.label,
      href: item.href || '#',
      requireAuth: item.requireAuth,
      showBadge: ['notifications', 'messages'].includes(item.id),
      badgeCount: getUnreadCount(unreadCounts, item.id as keyof UnreadCounts),
    }));
  }, [navMenuConfig, unreadCounts]);

  // 現在のパスに基づくアクティブ状態の判定
  const isActiveItem = (href: string): boolean => {
    if (href === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(mobileBottomNavVariants({ size }), className)}
      role='navigation'
      aria-label='モバイルナビゲーション'
      {...props}
    >
      <div className='flex items-center justify-around h-full px-2'>
        {mobileNavItems.map(item => (
          <MobileNavItemComponent
            key={item.id}
            item={item}
            isActive={isActiveItem(item.href)}
            badgeCount={item.badgeCount}
          />
        ))}
      </div>
    </nav>
  );
};
