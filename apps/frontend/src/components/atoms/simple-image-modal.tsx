'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { X } from 'lucide-react';

import { ImageDisplay } from '@/components/atoms';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';

interface SimpleImageModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** 閉じる時のコールバック */
  onClose: () => void;
  /** 表示する画像のメディアIDリスト */
  mediaIds: string[];
  /** 初期表示する画像のインデックス */
  initialIndex?: number;
  /** 画像の代替テキストのプレフィックス */
  altPrefix?: string;
}

/**
 * 画像ギャラリーモーダルコンポーネント
 *
 * 特徴:
 * - 複数画像のギャラリー表示
 * - キーボード操作（←→キーで切り替え、ESCで閉じる）
 * - 目立たないナビゲーションボタン
 * - 現在位置インジケーター
 * - シンプルなHTML構造
 * - レスポンシブ対応
 */
export const SimpleImageModal: React.FC<SimpleImageModalProps> = ({
  isOpen,
  onClose,
  mediaIds,
  initialIndex = 0,
  altPrefix = '画像',
}) => {
  // 現在表示中の画像インデックス
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // 画像の読み込み状態管理
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // モーダルが開くたびに読み込み状態をリセット
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsImageLoaded(false);
    }
  }, [isOpen, initialIndex]);

  // 画像が変更されるたびに読み込み状態をリセット
  useEffect(() => {
    setIsImageLoaded(false);
  }, [currentIndex]);

  // キーボードイベントの処理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 前の画像に移動
  const goToPrevious = () => {
    if (mediaIds.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + mediaIds.length) % mediaIds.length);
  };

  // 次の画像に移動
  const goToNext = () => {
    if (mediaIds.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % mediaIds.length);
  };

  // 画像読み込み完了時のハンドラー
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  if (!isOpen || mediaIds.length === 0) return null;

  const currentMediaId = mediaIds[currentIndex];
  const hasMultipleImages = mediaIds.length > 1;

  return createPortal(
    <div
      className={`fixed inset-0 ${getComponentZIndexClass('SimpleImageModal')} bg-black/80 flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className='relative flex items-center justify-center w-full h-full'
        onClick={e => e.stopPropagation()}
      >
        {/* 画像表示領域 */}
        <div className='relative max-w-full max-h-full flex items-center justify-center'>
          <ImageDisplay
            src={currentMediaId}
            variant='large'
            alt={`${altPrefix} ${currentIndex + 1}/${mediaIds.length}`}
            className='max-w-screen max-h-screen object-contain'
            priority={true}
            fallbackConfig={{ type: 'post' }}
            showLoading={false}
            noWrapper={true}
            onLoad={handleImageLoad}
          />
        </div>

        {/* 左ナビゲーションボタン */}
        {hasMultipleImages && isImageLoaded && (
          <button
            onClick={goToPrevious}
            className={cn(
              `absolute left-4 top-1/2 -translate-y-1/2 ${getComponentZIndexClass('ImageModalControls')}`,
              'bg-black/20 hover:bg-black/40 text-white rounded-full p-2',
              'opacity-0 hover:opacity-100 transition-opacity duration-200',
              'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label='前の画像'
          >
            <ChevronLeft className='h-6 w-6' />
          </button>
        )}

        {/* 右ナビゲーションボタン */}
        {hasMultipleImages && isImageLoaded && (
          <button
            onClick={goToNext}
            className={cn(
              `absolute right-4 top-1/2 -translate-y-1/2 ${getComponentZIndexClass('ImageModalControls')}`,
              'bg-black/20 hover:bg-black/40 text-white rounded-full p-2',
              'opacity-0 hover:opacity-100 transition-opacity duration-200',
              'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label='次の画像'
          >
            <ChevronRight className='h-6 w-6' />
          </button>
        )}

        {/* 現在位置インジケーター */}
        {hasMultipleImages && isImageLoaded && (
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${getComponentZIndexClass('ImageModalDots')}`}
          >
            <div className='bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium'>
              {currentIndex + 1} / {mediaIds.length}
            </div>
          </div>
        )}

        {/* 画像インデックスドット */}
        {hasMultipleImages && mediaIds.length <= 5 && isImageLoaded && (
          <div
            className={`absolute bottom-16 left-1/2 -translate-x-1/2 ${getComponentZIndexClass('ImageModalDots')} flex space-x-2`}
          >
            {mediaIds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors duration-200',
                  index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                )}
                aria-label={`画像 ${index + 1} に移動`}
              />
            ))}
          </div>
        )}

        {/* 画像がロードされてから×ボタンを表示 */}
        {isImageLoaded && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 opacity-70 hover:opacity-100'
            onClick={onClose}
            aria-label='モーダルを閉じる'
          >
            <X className='h-5 w-5' />
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
};
