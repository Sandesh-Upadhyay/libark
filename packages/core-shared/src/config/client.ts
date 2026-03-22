/**
 * 🎯 クライアント専用設定
 *
 * ブラウザ環境で使用される設定
 * 機密情報は含まず、NEXT_PUBLIC_*のみ使用
 */

import { envUtils } from './environment-strategy.js';

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

  // 基本URL設定（環境に応じた適切なURL選択）
  const backendUrl = isServer
    ? envUtils.getEnvVar('NEXT_PUBLIC_BACKEND_URL_INTERNAL') || 'http://backend:8000' // Docker内部ネットワーク用
    : envUtils.getEnvVar('NEXT_PUBLIC_BACKEND_URL') ||
      (envUtils.isProduction() ? 'https://libark.io/api' : 'http://localhost:8000'); // ブラウザ用

  const frontendUrl = envUtils.getEnvVar('NEXT_PUBLIC_FRONTEND_URL') || 'http://localhost:3000';
  const wsPath = envUtils.getEnvVar('NEXT_PUBLIC_WEBSOCKET_PATH') || '/ws';
  const mediaUrl =
    envUtils.getEnvVar('NEXT_PUBLIC_MEDIA_URL') || 'https://libark.sgp1.digitaloceanspaces.com';

  // API URLの生成（常にbackendUrl + /apiを使用）
  const apiUrl = buildUrl(backendUrl, '/api');

  // GraphQL URLの生成（専用環境変数を優先、環境に応じたフォールバック）
  const graphqlUrl =
    envUtils.getEnvVar('NEXT_PUBLIC_GRAPHQL_URL') ||
    buildUrl(backendUrl, '/graphql') ||
    (envUtils.isProduction() ? 'https://libark.io/graphql' : 'http://localhost:8000/graphql');
  const graphqlWsUrl = graphqlUrl.replace(/^http/, 'ws');

  // WebSocket URLの生成（クライアントサイドでは localhost を使用）
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

    // GraphQL設定
    graphqlUrl,
    graphqlWsUrl,

    // WebSocket設定
    wsUrl,
    wsPath,
    wsFullUrl,

    // メディア設定
    mediaUrl,

    // 環境設定
    nodeEnv,
    isDevelopment,
    isProduction,
    debug: isDevelopment,
  } as const;
}

/**
 * 🎯 メディアクライアント用設定
 */
export function getMediaClientConfig() {
  const config = getFrontendConfig();
  return {
    apiBaseUrl: config.backendUrl, // backendUrlを使用してAPI URLを正しく設定
    wsEndpoint: config.wsUrl,
    mediaBaseUrl: config.mediaUrl,
  } as const;
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
  } as const;
}

/**
 * 🎯 認証クライアント用設定
 */
export function getAuthClientConfig() {
  const config = getFrontendConfig();
  return {
    baseURL: config.apiUrl,
    debug: config.debug,
  } as const;
}

/**
 * 🎯 GraphQLクライアント用設定
 */
export function getGraphQLClientConfig() {
  const config = getFrontendConfig();
  return {
    httpUrl: config.graphqlUrl,
    wsUrl: config.graphqlWsUrl,
    debug: config.debug,
  } as const;
}

/**
 * 🎯 統一クライアント設定オブジェクト
 */
export const clientConfig = {
  get frontend() {
    return getFrontendConfig();
  },

  get media() {
    return getMediaClientConfig();
  },

  get websocket() {
    return getWebSocketClientConfig();
  },

  get auth() {
    return getAuthClientConfig();
  },

  get graphql() {
    return getGraphQLClientConfig();
  },
} as const;

export default clientConfig;
