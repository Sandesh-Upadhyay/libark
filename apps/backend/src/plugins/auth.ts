/**
 * 🔐 統一認証プラグイン（薄いラッパー）
 *
 * AuthServiceを中心とした統一認証システムのFastifyプラグイン
 * 重複を排除し、AuthServiceの機能を活用
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { PrismaClient } from '@libark/db';
import { getAuthConfig, getAuthConstants, envUtils } from '@libark/core-shared';
import {
  type AuthenticatedUser,
  type AuthResult,
  AuthError,
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
} from '@libark/core-shared';
import { type RateLimitResult } from '@libark/redis-client';
import type { Redis } from 'ioredis';

import { AuthService } from '../auth/AuthService.js';

// FastifyRequestの拡張
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

// プラグイン設定の型定義
export interface AuthPluginOptions {
  prisma: PrismaClient;
  redis?: Redis | null; // Redis接続（オプショナル）
}

/**
 * 🔐 統一認証プラグイン（薄いラッパー）
 */
async function authPlugin(fastify: FastifyInstance, options: AuthPluginOptions) {
  const { prisma, redis } = options;

  // 設定の取得
  const authConfig = getAuthConfig();
  const authConstants = getAuthConstants();

  // 統一認証サービス初期化（中心的な役割）
  const authService = AuthService.getInstance(prisma, redis || undefined, {
    jwtSecret: authConfig.jwtSecret,
    jwtExpiresIn: authConfig.jwtExpiresIn,
    cookieName: authConstants.ACCESS_TOKEN_COOKIE,
    cookieSecure: envUtils.isProduction(),
    cookieSameSite: envUtils.isProduction() ? 'strict' : 'lax',
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60, // 15分
  });

  // AuthServiceのラッパー関数群

  /**
   * JWT認証処理（AuthServiceに委譲）
   */
  async function authenticate(request: FastifyRequest): Promise<AuthResult> {
    try {
      const result = await authService.authenticate(request);
      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      request.log.error({ err: error } as unknown, '❌ [Auth] 認証エラー:');
      return {
        success: false,
        error: new AuthError(
          AUTH_ERROR_CODES.INTERNAL_ERROR,
          AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INTERNAL_ERROR]
        ),
      };
    }
  }

  /**
   * JWT生成（AuthServiceに委譲）
   */
  async function generateAccessToken(
    user: Pick<AuthenticatedUser, 'id' | 'username' | 'email'>
  ): Promise<string> {
    return await authService.generateAccessToken(user);
  }

  /**
   * 認証Cookieを設定（AuthServiceに委譲）
   */
  function setAuthCookie(reply: FastifyReply, token: string): void {
    authService.setAuthCookie(reply, token);
  }

  /**
   * 認証Cookieをクリア（AuthServiceに委譲）
   */
  function clearAuthCookies(reply: FastifyReply): void {
    authService.clearAuthCookies(reply);
  }

  /**
   * ログイン試行制限をチェック（AuthServiceに委譲）
   */
  async function checkLoginRateLimit(
    request: FastifyRequest,
    identifier: string
  ): Promise<RateLimitResult> {
    return await authService.checkLoginRateLimit(request, identifier);
  }

  /**
   * ログイン成功時にレート制限をリセット（AuthServiceに委譲）
   */
  async function resetLoginRateLimit(request: FastifyRequest, identifier: string): Promise<void> {
    return await authService.resetLoginRateLimit(request, identifier);
  }

  /**
   * 権限チェック（AuthServiceに委譲）
   */
  async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
    return await authService.hasPermission(userId, permissionName);
  }

  /**
   * 管理者権限チェック（AuthServiceに委譲）
   */
  async function isAdmin(userId: string): Promise<boolean> {
    return await authService.isAdmin(userId);
  }

  /**
   * キャッシュ統計情報を取得（AuthServiceに委譲）
   */
  function getCacheStats() {
    return authService.getCacheStats();
  }

  /**
   * 権限キャッシュ統計情報を取得（AuthServiceに委譲）
   */
  async function getPermissionCacheStats() {
    return await authService.getPermissionCacheStats();
  }

  /** 追加: ユーザー権限一覧取得 */
  async function getUserPermissionsList(userId: string): Promise<string[]> {
    return await authService.getUserPermissionsList(userId);
  }

  /**
   * ユーザーキャッシュを無効化（AuthServiceに委譲）
   */
  async function invalidateUserCache(userId: string): Promise<void> {
    return await authService.invalidateUserCache(userId);
  }

  /**
   * ユーザー権限キャッシュを無効化（AuthServiceに委譲）
   */
  async function invalidateUserPermissions(userId: string): Promise<void> {
    return await authService.invalidateUserPermissions(userId);
  }

  /**
   * 統合セッションを作成（AuthServiceに委譲）
   */
  async function createIntegratedSession(
    user: AuthenticatedUser,
    accessToken: string,
    request: FastifyRequest
  ): Promise<void> {
    return await authService.createIntegratedSession(user, accessToken, request);
  }

  /**
   * セッション統計情報を取得（AuthServiceに委譲）
   */
  async function getSessionStats(userId: string) {
    return await authService.getSessionStats(userId);
  }

  /**
   * レート制限統計情報を取得（AuthServiceに委譲）
   */
  async function getRateLimitStats() {
    return await authService.getRateLimitStats();
  }

  /**
   * トークンをブラックリストに追加（AuthServiceに委譲）
   */
  async function blacklistToken(
    request: FastifyRequest,
    token: string,
    userId: string,
    reason?: 'logout' | 'security' | 'expired' | 'revoked'
  ): Promise<void> {
    return await authService.blacklistToken(request, token, userId, reason);
  }

  /**
   * 認証必須プリハンドラー
   */
  async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await authenticate(request);

    if (!result.success || !result.data) {
      const statusCode = result.error?.code === AUTH_ERROR_CODES.INTERNAL_ERROR ? 500 : 401;
      reply.code(statusCode).send({
        success: false,
        error: result.error?.message || '認証が必要です',
        code: result.error?.code || 'UNAUTHENTICATED',
      });
      return;
    }

    // request.userに認証済みユーザー情報を設定
    request.user = result.data;
  }

  // Fastifyインスタンスに認証機能をデコレート（AuthServiceベース）
  fastify.decorate('auth', {
    authenticate,
    generateAccessToken,
    setAuthCookie,
    clearAuthCookies,
    getCacheStats: () => getCacheStats() ?? {},
    invalidateUserCache,
    checkLoginRateLimit,
    resetLoginRateLimit,
    getRateLimitStats,
    blacklistToken,
    // 権限関連機能
    hasPermission,
    isAdmin,
    getPermissionCacheStats,
    getUserPermissionsList,
    invalidateUserPermissions,
    // セッション管理機能
    createIntegratedSession,
    getSessionStats,
    // 統一認証サービス（直接アクセス用）
    authService,
  });

  // requireAuthプリハンドラーをデコレート
  fastify.decorate('requireAuth', requireAuth);

  fastify.log.info('🔐 Unified Authentication Plugin initialized (AuthService-based)');
  if (redis) {
    fastify.log.info('🚀 Redis-based caching and session management enabled');
  } else {
    fastify.log.warn('⚠️ Redis not available - running without caching');
  }
}

// Fastifyプラグインとしてエクスポート
export default fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['@fastify/cookie'],
});

// 型拡張（AuthServiceベース）
declare module 'fastify' {
  interface FastifyInstance {
    auth: {
      authenticate: (_request: FastifyRequest) => Promise<AuthResult>;
      generateAccessToken: (
        _user: Pick<AuthenticatedUser, 'id' | 'username' | 'email'>
      ) => Promise<string>;
      setAuthCookie: (_reply: FastifyReply, _token: string) => void;
      clearAuthCookies: (_reply: FastifyReply) => void;
      getCacheStats: () => Record<string, unknown>;
      invalidateUserCache: (_userId: string) => Promise<void>;
      checkLoginRateLimit: (
        _request: FastifyRequest,
        _identifier: string
      ) => Promise<RateLimitResult>;
      resetLoginRateLimit: (_request: FastifyRequest, _identifier: string) => Promise<void>;
      getRateLimitStats: () => Promise<unknown>;
      blacklistToken: (
        _request: FastifyRequest,
        _token: string,
        _userId: string,
        _reason?: 'logout' | 'security' | 'expired' | 'revoked'
      ) => Promise<void>;
      // 権限関連機能
      hasPermission: (_userId: string, _permissionName: string) => Promise<boolean>;
      isAdmin: (_userId: string) => Promise<boolean>;
      getPermissionCacheStats: () => Promise<unknown>;
      getUserPermissionsList: (_userId: string) => Promise<string[]>;
      invalidateUserPermissions: (_userId: string) => Promise<void>;
      // セッション管理機能
      createIntegratedSession: (
        _user: AuthenticatedUser,
        _accessToken: string,
        _request: FastifyRequest
      ) => Promise<void>;
      getSessionStats: (_userId: string) => Promise<unknown>;
      // 統一認証サービス（直接アクセス用）
      authService: AuthService;
    };
    requireAuth: (_request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
