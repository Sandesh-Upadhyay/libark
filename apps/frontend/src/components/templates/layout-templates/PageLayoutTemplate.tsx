/**
 * 🎯 統一ページレイアウトテンプレート (Template)
 *
 * 責任:
 * - 全ページ共通の統一レイアウト
 * - セクション分割レイアウトの管理
 * - フォーム要素に最適化されたレイアウト
 * - ホームページ、設定ページ、プロフィールページ等の統一管理
 *
 * 特徴:
 * - ESLintルール準拠（space-*, max-w-*, mx-auto 使用禁止）
 * - 構造的なレイアウト管理
 * - デフォルトヘッダーの使用
 * - サイドバー対応（オプション）
 */

'use client';

import React, { memo } from 'react';

import { Guard } from '@/features/auth/components/organisms/Guard';
import { Icon, ModernPageHeader } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { Motion } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { cn } from '@/lib/utils';

import { getHeaderConfig, getAnimationConfig, type SettingsLayoutProps } from './shared';

// 型エイリアス
export type PageLayoutProps = SettingsLayoutProps;

// SettingComponents統合: 設定セクション用の型定義
interface SettingSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface SettingGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Post関係のページかどうか（600px最大幅を適用） */
  isPostContent?: boolean;
}

/**
 * 🎯 ページセクションコンポーネント (統合版)
 * 複数のページ項目をグループ化
 */
export const PageSection: React.FC<SettingSectionProps> = ({
  title,
  description,
  icon: IconComponent,
  children,
  className,
}) => {
  return (
    <section className={cn('settings-section', className)}>
      {/* セクションヘッダー */}
      <div className='settings-section-header'>
        <div className='flex items-center gap-2'>
          {IconComponent && (
            <Icon size='md' className='text-primary'>
              {IconComponent}
            </Icon>
          )}
          <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
        </div>
        {description && <span className='text-sm text-muted-foreground'>{description}</span>}
      </div>

      {/* セクションコンテンツ */}
      <div className='settings-section-content'>{children}</div>
    </section>
  );
};

/**
 * 🎯 ページグループコンポーネント (統合版)
 * 関連する設定項目をグループ化
 */
export const PageGroup: React.FC<SettingGroupProps> = ({ title, children, className }) => {
  return (
    <div className={cn('settings-group', className)}>
      {title && (
        <h3 className='text-base font-semibold text-foreground settings-group-title'>{title}</h3>
      )}
      <div className='settings-group-content'>{children}</div>
    </div>
  );
};

/**
 * 🎯 ページコンテナコンポーネント (統合版)
 * ページコンテンツをラップ
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  isPostContent = false,
}) => {
  const containerClass = isPostContent
    ? 'mx-auto w-full max-w-full sm:max-w-[600px] page-container' // Post関係は600px固定
    : 'mx-auto w-full page-container'; // 通常のページは既存の設定を維持

  return <div className={cn(containerClass, className)}>{children}</div>;
};

/**
 * 🎯 統一ページレイアウトテンプレート (Template)
 *
 * 全ページで使用可能な統一レイアウト
 * 設定ページ、プロフィールページ、管理ページ等で使用
 */
export const PageLayoutTemplate: React.FC<PageLayoutProps> = memo(
  ({
    title,
    description,
    icon,
    children,
    requireAuth = false,
    requireAdmin = false,
    header = {},
    animation = {},
    className,
    constrainWidth = true,
    sidebar,
    isPostContent = false,
  }) => {
    // 設定の統合
    // サイドバーがある場合はヘッダーを非表示にする
    // ClientLayoutで既にサイドバー対応済みのため、ヘッダーは常に非表示
    const headerConfig = getHeaderConfig('page', {
      ...header,
      show: false, // ClientLayoutで統一管理されているため常に非表示
    });
    const animationConfig = getAnimationConfig(animation);

    // レイアウトコンテンツ
    const layoutContent = (
      <Motion.div
        preset={animationConfig.preset}
        delay={animationConfig.delay}
        className={cn('page-layout', className)}
      >
        {/* ページヘッダー */}
        {headerConfig.show && (
          <ModernPageHeader
            title={title}
            description={description}
            icon={icon}
            variant={headerConfig.variant}
            size={headerConfig.size}
          />
        )}

        {/* メインコンテンツエリア - 完全統一レイアウト */}
        <div className='min-h-screen bg-background'>
          {/* サイドバーがある場合はメッセージページと同じモバイル対応レイアウト */}
          {sidebar ? (
            <div className='fixed inset-0 lg:left-16 xl:left-72 flex bg-background mobile-nav-padding'>
              {/* サイドバー - モバイル対応 */}
              <div className='w-full md:w-auto flex-shrink-0'>{sidebar}</div>
              {/* メインコンテンツ */}
              <div className='flex flex-col flex-1'>
                {constrainWidth ? (
                  <PageContainer isPostContent={isPostContent}>{children}</PageContainer>
                ) : (
                  children
                )}
              </div>
            </div>
          ) : (
            /* 統一レイアウト（ClientLayoutのLeftSidebar対応済み） */
            <main className='min-h-[calc(100vh-3rem)] py-0'>
              {constrainWidth ? (
                <PageContainer isPostContent={isPostContent}>{children}</PageContainer>
              ) : (
                children
              )}
            </main>
          )}
        </div>
      </Motion.div>
    );

    // 認証ガード適用
    if (requireAuth || requireAdmin) {
      return <Guard type={requireAdmin ? 'admin' : 'auth'}>{layoutContent}</Guard>;
    }

    return layoutContent;
  }
);

PageLayoutTemplate.displayName = 'PageLayoutTemplate';

// 型エイリアス（後方互換性）
export const PageLayout = PageLayoutTemplate;
export const SettingsLayoutTemplate = PageLayoutTemplate;

// デフォルト設定
export const PAGE_LAYOUT_DEFAULTS = {
  requireAuth: false,
  requireAdmin: false,
  header: {
    variant: 'default' as const,
    size: 'default' as const,
    show: true,
  },
  layout: {
    spacing: 'container' as const,
    maxWidth: 'container' as const,
    padding: 'container' as const,
  },
  animation: {
    preset: 'slideUp' as const,
    delay: 0.1,
    duration: 0.3,
    disabled: false,
  },
  constrainWidth: true,
} as const;

// デフォルトエクスポート
export default PageLayoutTemplate;
