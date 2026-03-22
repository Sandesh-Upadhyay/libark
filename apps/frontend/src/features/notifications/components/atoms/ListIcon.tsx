/**
 * 🎯 汎用リストアイコンコンポーネント (Atom)
 *
 * 責任:
 * - アイコンの表示とスタイリング
 * - 色とサイズのバリエーション
 * - 背景色の管理
 */

import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Heart,
  MessageCircle,
  UserPlus,
  Share,
  Bell,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * リストアイコンのバリアント定義
 */
const listIconVariants = cva('inline-flex items-center justify-center rounded-full', {
  variants: {
    size: {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
    variant: {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      danger: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white',
      outline: 'border-2 border-border bg-background',
    },
  },
  defaultVariants: {
    size: 'sm',
    variant: 'default',
  },
});

export interface ListIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /** アイコンの内容（文字、絵文字、SVGなど） */
  children: React.ReactNode;
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** バリアント */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'destructive'
    | 'outline'
    | 'danger'
    | 'info';
}

/**
 * 🎯 汎用リストアイコンコンポーネント
 */
export const ListIcon = React.forwardRef<HTMLDivElement, ListIconProps>(
  ({ children, variant, size, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(listIconVariants({ variant, size }), className)} {...props}>
        {children}
      </div>
    );
  }
);

ListIcon.displayName = 'ListIcon';

export { listIconVariants };

/**
 * 事前定義されたアイコンヘルパー
 */
export const TransactionIcon = {
  deposit: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='success' {...props}>
      <ArrowDown className='h-4 w-4' />
    </ListIcon>
  ),
  withdrawal: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='danger' {...props}>
      <ArrowUp className='h-4 w-4' />
    </ListIcon>
  ),
  transferIn: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='info' {...props}>
      <ArrowLeft className='h-4 w-4' />
    </ListIcon>
  ),
  transferOut: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='warning' {...props}>
      <ArrowRight className='h-4 w-4' />
    </ListIcon>
  ),
};

export const NotificationIcon = {
  message: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='primary' {...props}>
      <MessageCircle className='h-4 w-4' />
    </ListIcon>
  ),
  system: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='info' {...props}>
      <Bell className='h-4 w-4' />
    </ListIcon>
  ),
  warning: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='warning' {...props}>
      <AlertTriangle className='h-4 w-4' />
    </ListIcon>
  ),
  success: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='success' {...props}>
      <CheckCircle className='h-4 w-4' />
    </ListIcon>
  ),
};

export const ActivityIcon = {
  like: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='danger' {...props}>
      <Heart className='h-4 w-4' />
    </ListIcon>
  ),
  comment: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='primary' {...props}>
      <MessageCircle className='h-4 w-4' />
    </ListIcon>
  ),
  follow: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='success' {...props}>
      <UserPlus className='h-4 w-4' />
    </ListIcon>
  ),
  share: (props?: Omit<ListIconProps, 'children'>) => (
    <ListIcon variant='info' {...props}>
      <Share className='h-4 w-4' />
    </ListIcon>
  ),
};
