/**
 * 🔗 Apollo Client WebSocketリンク設定
 *
 * createApolloClient.tsから分離してメンテナンス性を向上
 */

import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { createClient } from 'graphql-ws';
import { getGraphQLClientConfig } from '@libark/core-shared';
import { LogCategory, UnifiedLogLevel, unifiedLoggerHelpers as logger } from '@libark/core-shared';

/**
 * 🔗 WebSocketリンクの作成（シンプル化版）
 *
 * サーバーサイドレンダリング環境では null を返す
 */
export function createWebSocketLink(): GraphQLWsLink | null {
  // SSR環境では WebSocket を使用しない
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const config = getGraphQLClientConfig();

    // WebSocket URL の決定（実行時環境変数を優先）
    const wsUrl =
      process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace(/^http/, 'ws') ||
      config.wsUrl ||
      (process.env.NODE_ENV === 'production'
        ? 'wss://libark.io/graphql'
        : 'ws://localhost:8000/graphql');

    console.log('🔧 [GraphQL WebSocket] URL設定:', {
      wsUrl,
      NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
      NODE_ENV: process.env.NODE_ENV,
      configWsUrl: config.wsUrl,
    });

    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsUrl,
        connectionParams: () => {
          // WebSocket接続時はCookieが自動的に送信されるため、connectionParamsは不要
          // サーバー側でWebSocketアップグレードリクエストのCookieヘッダーから認証情報を取得

          if (process.env.NODE_ENV === 'development') {
            console.log('🔗 [WebSocket] Cookie認証モード:', {
              wsUrl,
              authMethod: 'cookie-based',
              note: 'Cookieは自動的にHTTPヘッダーで送信されます',
            });
          }

          // 空のconnectionParamsを返す（認証はCookieヘッダーで処理）
          return {};
        },
        on: {
          error: error => {
            console.error('❌ WebSocket接続エラー:', error);

            // 認証関連エラーの特別な処理
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage?.includes('認証') || errorMessage?.includes('UNAUTHENTICATED')) {
              console.warn('🔐 WebSocket認証エラー:', errorMessage);
              // 必要に応じて認証状態をリセットやリダイレクト処理を追加
            }

            // エラー時の自動再接続は graphql-ws が処理
          },
          closed: event => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔌 WebSocket接続が閉じられました:', event);
            }

            // 認証エラーの場合の特別な処理
            const closeEvent = event as CloseEvent;
            if (closeEvent && (closeEvent.code === 4401 || closeEvent.reason?.includes('認証'))) {
              console.warn('🔐 WebSocket認証エラーによる切断:', closeEvent.reason);
              // 必要に応じて認証状態をリセットやリダイレクト処理を追加
            }
          },
          connected: () => {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ WebSocket接続が確立されました');
            }
          },
        },
        retryAttempts: 5,
        retryWait: async function retryWait(retries) {
          // 指数バックオフで再接続間隔を調整
          const delay = Math.min(1000 * Math.pow(2, retries), 30000);
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 WebSocket再接続待機: ${delay}ms (試行回数: ${retries})`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        },
      })
    );

    logger.once(
      LogCategory.APOLLO,
      'websocket-link-created',
      UnifiedLogLevel.INFO,
      'WebSocket Link作成成功',
      { wsUrl }
    );

    return wsLink;
  } catch (error) {
    console.warn(
      `⚠️ WebSocket Link作成エラー (続行): ${error instanceof Error ? error.message : error}`
    );

    // エラー時は null を返して HTTP Link のみで続行
    return null;
  }
}
