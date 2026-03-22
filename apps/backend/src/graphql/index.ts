/**
 * 🎯 Apollo Server 4 GraphQL設定 + サブスクリプション
 *
 * Fastify + Apollo Server 4を使用したGraphQLサーバー設定（ESMネイティブ）
 * WebSocketからGraphQLサブスクリプションへの完全移行
 */

import type { Server as HTTPServer } from 'http';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApolloServer } from '@apollo/server';
import { HeaderMap } from '@apollo/server';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
// import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import { makeExecutableSchema } from '@graphql-tools/schema';
// import { ApolloServerCacheAdapter } from '@libark/cache/adapters';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import processRequest from 'graphql-upload/processRequest.mjs';
import { z } from 'zod';
import { typeDefs } from '@libark/graphql';
import { prisma } from '@libark/db/server';
import { createRedisPubSubManager, type RedisPubSubManager } from '@libark/redis-client';
import { UPLOAD_CONSTANTS, envUtils } from '@libark/core-shared';

import { resolvers } from '../resolvers/index.js';

import { createGraphQLContext, createSubscriptionContext, GraphQLContext } from './context.js';

// 🎯 Zodバリデーションスキーマ
const GraphQLUploadConfigSchema = z.object({
  maxFileSize: z
    .number()
    .int('最大ファイルサイズは整数である必要があります')
    .min(1, '最大ファイルサイズは1バイト以上である必要があります')
    .max(
      UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
      `最大ファイルサイズは${UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB以下である必要があります`
    )
    .default(UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES),
  maxFiles: z
    .number()
    .int('最大ファイル数は整数である必要があります')
    .min(1, '最大ファイル数は1以上である必要があります')
    .max(
      UPLOAD_CONSTANTS.MAX_FILES_COUNT,
      `最大ファイル数は${UPLOAD_CONSTANTS.MAX_FILES_COUNT}以下である必要があります`
    )
    .default(UPLOAD_CONSTANTS.MAX_FILES_COUNT),
});

// 定数定義
const DEFAULT_MAX_AGE_SECONDS = 30;
const APQ_TTL_SECONDS = 900;

// Redis PubSubマネージャーのグローバルインスタンス
let redisPubSub: RedisPubSubManager | null = null;
let wsServer: WebSocketServer | null = null;

export async function initializeGraphQL(fastify: FastifyInstance) {
  // Redis PubSubマネージャーの初期化
  try {
    redisPubSub = await createRedisPubSubManager();
    fastify.log.info('✅ [GraphQL] Redis PubSub初期化完了');
  } catch (error) {
    fastify.log.error({ err: error }, '❌ [GraphQL] Redis PubSub初期化エラー:');
    // Redis接続エラーでもサーバーは起動を継続（サブスクリプションのみ無効化）
    fastify.log.warn('⚠️ [GraphQL] Redis PubSub無効化でサーバー継続');
    redisPubSub = null;
  }

  // 高性能キャッシュ設定（統一キャッシュシステムを使用）
  // const cache = new InMemoryLRUCache({
  //   // ~100MiB キャッシュサイズ
  //   maxSize: 100 * 1024 * 1024,
  //   // 5分間のデフォルトTTL
  //   ttl: 300,
  // });
  const cache = undefined; // 統一キャッシュシステムに移行予定

  // GraphQLスキーマの作成

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // HTTPサーバーの取得（サブスクリプション用）
  const httpServer = fastify.server as HTTPServer;

  // WebSocketサーバーの作成（GraphQLサブスクリプション用）
  wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // GraphQL WebSocketサーバーの設定
  const serverCleanup = useServer(
    {
      schema,
      context: async ctx => {
        // 統一認証システムを使用したWebSocketコンテキスト作成
        try {
          // WebSocketコンテキストにHTTPリクエスト情報を含める
          // graphql-wsライブラリのコンテキストからHTTPリクエスト情報を取得
          const ctxObj = ctx as {
            socket?: {
              readyState?: number;
              upgradeReq?: {
                headers?: { cookie?: string; 'user-agent'?: string; 'x-forwarded-for'?: string };
              };
            };
            request?: {
              headers?: { cookie?: string; 'user-agent'?: string; 'x-forwarded-for'?: string };
            };
          };
          const websocketWithRequest = {
            readyState: ctxObj.socket?.readyState || 1,
            upgradeReq: {
              headers: {
                cookie:
                  ctx.extra?.request?.headers?.cookie ||
                  ctxObj.socket?.upgradeReq?.headers?.cookie ||
                  ctxObj.request?.headers?.cookie ||
                  '',
                'user-agent':
                  ctx.extra?.request?.headers?.['user-agent'] ||
                  ctxObj.socket?.upgradeReq?.headers?.['user-agent'] ||
                  ctxObj.request?.headers?.['user-agent'] ||
                  'unknown',
                'x-forwarded-for':
                  ctx.extra?.request?.headers?.['x-forwarded-for'] ||
                  ctxObj.socket?.upgradeReq?.headers?.['x-forwarded-for'] ||
                  ctxObj.request?.headers?.['x-forwarded-for'] ||
                  'unknown',
              },
            },
          };

          fastify.log.info(
            {
              hasSocket: !!ctxObj.socket,
              hasExtra: !!ctx.extra,
              hasRequest: !!ctxObj.request,
              cookieFromExtra: ctx.extra?.request?.headers?.cookie?.substring(0, 50) + '...',
              cookieFromSocket:
                ctxObj.socket?.upgradeReq?.headers?.cookie?.substring(0, 50) + '...',
              cookieFromRequest: ctxObj.request?.headers?.cookie?.substring(0, 50) + '...',
            },
            '🔍 [GraphQL WebSocket] リクエスト情報デバッグ:'
          );

          const contextValue = await createSubscriptionContext(
            ctx.connectionParams || {},
            websocketWithRequest as {
              readyState: number;
              upgradeReq: { headers: Record<string, string | string[]> };
            },
            fastify
          );

          // Redis PubSubを注入
          contextValue.redisPubSub = redisPubSub;

          return contextValue;
        } catch (error) {
          fastify.log.error({ err: error }, '❌ [GraphQL WebSocket] コンテキスト作成エラー:');
          return {
            prisma,
            redisPubSub,
            user: undefined,
            request: null,
            reply: null,
            fastify,
          };
        }
      },
    },
    wsServer
  );

  // Apollo Server 4インスタンスの作成（高性能設定 + サブスクリプション対応）
  const server = new ApolloServer<GraphQLContext>({
    schema,
    // 開発環境でのIntrospection有効化
    introspection: envUtils.isDevelopment(),
    // 高性能キャッシュ設定
    cache,
    // 高性能プラグイン設定 + サブスクリプション対応
    plugins: [
      // HTTPサーバードレインプラグイン（サブスクリプション対応）
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // WebSocketサーバークリーンアップ
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },

      // キャッシュコントロールプラグイン
      ApolloServerPluginCacheControl({
        // デフォルト30秒キャッシュ
        defaultMaxAge: DEFAULT_MAX_AGE_SECONDS,
        // 本番環境ではHTTPヘッダーを計算
        calculateHttpHeaders: envUtils.isProduction() ? 'if-cacheable' : false,
      }),

      // レスポンスキャッシュプラグイン
      responseCachePlugin({
        // ユーザー識別（プライベートキャッシュ用）
        sessionId: async requestContext => {
          const user = requestContext.contextValue?.user;
          return user ? user.id : null;
        },
        // カスタムキャッシュキー生成
        generateCacheKey: (requestContext, keyData) => {
          const operationName = requestContext.request.operationName ?? 'unnamed';
          const keyString = JSON.stringify(keyData);
          return `${operationName}:${Buffer.from(keyString).toString('base64')}`;
        },
        // キャッシュ読み取りフック（二重ガード）
        async shouldReadFromCache(requestContext) {
          const user = requestContext.contextValue?.user;
          const operationName = requestContext.request.operationName ?? 'unnamed';

          // ログイン中はキャッシュしない（個人化されたデータのため）
          if (user) {
            if (envUtils.isDevelopment()) {
              fastify.log.info(
                `[ResponseCache] ${operationName} - cache read disabled (authenticated user: ${user.id})`
              );
            }
            return false;
          }

          // デフォルトのキャッシュ読み取り（trueを返すとキャッシュを使用）
          return true;
        },
        // キャッシュ書き込みフック（二重ガード）
        async shouldWriteToCache(requestContext) {
          const user = requestContext.contextValue?.user;
          const operationName = requestContext.request.operationName ?? 'unnamed';

          // ログイン中はキャッシュしない（個人化されたデータのため）
          if (user) {
            if (envUtils.isDevelopment()) {
              fastify.log.info(
                `[ResponseCache] ${operationName} - cache write disabled (authenticated user: ${user.id})`
              );
            }
            return false;
          }

          // デフォルトのキャッシュ書き込み（trueを返すとキャッシュに保存）
          return true;
        },
      }),
    ],

    // Automatic Persisted Queries (APQ) 設定
    persistedQueries: {
      ttl: APQ_TTL_SECONDS, // 15分間のAPQキャッシュ
    },
  });

  // Apollo Serverの開始
  await server.start();

  // Fastify終了時にApollo ServerとWebSocketサーバーをクリーンアップ
  fastify.addHook('onClose', (instance, done) => {
    (async () => {
      try {
        await server.stop();
      } catch (e) {
        instance.log.warn({ err: e }, '⚠️ [GraphQL] Apollo Server stop error:');
      }
      try {
        wsServer?.clients.forEach(client => client.terminate());
        wsServer?.close();
      } catch (e) {
        instance.log.warn({ err: e }, '⚠️ [GraphQL] WebSocketServer close error:');
      }
      try {
        // Redisの全接続をクローズ
        const { RedisConnectionManager } = await import('@libark/redis-client');
        await RedisConnectionManager.getInstance().closeAllConnections();
      } catch (e) {
        instance.log.warn({ err: e }, '⚠️ [GraphQL] Redis connections close error:');
      }
      done();
    })();
  });

  // GraphQLエンドポイントの設定（multipart/form-data対応）
  fastify.post('/graphql', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // multipart/form-dataの場合はgraphql-uploadで処理
      let body = request.body;
      if (request.headers['content-type']?.includes('multipart/form-data')) {
        try {
          // Zodバリデーション済みの設定を使用
          const uploadConfig = GraphQLUploadConfigSchema.parse({
            maxFileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
            maxFiles: UPLOAD_CONSTANTS.MAX_FILES_COUNT,
          });

          body = await processRequest(request.raw, reply.raw, {
            maxFileSize: uploadConfig.maxFileSize,
            maxFiles: uploadConfig.maxFiles,
          });
        } catch (uploadError) {
          // Zodバリデーションエラーの処理
          if (uploadError instanceof z.ZodError) {
            fastify.log.error(
              {
                errors: uploadError.errors,
              } as unknown,
              'GraphQL upload config validation error:'
            );

            reply.status(500);
            return {
              errors: [
                {
                  message: 'Upload configuration error',
                  extensions: {
                    code: 'UPLOAD_CONFIG_ERROR',
                    validationErrors: uploadError.errors,
                  },
                },
              ],
            };
          }

          fastify.log.error({ err: uploadError }, 'GraphQL upload processing error:');
          reply.status(400);
          return {
            errors: [
              {
                message: 'File upload processing failed',
                extensions: {
                  code: 'UPLOAD_ERROR',
                },
              },
            ],
          };
        }
      }

      // Cookie認証システムを使用したGraphQLコンテキスト作成
      const contextValue = await createGraphQLContext({
        request,
        reply,
        fastify,
      });
      contextValue.redisPubSub = redisPubSub;

      // Apollo Serverでリクエストを実行
      const response = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: request.method.toUpperCase() as 'GET' | 'POST',
          headers: new HeaderMap(Object.entries(request.headers as Record<string, string>)),
          search: request.url.includes('?') ? request.url.split('?')[1] : '',
          body,
        },
        context: async () => {
          console.log('DEBUG: Apollo Context Factory called');
          return contextValue;
        },
      });

      // レスポンスの設定
      if (response.body.kind === 'complete') {
        reply.status(response.status || 200);

        // ヘッダーの設定
        for (const [key, value] of response.headers) {
          reply.header(key, value);
        }

        return response.body.string;
      }
    } catch (error) {
      fastify.log.error({ err: error }, 'GraphQL execution error:');
      reply.status(500);
      return {
        errors: [
          {
            message: 'Internal server error',
            extensions: {
              code: 'INTERNAL_ERROR',
            },
          },
        ],
      };
    }
  });

  // GETリクエスト対応（開発環境のみ）
  if (envUtils.isDevelopment()) {
    // GraphiQL UIの提供
    fastify.get('/graphiql', async (request: FastifyRequest, reply: FastifyReply) => {
      const graphiqlHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>GraphiQL</title>
  <style>
    body {
      height: 100%;
      margin: 0;
      width: 100%;
      overflow: hidden;
    }
    #graphiql {
      height: 100vh;
    }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script
    crossorigin
    src="https://unpkg.com/react@18/umd/react.development.js"
  ></script>
  <script
    crossorigin
    src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"
  ></script>
  <script
    src="https://unpkg.com/graphiql@3/graphiql.min.js"
  ></script>
  <script>
    // すべてのスクリプトが読み込まれるまで待機
    let attempts = 0;
    const maxAttempts = 50;

    function initGraphiQL() {
      attempts++;

      if (attempts > maxAttempts) {
        document.getElementById('graphiql').innerHTML = '<div style="padding: 20px; color: red;">GraphiQL failed to load. Please refresh the page.</div>';
        return;
      }

      if (typeof GraphiQL === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        setTimeout(initGraphiQL, 200);
        return;
      }

      try {
        const fetcher = (graphQLParams) => {
          return fetch('/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'include',
          }).then(response => response.json());
        };

        const root = ReactDOM.createRoot(document.getElementById('graphiql'));
        root.render(
          React.createElement(GraphiQL, {
            fetcher: fetcher,
            defaultEditorToolsVisibility: true,
          })
        );
      } catch (error) {
        console.error('GraphiQL initialization error:', error);
        document.getElementById('graphiql').innerHTML = '<div style="padding: 20px; color: red;">GraphiQL initialization failed: ' + error.message + '</div>';
      }
    }

    // ページ読み込み完了後に初期化
    window.addEventListener('load', initGraphiQL);
  </script>
</body>
</html>`;

      reply.type('text/html');
      return graphiqlHTML;
    });

    fastify.get('/graphql', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const contextValue = await createGraphQLContext({
          request,
          reply,
          fastify,
        });
        contextValue.redisPubSub = redisPubSub;

        const response = await server.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: 'GET',
            headers: new HeaderMap(Object.entries(request.headers as Record<string, string>)),
            search: request.url.includes('?') ? request.url.split('?')[1] : '',
            body: undefined,
          },
          context: async () => contextValue,
        });

        if (response.body.kind === 'complete') {
          reply.status(response.status || 200);

          for (const [key, value] of response.headers) {
            reply.header(key, value);
          }

          return response.body.string;
        }
      } catch (error) {
        fastify.log.error({ err: error }, 'GraphQL GET execution error:');
        reply.status(500);
        return {
          errors: [
            {
              message: 'Internal server error',
              extensions: {
                code: 'INTERNAL_ERROR',
              },
            },
          ],
        };
      }
    });

    fastify.log.info('GraphiQL available at /graphiql');
    fastify.log.info('GraphQL Studio Sandbox available at /graphql');
  }

  fastify.log.info('GraphQL endpoint available at /graphql');
  fastify.log.info('GraphQL WebSocket subscriptions available at ws://localhost:8000/graphql');
}

// Redis PubSubマネージャーのエクスポート（リゾルバーで使用）
export function getRedisPubSub() {
  return redisPubSub;
}
