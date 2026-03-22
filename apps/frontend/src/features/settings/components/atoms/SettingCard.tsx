/**
 * 🎯 設定カードコンポーネント (Atom)
 *
 * 責任:
 * - 設定セクション用の統一されたカードデザイン
 * - グラデーション背景とボーダー
 * - アイコン付きヘッダー
 * - 統一されたスタイリング
 */

import React from 'react';
import { type LucideProps } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { Card, CardContent, CardHeader } from '@/components/atoms';
import { cn } from '@/lib/utils';

/**
 * 設定カードのバリアント定義
 */
const settingCardVariants = cva('transition-all duration-200', {
  variants: {
    variant: {
      default: 'border-border',
      featured: 'border-primary/20 bg-primary/5',
      warning: 'border-warning/20 bg-warning/5',
      danger: 'border-destructive/20 bg-destructive/5',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * 設定カードヘッダーのバリアント定義
 */
const settingCardHeaderVariants = cva('flex items-center gap-3', {
  variants: {
    size: {
      sm: 'pb-2',
      md: 'pb-3',
      lg: 'pb-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/**
 * 設定カードアイコンのバリアント定義
 */
const settingCardIconVariants = cva('flex items-center justify-center rounded-lg', {
  variants: {
    variant: {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary/10 text-primary',
      warning: 'bg-warning/10 text-warning',
      danger: 'bg-destructive/10 text-destructive',
    },
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface SettingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** カードのタイトル */
  title: string;
  /** カードの説明 */
  description?: string;
  /** ヘッダーアイコン */
  icon?: React.ComponentType<LucideProps>;
  /** ヘッダーの追加コンテンツ */
  headerContent?: React.ReactNode;
  /** カードの内容 */
  children: React.ReactNode;
  /** バリアント */
  variant?: 'default' | 'featured' | 'warning' | 'danger';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
}

export const SettingCard = React.forwardRef<HTMLDivElement, SettingCardProps>(
  (
    { className, variant, size, title, description, icon: Icon, headerContent, children, ...props },
    ref
  ) => {
    return (
      <Card ref={ref} className={cn(settingCardVariants({ variant, size }), className)} {...props}>
        {/* ヘッダー */}
        <CardHeader className={cn(settingCardHeaderVariants({}))}>
          <div className=''>
            {Icon && (
              <div
                className={cn(
                  settingCardIconVariants({ variant: variant === 'featured' ? 'primary' : variant })
                )}
              >
                <Icon className='' />
              </div>
            )}
            <div className='flex-1'>
              <h2 className=''>{title}</h2>
              {description && <p className=''>{description}</p>}
            </div>
            {headerContent && <div className=''>{headerContent}</div>}
          </div>
        </CardHeader>

        {/* コンテンツ */}
        <CardContent className=''>{children}</CardContent>
      </Card>
    );
  }
);

SettingCard.displayName = 'SettingCard';
