/**
 * 🎯 MediaGridContainer - メディアグリッドコンテナオーガニズムコンポーネント
 *
 * メディアグリッドの状態管理とデータ取得を行う高レベルコンポーネント
 * アトミックデザインに基づく複合コンポーネント
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';


import { cn } from '@/lib/utils';
import { usePosts } from '@/features/posts/hooks/usePosts';

import { MediaGrid, type MediaItem } from '../molecules/MediaGrid';

// ================================
// 型定義
// ================================

export interface MediaGridContainerProps {
  /** ユーザーID（特定ユーザーのメディアを表示する場合） */
  userId?: string;
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
  /** サムネイルサイズ（廃止予定 - グリッドサイズに自動調整） */
  thumbnailSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** アスペクト比 */
  aspectRatio?: 'square' | '4/3' | '16/9' | 'auto';
  /** 最大表示数 */
  maxItems?: number;
  /** 空状態のメッセージ */
  emptyMessage?: string;
  /** ホバー効果を有効にするか */
  enableHover?: boolean;
  /** 角丸設定 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** 無限スクロールを有効にするか */
  enableInfiniteScroll?: boolean;
  /** カスタムメディアクリックハンドラー */
  onMediaClick?: (mediaId: string, postId: string, index: number) => void;
}

// ================================
// ヘルパー関数
// ================================

/**
 * 投稿データからメディアアイテムを抽出
 */
const extractMediaItems = (
  posts: Array<{ id: string; media?: Array<MediaItem> }>
): Array<MediaItem & { postId: string }> => {
  const mediaItems: Array<MediaItem & { postId: string }> = [];

  posts.forEach(post => {
    if (post.media && Array.isArray(post.media)) {
      post.media.forEach((media: MediaItem) => {
        mediaItems.push({
          id: media.id,
          postId: post.id,
          variants: media.variants,
          alt: `${(post as { user?: { username?: string } }).user?.username || 'ユーザー'}の投稿メディア`,
        });
      });
    }
  });

  return mediaItems;
};

// ================================
// コンポーネント実装
// ================================

export const MediaGridContainer: React.FC<MediaGridContainerProps> = ({
  userId,
  className,
  columns = { sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 'md',
  thumbnailSize = 'md',
  aspectRatio = 'square',
  maxItems,
  emptyMessage = 'メディアがありません',
  enableHover = true,
  rounded = 'md',
  enableInfiniteScroll = false,
  onMediaClick,
}) => {
  const navigate = useNavigate();

  // メディア投稿データを取得
  const {
    posts,
    loading: isLoading,
    error,
    loadMore,
    hasNextPage,
  } = usePosts({
    userId,
    type: 'media',
    limit: 20,
  });

  const isError = !!error;

  // メディアアイテムを抽出
  const mediaItems = useMemo(() => {
    return extractMediaItems(posts);
  }, [posts]);

  // メディアクリックハンドラー
  const handleMediaClick = useCallback(
    (mediaId: string, index: number, event: React.MouseEvent) => {
      const mediaItem = mediaItems[index];
      if (!mediaItem) return;

      // カスタムハンドラーがある場合は優先
      if (onMediaClick) {
        onMediaClick(mediaId, mediaItem.postId, index);
        return;
      }

      // スムーズな遷移のためのアニメーション効果
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.95)';
      target.style.transition = 'transform 0.1s ease-out';

      // 短い遅延後に遷移を実行
      setTimeout(() => {
        navigate(`/posts/${mediaItem.postId}`);
      }, 100);
    },
    [mediaItems, onMediaClick, navigate]
  );

  // 無限スクロール処理
  const handleLoadMoreMedia = useCallback(() => {
    if (enableInfiniteScroll && hasNextPage && !isLoading) {
      loadMore();
    }
  }, [enableInfiniteScroll, hasNextPage, isLoading, loadMore]);

  // エラー状態
  if (isError) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className='text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center'>
            <div className='w-8 h-8 bg-destructive/20 rounded' />
          </div>
          <p className='text-destructive text-sm mb-2'>メディアの読み込みに失敗しました</p>
          <p className='text-muted-foreground text-xs'>
            {error?.message || '不明なエラーが発生しました'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MediaGrid
        items={mediaItems}
        columns={columns}
        gap={gap}
        thumbnailSize={thumbnailSize}
        aspectRatio={aspectRatio}
        onMediaClick={handleMediaClick}
        maxItems={maxItems}
        emptyMessage={emptyMessage}
        isLoading={isLoading}
        enableHover={enableHover}
        rounded={rounded}
      />

      {/* 無限スクロール用のロードモアボタン */}
      {enableInfiniteScroll && hasNextPage && !isLoading && (
        <div className='flex justify-center mt-6'>
          <button
            onClick={handleLoadMoreMedia}
            className='px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors'
          >
            さらに読み込む
          </button>
        </div>
      )}

      {/* ローディング表示（無限スクロール時） */}
      {enableInfiniteScroll && isLoading && mediaItems.length > 0 && (
        <div className='flex justify-center mt-6'>
          <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
        </div>
      )}
    </div>
  );
};

// ================================
// デフォルトエクスポート
// ================================

export default MediaGridContainer;

// ================================
// 型エクスポート
// ================================

// MediaGridContainerPropsは既にinterfaceでエクスポート済み
