'use client';

import React, { memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { useAuth } from '@libark/graphql-client';

import { usePermissions } from '@/hooks';
import { cn } from '@/lib/utils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Logo,
} from '@/components/atoms';
import { useFeatures } from '@/hooks';

import { getLeftSidebarMenuConfig } from '../config/navigation-config';

export interface LeftSidebarProps {
  className?: string;
  width?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  showText?: boolean;
  isMobile?: boolean;
  /** モバイル環境でナビゲーション時に呼び出されるコールバック */
  onNavigate?: () => void;
}

const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({
  className,
  width = 'md',
  collapsed,
  showText = true,
  isMobile,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdmin } = usePermissions();
  const { features } = useFeatures();
  const userProfile =
    user && isAuthenticated && user.username
      ? {
          username: user.username,
          displayName: user.displayName || null,
          profileImageId: user.profileImageId || null,
        }
      : null;

  // ナビゲーションリンククリック時の処理
  const handleNavigationClick = useCallback(() => {
    // モバイル環境でonNavigateコールバックが提供されている場合のみ実行
    if (isMobile && onNavigate) {
      onNavigate();
    }
  }, [isMobile, onNavigate]);

  if (collapsed) return null;

  const menuItems = getLeftSidebarMenuConfig(t, isAuthenticated, user, isAdmin, features);
  const widthMap = {
    sm: showText ? 'w-60' : 'w-12',
    md: showText ? 'w-72' : 'w-12',
    lg: showText ? 'w-80' : 'w-12',
  };
  const baseItemClass = showText
    ? 'flex items-center h-12 text-base font-medium text-foreground hover:bg-accent'
    : 'w-12 h-12 flex justify-center items-center text-base font-medium text-foreground hover:bg-accent';
  const iconContainerClass = 'w-12 h-12 flex justify-center items-center shrink-0';

  const handleLogout = async () => {
    try {
      // 統一認証システムのログアウト機能を使用
      await logout();
      // ログアウト成功後は物理遷移で完全な状態リセット（メインページにリダイレクト）
      window.location.href = '/';
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラー時もメインページにリダイレクト
      window.location.href = '/';
    }
  };

  const renderUser = () =>
    userProfile && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(baseItemClass, 'w-full')}>
            <div className={iconContainerClass}>
              <UserAvatar
                username={userProfile.username}
                displayName={userProfile.displayName || undefined}
                profileImageId={userProfile.profileImageId || undefined}
                size='sm'
                className='h-10 w-10'
              />
            </div>
            {showText && (
              <div className='flex-1 text-left ml-2'>
                <p className='font-medium'>{userProfile.displayName || userProfile.username}</p>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='start'
          className={cn('w-56', getComponentZIndexClass('SidebarUserMenu'))}
        >
          <DropdownMenuItem onClick={() => navigate(`/profile/${userProfile.username}`)}>
            プロフィールを表示
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
            <LogOut className='mr-2 h-4 w-4' />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  const content = (
    <>
      {isMobile ? null : (
        <button
          className={baseItemClass}
          onClick={() => navigate(isAuthenticated ? '/home' : '/')}
          aria-label='LIBARK ホームページに移動'
        >
          <div className={iconContainerClass}>
            <Logo size='sm' />
          </div>
        </button>
      )}
      <nav className='flex-1 space-y-1'>
        {menuItems.map(item => {
          if ((item.requireAuth || item.adminOnly) && !isAuthenticated) return null;
          const Icon = item.icon;
          const icon = Icon && <Icon className='h-5 w-5' />;
          return item.type === 'link' ? (
            <Link
              key={item.id}
              to={item.href!}
              className={baseItemClass}
              onClick={handleNavigationClick}
            >
              <div className={iconContainerClass}>{icon}</div>
              {showText && <span className='ml-2'>{item.label}</span>}
            </Link>
          ) : item.type === 'button' ? (
            <Button key={item.id} variant='ghost' onClick={item.onClick} className={baseItemClass}>
              <div className={iconContainerClass}>{icon}</div>
              {showText && <span className='ml-2'>{item.label}</span>}
            </Button>
          ) : null;
        })}
      </nav>
      {isMobile ? renderUser() : userProfile && renderUser()}
    </>
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-sidebar bg-background/90 backdrop-blur-sm border-r border-border flex flex-col overflow-y-auto scrollbar-thin',
        widthMap[width],
        className
      )}
      aria-label='メインナビゲーション'
    >
      {content}
    </aside>
  );
};

// メモ化されたLeftSidebarコンポーネント
export const LeftSidebar = memo(LeftSidebarComponent);
LeftSidebar.displayName = 'LeftSidebar';
