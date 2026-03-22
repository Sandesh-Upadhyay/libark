'use client';

import { useMemo } from 'react';

import { LAYOUT_SIZES, BREAKPOINTS } from '@/lib/constants/layout';

/**
 * レイアウト設定を一元管理するフック
 *
 * アプリケーション全体で一貫したレイアウト設定を使用するために、
 * 幅やサイズなどの設定を一元管理します。
 */
export function useLayoutSettings() {
  return useMemo(
    () => ({
      // コンテンツの最大幅（統一定数から取得）
      content: LAYOUT_SIZES.content,

      // 投稿カード（600px固定）
      postCard: {
        maxWidth: 600,
        width: '100%',
        padding: {
          sm: '1rem 1.25rem', // sm以上の画面サイズでのパディング
          base: '1rem', // デフォルトのパディング
        },
      },

      // 投稿フォーム（600px固定）
      postForm: {
        maxWidth: 600,
        width: '100%',
        padding: {
          sm: '1rem 1.25rem', // sm以上の画面サイズでのパディング
          base: '0.75rem', // デフォルトのパディング
        },
      },

      // 画像グリッド（600px固定）
      imageGrid: {
        maxWidth: 600,
        width: '100%',
        aspectRatio: '4/3',
        minHeight: 200,
      },

      // サムネイル
      thumbnail: {
        size: 112,
        aspectRatio: '1/1',
        // 画像表示設定
        display: {
          preserveSize: true, // 元のサイズを保持（劣化防止）
          objectFit: 'contain', // 画像を切り抜かずに表示
          maxWidth: 1200, // サムネイルの最大幅（S3のサムネイルサイズに合わせる）
          useOriginalSize: true, // 元のサイズを使用
        },
      },

      // レスポンシブ設定
      // ブレークポイント（統一定数から取得）
      breakpoints: BREAKPOINTS,
    }),
    []
  );
}

// 静的な設定オブジェクト - フックに依存しない
export const LAYOUT_SETTINGS = {
  content: LAYOUT_SIZES.content,
  postCard: {
    maxWidth: 680,
    width: '100%',
    padding: {
      sm: '1rem 1.25rem',
      base: '1rem',
    },
  },
  postForm: {
    maxWidth: 680,
    width: '100%',
    padding: {
      sm: '1rem 1.25rem',
      base: '0.75rem',
    },
  },
  imageGrid: {
    maxWidth: 680,
    width: '100%',
    aspectRatio: '4/3',
    minHeight: 200,
  },
  thumbnail: {
    size: 112,
    aspectRatio: '1/1',
    // 画像表示設定
    display: {
      preserveSize: true, // 元のサイズを保持（劣化防止）
      objectFit: 'contain', // 画像を切り抜かずに表示
      maxWidth: 1200, // サムネイルの最大幅（S3のサムネイルサイズに合わせる）
      useOriginalSize: true, // 元のサイズを使用
    },
  },
  breakpoints: BREAKPOINTS,
};

// 静的な設定を取得するためのヘルパー関数
export function getLayoutSettings() {
  // 常に静的な設定を返す
  return LAYOUT_SETTINGS;
}
