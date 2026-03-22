/**
 * 🧬 QuickAccessCard - Molecule Component
 *
 * 責任:
 * - 設定ページのクイックアクセス機能
 * - 統一されたカードデザイン
 * - ホバー効果とインタラクション
 * - アクセシビリティ対応
 */

'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, Icon } from '@/components/atoms';
import { Badge } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { cn } from '@/lib/utils';

/**
 * QuickAccessCard バリアント定義
 */
const quickAccessCardVariants = cva('group transition-all duration-200 cursor-pointer', {
  variants: {
    variant: {
      default: 'hover:shadow-md hover:border-primary/50',
      disabled: 'cursor-not-allowed opacity-60',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * QuickAccessCard Props
 */
export interface QuickAccessCardProps extends VariantProps<typeof quickAccessCardVariants> {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
  badge?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * 🧬 QuickAccessCard コンポーネント
 *
 * 使用例:
 * ```tsx
 * <QuickAccessCard
 *   title="プロフィール設定"
 *   description="プロフィール情報とアバター画像を管理"
 *   href="/settings/profile"
 *   icon={User}
 * />
 * ```
 */
export function QuickAccessCard({
  title,
  description,
  href,
  icon: IconComponent,
  disabled = false,
  badge,
  variant,
  size,
  className,
  onClick,
}: QuickAccessCardProps) {
  const finalVariant = disabled ? 'disabled' : variant;

  const cardContent = (
    <Card className={cn(quickAccessCardVariants({ variant: finalVariant, size }), className)}>
      <div className='flex items-start justify-between'>
        <div className='flex-1 space-y-1.5'>
          {/* アイコンとタイトル */}
          <div className='flex items-center gap-2.5'>
            {IconComponent && (
              <Icon size='sm' className='text-primary'>
                <IconComponent />
              </Icon>
            )}
            <h3 className='text-sm font-medium text-foreground'>{title}</h3>
          </div>

          {/* 説明文 */}
          <span className='text-xs text-muted-foreground leading-relaxed'>{description}</span>

          {/* バッジ（無効化時など） */}
          {badge && (
            <Badge variant='secondary' size='xs'>
              {badge}
            </Badge>
          )}
        </div>

        {/* 右側の矢印アイコン */}
        {!disabled && (
          <Icon
            size='xs'
            className='text-muted-foreground group-hover:text-primary transition-colors'
          >
            <ChevronRight />
          </Icon>
        )}
      </div>
    </Card>
  );

  // 無効化されている場合は通常のdivとして表示
  if (disabled) {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-disabled='true'
        aria-label={`${title} - ${badge || '利用できません'}`}
      >
        {cardContent}
      </div>
    );
  }

  // 有効な場合はLinkコンポーネントとして表示
  return (
    <Link
      to={href}
      className='block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg'
      onClick={onClick}
      aria-label={`${title}の設定ページに移動`}
    >
      {cardContent}
    </Link>
  );
}

// export type { QuickAccessCardProps }; // 重複エクスポートのためコメントアウト
