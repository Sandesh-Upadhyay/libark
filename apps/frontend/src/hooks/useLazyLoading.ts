/**
 * Performance Optimization Hooks
 *
 * パフォーマンス最適化のためのカスタムフック集
 *
 * 注意: 遅延読み込み機能は useIntersectionObserver を使用してください
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * リスト仮想化フック
 *
 * 大量のリストアイテムを効率的に表示するための仮想化
 */
interface UseVirtualizationOptions {
  /** アイテムの高さ */
  itemHeight: number;
  /** コンテナの高さ */
  containerHeight: number;
  /** バッファサイズ（表示範囲外でも描画するアイテム数） */
  buffer?: number;
}

export function useVirtualization<T>(items: T[], options: UseVirtualizationOptions) {
  const { itemHeight, containerHeight, buffer = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + buffer * 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

/**
 * デバウンス付きスクロールフック
 *
 * スクロールイベントのパフォーマンス最適化
 */
export function useOptimizedScroll(
  callback: (scrollY: number) => void,
  delay: number = 16 // 60fps
) {
  const [scrollY, setScrollY] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const newScrollY = window.scrollY;
      setScrollY(newScrollY);
      callback(newScrollY);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll]);

  return scrollY;
}
