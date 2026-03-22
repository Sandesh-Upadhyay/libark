/**
 * 🎯 統計情報カードコンポーネント (Atom)
 *
 * 責任:
 * - 統計情報の視覚的表示
 * - Lucidアイコンを使用したビジュアルデザイン
 * - レスポンシブ対応
 * - アクセシビリティ対応
 *
 * 特徴:
 * - Atomic Design原則の厳密な遵守
 * - CVAによるバリアント管理
 * - Tailwind CSSによるスタイリング
 * - 型安全性の確保
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Card, CardContent } from './card';
import { Badge } from './badge';


// StatsCardのバリアント定義
const statsCardVariants = cva('transition-all duration-200 hover:shadow-md', {
  variants: {
    variant: {
      default: 'border-border bg-card text-card-foreground',
      primary: 'border-primary/20 bg-primary/5 text-primary-foreground',
      success: 'border-success/20 bg-success/5 text-success-foreground',
      warning: 'border-warning/20 bg-warning/5 text-warning-foreground',
      info: 'border-info/20 bg-info/5 text-info-foreground',
    },
    size: {
      sm: 'p-3',
      default: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// アイコンのバリアント定義
const iconVariants = cva('flex-shrink-0 rounded-lg flex items-center justify-center', {
  variants: {
    variant: {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary text-primary-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      info: 'bg-info text-info-foreground',
    },
    size: {
      sm: 'w-8 h-8',
      default: 'w-10 h-10',
      lg: 'w-12 h-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// 統計値のバリアント定義
const valueVariants = cva('font-bold leading-none', {
  variants: {
    size: {
      sm: 'text-lg',
      default: 'text-2xl',
      lg: 'text-3xl',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

// ラベルのバリアント定義
const labelVariants = cva('text-muted-foreground leading-none', {
  variants: {
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface StatsCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
  /** 統計値 */
  value: string | number;
  /** ラベル */
  label: string;
  /** アイコン */
  icon: LucideIcon;
  /** 変化量（オプション） */
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  /** 説明文（オプション） */
  description?: string;
  /** バッジ（オプション） */
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'success' | 'destructive' | 'outline';
  };
  /** ローディング状態 */
  loading?: boolean;
}

/**
 * 🎯 統計情報カードコンポーネント
 *
 * 統計情報を視覚的に魅力的なカード形式で表示
 * Lucidアイコンとモダンなデザインを使用
 */
export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      value,
      label,
      icon: Icon,
      change,
      description,
      badge,
      loading = false,
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    // ローディング状態の表示
    if (loading) {
      return (
        <Card
          ref={ref}
          className={cn(statsCardVariants({ variant, size }), 'animate-pulse', className)}
          {...props}
        >
          <CardContent className='p-0'>
            <div className='flex items-start space-x-3'>
              {/* アイコンスケルトン */}
              <div className={cn(iconVariants({ variant, size }), 'bg-muted')} />

              {/* コンテンツスケルトン */}
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-muted rounded w-16' />
                <div className='h-6 bg-muted rounded w-20' />
                {description && <div className='h-3 bg-muted rounded w-24' />}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn(statsCardVariants({ variant, size }), className)} {...props}>
        <CardContent className='p-0'>
          <div className='flex items-start space-x-3'>
            {/* アイコン */}
            <div className={cn(iconVariants({ variant, size }))}>
              <Icon
                className={cn(size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5')}
              />
            </div>

            {/* メインコンテンツ */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  {/* ラベル */}
                  <p className={cn(labelVariants({ size }))}>{label}</p>

                  {/* 統計値 */}
                  <p className={cn(valueVariants({ size }))}>{value}</p>
                </div>

                {/* バッジ */}
                {badge && (
                  <Badge variant={badge.variant} size='sm'>
                    {badge.text}
                  </Badge>
                )}
              </div>

              {/* 変化量 */}
              {change && (
                <div className='flex items-center mt-2 space-x-1'>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      change.type === 'increase' && 'text-green-600',
                      change.type === 'decrease' && 'text-red-600',
                      change.type === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {change.type === 'increase' && '+'}
                    {change.value}
                    {change.type !== 'neutral' && '%'}
                  </span>
                  <span className='text-xs text-muted-foreground'>前月比</span>
                </div>
              )}

              {/* 説明文 */}
              {description && (
                <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>{description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export { statsCardVariants };
