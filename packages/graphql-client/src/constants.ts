/**
 * 🎯 GraphQL Client 定数
 *
 * GraphQLクライアント関連の定数を一元管理
 */

/**
 * Apollo Client 設定関連定数
 */
export const APOLLO_CLIENT_CONSTANTS = {
  // キャッシュ設定
  DEFAULT_CACHE_SIZE: 100,

  // リトライ設定
  MAX_RETRY_ATTEMPTS: 5,
  RETRY_DELAY_BASE: 1000, // 1秒
  RETRY_DELAY_MULTIPLIER: 60, // 60秒

  // ポーリング設定（WebSocketサブスクリプション使用のため削除）
  // DEFAULT_POLL_INTERVAL: 30000, // 30秒 - WebSocketで代替
  // NOTIFICATION_POLL_INTERVAL: 20, // 20秒 - WebSocketで代替

  // バッチ設定
  BATCH_SIZE_SMALL: 10,
  BATCH_SIZE_MEDIUM: 20,
  BATCH_SIZE_LARGE: 50,

  // バッファサイズ
  BUFFER_SIZE_1KB: 1024,
  BUFFER_SIZE_MULTIPLIER: 2,

  // タイムアウト設定
  LOADING_DELAY: 100, // 100ms
  LOADING_TIMEOUT: 300, // 300ms
} as const;

/**
 * 認証関連定数
 */
export const AUTH_CONSTANTS = {
  // トークン有効期限チェック間隔（WebSocket認証で代替）
  // TOKEN_CHECK_INTERVAL: 50, // 50秒 - WebSocketで代替
} as const;

/**
 * 通知関連定数（WebSocketサブスクリプション使用）
 */
export const NOTIFICATION_CONSTANTS = {
  // 通知取得間隔（WebSocketサブスクリプションで代替）
  FETCH_INTERVAL: 20, // 初回取得用のみ保持
  // POLL_INTERVAL: 30000, // 30秒 - WebSocketで代替
} as const;

/**
 * パフォーマンス関連定数
 */
export const PERFORMANCE_CONSTANTS = {
  // ローディング表示遅延
  LOADING_DISPLAY_DELAY: 100, // 100ms
  LOADING_TIMEOUT: 300, // 300ms
} as const;
