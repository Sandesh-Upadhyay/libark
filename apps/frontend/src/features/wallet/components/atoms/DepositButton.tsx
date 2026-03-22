/**
 * 🎯 入金ボタンコンポーネント (Atom)
 *
 * 責任:
 * - 入金アクションのトリガー
 * - ローディング状態の表示
 * - アクセシビリティ対応
 */

import React from 'react';
import { Plus, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/atoms';

/**
 * 入金ボタンのプロパティ定義
 */
export interface DepositButtonProps extends Omit<ButtonProps, 'children'> {
  /** ローディング状態 */
  isLoading?: boolean;
  /** ボタンテキスト */
  children?: React.ReactNode;
  /** アイコンを表示するか */
  showIcon?: boolean;
  /** 入金クリック時のコールバック */
  onDeposit?: () => void;
  /** 全幅表示 */
  fullWidth?: boolean;
  /** 最大幅 */
  maxWidth?: string | number;
}

/**
 * 🎯 入金ボタンコンポーネント
 */
export const DepositButton = React.forwardRef<HTMLButtonElement, DepositButtonProps>(
  (
    {
      variant = 'default',
      size = 'default',
      isLoading = false,
      children = '入金',
      showIcon = true,
      onDeposit,
      fullWidth = false,
      maxWidth,
      className,
      onClick,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(event);
      }
      if (onDeposit && !event.defaultPrevented) {
        onDeposit();
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(fullWidth && 'w-full', className)}
        style={{
          maxWidth: maxWidth
            ? typeof maxWidth === 'number'
              ? `${maxWidth}px`
              : maxWidth
            : undefined,
          ...style,
        }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
        ) : (
          showIcon && <Plus className='h-4 w-4 mr-2' />
        )}
        {children}
      </Button>
    );
  }
);

DepositButton.displayName = 'DepositButton';
