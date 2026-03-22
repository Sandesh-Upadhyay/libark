/**
 * 🎯 統一モバイルレイアウトシステム
 *
 * 全ページで一貫したモバイルファーストのレイアウトを提供
 * PostList、設定ページ、その他すべてのページで使用可能
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// MobileCard削除済み

/**
 * モバイルセクションのバリアント
 */
const mobileSectionVariants = cva('space-y-3 sm:space-y-4', {
  variants: {
    spacing: {
      tight: 'space-y-2 sm:space-y-3',
      normal: 'space-y-3 sm:space-y-4',
      loose: 'space-y-4 sm:space-y-6',
    },
  },
  defaultVariants: {
    spacing: 'normal',
  },
});

/**
 * モバイルリストアイテムのバリアント
 */
const mobileListItemVariants = cva('flex items-start gap-3 sm:gap-4 transition-colors', {
  variants: {
    variant: {
      static: '',
      interactive: 'cursor-pointer hover:bg-muted/50 active:bg-muted/70',
      button:
        'cursor-pointer hover:bg-muted/50 active:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    },
    padding: {
      none: '',
      sm: 'p-2 sm:p-3',
      md: 'p-3 sm:p-4',
      lg: 'p-4 sm:p-6',
    },
    alignment: {
      start: 'items-start',
      center: 'items-center',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: {
    variant: 'static',
    padding: 'md',
    alignment: 'start',
  },
});

// MobileCardProps削除済み - 統一カードスタイルシステムを使用

/**
 * モバイルセクションのプロパティ
 */
export interface MobileSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileSectionVariants> {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * モバイルリストアイテムのプロパティ
 */
export interface MobileListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileListItemVariants> {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  onItemClick?: () => void;
}

// MobileCard削除済み - 統一カードスタイルシステム（lib/styles/card-styles.ts）を使用

/**
 * 統一モバイルセクション
 */
const MobileSection = React.forwardRef<HTMLDivElement, MobileSectionProps>(
  (
    { className, spacing, title, description, icon: Icon, headerAction, children, ...props },
    ref
  ) => {
    const hasHeader = title || description || Icon || headerAction;

    return (
      <div className={cn(mobileSectionVariants({ spacing, className }))} ref={ref} {...props}>
        {hasHeader && (
          <div className='flex items-center gap-2 sm:gap-3 pb-2 border-b border-border'>
            {Icon && (
              <div className='flex items-center justify-center rounded-lg bg-muted text-muted-foreground h-6 w-6 sm:h-8 sm:w-8'>
                <Icon className='h-3 w-3 sm:h-4 sm:w-4' />
              </div>
            )}
            <div className='flex-1 min-w-0'>
              {title && <h3 className='text-sm font-medium text-foreground'>{title}</h3>}
              {description && (
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>{description}</p>
              )}
            </div>
            {headerAction && <div className='flex-shrink-0'>{headerAction}</div>}
          </div>
        )}
        <div className='space-y-0'>{children}</div>
      </div>
    );
  }
);
MobileSection.displayName = 'MobileSection';

/**
 * 統一モバイルリストアイテム
 */
const MobileListItem = React.forwardRef<HTMLDivElement, MobileListItemProps>(
  (
    {
      className,
      variant,
      padding,
      alignment,
      icon,
      title,
      subtitle,
      description,
      action,
      meta,
      children,
      onItemClick,
      ...props
    },
    ref
  ) => {
    const hasContent = title || subtitle || description || children;
    const isClickable = variant === 'interactive' || variant === 'button' || onItemClick;

    return (
      <div
        className={cn(mobileListItemVariants({ variant, padding, alignment, className }))}
        onClick={onItemClick}
        ref={ref}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        {...props}
      >
        {icon && <div className='flex-shrink-0 mt-0.5'>{icon}</div>}

        {hasContent && (
          <div className='flex-1 min-w-0'>
            {(title || meta) && (
              <div className='flex items-center justify-between'>
                {title && <h4 className='text-sm font-medium text-foreground'>{title}</h4>}
                {meta && <div className='flex-shrink-0 ml-2'>{meta}</div>}
              </div>
            )}

            {subtitle && (
              <p className='text-xs sm:text-sm text-muted-foreground mt-1'>{subtitle}</p>
            )}

            {description && <p className='text-xs text-muted-foreground mt-1'>{description}</p>}

            {children && <div className='mt-3'>{children}</div>}
          </div>
        )}

        {action && <div className='flex-shrink-0 ml-2'>{action}</div>}
      </div>
    );
  }
);
MobileListItem.displayName = 'MobileListItem';

/**
 * モバイルレイアウトユーティリティ
 */
export const mobileLayoutUtils = {
  // 共通クラス名
  card: 'border-0 sm:border sm:rounded-lg bg-card divide-y divide-border',
  padding: 'p-3 sm:p-4',
  spacing: 'space-y-3 sm:space-y-4',
  gap: 'gap-3 sm:gap-4',
  iconSize: 'h-4 w-4 sm:h-5 sm:w-5',
  textSize: 'text-xs sm:text-sm',

  // 組み合わせクラス
  cardWithPadding: 'border-0 sm:border sm:rounded-lg bg-card divide-y divide-border',
  listItem: 'p-3 sm:p-4 flex items-start gap-3 sm:gap-4',
  section: 'space-y-3 sm:space-y-4',
} as const;

export {
  // MobileCard削除済み
  MobileSection,
  MobileListItem,
  // mobileCardVariants削除済み
  mobileSectionVariants,
  mobileListItemVariants,
};
