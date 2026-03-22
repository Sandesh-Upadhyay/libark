/**
 * 🎯 フロントエンド設定
 *
 * ブラウザ環境での統一設定を提供
 * バックエンドと同じ設定システムを使用
 */

import { envUtils } from './environment-strategy.js';
import { UPLOAD_CONSTANTS, SUPPORTED_IMAGE_FORMATS } from './constants.js';

// ブラウザ環境の型定義
declare global {
  interface Window {
    __NEXT_DATA__?: {
      runtimeConfig?: Record<string, string>;
    };
  }
}

/**
 * 🔧 URL生成ヘルパー
 */
function buildUrl(baseUrl: string, path: string = ''): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

/**
 * 🎯 フロントエンド設定の取得
 */
export function getFrontendConfig() {
  // 環境戦略を使用して環境判定
  const isServer = envUtils.isServer();

  // 基本URL設定
  const backendUrl = isServer
    ? envUtils.getEnvVar('NEXT_PUBLIC_BACKEND_URL_INTERNAL') || 'http://backend:8000' // Docker内部ネットワーク用
    : envUtils.getEnvVar('NEXT_PUBLIC_BACKEND_URL') || 'http://localhost:8000'; // ブラウザ用

  const frontendUrl = envUtils.getEnvVar('NEXT_PUBLIC_FRONTEND_URL') || 'http://localhost:3000';
  const wsPath = envUtils.getEnvVar('NEXT_PUBLIC_WEBSOCKET_PATH') || '/graphql';
  const mediaUrl =
    envUtils.getEnvVar('NEXT_PUBLIC_MEDIA_URL') || 'https://libark.sgp1.digitaloceanspaces.com';

  // API URLの生成（常にbackendUrl + /apiを使用）
  const apiUrl = buildUrl(backendUrl, '/api');

  // GraphQLサブスクリプション URLの生成（クライアントサイドでは localhost を使用）
  const wsUrl = isServer
    ? backendUrl
    : envUtils.getEnvVar('NEXT_PUBLIC_BACKEND_URL') || 'http://localhost:8000';
  const wsFullUrl = `${wsUrl}${wsPath}`;

  // 環境判定（envUtilsを使用）
  const nodeEnv = envUtils.getNodeEnv();
  const isDevelopment = envUtils.isDevelopment();
  const isProduction = envUtils.isProduction();

  return {
    // 基本URL
    backendUrl,
    frontendUrl,
    apiUrl,

    // GraphQLサブスクリプション設定
    wsUrl,
    wsPath,
    wsFullUrl,

    // メディア設定（統一定数を使用）
    mediaUrl,
    media: {
      maxFileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES, // 統一定数を使用
      allowedImageTypes: SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES,
      allowedVideoTypes: ['video/mp4', 'video/webm'] as const,
      maxImageDimension: 4096,
      compressionQuality: 0.8,
    },

    // 環境設定
    nodeEnv,
    isDevelopment,
    isProduction,
    debug: isDevelopment,

    // 設定概要（デバッグ用）
    getConfigSummary() {
      return {
        backendUrl,
        frontendUrl,
        apiUrl,
        wsUrl,
        wsPath,
        wsFullUrl,
        mediaUrl,
        nodeEnv,
        isDevelopment,
        isProduction,
        debug: isDevelopment,
      };
    },
  } as const;
}

/**
 * 🎯 メディアクライアント用設定
 */
export function getMediaClientConfig() {
  const config = getFrontendConfig();
  return {
    apiBaseUrl: config.backendUrl,
    wsEndpoint: config.wsUrl,
    mediaBaseUrl: config.mediaUrl,
  };
}

/**
 * 🎯 WebSocketクライアント用設定
 */
export function getWebSocketClientConfig() {
  const config = getFrontendConfig();
  return {
    serverUrl: config.wsUrl,
    path: config.wsPath,
    debug: config.debug,
  };
}

/**
 * 🎯 認証クライアント用設定
 */
export function getAuthClientConfig() {
  const config = getFrontendConfig();
  return {
    baseURL: config.apiUrl,
    debug: config.debug,
  };
}

/**
 * 🔗 レガシー互換性のための設定オブジェクト
 */
export const frontendConfig = {
  get config() {
    return getFrontendConfig();
  },

  get baseUrl() {
    return getFrontendConfig().backendUrl;
  },

  get frontendUrl() {
    return getFrontendConfig().frontendUrl;
  },

  get apiUrl() {
    return getFrontendConfig().apiUrl;
  },

  get wsUrl() {
    return getFrontendConfig().wsUrl;
  },

  get wsPath() {
    return getFrontendConfig().wsPath;
  },

  get wsFullUrl() {
    return getFrontendConfig().wsFullUrl;
  },

  get mediaUrl() {
    return getFrontendConfig().mediaUrl;
  },

  get isDevelopment() {
    return getFrontendConfig().isDevelopment;
  },

  get isProduction() {
    return getFrontendConfig().isProduction;
  },

  get debug() {
    return getFrontendConfig().debug;
  },
} as const;

// 設定の初期化完了（ログは必要時のみ）

export default frontendConfig;
