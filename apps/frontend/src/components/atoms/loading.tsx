import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';


import { cn } from '@/lib/utils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';
import { DESIGN_COLORS } from '@/lib/constants/design-system';

import { Skeleton } from './skeleton';

// ローディングスピナーのバリエーション
const loadingVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      default: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    },
    variant: {
      default: 'text-primary',
      muted: 'text-muted-foreground',
      white: 'text-white',
      success: 'text-success',
      warning: 'text-warning',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

// ローディングスピナー
interface LoadingSpinnerProps extends VariantProps<typeof loadingVariants> {
  className?: string;
}

export function LoadingSpinner({ size, variant, className }: LoadingSpinnerProps) {
  return <Loader2 className={cn(loadingVariants({ size, variant }), className)} />;
}

// ブランドローディング（SVGロゴ使用）
interface BrandLoadingProps extends VariantProps<typeof loadingVariants> {
  className?: string;
}

export function BrandLoading({ size, variant, className }: BrandLoadingProps) {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 128 128'
      className={cn(
        size === 'xs' && 'w-3 h-3',
        size === 'sm' && 'w-4 h-4',
        size === 'default' && 'w-6 h-6',
        size === 'lg' && 'w-8 h-8',
        size === 'xl' && 'w-12 h-12',
        variant === 'default' && 'text-primary',
        variant === 'muted' && 'text-muted-foreground',
        variant === 'white' && 'text-white',
        variant === 'success' && 'text-success',
        variant === 'warning' && 'text-warning',
        variant === 'destructive' && 'text-destructive',
        className
      )}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        style={{ fill: DESIGN_COLORS.special.loadingPrimary }}
        d='M92.5,40.32c-11.99-.77-22.97,4.71-29.86,13.7,11.13,7.18,18.15,20.01,17.23,34.17-.46,7.07-2.83,13.55-6.58,18.98,4.36,2.45,9.31,3.98,14.62,4.33,19.28,1.24,35.94-13.68,37.2-33.34,1.27-19.65-13.34-36.59-32.62-37.84Z'
      />
      <circle
        style={{ fill: DESIGN_COLORS.special.loadingSecondary }}
        cx='40.72'
        cy='90.25'
        r='37.75'
      />
      <path
        style={{ fill: DESIGN_COLORS.special.loadingPrimary }}
        d='M63.83,60.8c4.54,6.68,3.2,14.35-.52,21.89-2.09,4.24-2.98,11.38-7.47,13.58-.86.42-.29,1.51-.64,2.4-.6,1.51-2.51,2.37-4.31,3.28-1.68.84-7.05-.51-7.67,1.44-1.04,3.24-3.77-.48-5.31.64-6.03,4.4-10.35-5.43-18.82-4.32-4.5.59-16.07-4.21-14.77-16.38,0,0-2.19,1.44-1.27,10.85s7.75,23.79,20.66,29.51c12.91,5.72,29.33,7.93,45.74-9.04,16.42-16.97,5.17-41.29,4.49-42.61-3.12-6.03-11.48-13.3-10.09-11.24Z'
      />
      <path
        style={{ fill: DESIGN_COLORS.special.loadingTertiary }}
        d='M57.91,97.96c-2.08,7.03-15.11,9.72-16.06,13.26-2.24,8.31-6.68,10.31-8.99,5.75-1.73-3.4-2.84-12.5-12.82-7.03-8.16,4.47-12.23-15.1-12.23-15.1,0,0,2.72,2.72,13.78,4.15,5.01.65,8.16,5.31,13.14,5.35,4.31.04,6.68-2.55,11.03-2.24,8.79.64,8.51-5.39,11.03-9.35,3.22-5.07,8.15-12.86,8.15-12.86,0,0-5.33,12.32-7.03,18.06Z'
      />
      <path
        style={{ fill: DESIGN_COLORS.special.loadingPrimary }}
        d='M94.94,40.94c-11.56-1.97-35.66-7.13-37.38-17.71s21.89-1.72,23.85-13.28c2.44-14.31-28.04-10.82-41.07-4.18-13.03,6.64-22.28,13.26-23.36,21.89-.74,5.9,3.2,15.25,17.21,2.46,14.02-12.79,18.44-6.39,14.76,3.2-3.69,9.59-9.16,15.86-9.16,15.86,0,0,11.07-2.21,17.52,3.69,0,0-2.95-8.73-.49-15.37s11.21,5.64,5.82,16.52c-1.69,3.43,32.3-13.08,32.3-13.08Z'
      />
    </svg>
  );
}

// フルページローディング
interface FullPageLoadingProps {
  title?: string;
  description?: string;
  variant?: 'spinner' | 'brand';
}

export function FullPageLoading({
  title = '読み込み中...',
  description,
  variant = 'brand',
}: FullPageLoadingProps) {
  const LoadingIcon = variant === 'brand' ? BrandLoading : LoadingSpinner;

  return (
    <div className='min-h-screen bg-background flex items-center justify-center'>
      <div className='flex flex-col items-center space-y-4 text-center'>
        <div className='relative'>
          <div className='absolute -inset-2 bg-primary/20 rounded-full blur-lg opacity-70' />
          <div className='relative bg-card rounded-full shadow-lg'>
            <LoadingIcon size='xl' />
          </div>
        </div>
        <div className='space-y-2'>
          <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
          {description && <p className='text-sm text-muted-foreground max-w-sm'>{description}</p>}
        </div>
      </div>
    </div>
  );
}

// インラインローディング
interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'spinner' | 'brand';
}

export function InlineLoading({
  text = '読み込み中',
  size = 'default',
  variant = 'spinner',
}: InlineLoadingProps) {
  const LoadingIcon = variant === 'brand' ? BrandLoading : LoadingSpinner;
  const sizeMap = {
    sm: { icon: 'sm' as const, text: 'text-sm' },
    default: { icon: 'default' as const, text: 'text-base' },
    lg: { icon: 'lg' as const, text: 'text-lg' },
  };

  return (
    <div className='flex items-center gap-2 text-muted-foreground'>
      <LoadingIcon size={sizeMap[size].icon} />
      <span className={sizeMap[size].text}>{text}</span>
    </div>
  );
}

// プログレスバー
interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function ProgressBar({
  value,
  className,
  showPercentage = false,
  size = 'default',
}: ProgressBarProps) {
  const sizeMap = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className='w-full space-y-1'>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeMap[size], className)}>
        <div
          className='h-full progress-bar-animated rounded-full'
          style={{ '--progress-width': `${clampedValue}%` } as React.CSSProperties}
        />
      </div>
      {showPercentage && (
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>進行状況</span>
          <span>{clampedValue}%</span>
        </div>
      )}
    </div>
  );
}

// カードスケルトン（投稿用）
export function PostSkeleton() {
  return (
    <div className='card space-y-4'>
      <div className='flex'>
        <Skeleton variant='default' width={40} height={40} className='rounded-full' />
        <div className='flex-1 space-y-2 ml-4'>
          <Skeleton variant='text' width='30%' height={16} />
          <Skeleton variant='text' width='20%' height={14} />
        </div>
      </div>
      <div className='space-y-2'>
        <Skeleton variant='text' width='100%' height={20} />
        <Skeleton variant='text' width='90%' height={20} />
        <Skeleton variant='text' width='75%' height={20} />
      </div>
      <Skeleton variant='default' width='100%' height={200} className='rounded-lg' />
      <div className='flex justify-between'>
        <Skeleton variant='text' width={80} height={32} className='rounded-md' />
        <Skeleton variant='text' width={80} height={32} className='rounded-md' />
      </div>
    </div>
  );
}

// ナビゲーションスケルトン（全体）
export function NavigationSkeleton() {
  return (
    <div
      className={`fixed top-0 left-0 right-0 ${getComponentZIndexClass('Navigation')} border-b border-border bg-background/70 backdrop-blur-xl`}
    >
      <div className='container-custom flex justify-between items-center h-16'>
        <Skeleton variant='default' width={120} height={32} className='rounded-lg' />
        <div className='flex items-center space-x-2'>
          <Skeleton variant='default' width={100} height={32} className='rounded-lg' />
          <Skeleton variant='default' width={32} height={32} className='rounded-full' />
        </div>
      </div>
    </div>
  );
}

// ナビゲーション右側部分のスケルトン（初期化中用）
export function NavigationRightSkeleton() {
  return (
    <div className='flex items-center space-x-2'>
      <Skeleton variant='default' width={100} height={32} className='rounded-lg' />
      <Skeleton variant='default' width={32} height={32} className='rounded-full' />
    </div>
  );
}

// グリッドスケルトン（リスト用）
interface GridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
}

export function GridSkeleton({ count = 6, columns = 1 }: GridSkeletonProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid space-y-6', gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
