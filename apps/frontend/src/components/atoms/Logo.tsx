import React from 'react';

import { cn } from '@/lib/utils';
// スタイルは直接Tailwindクラスを使用

export interface LogoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  onClick?: () => void;
  'aria-label'?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'nav';
  variant?: 'default' | 'primary' | 'muted' | 'interactive';
}

// サイズマッピング（Next.js Imageコンポーネント用）
const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  nav: 32,
  lg: 48,
  xl: 64,
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  (
    {
      size = 'md',
      variant: _variant = 'default',
      className,
      onClick,
      'aria-label': ariaLabel = 'LIBARK ホームページに移動',
      ...props
    },
    ref
  ) => {
    const logoSize = sizeMap[size!];

    if (onClick) {
      return (
        <button
          className={cn('inline-flex items-center justify-center transition-colors', className)}
          onClick={onClick}
          aria-label={ariaLabel}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <img src='/images/favicon.svg' alt='LIBARK' width={logoSize} height={logoSize} />
        </button>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        <img src='/images/favicon.svg' alt='LIBARK' width={logoSize} height={logoSize} />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
