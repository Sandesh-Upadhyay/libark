'use client';

/**
 * Icon - 純粋なアイコン表示コンポーネント
 *
 * 責任:
 * - アイコンの色管理のみ
 * - インタラクション状態の管理
 * - サイズは親コンポーネントが管理
 */

import React from 'react';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '4xl';
  as?: 'span' | 'div';
}

export const Icon = React.memo(
  React.forwardRef<HTMLDivElement, IconProps>(
    (
      {
        children,
        className,
        size: _size,

        as: Component = 'div',
        ...props
      },
      ref
    ) => {
      return (
        <Component ref={ref} className={className} {...props}>
          {children}
        </Component>
      );
    }
  )
);

Icon.displayName = 'Icon';
