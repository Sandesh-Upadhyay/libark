/**
 * 🚀 Apollo Client作成（シンプル化版）
 *
 * 責務分離により保守性を向上させたバージョン
 */

import {
  ApolloClient,
  InMemoryCache,
  from,
  split,
  type NormalizedCacheObject,
} from '@apollo/client/core/index.js';
import { setContext } from '@apollo/client/link/context/index.js';
import { onError } from '@apollo/client/link/error/index.js';
import { getMainDefinition } from '@apollo/client/utilities/index.js';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { getGraphQLClientConfig, LogCategory, UnifiedLogLevel, unifiedLoggerHelpers as logger } from '@libark/core-shared';

// キャッシュ永続化パッケージをインポート
import { CachePersistor } from 'apollo3-cache-persist';

import { createTypePolicies } from './typePolicies.js';
import { handleGraphQLErrors } from './errorHandlers.js';
import { createWebSocketLink } from './websocketLink.js';

type LibarkApolloClient = ApolloClient<NormalizedCacheObject>;

/**
 * 🚀 シンプル化されたApollo Client作成関数
 */
export function createApolloClient(): LibarkApolloClient | null {
  try {
    // 設定の取得と検証
    const config = getGraphQLClientConfig();
    if (!config) {
      throw new Error('GraphQL設定の取得に失敗しました');
    }

    // HTTP URL の決定（実行時環境変数を優先）
    const httpUrl =
      process.env.NEXT_PUBLIC_GRAPHQL_URL ||
      config.httpUrl ||
      (process.env.NODE_ENV === 'production'
        ? 'https://libark.io/graphql'
        : 'http://localhost:8000/graphql');

    console.log('🔧 [GraphQL Client] URL設定:', { httpUrl });
    // #region agent log
    fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a7f7a'},body:JSON.stringify({sessionId:'1a7f7a',runId:'pre-fix',hypothesisId:'B',location:'packages/graphql-client/src/apollo/createApolloClient.ts:48',message:'GraphQL httpUrl resolved',data:{httpUrl},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // HTTP Link の作成（ファイルアップロード対応）
    const httpLink = createUploadLink({
      uri: httpUrl,
      credentials: 'include', // Cookie認証
      headers: {
        'Apollo-Require-Preflight': 'true', // CSRF対策
      },
    });

    // CSRF保護リンク
    const csrfLink = from([
      // CSRFトークンを自動付与
      setContext((operation, { headers }) => {
        // Cookieからトークンを取得
        const getCSRFToken = (): string | null => {
          if (typeof document === 'undefined') return null;

          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf-token') {
              return decodeURIComponent(value);
            }
          }
          return null;
        };

        const csrfToken = getCSRFToken();
        // #region agent log
        fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a7f7a'},body:JSON.stringify({sessionId:'1a7f7a',runId:'pre-fix',hypothesisId:'A',location:'packages/graphql-client/src/apollo/createApolloClient.ts:77',message:'CSRF token presence for operation',data:{operationName:operation.operationName||null,hasCsrfCookie:!!csrfToken,csrfTokenLength:csrfToken?String(csrfToken).length:0},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        return {
          headers: {
            ...headers,
            ...(csrfToken && { 'x-csrf-token': csrfToken }),
          },
        };
      }),
      httpLink,
    ]);

    logger.once(
      LogCategory.APOLLO,
      'http-link-created',
      UnifiedLogLevel.INFO,
      'GraphQL HTTP Link作成成功',
      { httpUrl }
    );

    // WebSocket Link の作成
    const wsLink = createWebSocketLink();

    // エラーハンドリング Link
    const errorLink = onError(handleGraphQLErrors);

    // Link の分岐設定
    const splitLink =
      wsLink != null
        ? split(
            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
              );
            },
            wsLink,
            csrfLink // CSRF保護されたHTTPリンクを使用
          )
        : csrfLink;

    // キャッシュの作成
    const cache = new InMemoryCache({
      resultCaching: true,
      typePolicies: createTypePolicies(),
    });

    // キャッシュ永続化の設定
    if (typeof window !== 'undefined') {
      try {
        const persistor = new CachePersistor({
          cache,
          storage: window.localStorage,
          trigger: 'write',
          debounce: 100,
          key: 'libark-apollo-cache',
        });

        // キャッシュの復元
        persistor
          .restore()
          .then(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Apollo Cache restored from localStorage');
            }
          })
          .catch((error: unknown) => {
            console.warn('⚠️ Apollo Cache restore failed:', error);
          });

        // 多重実行ガード付きの flush 関数
        let flushing = false;
        const flush = async () => {
          if (flushing) return;
          flushing = true;
          try {
            await persistor.persist();
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Apollo Cache flushed to localStorage');
            }
          } catch (error: unknown) {
            console.warn('⚠️ Apollo Cache flush failed:', error);
          } finally {
            flushing = false;
          }
        };

        // イベントハンドラ
        const handler = () => {
          // pagehide は即 flush
          // visibilitychange は hidden の時だけ flush
          if (document.visibilityState === 'hidden') {
            flush();
          }
        };

        // HMR/再初期化対策: 既存のハンドラがあれば削除
        const w = window as any;
        if (w.__LIBARK_APOLLO_PERSIST_HANDLER__) {
          window.removeEventListener('pagehide', w.__LIBARK_APOLLO_PERSIST_HANDLER__);
          window.removeEventListener('visibilitychange', w.__LIBARK_APOLLO_PERSIST_HANDLER__);
        }

        // window に保持
        w.__LIBARK_APOLLO_PERSISTOR__ = persistor;
        w.__LIBARK_APOLLO_PERSIST_HANDLER__ = handler;

        // リスナを追加
        window.addEventListener('pagehide', handler);
        window.addEventListener('visibilitychange', handler);
      } catch (error: unknown) {
        console.warn('⚠️ CachePersistor initialization failed:', error);
      }
    }

    // Apollo Client の作成
    const apolloClient = new ApolloClient({
      link: from([errorLink, splitLink]),
      queryDeduplication: true,
      defaultOptions: {
        query: {
          fetchPolicy: 'cache-first',
          notifyOnNetworkStatusChange: false,
        },
        watchQuery: {
          fetchPolicy: 'cache-first',
          notifyOnNetworkStatusChange: false,
        },
      },
      cache,
      assumeImmutableResults: false,
    });

    logger.once(
      LogCategory.APOLLO,
      'apollo-client-created',
      UnifiedLogLevel.INFO,
      'Apollo Client作成成功'
    );

    return apolloClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    console.error('❌ Apollo Client作成エラー:', errorMessage);

    // エラー時はnullを返す
    return null;
  }
}
