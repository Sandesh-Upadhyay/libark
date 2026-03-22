/**
 * 🎯 完全統一画像表示コンポーネント
 *
 * 全ての画像表示用途（Post画像、アバター、カバー、Blob画像）に対応
 * URL生成、フォールバック処理、エラーハンドリングを完全統一
 */

'use client';

import React, { useState, useCallback } from 'react';

import { cn } from '@/lib/utils';
import {
  generateUnifiedImageUrl,
  createUnifiedImageSource,
  generateFallbackContent,
  type ImageVariant,
  type UnifiedImageSource,
  type FallbackConfig,
} from '@/lib/utils/imageUtils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';
import { Skeleton } from '@/components/atoms';

// ================================
// 型定義
// ================================

export interface ImageDisplayProps {
  /** 画像ソース（メディアID、URL、またはBlob URL） */
  src?: string | null;
  /** バリアント（メディアIDの場合） */
  variant?: ImageVariant;
  /** alt属性 */
  alt?: string;
  /** CSSクラス */
  className?: string;
  /** インラインスタイル */
  style?: React.CSSProperties;
  /** 幅 */
  width?: number | string;
  /** 高さ */
  height?: number | string;
  /** オブジェクトフィット */
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  /** 優先読み込み */
  priority?: boolean;
  /** フォールバック設定 */
  fallbackConfig?: FallbackConfig;
  /** カスタムプレースホルダー */
  placeholder?: React.ReactNode;
  /** 読み込み完了時のコールバック */
  onLoad?: () => void;
  /** エラー時のコールバック */
  onError?: (error: Error) => void;
  /** クリック時のコールバック */
  onClick?: () => void;
  /** ローディング状態の表示 */
  showLoading?: boolean;
  /** ラッパーdivを使用しない（親要素が位置制御する場合） */
  noWrapper?: boolean;
}

/**
 * 🎯 画像表示コンポーネント
 */
export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  variant,
  alt = '画像',
  className,
  style,
  width,
  height,
  objectFit = 'cover',
  priority = false,
  fallbackConfig,
  placeholder,
  onLoad,
  onError,
  onClick,
  showLoading = true,
  noWrapper = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 統一画像ソースの生成
  const imageSource: UnifiedImageSource = createUnifiedImageSource(src, variant);

  // 統一URL生成
  const imageUrl = generateUnifiedImageUrl(imageSource);

  // エラーハンドリング
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(new Error('画像の読み込みに失敗しました'));
    }
  }, [onError]);

  // 読み込み完了ハンドリング
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  // フォールバック内容の生成
  const fallbackContent = fallbackConfig
    ? generateFallbackContent(fallbackConfig)
    : generateFallbackContent({ type: 'default' });

  // 画像URLが存在しない場合またはエラーの場合
  if (!imageUrl || hasError) {
    return (
      <div
        className={cn('flex items-center justify-center', fallbackContent.className, className)}
        style={{ width, height }}
        onClick={onClick}
      >
        {placeholder || (
          <>
            {fallbackContent.type === 'text' && fallbackContent.content && (
              <span className='text-lg font-medium'>{fallbackContent.content}</span>
            )}
            {fallbackContent.type === 'placeholder' && (
              <span className='text-gray-400 text-sm'>{fallbackContent.message}</span>
            )}
            {fallbackContent.type === 'gradient' && <div className='w-full h-full' />}
          </>
        )}
      </div>
    );
  }

  // noWrapperが指定されている場合は、img要素のみを返す
  if (noWrapper) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{
          width,
          height,
          objectFit,
          ...style,
        }}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        draggable={false}
      />
    );
  }

  return (
    <div className='relative' style={{ width, height }}>
      {/* ローディング表示 */}
      {isLoading && showLoading && (
        <div className={`absolute inset-0 ${getComponentZIndexClass('PostImageContainer')}`}>
          <Skeleton className='w-full h-full' />
        </div>
      )}

      {/* 画像表示 */}
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{
          width,
          height,
          objectFit,
          ...style,
        }}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        draggable={false}
      />
    </div>
  );
};

export default ImageDisplay;
