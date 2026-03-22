/**
 * 🎯 MediaGrid - メディアグリッド表示モレキュールコンポーネント
 *
 * 複数のMediaThumbnailを配置するレスポンシブグリッドレイアウト
 * アトミックデザインに基づく中間レベルのコンポーネント
 */

import React from 'react';

import { cn } from '@/lib/utils';
import { MediaThumbnail } from '@/components/atoms';

// ================================
// 型定義
// ================================

export interface MediaItem {
  id: string;
  variants?: Array<{
    id: string;
    type: string;
    s3Key: string;
    width?: number;
    height?: number;
    fileSize?: number;
    quality?: number;
    url?: string;
  }>;
  alt?: string;
}

export interface MediaGridProps {
  /** メディアアイテムの配列 */
  items: MediaItem[];
  /** カスタムクラス名 */
  className?: string;
  /** グリッドカラム数（レスポンシブ対応） */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** グリッド間隔 */
  gap?: 'sm' | 'md' | 'lg';
  /** サムネイルサイズ */
  thumbnailSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** アスペクト比 */
  aspectRatio?: 'square' | '4/3' | '16/9' | 'auto';
  /** メディアクリックハンドラー */
  onMediaClick?: (mediaId: string, index: number, event: React.MouseEvent) => void;
  /** 最大表示数 */
  maxItems?: number;
  /** 空状態のメッセージ */
  emptyMessage?: string;
  /** ローディング状態 */
  isLoading?: boolean;
  /** ホバー効果を有効にするか */
  enableHover?: boolean;
  /** 角丸設定 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

// ================================
// スタイルバリアント
// ================================

const gapVariants = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const getGridColumnsClass = (columns: MediaGridProps['columns']) => {
  const { sm = 2, md = 3, lg = 4, xl = 5 } = columns || {};

  // Tailwindの動的クラス名を確実に生成するため、明示的にマッピング
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return cn(
    colsMap[sm] || 'grid-cols-2',
    `sm:${colsMap[md] || 'grid-cols-3'}`,
    `md:${colsMap[lg] || 'grid-cols-4'}`,
    `lg:${colsMap[xl] || 'grid-cols-5'}`
  );
};

// ================================
// コンポーネント実装
// ================================

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  className,
  columns,
  gap = 'md',
  thumbnailSize: _thumbnailSize = 'md',
  aspectRatio = 'square',
  onMediaClick,
  maxItems,
  emptyMessage = 'メディアがありません',
  isLoading = false,
  enableHover = true,
  rounded = 'md',
}) => {
  // 表示するアイテムを制限
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const remainingCount = maxItems && items.length > maxItems ? items.length - maxItems : 0;

  // メディアクリックハンドラー
  const _handleMediaClick = (mediaId: string, index: number) => {
    return (event: React.MouseEvent) => {
      if (onMediaClick) {
        onMediaClick(mediaId, index, event);
      }
    };
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className={cn('grid', getGridColumnsClass(columns), gapVariants[gap], className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'bg-muted animate-pulse',
              aspectRatio === 'square' && 'aspect-square',
              aspectRatio === '4/3' && 'aspect-[4/3]',
              aspectRatio === '16/9' && 'aspect-video',
              rounded === 'sm' && 'rounded-sm',
              rounded === 'md' && 'rounded-md',
              rounded === 'lg' && 'rounded-lg',
              rounded === 'full' && 'rounded-full'
            )}
          />
        ))}
      </div>
    );
  }

  // 空状態
  if (displayItems.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center'>
            <div className='w-8 h-8 bg-muted-foreground/20 rounded' />
          </div>
          <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid', getGridColumnsClass(columns), gapVariants[gap], className)}>
      {displayItems.map((item, index) => (
        <div key={item.id} className='relative w-full'>
          <MediaThumbnail
            mediaId={item.id}
            // variants={item.variants} // variantsプロパティが存在しないためコメントアウト
            alt={item.alt || `メディア ${index + 1}`}
            className='w-full h-full'
            aspectRatio={aspectRatio}
            onClick={
              onMediaClick
                ? (mediaId: string, event: React.MouseEvent) => {
                    onMediaClick(mediaId, index, event);
                  }
                : undefined
            }
            enableHover={enableHover}
            priority={index < 4} // 最初の4つを優先読み込み
            rounded={rounded}
          />

          {/* 残り枚数表示（最後のアイテムの場合） */}
          {remainingCount > 0 && index === displayItems.length - 1 && (
            <div className='absolute inset-0 bg-black/60 flex items-center justify-center rounded-md'>
              <span className='text-white text-lg font-semibold'>+{remainingCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ================================
// デフォルトエクスポート
// ================================

export default MediaGrid;

// ================================
// 型エクスポート
// ================================

// MediaGridPropsとMediaItemは既にinterfaceでエクスポート済み
