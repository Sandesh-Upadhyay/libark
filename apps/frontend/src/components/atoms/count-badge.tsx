'use client';

import React from 'react';

import { Badge } from './badge';

/**
 * CountBadge - シンプルなカウント表示
 * 標準Badgeコンポーネントのみを使用
 */

// 型定義
interface CountBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** カウント数 */
  count: number;
  /** 最大表示数（デフォルト: 99） */
  maxCount?: number;
  /** 新着アイテムがあるかどうか */
  hasNewItems?: boolean;
  /** 絶対配置するかどうか */
  absolute?: boolean;
  /** 表示バリアント */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * 🎯 CountBadgeコンポーネント (Atom)
 *
 * 責任:
 * - カウント数の統一された表示
 * - 0の場合は非表示
 * - 最大数を超えた場合の「99+」表示
 *
 * 特徴:
 * - 標準Badgeコンポーネントのみを使用
 * - シンプルで一貫したデザイン
 * - アクセシビリティ対応
 * - Shadcnデザインシステム準拠
 */
export const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  (
    {
      count,
      maxCount = 99,
      hasNewItems: _hasNewItems = false,
      absolute: _absolute = false,
      className,
      ...props
    },
    _ref
  ) => {
    // 0の場合は表示しない
    if (count <= 0) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

    return (
      <Badge
        variant='destructive'
        className={className}
        aria-label={`${displayCount}件の未読アイテム`}
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);

CountBadge.displayName = 'CountBadge';

export type { CountBadgeProps };
