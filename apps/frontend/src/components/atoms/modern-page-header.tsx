/**
 * ModernPageHeader - モダンでミニマルなページヘッダーコンポーネント
 *
 * 責任:
 * - モダンなページタイトルの表示
 * - 新しいサイドメニューデザインとの統一感
 * - Framer Motionアニメーション統合
 * - レスポンシブ対応
 * - アクセシビリティ対応
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// バリアント定義
const modernPageHeaderVariants = cva('flex flex-col space-y-2 pb-4 border-b border-border/50', {
  variants: {
    variant: {
      default: 'mb-6',
      minimal: 'mb-4 pb-2',
      compact: 'mb-3 pb-1',
      prominent: 'mb-8 pb-6',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ModernPageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | 'variant'
  | 'size'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onDragOver'
  | 'onAnimationStart'
  | 'onAnimationEnd'
> {
  /** ページタイトル */
  title?: string;
  /** ページの説明 */
  description?: string;
  /** アイコンコンポーネント */
  icon?: LucideIcon;
  /** バリアント */
  variant?: 'default' | 'minimal' | 'compact' | 'prominent';
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
  /** アニメーションを無効にするか */
  disableAnimation?: boolean;
  /** 戻るボタンを表示するか */
  showBackButton?: boolean;
  /** 戻るボタンのクリックハンドラー */
  onBackClick?: () => void;
}

/**
 * アニメーション設定
 */
const headerAnimations = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
} as const;

const iconAnimations = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut', delay: 0.1 },
  },
} as const;

const textAnimations = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut', delay: 0.15 },
  },
} as const;

export const ModernPageHeader = React.forwardRef<HTMLDivElement, ModernPageHeaderProps>(
  (
    {
      title,
      description,
      icon: IconComponent,
      variant = 'default',
      size = 'md',
      disableAnimation = false,
      showBackButton = false,
      onBackClick,
      className,
      ...props
    },
    ref
  ) => {
    // 戻るボタンのクリック処理
    const handleBackClick = () => {
      if (onBackClick) {
        onBackClick();
      } else {
        window.history.back();
      }
    };

    // アイコン要素
    const iconElement = IconComponent && (
      <motion.div
        className='flex items-center justify-center shrink-0'
        variants={disableAnimation ? {} : iconAnimations}
        initial={disableAnimation ? {} : 'initial'}
        animate={disableAnimation ? {} : 'animate'}
      >
        <IconComponent className='h-8 w-8 text-primary/80' />
      </motion.div>
    );

    // 戻るボタン要素
    const backButtonElement = showBackButton && (
      <motion.button
        onClick={handleBackClick}
        className='flex items-center justify-center p-2 rounded-md hover:bg-muted/50 transition-colors duration-150 mr-2'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label='戻る'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='text-muted-foreground'
        >
          <path d='m15 18-6-6 6-6' />
        </svg>
      </motion.button>
    );

    return (
      <motion.div
        ref={ref}
        className={cn(modernPageHeaderVariants({ variant, size }), className)}
        variants={disableAnimation ? {} : headerAnimations}
        initial={disableAnimation ? {} : 'initial'}
        animate={disableAnimation ? {} : 'animate'}
        exit={disableAnimation ? {} : 'exit'}
        {...props}
      >
        <div className='flex items-center gap-4'>
          {/* 戻るボタン */}
          {backButtonElement}

          {/* アイコン */}
          {iconElement}

          {/* テキストコンテンツ */}
          <motion.div
            className='flex-1 min-w-0'
            variants={disableAnimation ? {} : textAnimations}
            initial={disableAnimation ? {} : 'initial'}
            animate={disableAnimation ? {} : 'animate'}
          >
            {/* タイトル */}
            {title && (
              <h1 className='text-2xl sm:text-3xl font-bold text-foreground leading-tight truncate mb-1'>
                {title}
              </h1>
            )}

            {/* 説明 */}
            {description && (
              <p className='text-base text-muted-foreground leading-relaxed'>{description}</p>
            )}
          </motion.div>
        </div>

        {/* 装飾的なボーダー（prominentバリアントの場合） */}
        {variant === 'prominent' && (
          <motion.div
            className='absolute bottom-0 left-0 w-16 h-1 bg-primary rounded-full'
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
          />
        )}
      </motion.div>
    );
  }
);

ModernPageHeader.displayName = 'ModernPageHeader';
