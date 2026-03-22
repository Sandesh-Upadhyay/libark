/**
 * 🛡️ CSRF保護プラグイン
 *
 * 責任:
 * - GraphQLミューテーションのCSRF保護
 * - CSRFトークンの生成・配布
 * - 攻撃検知とログ記録
 * - 開発環境での柔軟な設定
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import {
  csrfManager,
  logCSRFAttack,
  extractMutationName,
  isMutation,
  type CSRFConfig,
} from '@libark/core-server';
import { extractClientIP } from '@libark/core-shared';
import { envUtils } from '@libark/core-shared';

// CSRF保護設定
interface CSRFPluginOptions {
  enabled?: boolean;
  skipRoutes?: string[];
  config?: Partial<CSRFConfig>;
}

/**
 * CSRF保護プラグイン
 */
async function csrfPlugin(fastify: FastifyInstance, options: CSRFPluginOptions = {}) {
  const { enabled = true, skipRoutes = ['/health', '/metrics'] } = options;

  // 開発環境では無効化可能
  if (!enabled || (envUtils.isDevelopment() && process.env.DISABLE_CSRF === 'true')) {
    fastify.log.warn('⚠️ CSRF保護が無効化されています');
    return;
  }

  // CSRFマネージャーを初期化
  const csrf = csrfManager;
  const csrfConfig = csrf.getConfig();

  fastify.log.info('🛡️ CSRF保護プラグイン初期化完了');

  /**
   * CSRFトークンを生成してCookieに設定
   */
  async function setCSRFToken(reply: FastifyReply): Promise<string> {
    const token = await csrf.generateToken();
    const cookieOptions = csrf.getCookieOptions();

    reply.setCookie(csrfConfig.cookieName, token, cookieOptions);
    return token;
  }

  /**
   * CSRF攻撃をログに記録
   */
  function logAttack(request: FastifyRequest, reason: string, mutation?: string) {
    const clientIP = extractClientIP(request.headers);

    logCSRFAttack({
      userId: (request as { user?: { id?: string } }).user?.id,
      ipAddress: clientIP || undefined,
      userAgent: request.headers['user-agent'],
      requestId: request.id,
      reason: reason as 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'SIGNATURE_MISMATCH',
      mutation,
    });
  }

  // CSRFトークン生成エンドポイント
  fastify.get('/csrf-token', async (request, reply) => {
    const token = await setCSRFToken(reply);

    return {
      token,
      headerName: csrfConfig.headerName,
      cookieName: csrfConfig.cookieName,
    };
  });

  // GraphQLリクエストのCSRF保護
  fastify.addHook('preHandler', async (request, reply) => {
    // スキップするルートをチェック
    if (skipRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    // GraphQLエンドポイントのみ保護
    if (!request.url.startsWith('/graphql')) {
      return;
    }

    // GETリクエスト（クエリ）はスキップ
    if (request.method === 'GET') {
      return;
    }

    // リクエストボディを確認
    const body = request.body as { query?: string };
    if (!body || !body.query) {
      return;
    }

    // ミューテーションのみ保護
    if (!isMutation(body.query)) {
      return;
    }

    const mutationName = extractMutationName(body.query);

    // CSRFトークンを検証
    const cookieToken = request.cookies?.[csrfConfig.cookieName];
    const headerToken = request.headers[csrfConfig.headerName] as string;
    // #region agent log
    fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b', {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a7f7a' },
      body: JSON.stringify({
        sessionId: '1a7f7a',
        runId: 'pre-fix',
        hypothesisId: 'A',
        location: 'apps/backend/src/plugins/csrf.ts:120',
        message: 'CSRF preHandler token presence',
        data: {
          requestId: request.id,
          url: request.url,
          method: request.method,
          mutationName: mutationName || null,
          hasCookieToken: !!cookieToken,
          hasHeaderToken: !!headerToken,
          cookieTokenLength: cookieToken ? String(cookieToken).length : 0,
          headerTokenLength: headerToken ? String(headerToken).length : 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // トークンが存在しない場合
    if (!cookieToken && !headerToken) {
      // #region agent log
      fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b', {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a7f7a' },
        body: JSON.stringify({
          sessionId: '1a7f7a',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'apps/backend/src/plugins/csrf.ts:121',
          message: 'CSRF blocked: missing token',
          data: {
            requestId: request.id,
            mutationName: mutationName || null,
            code: 'CSRF_TOKEN_MISSING',
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      logAttack(request, 'MISSING_TOKEN', mutationName || undefined);
      reply.code(403).send({
        error: 'CSRF token required',
        code: 'CSRF_TOKEN_MISSING',
      });
      return;
    }

    // トークンが一致しない場合
    if (cookieToken !== headerToken) {
      // #region agent log
      fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b', {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a7f7a' },
        body: JSON.stringify({
          sessionId: '1a7f7a',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'apps/backend/src/plugins/csrf.ts:131',
          message: 'CSRF blocked: token mismatch',
          data: {
            requestId: request.id,
            mutationName: mutationName || null,
            code: 'CSRF_TOKEN_INVALID',
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      logAttack(request, 'INVALID_TOKEN', mutationName || undefined);
      reply.code(403).send({
        error: 'CSRF token mismatch',
        code: 'CSRF_TOKEN_INVALID',
      });
      return;
    }

    // トークンの署名を検証
    if (!(await csrf.verifyToken(cookieToken))) {
      // #region agent log
      fetch('http://127.0.0.1:7532/ingest/1bec87db-370e-45a9-bed5-692fbf3f003b', {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a7f7a' },
        body: JSON.stringify({
          sessionId: '1a7f7a',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'apps/backend/src/plugins/csrf.ts:141',
          message: 'CSRF blocked: signature mismatch',
          data: {
            requestId: request.id,
            mutationName: mutationName || null,
            code: 'CSRF_TOKEN_INVALID',
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      logAttack(request, 'SIGNATURE_MISMATCH', mutationName || undefined);
      reply.code(403).send({
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      });
      return;
    }

    // 検証成功 - 新しいトークンを生成して更新
    await setCSRFToken(reply);
  });

  // Fastifyインスタンスにcsrf機能をデコレート
  fastify.decorate('csrf', {
    generateToken: () => csrf.generateToken(),
    verifyToken: (token: string) => csrf.verifyToken(token),
    setToken: (reply: FastifyReply) => setCSRFToken(reply),
    getConfig: () => csrfConfig,
  });

  fastify.log.info('🛡️ CSRF保護が有効化されました');
}

// TypeScript型定義
declare module 'fastify' {
  interface FastifyInstance {
    csrf: {
      generateToken: () => Promise<string>;
      verifyToken: (token: string) => Promise<boolean>;
      setToken: (reply: FastifyReply) => Promise<string>;
      getConfig: () => CSRFConfig;
    };
  }
}

export default fp(csrfPlugin, {
  name: 'csrf-protection',
  dependencies: [],
});
