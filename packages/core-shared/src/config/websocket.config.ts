/**
 * 🔌 GraphQLサブスクリプション設定
 *
 * GraphQLサブスクリプション専用のWebSocket設定を提供
 */

import { getConfig } from './validation.js';
import type { WebSocketConfig } from './schema.js';

/**
 * 🎯 GraphQLサブスクリプション設定の取得
 */
export function getWebSocketConfig(): WebSocketConfig {
  const config = getConfig();

  return {
    WEBSOCKET_PATH: config.WEBSOCKET_PATH,
    WEBSOCKET_ENABLED: config.WEBSOCKET_ENABLED,
    WEBSOCKET_CORS_ORIGINS: config.WEBSOCKET_CORS_ORIGINS,
    WEBSOCKET_MAX_CONNECTIONS: config.WEBSOCKET_MAX_CONNECTIONS,
    WEBSOCKET_DEBUG: config.WEBSOCKET_DEBUG,
    WEBSOCKET_CONNECTION_TIMEOUT: config.WEBSOCKET_CONNECTION_TIMEOUT,
    WEBSOCKET_AUTHENTICATION_TIMEOUT: config.WEBSOCKET_AUTHENTICATION_TIMEOUT,
  };
}
