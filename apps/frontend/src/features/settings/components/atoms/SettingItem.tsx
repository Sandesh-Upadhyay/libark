/**
 * 🎯 設定項目コンポーネント (Atom)
 *
 * 責任:
 * - 個別の設定項目のレイアウト
 * - ラベル、説明、コントロールの配置
 * - 統一されたスタイリング
 * - アクセシビリティ対応
 */

import React from 'react';
import { type LucideProps } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * 設定項目のバリアント定義
 */
const settingItemVariants = cva(
  'flex items-center justify-between p-4 rounded-lg border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-background hover:bg-muted/50',
        interactive: 'bg-background hover:bg-muted/50 cursor-pointer',
        static: 'bg-background',
        highlighted: 'bg-primary/5 border-primary/20',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
      },
      state: {
        default: '',
        disabled: 'opacity-50 pointer-events-none',
        error: 'border-destructive/50 bg-destructive/5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

/**
 * 設定項目アイコンのバリアント定義
 */
const settingItemIconVariants = cva('flex items-center justify-center rounded-lg', {
  variants: {
    variant: {
      default: 'bg-muted text-muted-foreground',
      muted: 'bg-muted/50 text-muted-foreground',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      destructive: 'bg-destructive/10 text-destructive',
    },
    size: {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-10 w-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface SettingItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 項目のタイトル */
  title: string;
  /** 項目の説明 */
  description?: string;
  /** 項目のアイコン */
  icon?: React.ComponentType<LucideProps>;
  /** アイコンのバリアント */
  iconVariant?: 'default' | 'muted' | 'success' | 'warning' | 'destructive';
  /** 右側のコントロール要素 */
  control?: React.ReactNode;
  /** 必須項目かどうか */
  required?: boolean;
  /** 無効状態かどうか */
  disabled?: boolean;
  /** バリアント */
  variant?: 'default' | 'interactive' | 'static' | 'highlighted';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 状態 */
  state?: 'default' | 'disabled' | 'error';
  /** レイアウト */
  layout?: 'horizontal' | 'vertical';
}

export const SettingItem = React.forwardRef<HTMLDivElement, SettingItemProps>(
  (
    {
      className,
      variant,
      layout: _layout,
      title,
      description,
      icon: Icon,
      iconVariant = 'default',
      control,
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          settingItemVariants({ variant }),
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {/* アイコン */}
        {Icon && (
          <div className={cn(settingItemIconVariants({ variant: iconVariant }))}>
            <Icon className='' />
          </div>
        )}

        {/* メインコンテンツ */}
        <div className=''>
          <div className=''>
            <h4 className=''>{title}</h4>
            {required && (
              <span className='' aria-label='必須'>
                *
              </span>
            )}
          </div>
          {description && <p className=''>{description}</p>}
        </div>

        {/* コントロール */}
        {control && <div className='flex-shrink-0'>{control}</div>}
      </div>
    );
  }
);

SettingItem.displayName = 'SettingItem';
