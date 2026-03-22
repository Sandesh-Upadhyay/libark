'use client';

import React from 'react';

import { cn } from '@/lib/utils';

// ================================
// 基本スケルトンコンポーネント
// ================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'image';
  width?: number | string;
  height?: number | string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | 'auto';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', width, height, aspectRatio, style, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'text':
          return 'rounded-sm h-4';
        case 'circular':
          return 'rounded-full';
        case 'image':
          return 'rounded-lg';
        default:
          return 'rounded-md';
      }
    };

    // アスペクト比のクラスを取得
    const getAspectRatioClass = () => {
      switch (aspectRatio) {
        case '1:1':
          return 'aspect-square';
        case '4:3':
          return 'aspect-[4/3]';
        case '16:9':
          return 'aspect-video';
        default:
          return '';
      }
    };

    const inlineStyles = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-muted',
          getVariantStyles(),
          getAspectRatioClass(),
          className
        )}
        style={inlineStyles}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ================================
// 画像専用スケルトンコンポーネント
// ================================

interface ImageSkeletonProps extends Omit<SkeletonProps, 'variant'> {
  shape?: 'rectangle' | 'circle' | 'square';
}

const ImageSkeleton = React.forwardRef<HTMLDivElement, ImageSkeletonProps>(
  ({ shape = 'rectangle', aspectRatio = '16:9', className, ...props }, ref) => {
    // 形状に基づいてバリアントを決定
    const getVariant = () => {
      switch (shape) {
        case 'circle':
          return 'circular';
        case 'square':
        case 'rectangle':
        default:
          return 'image';
      }
    };

    // 正方形・円形の場合はアスペクト比を1:1に設定
    const finalAspectRatio = shape === 'square' || shape === 'circle' ? '1:1' : aspectRatio;

    return (
      <Skeleton
        ref={ref}
        variant={getVariant()}
        aspectRatio={finalAspectRatio}
        className={className}
        {...props}
      />
    );
  }
);

ImageSkeleton.displayName = 'ImageSkeleton';

// ================================
// 便利なプリセットコンポーネント
// ================================

/**
 * アバター用スケルトン
 */
const AvatarSkeleton: React.FC<Omit<ImageSkeletonProps, 'shape' | 'aspectRatio'>> = props => (
  <ImageSkeleton shape='circle' {...props} />
);

/**
 * カバー画像用スケルトン
 */
const CoverSkeleton: React.FC<Omit<ImageSkeletonProps, 'shape' | 'aspectRatio'>> = props => (
  <ImageSkeleton shape='rectangle' aspectRatio='16:9' {...props} />
);

/**
 * 投稿画像用スケルトン
 */
const PostImageSkeleton: React.FC<Omit<ImageSkeletonProps, 'shape'>> = props => (
  <ImageSkeleton shape='rectangle' {...props} />
);

/**
 * サムネイル用スケルトン
 */
const ThumbnailSkeleton: React.FC<Omit<ImageSkeletonProps, 'shape' | 'aspectRatio'>> = props => (
  <ImageSkeleton shape='square' {...props} />
);

export {
  Skeleton,
  ImageSkeleton,
  AvatarSkeleton,
  CoverSkeleton,
  PostImageSkeleton,
  ThumbnailSkeleton,
};
