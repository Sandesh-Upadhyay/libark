/**
 * 🎯 投稿画像表示コンポーネント (Molecule)
 *
 * 設計原則:
 * - レスポンシブグリッドレイアウト
 * - 効率的な画像読み込み
 * - アクセシビリティ対応
 * - Paid画像表示対応
 * - アトミックデザイン原則に基づく配置
 */

import React, { useCallback, useMemo } from 'react';
import type { PostInfoFragment } from '@libark/graphql-client';
import { useAuth } from '@libark/graphql-client';

import { ImageDisplay, Skeleton } from '@/components/atoms';

interface PostImageDisplayProps {
  post: PostInfoFragment;
  onImageClick?: (index: number, e?: React.MouseEvent) => void;
  onInteractiveClick?: (e: React.MouseEvent) => void;
}

/**
 * 投稿画像表示コンポーネント (Molecule)
 *
 * 責任:
 * - 投稿に関連する画像の表示
 * - レスポンシブグリッドレイアウト
 * - Paid投稿の画像ブラー処理
 * - 画像クリックイベントの処理
 */
export const PostImageDisplay: React.FC<PostImageDisplayProps> = ({
  post,
  onImageClick,
  onInteractiveClick,
}) => {
  const { user: currentUser } = useAuth();

  // 自分の投稿かどうかの判定
  const isOwnPost = currentUser?.id === (post as any).user?.id;
  const isPaidPost = post.visibility === 'PAID';

  // 画像クリック処理
  const handleImageClick = useCallback(
    (media: any, index: number) => (e: React.MouseEvent) => {
      if (onInteractiveClick) {
        onInteractiveClick(e);
      }
      if (onImageClick) {
        onImageClick(index, e);
      }
    },
    [onImageClick, onInteractiveClick]
  );

  // グリッドクラスの決定
  const getGridClass = useMemo(() => {
    if (!post.media || post.media.length === 0) return '';

    switch (post.media.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 grid-rows-2';
      case 4:
      default:
        return 'grid-cols-2 grid-rows-2';
    }
  }, [post.media]);

  // 画像が存在しない場合は何も表示しない
  if (!post.media || post.media.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-2 ${getGridClass} mt-3`} data-testid='post-image'>
      {post.media.slice(0, 4).map((mediaItem, index) => {
        return (
          <div
            key={mediaItem.id}
            className={`
              relative overflow-hidden rounded-lg bg-muted cursor-pointer
              hover:opacity-90 transition-opacity
              ${post.media!.length === 3 && index === 0 ? 'row-span-2' : ''}
            `}
            onClick={handleImageClick(mediaItem, index)}
          >
            <ImageDisplay
              src={mediaItem.id}
              variant={isPaidPost && !isOwnPost ? 'blur' : 'medium'} // 他人のPaid投稿のみblur、それ以外はmedium
              alt={`投稿画像 ${index + 1}`}
              className='w-full h-full'
              style={isPaidPost && !isOwnPost ? { filter: 'blur(24px)' } : undefined} // Paid投稿で自分の投稿でない場合のみblurフィルター適用
              priority={index === 0} // 最初の画像のみ優先読み込み
              placeholder={<Skeleton className='w-full h-full' />}
              showLoading={true}
            />

            {/* 複数画像の場合の残り枚数表示 */}
            {index === 3 && post.media!.length > 4 && (
              <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                <span className='text-white text-lg font-semibold'>+{post.media!.length - 4}</span>
              </div>
            )}

            {/* Paid投稿の場合のオーバーレイ */}
            {isPaidPost && !isOwnPost && (
              <div className='absolute inset-0 bg-black/30 flex items-center justify-center'>
                <div className='bg-white/90 rounded-lg px-3 py-1'>
                  <span className='text-sm font-medium text-gray-900'>有料コンテンツ</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
