/**
 * 🧭 右側サイドバー (Feature)
 *
 * 責任:
 * - 検索フォーム
 * - フッター情報
 * - 補助的な情報表示
 * - レスポンシブ対応
 *
 * 特徴:
 * - Shadcn/ui準拠のデザイン
 * - アトミックデザインの原則に従った構造
 * - 型安全なProps
 * - アクセシビリティ対応
 */

'use client';

import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Twitter } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/atoms';

export interface RightSidebarProps {
  /** 追加のクラス名 */
  className?: string;
  /** サイドバーの幅 */
  width?: 'sm' | 'md' | 'lg';
  /** 折りたたみ状態 */
  collapsed?: boolean;
}

/**
 * 🧭 右側サイドバー
 *
 * 検索フォームとフッター情報を表示する右側のサイドバーコンポーネント
 *
 * 使用例:
 * ```tsx
 * <RightSidebar className="hidden xl:flex" width="md" />
 * ```
 */
const RightSidebarComponent: React.FC<RightSidebarProps> = ({
  className,
  width = 'md',
  collapsed = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const currentYear = new Date().getFullYear();

  // サイドバーの幅設定
  const widthClasses = {
    sm: 'w-60',
    md: 'w-72',
    lg: 'w-80',
  };

  if (collapsed) {
    return null; // 折りたたみ時は非表示
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: 検索機能の実装
      console.log('検索:', searchQuery);
    }
  };

  const _socialLinks = [
    { href: 'https://x.com/libark_official', icon: Twitter, label: 'X (Twitter)' },
  ];

  const companyLinks = [
    { href: '/about', label: t('common.about', { default: 'サービスについて' }) },
    { href: '/features', label: t('common.features', { default: '機能' }) },
    { href: '/help', label: t('footer.help', { default: 'ヘルプ' }) },
    { href: '/contact', label: t('common.contact', { default: 'お問い合わせ' }) },
  ];

  const legalLinks = [
    { href: '/terms', label: t('common.terms', { default: '利用規約' }) },
    { href: '/privacy', label: t('common.privacy', { default: 'プライバシーポリシー' }) },
    { href: '/cookies', label: t('footer.cookies', { default: 'Cookie ポリシー' }) },
  ];

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 bottom-0 z-sidebar',
        'bg-background/90 backdrop-blur-sm',
        'border-l border-border',
        'flex flex-col',
        'overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
        widthClasses[width],
        className
      )}
      aria-label='補助情報'
    >
      {/* 検索セクション（Xスタイル） */}
      <div className='px-4 py-0'>
        <form onSubmit={handleSearch} role='search' aria-label='検索'>
          <div className='relative h-12 flex items-center'>
            <Search className='absolute left-3 h-5 w-5 text-muted-foreground z-10' />
            <input
              type='text'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='検索'
              className='w-full h-full pl-12 pr-4 rounded-full bg-muted/50 border-0 focus:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20 text-base placeholder:text-muted-foreground'
              autoComplete='off'
              spellCheck='false'
            />
          </div>
        </form>
      </div>

      <Separator />

      {/* フッター情報 */}
      <div className='flex-1 p-4 space-y-6'>
        {/* サービスリンク */}
        <div className='space-y-3'>
          <h3 className='font-medium text-sm'>サービス</h3>
          <ul className='space-y-2'>
            {companyLinks.map(link => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* 法的情報 */}
        <div className='space-y-3'>
          <h3 className='font-medium text-sm'>法的情報</h3>
          <ul className='space-y-2'>
            {legalLinks.map(link => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* コピーライト */}
      <div className='p-4 border-t border-border'>
        <p className='text-xs text-muted-foreground text-center'>
          &copy; {currentYear} LIBARK. すべての権利は保護されています
        </p>
      </div>
    </aside>
  );
};

// メモ化されたRightSidebarコンポーネント
export const RightSidebar = memo(RightSidebarComponent);
RightSidebar.displayName = 'RightSidebar';
