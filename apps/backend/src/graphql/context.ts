/**
 * 🎯 GraphQLコンテキスト作成（Cookie認証対応）
 *
 * Cookie認証システムを使用したGraphQLコンテキスト
 */

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import type { PrismaClient as PrismaClientType } from '@libark/db';
import { counterManager, type RedisPubSubManager, sessionManager } from '@libark/redis-client';
import { getAuthConfig } from '@libark/core-shared';
import {
  AuthError,
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  type AuthenticatedUser,
  type AuthResult,
  type JWTPayload,
} from '@libark/core-shared';
import DataLoader from 'dataloader';

import {
  createPostLikeDataLoader,
  createCommentLikeDataLoader,
  createPostPurchaseDataLoader,
} from './dataloaders.js';

import { getRedisPubSub } from './index.js';

/**
 * GraphQLコンテキスト用のDataLoader型定義
 */
export interface GraphQLDataLoaders {
  postLikeLoader: DataLoader<string, boolean>;
  commentLikeLoader: DataLoader<string, boolean>;
  postPurchaseLoader: DataLoader<string, boolean>;
}

export interface GraphQLContext {
  prisma: PrismaClientType;
  user?: AuthenticatedUser;
  request: FastifyRequest | null;
  reply: FastifyReply | null;
  fastify: FastifyInstance;
  authService: FastifyInstance['auth']['authService'];
  redisPubSub?: RedisPubSubManager | null; // Redis PubSubマネージャー（サブスクリプション用）
  dataloaders: GraphQLDataLoaders; // N+1問題解決用DataLoader
}

/**
 * 🔐 WebSocket用JWT認証ヘルパー
 *
 * WebSocket接続時のJWTトークン検証を行う
 */
async function authenticateWebSocketToken(
  token: string,
  fastify: FastifyInstance
): Promise<AuthResult> {
  try {
    const authConfig = getAuthConfig();

    // ブラックリスト確認
    try {
      const isBlacklisted = await sessionManager.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return {
          success: false,
          error: new AuthError(
            AUTH_ERROR_CODES.TOKEN_BLACKLISTED,
            AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_BLACKLISTED]
          ),
        };
      }
    } catch (e) {
      fastify.log.warn({ err: e } as unknown, '⚠️ [GraphQL WS] ブラックリストチェック失敗（継続）');
    }

    // JWT検証（HTTPと同じjsonwebtokenを使用）
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
    } catch {
      return {
        success: false,
        error: new AuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_INVALID]
        ),
      };
    }

    // ペイロードからユーザーIDを取得
    const userId = decoded.id || decoded.userId || decoded.sub;
    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: new AuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Invalid token payload - missing userId'
        ),
      };
    }

    // AuthService経由の整合性あるユーザー構築
    const dbUser = await fastify.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!dbUser || !dbUser.isActive) {
      return {
        success: false,
        error: new AuthError(
          AUTH_ERROR_CODES.USER_NOT_FOUND,
          AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.USER_NOT_FOUND]
        ),
      };
    }

    const permissions = await fastify.auth.getUserPermissionsList(dbUser.id);

    const authenticatedUser: AuthenticatedUser = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      displayName: dbUser.displayName,
      isActive: dbUser.isActive,
      isVerified: dbUser.isVerified,
      role: dbUser.role?.name ?? 'BASIC_USER',
      permissions,
      createdAt: dbUser.createdAt,
      lastLoginAt: dbUser.lastLoginAt,
    };

    return { success: true, data: authenticatedUser };
  } catch (error) {
    return {
      success: false,
      error: new AuthError(
        AUTH_ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Authentication failed'
      ),
    };
  }
}

/**
 * 🔐 統一認可ヘルパー
 *
 * HTTP認証とWebSocket認証で共通利用できる認可ロジック
 */
export async function requireAuthentication(
  context: GraphQLContext,
  requiredUserId?: string
): Promise<AuthenticatedUser> {
  // 既に認証済みの場合
  if (context.user) {
    if (requiredUserId && context.user.id !== requiredUserId) {
      throw new GraphQLError('他のユーザーのリソースにはアクセスできません', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    return context.user;
  }

  // HTTP認証の場合
  if (context.request) {
    const authResult = await context.fastify.auth.authenticate(context.request);
    if (authResult.success && authResult.data) {
      if (requiredUserId && authResult.data.id !== requiredUserId) {
        throw new GraphQLError('他のユーザーのリソースにはアクセスできません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return authResult.data;
    }
  }

  // WebSocketサブスクリプションで認証が行われていない場合
  if (!context.request && !context.user) {
    context.fastify.log.warn('🔐 [GraphQL WebSocket] WebSocket認証が必要です');
    // WebSocketサブスクリプションでは認証が必須
    throw new GraphQLError('WebSocket認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // 認証失敗
  throw new GraphQLError('認証が必要です', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

/**
 * Cookie認証システムを使用したGraphQLコンテキスト作成
 */
export async function createGraphQLContext({
  request,
  reply,
  fastify,
}: {
  request: FastifyRequest;
  reply: FastifyReply;
  fastify: FastifyInstance;
}): Promise<GraphQLContext> {
  // FastifyからPrismaを取得（テストモックも許容）
  const prisma = (fastify as FastifyInstance & { prisma: PrismaClientType }).prisma;

  try {
    let user: AuthenticatedUser | undefined;

    // 🧪 テスト環境用の認証バイパス (x-test-user-id ヘッダー)
    const testUserId = request.headers['x-test-user-id'] as string;
    if (process.env.NODE_ENV === 'test' && testUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      if (dbUser) {
        const permissions = await fastify.auth.getUserPermissionsList(dbUser.id);
        user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          displayName: dbUser.displayName,
          isActive: dbUser.isActive,
          isVerified: dbUser.isVerified,
          role: dbUser.role?.name ?? 'BASIC_USER',
          permissions,
          createdAt: dbUser.createdAt,
          lastLoginAt: dbUser.lastLoginAt,
        };
      }
    }

    if (!user) {
      // Cookie認証システムから認証情報を取得
      const result = await fastify.auth.authenticate(request);
      if (result.success && result.data) {
        user = result.data;
        await counterManager.recordActiveUser(user.id);
        fastify.log.info({ userId: user.id } as unknown, '✅ [GraphQL] Cookie認証成功:');
      }
    }

    // DataLoaderを作成（リクエストごとに新しいインスタンス）
    const userIdForLoaders = user?.id;
    const dataloaders: GraphQLDataLoaders = {
      postLikeLoader: createPostLikeDataLoader(prisma, userIdForLoaders),
      commentLikeLoader: createCommentLikeDataLoader(prisma, userIdForLoaders),
      postPurchaseLoader: createPostPurchaseDataLoader(prisma, userIdForLoaders),
    };

    const ctx = {
      prisma,
      user,
      request,
      reply,
      fastify,
      authService: fastify.auth.authService,
      redisPubSub: getRedisPubSub(),
      dataloaders,
    };
    console.log('DEBUG: createGraphQLContext FINISHED, prisma exists?', !!ctx.prisma);
    return ctx;
  } catch (error) {
    fastify.log.error({ err: error } as unknown, '🔒 GraphQL context creation error:');
    // DataLoaderを作成（エラー時も作成）
    const dataloaders: GraphQLDataLoaders = {
      postLikeLoader: createPostLikeDataLoader(prisma, undefined),
      commentLikeLoader: createCommentLikeDataLoader(prisma, undefined),
      postPurchaseLoader: createPostPurchaseDataLoader(prisma, undefined),
    };

    return {
      prisma,
      user: undefined,
      request,
      reply,
      fastify,
      authService: fastify.auth.authService,
      redisPubSub: null,
      dataloaders,
    };
  }
}

/**
 * GraphQLサブスクリプション用コンテキスト作成（本番環境対応Cookie認証版）
 *
 * WebSocket接続時にCookieから認証情報を取得し、認証済みユーザーのみサブスクリプションを許可
 */
interface ConnectionParams {
  authorization?: string;
  token?: string;
  [key: string]: unknown;
}

interface WebSocketWithRequest {
  readyState: number;
  upgradeReq?: {
    headers: {
      cookie?: string;
      'user-agent'?: string;
      'x-forwarded-for'?: string;
      [key: string]: string | string[] | undefined;
    };
  };
}

export async function createSubscriptionContext(
  connectionParams: ConnectionParams,
  websocket: WebSocketWithRequest,
  fastify: FastifyInstance
): Promise<GraphQLContext> {
  let user: AuthenticatedUser | undefined;
  const startTime = Date.now();

  try {
    fastify.log.info(
      {
        hasConnectionParams: !!connectionParams,
        connectionParamsKeys: connectionParams ? Object.keys(connectionParams) : [],
        hasUpgradeReq: !!websocket.upgradeReq,
        hasCookieHeader: !!websocket.upgradeReq?.headers?.cookie,
      } as unknown,
      '🔗 [GraphQL WebSocket] Cookie認証付きコンテキスト作成開始:'
    );

    // Cookie認証の実行
    let token: string | undefined;

    // 方法1: WebSocketアップグレードリクエストのCookieヘッダーから取得
    if (websocket.upgradeReq?.headers?.cookie) {
      const cookieHeader = websocket.upgradeReq.headers.cookie;
      const cookieMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
      token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : undefined;

      fastify.log.info(
        {
          hasCookieHeader: !!cookieHeader,
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          cookieHeaderLength: cookieHeader.length,
          cookiePreview: cookieHeader.substring(0, 100) + '...',
        },
        '🍪 [GraphQL WebSocket] Cookieヘッダーから認証トークン取得:'
      );
    }

    // 方法2: connectionParamsから取得（フォールバック）
    if (!token && connectionParams?.authorization) {
      const authHeader = connectionParams.authorization as string;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        fastify.log.info('🔑 [GraphQL WebSocket] connectionParamsから認証トークン取得');
      }
    }

    // 方法3: connectionParamsのtokenから直接取得
    if (!token && connectionParams?.token) {
      token = connectionParams.token as string;
      fastify.log.info('🔑 [GraphQL WebSocket] connectionParams.tokenから認証トークン取得');
    }

    if (!token) {
      fastify.log.warn(
        {
          connectionParams: Object.keys(connectionParams || {}),
          environment: process.env.NODE_ENV,
          hasCookieHeader: !!websocket.upgradeReq?.headers?.cookie,
          cookieHeaderPreview: websocket.upgradeReq?.headers?.cookie?.substring(0, 100) + '...',
        },
        '🔐 [GraphQL WebSocket] 認証トークンが見つかりません:'
      );

      // 認証トークンが必要
      throw new GraphQLError('WebSocket認証トークンが必要です', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // JWT認証実行
    const authResult = await authenticateWebSocketToken(token, fastify);

    if (!authResult.success || !authResult.data) {
      fastify.log.warn(
        {
          error: authResult.error,
          tokenLength: token.length,
        },
        '🔐 [GraphQL WebSocket] 認証失敗:'
      );

      throw new GraphQLError('WebSocket認証に失敗しました', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    user = authResult.data;

    const authDuration = Date.now() - startTime;
    fastify.log.info(
      {
        userId: user.id,
        username: user.username,
        authDuration: `${authDuration}ms`,
      },
      '✅ [GraphQL WebSocket] 認証成功:'
    );

    // セキュリティ監査ログ
    fastify.log.info(
      {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
        userAgent: connectionParams?.userAgent || 'unknown',
        ip: connectionParams?.ip || 'unknown',
      },
      '🔒 [Security Audit] WebSocket認証成功:'
    );
  } catch (error) {
    const authDuration = Date.now() - startTime;

    if (error instanceof GraphQLError) {
      // 認証エラーの場合は詳細をログに記録
      fastify.log.warn(
        {
          error: error.message,
          code: error.extensions?.code,
          authDuration: `${authDuration}ms`,
        },
        '🔐 [GraphQL WebSocket] 認証エラー:'
      );

      // セキュリティ監査ログ
      fastify.log.warn(
        {
          error: error.message,
          timestamp: new Date().toISOString(),
          userAgent: connectionParams?.userAgent || 'unknown',
          ip: connectionParams?.ip || 'unknown',
        },
        '🚨 [Security Audit] WebSocket認証失敗:'
      );

      throw error;
    }

    // 予期しないエラーの場合
    fastify.log.error({ err: error }, '❌ [GraphQL WebSocket] 予期しないエラー:');
    throw new GraphQLError('内部サーバーエラー', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  // DataLoaderを作成（WebSocket用）
  const prisma = (fastify as { prisma: import('@libark/db').PrismaClient }).prisma;
  const dataloaders: GraphQLDataLoaders = {
    postLikeLoader: createPostLikeDataLoader(prisma, user?.id),
    commentLikeLoader: createCommentLikeDataLoader(prisma, user?.id),
    postPurchaseLoader: createPostPurchaseDataLoader(prisma, user?.id),
  };

  return {
    prisma,
    user,
    request: null,
    reply: null,
    fastify,
    authService: fastify.auth.authService,
    redisPubSub: getRedisPubSub(),
    dataloaders,
  };
}
