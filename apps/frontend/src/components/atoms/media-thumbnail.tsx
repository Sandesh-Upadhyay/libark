/**
 * 🎯 MediaThumbnail - メディアサムネイル表示アトムコンポーネント
 *
 * アトミックデザインに基づく最小単位のメディア表示コンポーネント
 * 統一されたサムネイル表示とクリックハンドリングを提供
 */

import React from 'react';

import { cn } from '@/lib/utils';
import { ImageDisplay } from '@/components/atoms';
import { Skeleton } from '@/components/atoms';

// ================================
// 型定義
// ================================

export interface MediaThumbnailProps {
  /** メディアID */
  mediaId: string;
  /** 代替テキスト */
  alt?: string;
  /** カスタムクラス名 */
  className?: string;
  /** サムネイルサイズ */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** アスペクト比 */
  aspectRatio?: 'square' | '4/3' | '16/9' | 'auto';
  /** クリックハンドラー */
  onClick?: (mediaId: string, event: React.MouseEvent) => void;
  /** ホバー効果を有効にするか */
  enableHover?: boolean;
  /** 読み込み優先度 */
  priority?: boolean;
  /** 角丸設定 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

// ================================
// スタイルバリアント
// ================================

const sizeVariants = {
  sm: '', // 親コンテナのサイズに従う
  md: '', // 親コンテナのサイズに従う
  lg: '', // 親コンテナのサイズに従う
  xl: '', // 親コンテナのサイズに従う
};

const aspectRatioVariants = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-video',
  auto: '',
};

const roundedVariants = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

// ================================
// コンポーネント実装
// ================================

export const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  mediaId,
  alt = 'メディアサムネイル',
  className,
  size = 'md',
  aspectRatio = 'square',
  onClick,
  enableHover = true,
  priority = false,
  rounded = 'md',
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if (onClick) {
      event.preventDefault();
      event.stopPropagation();
      onClick(mediaId, event);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick) {
      event.preventDefault();
      handleClick(event as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  return (
    <div
      className={cn(
        // 基本スタイル
        'relative overflow-hidden bg-muted',
        // サイズ
        sizeVariants[size],
        // アスペクト比
        aspectRatioVariants[aspectRatio],
        // 角丸
        roundedVariants[rounded],
        // インタラクティブスタイル
        onClick && [
          'cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          enableHover && 'hover:opacity-90 transition-opacity duration-200',
        ],
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${alt}をクリックして詳細を表示` : alt}
    >
      <ImageDisplay
        src={mediaId}
        variant='thumb'
        alt={alt}
        className='w-full h-full object-cover'
        priority={priority}
        placeholder={<Skeleton className='w-full h-full' />}
        fallbackConfig={{ type: 'post' }}
        showLoading={false}
        noWrapper={true}
        onError={(error: Error) => {
          console.warn('MediaThumbnail画像読み込みエラー:', error);
        }}
      />

      {/* オーバーレイ効果（ホバー時） */}
      {onClick && enableHover && (
        <div className='absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200' />
      )}
    </div>
  );
};

// ================================
// デフォルトエクスポート
// ================================

export default MediaThumbnail;

// ================================
// 型エクスポート
// ================================

// MediaThumbnailPropsは既にinterfaceでエクスポート済み
