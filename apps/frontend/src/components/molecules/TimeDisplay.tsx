'use client';

import React, { useState, useCallback, useMemo } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/atoms';
import { useRealTimeFormat } from '@/hooks/useRealTimeFormat';
import { cn } from '@/lib/utils';
import { getBrowserTimezone } from '@/lib/utils/timezoneUtils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';
import type { TimeDisplayProps } from '@/types';

/**
 * TimeDisplay - 時間表示コンポーネント (Molecule)
 *
 * 責任:
 * - 相対時間の表示（リアルタイム更新対応）
 * - デスクトップ: ツールチップで詳細時間表示
 * - モバイル: クリックで詳細時間表示切り替え
 * - アクセシビリティ対応
 *
 * 特徴:
 * - レスポンシブ対応（デスクトップ/モバイル）
 * - リアルタイム更新機能
 * - 適切なフォーカス管理
 * - タッチデバイス対応
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  date,
  createdAt,
  enableRealTimeUpdate = true,
  onInteractiveClick,
  className,
  size = 'sm',
  align = 'end',
  timezone = getBrowserTimezone(),
  locale = 'ja' as 'ja' | 'en',
}) => {
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);

  // リアルタイム時間フォーマット
  const { relativeTime, absoluteTime, hasError } = useRealTimeFormat(createdAt || date, {
    enableAutoUpdate: enableRealTimeUpdate,
    updateInterval: 1000,
    timezone,
    locale: locale as 'ja' | 'en',
  });

  // 絶対時間を安定化（ツールチップが閉じられないように）
  const stableAbsoluteTime = useMemo(() => absoluteTime, [absoluteTime]);

  // インタラクティブクリック防止ハンドラー
  const handleInteractiveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onInteractiveClick) {
        onInteractiveClick();
      }
    },
    [onInteractiveClick]
  );

  // モバイル用タップハンドラー
  const handleMobileClick = useCallback(
    (e: React.MouseEvent) => {
      handleInteractiveClick(e);
      setShowDetailOnMobile(!showDetailOnMobile);
    },
    [handleInteractiveClick, showDetailOnMobile]
  );

  // サイズに応じたスタイル
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const buttonClasses = cn(
    'text-muted-foreground transition-colors duration-200 rounded-md focus:outline-none focus:ring-1 focus:ring-ring',
    sizeClasses[size as keyof typeof sizeClasses],
    className
  );

  // 安定したキーでツールチップの再マウントを防ぐ
  const stableKey = useMemo(() => `time-display-${createdAt}`, [createdAt]);

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      {/* デスクトップ用（md以上で表示） */}
      <div className='hidden md:block'>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              key={stableKey}
              onClick={handleInteractiveClick}
              onMouseDown={e => e.stopPropagation()}
              onMouseUp={e => e.stopPropagation()}
              className={buttonClasses}
              aria-label={`投稿時間: ${stableAbsoluteTime}`}
              type='button'
            >
              {relativeTime}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side='bottom'
            align={align}
            sideOffset={8}
            className={getComponentZIndexClass('Tooltip')}
            avoidCollisions={true}
          >
            <div className='text-center'>
              <p className='text-sm font-medium'>{stableAbsoluteTime}</p>
              {hasError && (
                <p className='text-xs text-muted-foreground mt-1'>日時の解析に問題があります</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* モバイル用（md未満で表示） */}
      <div className='block md:hidden'>
        <div className='relative'>
          <button
            key={stableKey}
            onClick={handleMobileClick}
            className={buttonClasses}
            aria-label={`投稿時間: ${stableAbsoluteTime}`}
            aria-expanded={showDetailOnMobile}
          >
            {showDetailOnMobile ? stableAbsoluteTime : relativeTime}
          </button>
          {showDetailOnMobile && hasError && (
            <div
              className={`absolute top-full left-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-600 dark:text-red-400 whitespace-nowrap ${getComponentZIndexClass('PostImageContainer')}`}
            >
              日時の解析に問題があります
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export type { TimeDisplayProps };
