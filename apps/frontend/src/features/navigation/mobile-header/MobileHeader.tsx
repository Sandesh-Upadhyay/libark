/**
 * 📱 モバイルヘッダーコンポーネント (Feature)
 *
 * 責任:
 * - モバイル用ヘッダーの表示
 * - ロゴとユーザーアバターの配置
 * - サイドナビゲーションの制御
 *
 * 特徴:
 * - LeftSidebar基準の統一スタイル
 * - アトミックデザインの原則に従った構造
 * - 型安全なProps
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@libark/graphql-client';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { Logo } from '@/components/atoms';

import { LeftSidebar } from '../left-sidebar';

// LeftSidebar基準の統一スタイル
const HEADER_ITEM_CLASSES =
  'flex items-center justify-center px-1 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const ICON_CONTAINER_CLASSES = 'flex items-center justify-center w-10 h-10 flex-shrink-0';

export interface MobileHeaderProps {
  /** カスタムクラス */
  className?: string;
}

/**
 * 📱 モバイルヘッダー
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ロゴクリック処理
  const handleLogoClick = useCallback(() => {
    navigate(isAuthenticated ? '/home' : '/');
  }, [isAuthenticated, navigate]);

  // アバタークリック処理（サイドナビゲーション表示）
  const handleAvatarClick = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  // サイドナビゲーション閉じる処理
  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'bg-background/90 backdrop-blur-sm',
          'border-b border-border',
          'h-12',
          className
        )}
        aria-label='モバイルヘッダー'
      >
        <div className='flex items-center justify-between h-full'>
          {/* 左側: アバター（認証済みの場合のみ） */}
          <div className='w-16 flex justify-center'>
            {isAuthenticated && user ? (
              <button onClick={handleAvatarClick} className={HEADER_ITEM_CLASSES}>
                <div className={ICON_CONTAINER_CLASSES}>
                  <UserAvatar
                    username={user.username}
                    displayName={user.displayName || undefined}
                    profileImageId={user.profileImageId || undefined}
                    size='sm'
                    className='h-8 w-8'
                  />
                </div>
              </button>
            ) : null}
          </div>

          {/* 中央: ロゴ */}
          <div className='flex-1 flex justify-center'>
            <Logo size='nav' onClick={handleLogoClick} className={HEADER_ITEM_CLASSES} />
          </div>

          {/* 右側: 空のスペース（バランス調整） */}
          <div className='w-16 flex justify-center'>
            {/* 将来的にメニューボタンなどを配置可能 */}
          </div>
        </div>
      </header>

      {/* モバイルサイドナビゲーション */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              className='fixed inset-0 bg-black/40 z-sidebar-overlay'
              onClick={handleSidebarClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              aria-label='サイドナビゲーションを閉じる'
            />

            {/* サイドナビゲーション */}
            <motion.div
              className='fixed top-0 left-0 bottom-0 w-80 max-w-[80vw] z-sidebar'
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <LeftSidebar
                className='h-full shadow-xl'
                width='md'
                showText={true}
                isMobile={true}
                onNavigate={handleSidebarClose}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// displayNameを設定
MobileHeader.displayName = 'MobileHeader';
