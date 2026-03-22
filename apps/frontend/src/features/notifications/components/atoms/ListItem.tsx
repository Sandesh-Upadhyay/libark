/**
 * 🎯 汎用リストアイテムコンポーネント (Atom)
 *
 * 責任:
 * - 基本的なリストアイテムの表示
 * - アイコン、メイン情報、サブ情報、アクションの配置
 * - ホバー・アクティブ状態の管理
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * リストアイテムのバリアント定義
 */

const listItemVariants = cva('flex items-center gap-3 p-3 rounded-lg transition-colors', {
  variants: {
    variant: {
      default: '',
      interactive: 'cursor-pointer',
      static: '',
      highlighted: 'bg-primary/10 border border-primary/20',
    },
    size: {
      sm: 'p-2 gap-2',
      md: 'p-3 gap-3',
      lg: 'p-4 gap-4',
    },
    state: {
      default: '',
      active: 'bg-primary/10',
      disabled: 'opacity-50 pointer-events-none',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    state: 'default',
  },
});

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** アイコン要素 */
  icon?: React.ReactNode;
  /** メインタイトル */
  title: string;
  /** サブタイトル */
  subtitle?: string;
  /** 右側のアクション要素 */
  action?: React.ReactNode;
  /** 右側のメタ情報 */
  meta?: React.ReactNode;
  /** クリック時のコールバック */
  onItemClick?: () => void;
  /** 選択状態 */
  selected?: boolean;
  /** バリアント */
  variant?: 'default' | 'interactive' | 'static' | 'highlighted' | 'selected';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 状態 */
  state?: 'default' | 'active' | 'disabled';
}

/**
 * 🎯 汎用リストアイテムコンポーネント
 */
export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      icon,
      title,
      subtitle,
      action,
      meta,
      onItemClick,
      selected = false,
      variant = 'default',
      size,
      className,
      ...props
    },
    ref
  ) => {
    const finalVariant = selected ? 'selected' : onItemClick ? 'interactive' : variant;

    return (
      <div
        ref={ref}
        className={cn(
          listItemVariants({
            variant: finalVariant === 'selected' ? 'highlighted' : finalVariant,
            size,
          }),
          className
        )}
        onClick={onItemClick}
        {...props}
      >
        {/* アイコン */}
        {icon && <div className='flex-shrink-0'>{icon}</div>}

        {/* メイン情報 */}
        <div className=''>
          <div className='flex items-center justify-between'>
            <p className=''>{title}</p>
            {meta && <div className=''>{meta}</div>}
          </div>

          {subtitle && <p className=''>{subtitle}</p>}
        </div>

        {/* アクション */}
        {action && <div className=''>{action}</div>}
      </div>
    );
  }
);

ListItem.displayName = 'ListItem';

export { listItemVariants };
