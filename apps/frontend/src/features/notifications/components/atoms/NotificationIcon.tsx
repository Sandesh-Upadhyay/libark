'use client';

import React from 'react';
import { Bell } from 'lucide-react';

import { Badge } from '@/components/atoms';

export interface NotificationIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 未読通知があるかどうか */
  hasUnread?: boolean;
  /** アイコンのサイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** アクセシビリティ用のラベル */
  'aria-label'?: string;
}

/**
 * 🎯 NotificationIconコンポーネント (Atom)
 *
 * 責任:
 * - 通知アイコンの表示
 * - 未読状態の視覚的表示
 * - レスポンシブ対応とサイズバリエーション
 *
 * 特徴:
 * - シンプルで一貫したデザイン
 * - アトミックデザインの原則に準拠
 * - デフォルトのデザインシステム準拠
 * - アクセシビリティ対応
 * - タッチインターフェース最適化
 */
export const NotificationIcon = React.forwardRef<HTMLDivElement, NotificationIconProps>(
  (props, ref) => {
    const { hasUnread = false, className, 'aria-label': ariaLabel = '通知', ...restProps } = props;

    return (
      <div ref={ref} className={className} aria-label={ariaLabel} role='img' {...restProps}>
        <Bell aria-hidden='true' />
        {hasUnread && (
          <Badge
            variant='destructive'
            className='absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full'
            aria-label='未読通知あり'
          >
            •
          </Badge>
        )}
      </div>
    );
  }
);

NotificationIcon.displayName = 'NotificationIcon';
