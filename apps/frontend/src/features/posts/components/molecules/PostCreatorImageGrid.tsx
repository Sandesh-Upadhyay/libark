'use client';

import React from 'react';
import { X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


import { cn } from '@/lib/utils';
import { getComponentZIndexStyle, getComponentZIndexClass } from '@/lib/constants/z-index';
import { ImageDisplay } from '@/components/atoms';

import {
  PostCreatorImageGridErrorBoundary,
  ImageItemFallback,
} from './PostCreatorImageGridErrorBoundary';

// ImageSource, ImageCacheHook types are now handled internally

/**
 * 🎯 PostCreator専用の画像グリッドコンポーネント (Molecule)
 *
 * 責任:
 * - PostCreator専用のレイアウト（正方形サムネイル）
 * - ドラッグ&ドロップによる並べ替え
 * - 削除機能
 * - 軽量thumbバリアント使用
 *
 * 特徴:
 * - 常に正方形のサムネイル
 * - 小さなサイズ（h-20 sm:h-24）
 * - 最大4列グリッド
 * - ドラッグハンドル付き
 */

interface ImageSource {
  id: string;
  url: string;
  file?: File;
}

interface ImageCacheHook {
  getCachedUrl: (source: ImageSource) => string | null;
}

interface PostCreatorImageGridProps {
  sources: ImageSource[];
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  useExternalCache?: ImageCacheHook;
  className?: string;
}

/**
 * 🎯 ソート可能な画像アイテム
 */
interface SortableImageItemProps {
  source: ImageSource;
  index: number;
  onRemove: () => void;
  useExternalCache?: ImageCacheHook;
}

const SortableImageItem: React.FC<SortableImageItemProps> = ({ source, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `image-${index}`,
    animateLayoutChanges: () => false, // アニメーションを完全に無効化
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'none', // アニメーションを完全に無効化
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? getComponentZIndexStyle('PostImageDragHandle').zIndex : 'auto',
    scale: isDragging ? '1.02' : '1',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative group w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square'
      {...attributes}
    >
      <div
        {...listeners}
        className={`absolute top-1 left-1 ${getComponentZIndexClass('PostImageDragHandle')} opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-background/80 hover:bg-background rounded p-1`}
        aria-label='ドラッグして並べ替え'
      >
        <GripVertical className='h-3 w-3 text-foreground' />
      </div>

      <div className='relative w-full h-full rounded-lg overflow-hidden bg-muted'>
        <ImageDisplay
          src={
            ('url' in source && source.url.startsWith('blob:')
              ? source.url
              : 'mediaId' in source
                ? source.mediaId
                : '') as string
          }
          variant='thumb'
          alt={`画像 ${index + 1}`}
          className='absolute inset-0 w-full h-full object-cover'
          fallbackConfig={{ type: 'post' }}
          showLoading={false}
          noWrapper={true}
        />
      </div>

      <button
        onClick={onRemove}
        className={`absolute -top-1 -right-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${getComponentZIndexClass('PostImageDragHandle')} p-1`}
        aria-label={`画像 ${index + 1} を削除`}
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  );
};

/**
 * 🎯 PostCreator専用画像グリッド
 */
const PostCreatorImageGrid: React.FC<PostCreatorImageGridProps> = ({
  sources,
  onRemove,
  onReorder,
  useExternalCache,
  className,
}) => {
  // センサー設定（ドラッグ&ドロップ用）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動後にドラッグ開始
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ドラッグ終了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sources.findIndex((_, index) => `image-${index}` === active.id);
    const newIndex = sources.findIndex((_, index) => `image-${index}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // 即座に実行（アニメーション無効化により安全）
      onReorder(oldIndex, newIndex);
    }
  };

  if (sources.length === 0) {
    return null;
  }

  const imageItems = sources.map((source, index) => ({
    id: `image-${index}`,
    source,
    index,
  }));

  const DndContextComponent = DndContext;

  return (
    <DndContextComponent
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      autoScroll={false}
    >
      <SortableContext items={imageItems.map(item => item.id)} strategy={rectSortingStrategy}>
        <div className={cn('flex flex-wrap gap-2', className)}>
          {imageItems.map(item => (
            <PostCreatorImageGridErrorBoundary
              key={item.id}
              fallback={({ error }) => <ImageItemFallback error={error} />}
            >
              <SortableImageItem
                source={item.source}
                index={item.index}
                onRemove={() => onRemove(item.index)}
                useExternalCache={useExternalCache}
              />
            </PostCreatorImageGridErrorBoundary>
          ))}
        </div>
      </SortableContext>
    </DndContextComponent>
  );
};

export { PostCreatorImageGrid };
export type { PostCreatorImageGridProps };
