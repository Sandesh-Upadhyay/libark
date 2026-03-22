/**
 * 🎯 統一セクションシェルコンポーネント (Molecule)
 *
 * 責任:
 * - Settings/Admin/Wallet で共通のセクションデザイン
 * - Settings: `border-b` + `p-4`（Xスタイル）
 * - Admin: `border` + `rounded-lg` + `p-6`
 * - 危険操作: `danger` バリアント
 *
 * 特徴:
 * - CVA による variant 切り替え
 * - アイコン付きヘッダー
 * - アクセシビリティ対応
 * - 既存の Header コンポーネントと統一されたデザイン
 */

'use client';

import React from 'react';
import { type LucideProps } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * セクションシェルのバリアント定義
 */
const sectionShellVariants = cva('bg-background', {
  variants: {
    variant: {
      settings: 'border-b border-border/30 p-4',
      admin: 'border border-border/30 rounded-lg p-6',
      compact: 'border-b border-border/30 p-3',
      danger: 'bg-destructive/10 border border-destructive/30 rounded-lg p-4',
    },
  },
  defaultVariants: {
    variant: 'settings',
  },
});

/**
 * セクションヘッダーのバリアント定義
 */
const sectionHeaderVariants = cva('flex items-center gap-2 mb-2', {
  variants: {
    variant: {
      settings: '',
      admin: '',
      compact: '',
      danger: '',
    },
  },
  defaultVariants: {
    variant: 'settings',
  },
});

/**
 * セクションタイトルのバリアント定義
 */
const sectionTitleVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      settings: 'text-foreground',
      admin: 'text-foreground',
      compact: 'text-foreground',
      danger: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'settings',
  },
});

/**
 * セクション説明のバリアント定義
 */
const sectionDescriptionVariants = cva('text-sm text-muted-foreground mb-4', {
  variants: {
    variant: {
      settings: '',
      admin: '',
      compact: 'text-xs',
      danger: 'text-destructive/80',
    },
  },
  defaultVariants: {
    variant: 'settings',
  },
});

export interface SectionShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** セクションタイトル */
  title?: string;
  /** セクション説明 */
  description?: string;
  /** ヘッダーアイコン */
  icon?: React.ComponentType<LucideProps>;
  /** バリアント */
  variant?: 'settings' | 'admin' | 'compact' | 'danger';
  /** ヘッダーを表示するかどうか */
  showHeader?: boolean;
  /** セクションの内容 */
  children: React.ReactNode;
}

/**
 * 🎯 セクションシェルコンポーネント
 *
 * Settings/Admin/Wallet で共通のセクションデザインを提供
 */
export const SectionShell = React.forwardRef<HTMLDivElement, SectionShellProps>(
  (
    {
      className,
      variant = 'settings',
      title,
      description,
      icon: Icon,
      showHeader = true,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn(sectionShellVariants({ variant }), className)} {...props}>
        {/* ヘッダー */}
        {showHeader && (title || description || Icon) && (
          <div className={sectionHeaderVariants({ variant })}>
            {Icon && <Icon className='h-4 w-4' />}
            {title && <h3 className={sectionTitleVariants({ variant })}>{title}</h3>}
          </div>
        )}

        {/* 説明 */}
        {showHeader && description && (
          <p className={sectionDescriptionVariants({ variant })}>{description}</p>
        )}

        {/* コンテンツ */}
        {children}
      </div>
    );
  }
);

SectionShell.displayName = 'SectionShell';

export default SectionShell;
