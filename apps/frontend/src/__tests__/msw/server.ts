import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { graphqlHandlers } from './handlers.graphql';
import { errorHandlers } from './handlers.errors';

/**
 * MSWサーバー設定
 * テスト環境でGraphQL APIのモックを提供する
 */

// デフォルトのHTTPハンドラー
const httpHandlers = [
  http.get('https://example.com/ping', () => {
    return HttpResponse.json({ ok: true });
  }),
];

// 全ハンドラーを統合
export const handlers = [...httpHandlers, ...graphqlHandlers, ...errorHandlers];

// MSWサーバーのセットアップ
export const server = setupServer(...handlers);

/**
 * テスト用のMSWサーバー管理関数
 */

// リクエストログ用のリスナー
let requestLog: Array<{ method: string; url: string; timestamp: number }> = [];

server.events.on('request:start', ({ request }) => {
  requestLog.push({
    method: request.method,
    url: request.url,
    timestamp: Date.now(),
  });
});

// レスポンスログ用のリスナー
let responseLog: Array<{ status: number; timestamp: number }> = [];

server.events.on('response:mocked', ({ response }) => {
  responseLog.push({
    status: response.status,
    timestamp: Date.now(),
  });
});

/**
 * リクエストログを取得
 */
export function getRequestLog() {
  return requestLog;
}

/**
 * レスポンスログを取得
 */
export function getResponseLog() {
  return responseLog;
}

/**
 * ログをクリア
 */
export function clearLogs() {
  requestLog = [];
  responseLog = [];
}

/**
 * テスト間でMSWの状態をリセット
 */
export function resetMSWServer() {
  clearLogs();
  // handlers.graphql.tsのresetMSWState()を呼び出し
  const { resetMSWState } = require('./handlers.graphql');
  resetMSWState();
}

/**
 * MSWサーバーを起動
 * 通常はsetup.tsで自動的に呼び出されます
 */
export function startMSWServer() {
  server.listen({
    onUnhandledRequest: 'bypass',
  });
  console.log('🔶 MSW server started');
}

/**
 * MSWサーバーを停止
 * テスト終了時に呼び出します
 */
export function stopMSWServer() {
  server.close();
  console.log('🔷 MSW server stopped');
}

/**
 * 特定のハンドラーのみを有効化する
 * 特定のエラーシナリオをテストする場合に使用
 */
export function useSpecificHandlers(...specificHandlers: any[]) {
  server.use(...specificHandlers);
}

/**
 * 特定のハンドラーを無効化する
 */
export function resetHandlers() {
  server.resetHandlers();
}

// テスト環境でのみ自動的に起動
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  startMSWServer();
}
