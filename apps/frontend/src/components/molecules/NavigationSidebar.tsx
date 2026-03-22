/**
 * 🧭 汎用ナビゲーションサイドバー (Molecule)
 *
 * 責任:
 * - 統一されたサイドバーレイアウト
 * - メニュー項目の表示
 * - アクティブ状態の管理
 * - 設定・ウォレット両対応
 *
 * 特徴:
 * - Shadcn/ui準拠のデザイン
 * - 汎用的で再利用可能
 * - 型安全なProps
 * - 一貫したスタイリング
 */

'use client';

import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge, Separator } from '@/components/atoms';

export interface NavigationMenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
  requireAdmin?: boolean;
}

export interface NavigationSidebarProps {
  /** サイドバータイトル */
  title: string;
  /** サイドバー説明文 */
  description?: string;
  /** ヘッダーアイコン */
  headerIcon: LucideIcon;
  /** メニュー項目リスト */
  menuItems: NavigationMenuItem[];
  /** フッター情報 */
  footerInfo?: string[];
  /** 追加のクラス名 */
  className?: string;
  /** 管理者権限チェック関数 */
  isAdmin?: boolean;
}

/**
 * 🧭 汎用ナビゲーションサイドバー
 *
 * 設定・ウォレット・その他のナビゲーションに使用できる汎用サイドバー
 *
 * 使用例:
 * ```tsx
 * // ウォレット用
 * <NavigationSidebar
 *   title="ウォレット"
 *   description="資金管理と取引履歴"
 *   headerIcon={CreditCard}
 *   menuItems={walletMenuItems}
 *   footerInfo={['セキュアな暗号化通信', '24時間監視システム']}
 * />
 *
 * // 設定用
 * <NavigationSidebar
 *   title="設定"
 *   description="アカウントとシステム設定"
 *   headerIcon={Settings}
 *   menuItems={settingsMenuItems}
 * />
 * ```
 */
const NavigationSidebarComponent: React.FC<NavigationSidebarProps> = ({
  title,
  description,
  headerIcon: HeaderIcon,
  menuItems,
  footerInfo,
  className,
  isAdmin = false,
}) => {
  const location = useLocation();

  const isActiveItem = (href: string): boolean => {
    if (href === '/wallet' || href === '/settings') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  // 管理者権限が必要な項目をフィルタリング
  const filteredMenuItems = menuItems.filter(item => !item.requireAdmin || isAdmin);

  return (
    <nav className={cn('flex flex-col space-y-1 p-4', className)}>
      {/* ヘッダー */}
      <div className='mb-4'>
        <div className='flex items-center space-x-2 mb-2'>
          <HeaderIcon className='h-5 w-5 text-primary' />
          <h2 className='text-lg font-semibold'>{title}</h2>
        </div>
        {description && <p className='text-sm text-muted-foreground'>{description}</p>}
      </div>

      <Separator className='mb-4' />

      {/* メニュー項目 */}
      <div className='space-y-1'>
        {filteredMenuItems.map(item => {
          const isActive = isActiveItem(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <Icon className='h-4 w-4 flex-shrink-0' />
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between'>
                  <span className='truncate'>{item.label}</span>
                  {item.badge && (
                    <Badge variant='secondary' className='ml-2 text-xs'>
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className='text-xs text-muted-foreground mt-0.5 truncate'>
                    {item.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* フッター情報 */}
      {footerInfo && footerInfo.length > 0 && (
        <div className='mt-auto pt-4'>
          <Separator className='mb-4' />
          <div className='text-xs text-muted-foreground space-y-1'>
            {footerInfo.map((info, index) => (
              <p key={index}>{info}</p>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// メモ化されたNavigationSidebarコンポーネント
export const NavigationSidebar = memo(NavigationSidebarComponent);
NavigationSidebar.displayName = 'NavigationSidebar';
