/**
 * 🎯 メディアクエリフック
 *
 * レスポンシブデザインのためのメディアクエリ判定
 * モバイル/デスクトップの切り替えに使用
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * メディアクエリの状態を監視するフック
 *
 * @param query - メディアクエリ文字列 (例: '(max-width: 768px)')
 * @returns メディアクエリにマッチするかどうかのboolean値
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // サーバーサイドレンダリング対応
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // 初期値設定
    setMatches(mediaQuery.matches);

    // リスナー関数
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // イベントリスナー追加
    mediaQuery.addEventListener('change', handleChange);

    // クリーンアップ
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * モバイルデバイス判定フック
 *
 * @returns モバイルデバイスかどうかのboolean値
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * タブレットデバイス判定フック
 *
 * @returns タブレットデバイスかどうかのboolean値
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * デスクトップデバイス判定フック
 *
 * @returns デスクトップデバイスかどうかのboolean値
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}
