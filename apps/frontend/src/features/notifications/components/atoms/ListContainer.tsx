/**
 * 🎯 汎用リストコンテナコンポーネント (Atom)
 *
 * 責任:
 * - リストの外観とレイアウト
 * - 空状態・ローディング状態の表示
 * - スクロール可能エリアの管理
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * リストコンテナのバリアント定義
 */

const listContainerVariants = cva('w-full', {
  variants: {
    variant: {
      default: 'space-y-2',
      compact: 'space-y-1',
      loose: 'space-y-4',
      divided: 'divide-y divide-border',
    },
    size: {
      sm: 'text-sm',
      md: '',
      lg: 'text-lg',
    },
    padding: {
      none: '',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    },
    background: {
      none: '',
      card: 'bg-card rounded-lg border',
      muted: 'bg-muted/50 rounded-lg',
    },
    scroll: {
      none: '',
      auto: 'overflow-auto',
      hidden: 'overflow-hidden',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    padding: 'none',
    background: 'none',
    scroll: 'none',
  },
});

export interface ListContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 子要素 */
  children?: React.ReactNode;
  /** バリアント */
  variant?: 'default' | 'compact' | 'loose' | 'divided';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
  /** パディング */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 背景 */
  background?: 'none' | 'card' | 'muted';
  /** スクロール */
  scroll?: 'none' | 'auto' | 'hidden';
  /** ローディング状態 */
  isLoading?: boolean;
  /** エラー状態 */
  error?: string | null;
  /** 空状態のメッセージ */
  emptyMessage?: string;
  /** 空状態のアイコン */
  emptyIcon?: React.ReactNode;
  /** 最大高さ */
  maxHeight?: string;
}

/**
 * 空状態コンポーネント
 */
const EmptyState: React.FC<{
  message: string;
  icon?: React.ReactNode;
}> = ({ message, icon }) => (
  <div className='flex flex-col items-center justify-center p-8 text-center'>
    <div className='mb-2'>{icon || <span className='text-2xl'>📝</span>}</div>
    <p className='text-sm text-muted-foreground'>{message}</p>
  </div>
);

/**
 * ローディング状態コンポーネント
 */
const LoadingState: React.FC = () => (
  <div className='flex items-center justify-center p-4'>
    <div className='flex items-center space-x-2'>
      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
      <span className='text-sm text-muted-foreground'>読み込み中...</span>
    </div>
  </div>
);

/**
 * エラー状態コンポーネント
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className='flex flex-col items-center justify-center p-8 text-center'>
    <div className='mb-2'>
      <span className='text-2xl text-destructive'>⚠</span>
    </div>
    <p className='text-sm text-destructive'>{error}</p>
  </div>
);

/**
 * 🎯 汎用リストコンテナコンポーネント
 */
export const ListContainer = React.forwardRef<HTMLDivElement, ListContainerProps>(
  (
    {
      children,
      isLoading = false,
      error = null,
      emptyMessage = 'アイテムがありません',
      emptyIcon,
      maxHeight,
      variant,
      size,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerStyle = maxHeight ? { ...style, maxHeight, overflowY: 'auto' as const } : style;

    // ローディング状態
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(listContainerVariants({ variant, size }), className)}
          style={containerStyle}
          {...props}
        >
          <LoadingState />
        </div>
      );
    }

    // エラー状態
    if (error) {
      return (
        <div
          ref={ref}
          className={cn(listContainerVariants({ variant, size }), className)}
          style={containerStyle}
          {...props}
        >
          <ErrorState error={error} />
        </div>
      );
    }

    // 空状態
    if (!children || React.Children.count(children) === 0) {
      return (
        <div
          ref={ref}
          className={cn(listContainerVariants({ variant, size }), className)}
          style={containerStyle}
          {...props}
        >
          <EmptyState message={emptyMessage} icon={emptyIcon} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(listContainerVariants({ variant, size }), className)}
        style={containerStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ListContainer.displayName = 'ListContainer';

export { listContainerVariants };
