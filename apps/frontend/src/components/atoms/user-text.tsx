'use client';

/**
 * UserText - ユーザー名・表示名テキスト表示コンポーネント (Atom)
 *
 * 責任:
 * - ユーザー名・表示名のテキスト表示のみ
 * - テキストのスタイリング
 * - 切り詰め処理
 *
 * 特徴:
 * - 純粋なテキスト表示
 * - レイアウトは含まない
 * - 単一責任の原則
 */

import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * UserText バリアント定義
 */

const userTextVariants = cva('inline-block', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    truncate: {
      none: '',
      line: 'truncate',
      word: 'break-words',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
    weight: 'medium',
    truncate: 'none',
  },
});

export interface UserTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 表示するテキスト */
  text?: string;
  /** プレフィックス（@など） */
  prefix?: string;
  /** バリアント */
  variant?: 'default' | 'muted' | 'primary' | 'secondary';
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** 重み */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** 切り詰め */
  truncate?: 'none' | 'line' | 'word';
}

/**
 * 🎯 UserText コンポーネント (Atom)
 *
 * 責任:
 * - ユーザー名・表示名のテキスト表示
 * - テキストスタイリング
 * - 切り詰め処理
 *
 * 特徴:
 * - 純粋なテキスト表示
 * - プレフィックス対応（@username）
 * - 型安全なバリアント
 */
export const UserText = React.forwardRef<HTMLSpanElement, UserTextProps>(
  ({ text, prefix, variant, size, truncate, weight, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(userTextVariants({ variant, size, truncate, weight }), className)}
        title={truncate ? text : undefined}
        {...props}
      >
        {prefix && <span className='opacity-75'>{prefix}</span>}
        {text || ''}
      </span>
    );
  }
);

UserText.displayName = 'UserText';

export { userTextVariants };
