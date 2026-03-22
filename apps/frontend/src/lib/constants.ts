'use client';

/**
 * アプリケーション全体で使用する定数を定義するモジュール
 */

// サムネイルサイズ
export const THUMBNAIL_SIZE = {
  width: 112,
  height: 112,
};

// ポストイメージグリッドのサイズ
export const POST_IMAGE_GRID_SIZE = {
  // グリッド全体のサイズ（4:3のアスペクト比）
  container: {
    width: 800,
    height: 600,
    aspectRatio: '4/3',
  },
  // 1枚の画像の場合（4:3のアスペクト比）
  single: {
    width: 800,
    height: 600,
    aspectRatio: '4/3',
  },
  // 複数画像の場合
  multiple: {
    // 2枚の場合（左右に配置）
    two: {
      width: 400,
      height: 600,
      aspectRatio: '2/3', // 縦長
    },
    // 3枚の場合（左1枚、右上下2枚）
    three: {
      left: {
        width: 400,
        height: 600,
        aspectRatio: '2/3', // 縦長
      },
      right: {
        width: 400,
        height: 300,
        aspectRatio: '4/3', // 横長
      },
    },
    // 4枚の場合（2x2グリッド）
    four: {
      width: 400,
      height: 300,
      aspectRatio: '4/3', // 横長
    },
  },
};

// ローディングインジケーターのサイズ
export const LOADING_INDICATOR_SIZE = {
  default: {
    width: 24,
    height: 24,
  },
  small: {
    width: 16,
    height: 16,
  },
  large: {
    width: 32,
    height: 32,
  },
};

// 画像処理のポーリング間隔（WebSocketサブスクリプション使用のため削除）
// export const IMAGE_PROCESSING_POLLING_INTERVAL = 5000; // 5秒 - WebSocketで代替

// 画像処理の最大リトライ回数
export const IMAGE_PROCESSING_MAX_RETRIES = 20;

// 画像処理の最大処理時間（ミリ秒）
export const IMAGE_PROCESSING_MAX_TIME = 5 * 60 * 1000; // 5分
