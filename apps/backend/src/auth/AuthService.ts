/**
 * 🏆 統一認証サービス
 *
 * 責任:
 * - 認証フローの統一管理
 * - JWT生成・検証の統合
 * - セッション管理の統合
 * - 権限チェックの統合
 * - セキュリティポリシーの統一実装
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';
import { verifyPassword } from '@libark/core-server/security/password';
import { verifyTOTPCode, verifyBackupCode } from '@libark/core-server/security/totp';
import jwt from 'jsonwebtoken';
import type { Secret } from 'jsonwebtoken';
import {
  AuthenticatedUser,
  AuthResult,
  AuthError,
  AuthErrorCode,
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  JWTPayload,
  SecurityEventType,
  logSecurityEvent,
  extractClientIP,
} from '@libark/core-shared';
import { rateLimiter, type RateLimitResult } from '@libark/redis-client';

import { AuthCache } from './AuthCache.js';
import { PermissionCache } from './PermissionCache.js';
import { IntegratedSessionManager } from './SessionManager.js';

// 認証設定
export interface AuthServiceConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieName: string;
  cookieSecure: boolean;
  cookieSameSite: 'strict' | 'lax' | 'none';
  maxLoginAttempts: number;
  lockoutDuration: number;
}

// ログイン結果
export interface LoginResult {
  success: boolean;
  user?: AuthenticatedUser;
  accessToken?: string;
  message: string;
  errorCode?: AuthErrorCode;
  rateLimitInfo?: RateLimitResult;
  requiresTwoFactor?: boolean; // 2FA要求フラグ
}

// 2FA検証結果
export interface TwoFactorVerificationResult {
  success: boolean;
  isBackupCode?: boolean;
  error?: AuthError;
}

// 認証結果（新しいAuthResult型を使用）
export type AuthenticationResult = AuthResult;

/**
 * 統一認証サービス
 */
export class AuthService {
  private static instance: AuthService;
  private authCache?: AuthCache;
  private permissionCache?: PermissionCache;
  private sessionManager?: IntegratedSessionManager;

  private constructor(
    private prisma: PrismaClient,
    private redis?: Redis,
    private config?: AuthServiceConfig
  ) {
    // デフォルト設定を適用
    if (!this.config) {
      this.config = {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
        cookieName: 'accessToken',
        cookieSecure: process.env.NODE_ENV === 'production',
        cookieSameSite: 'strict',
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60, // 15分
      };
    }

    // JWT秘密鍵の検証
    if (!this.config.jwtSecret || this.config.jwtSecret === 'default-secret-change-in-production') {
      console.error('❌ [AuthService] JWT_SECRET環境変数が設定されていません');
      throw new Error('JWT_SECRET環境変数が必要です');
    }
    // キャッシュシステム初期化
    if (redis) {
      this.authCache = new AuthCache(redis, prisma);
      this.permissionCache = new PermissionCache(redis, prisma);
      this.sessionManager = IntegratedSessionManager.getInstance(redis, prisma);
    }

    console.log('🏆 [AuthService] 統一認証サービス初期化完了');
  }

  public static getInstance(
    prisma: PrismaClient,
    redis?: Redis,
    config?: AuthServiceConfig
  ): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(prisma, redis, config);
    }
    return AuthService.instance;
  }

  /**
   * ユーザーログイン
   */
  async login(
    email: string,
    password: string,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<LoginResult> {
    const clientIP = extractClientIP(request.headers);
    const userAgent = request.headers['user-agent'];

    try {
      // レート制限チェック
      const rateLimitResult = await this.checkLoginRateLimit(request, email);
      if (!rateLimitResult.allowed) {
        // セキュリティログ記録
        logSecurityEvent({
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          ipAddress: clientIP || undefined,
          userAgent,
          severity: 'HIGH',
          requestId: request.id,
          details: {
            email,
            remainingAttempts: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
        });

        return {
          success: false,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED],
          errorCode: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          rateLimitInfo: rateLimitResult,
        };
      }

      // ユーザー検索
      const user = await this.findUserByEmail(email);
      if (!user) {
        // セキュリティログ記録
        logSecurityEvent({
          eventType: SecurityEventType.LOGIN_FAILURE,
          ipAddress: clientIP || undefined,
          userAgent,
          severity: 'MEDIUM',
          requestId: request.id,
          details: { email, reason: 'user_not_found' },
        });

        return {
          success: false,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS],
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        };
      }

      // パスワード検証
      if (!user.passwordHash) {
        // セキュリティログ記録
        logSecurityEvent({
          eventType: SecurityEventType.LOGIN_FAILURE,
          userId: user.id,
          username: user.username,
          email: user.email,
          ipAddress: clientIP || undefined,
          userAgent,
          severity: 'HIGH',
          requestId: request.id,
          details: { reason: 'missing_password_hash' },
        });

        return {
          success: false,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS],
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        };
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        // セキュリティログ記録
        logSecurityEvent({
          eventType: SecurityEventType.LOGIN_FAILURE,
          userId: user.id,
          username: user.username,
          email: user.email,
          ipAddress: clientIP || undefined,
          userAgent,
          severity: 'MEDIUM',
          requestId: request.id,
          details: { reason: 'invalid_password' },
        });

        return {
          success: false,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS],
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        };
      }

      // アカウント状態チェック
      if (!user.isActive) {
        // セキュリティログ記録
        logSecurityEvent({
          eventType: SecurityEventType.ACCOUNT_SUSPENDED,
          userId: user.id,
          username: user.username,
          email: user.email,
          ipAddress: clientIP || undefined,
          userAgent,
          severity: 'HIGH',
          requestId: request.id,
          details: { reason: 'account_inactive' },
        });

        return {
          success: false,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.USER_INACTIVE],
          errorCode: AUTH_ERROR_CODES.USER_INACTIVE,
        };
      }

      // JWT生成
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        role: user.role?.name ?? 'BASIC_USER',
        permissions: [],
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };

      const accessToken = await this.generateAccessToken(authenticatedUser);

      // Cookieに設定
      this.setAuthCookie(reply, accessToken);

      // デバッグ: Cookie設定の確認
      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 [AuthService] Cookie設定:', {
          cookieName: this.config?.cookieName,
          cookieSecure: this.config?.cookieSecure,
          cookieSameSite: this.config?.cookieSameSite,
          tokenPrefix: accessToken.substring(0, 20) + '...',
        });
      }

      // 認証キャッシュに保存
      if (this.authCache) {
        await this.authCache.cacheUser(authenticatedUser);
      }

      // 統合セッション作成
      if (this.sessionManager) {
        await this.sessionManager.createSession({
          user: authenticatedUser,
          accessToken,
          ipAddress: clientIP || undefined,
          userAgent,
          deviceName: this.extractDeviceName(userAgent),
        });
      }

      // 最終ログイン時刻を更新
      await this.updateLastLogin(user.id);

      // レート制限をリセット
      await this.resetLoginRateLimit(request, email);

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.LOGIN_SUCCESS,
        userId: user.id,
        username: user.username,
        email: user.email,
        ipAddress: clientIP || undefined,
        userAgent,
        severity: 'LOW',
        requestId: request.id,
        details: { method: 'UNIFIED_AUTH_SERVICE' },
      });

      return {
        success: true,
        user: authenticatedUser,
        accessToken,
        message: 'ログインに成功しました',
      };
    } catch (error) {
      console.error('❌ [AuthService] ログインエラー:', error);

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.SYSTEM_ERROR,
        ipAddress: clientIP || undefined,
        userAgent,
        severity: 'HIGH',
        requestId: request.id,
        errorCode: 'AUTH_SERVICE_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: { email, operation: 'login' },
      });

      return {
        success: false,
        message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INTERNAL_ERROR],
        errorCode: AUTH_ERROR_CODES.INTERNAL_ERROR,
      };
    }
  }

  /**
   * JWT認証
   */
  async authenticate(request: FastifyRequest): Promise<AuthenticationResult> {
    try {
      const accessToken = request.cookies?.[this.config?.cookieName || 'accessToken'];

      if (!accessToken) {
        return {
          success: false,
          error: new AuthError(
            AUTH_ERROR_CODES.TOKEN_MISSING,
            AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_MISSING]
          ),
        };
      }

      // トークンブラックリストチェック
      try {
        const { sessionManager } = await import('@libark/redis-client');
        const isBlacklisted = await sessionManager.isTokenBlacklisted(accessToken);
        if (isBlacklisted) {
          return {
            success: false,
            error: new AuthError(
              AUTH_ERROR_CODES.TOKEN_BLACKLISTED,
              AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_BLACKLISTED]
            ),
          };
        }
      } catch (error) {
        console.warn('⚠️ [AuthService] ブラックリストチェックエラー:', error);
        // ブラックリストチェックエラーは認証を継続
      }

      // JWT検証
      let decoded: JWTPayload;
      try {
        decoded = jwt.verify(accessToken, this.config?.jwtSecret || 'default-secret') as JWTPayload;
      } catch (jwtError: unknown) {
        if (jwtError instanceof Error && jwtError.name === 'TokenExpiredError') {
          return {
            success: false,
            error: new AuthError(
              AUTH_ERROR_CODES.TOKEN_EXPIRED,
              AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_EXPIRED]
            ),
          };
        } else if (jwtError instanceof Error && jwtError.name === 'JsonWebTokenError') {
          return {
            success: false,
            error: new AuthError(
              AUTH_ERROR_CODES.TOKEN_INVALID,
              AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_INVALID]
            ),
          };
        } else {
          return {
            success: false,
            error: new AuthError(
              AUTH_ERROR_CODES.TOKEN_INVALID,
              AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_INVALID]
            ),
          };
        }
      }

      // ユーザーIDの取得（idまたはuserIdフィールドを確認）
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        return {
          success: false,
          error: new AuthError(
            AUTH_ERROR_CODES.TOKEN_INVALID,
            AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_INVALID]
          ),
        };
      }

      // キャッシュからユーザー情報を取得
      let user: AuthenticatedUser | null = null;

      if (this.authCache) {
        user = await this.authCache.getUser(userId);
      }

      // キャッシュにない場合はDBから取得
      if (!user) {
        const dbUser = await this.findUserById(userId);
        if (!dbUser) {
          return {
            success: false,
            error: new AuthError(
              AUTH_ERROR_CODES.USER_NOT_FOUND,
              AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.USER_NOT_FOUND]
            ),
          };
        }

        user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          displayName: dbUser.displayName,
          isActive: dbUser.isActive,
        } as AuthenticatedUser;

        // キャッシュに保存
        if (this.authCache && user) {
          await this.authCache.cacheUser(user);
        }
      }

      // アカウント状態チェック
      if (!user || !user.isActive) {
        return {
          success: false,
          error: new AuthError(
            AUTH_ERROR_CODES.USER_INACTIVE,
            AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.USER_INACTIVE]
          ),
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return {
          success: false,
          error: new AuthError(
            AUTH_ERROR_CODES.TOKEN_EXPIRED,
            AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_EXPIRED]
          ),
        };
      }

      return {
        success: false,
        error: new AuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.TOKEN_INVALID]
        ),
      };
    }
  }

  /**
   * ログアウト
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const accessToken = request.cookies?.[this.config?.cookieName || 'accessToken'];

    if (accessToken && this.sessionManager) {
      try {
        // 現在のユーザー情報を取得
        const authResult = await this.authenticate(request);

        if (authResult.success && authResult.data) {
          // セキュリティログ記録
          logSecurityEvent({
            eventType: SecurityEventType.LOGOUT,
            userId: authResult.data.id,
            username: authResult.data.username,
            email: authResult.data.email,
            ipAddress: extractClientIP(request.headers) || undefined,
            userAgent: request.headers['user-agent'],
            severity: 'LOW',
            requestId: request.id,
            details: { method: 'UNIFIED_AUTH_SERVICE' },
          });
        }
      } catch (error) {
        console.warn('⚠️ [AuthService] ログアウト時のセキュリティログ記録に失敗:', error);
      }
    }

    // Cookie削除
    this.clearAuthCookies(reply);
  }

  /**
   * 権限チェック（新しいRole + Permission分離システム）
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    console.log(`🔍 [AuthService] Checking permission: ${permissionName} for user: ${userId}`);
    try {
      // 1. パーミッション定義を取得
      const permission = await this.prisma.permission.findUnique({
        where: { name: permissionName },
      });
      console.log(`🔍 [AuthService] Permission definition found: ${!!permission}`);
      if (!permission) return false;

      // 2. ユーザーのオーバーライド確認
      const override = await this.prisma.userPermissionOverride.findFirst({
        where: {
          userId,
          permissionId: permission.id,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      console.log(`🔍 [AuthService] Override found: ${!!override}, allowed: ${override?.allowed}`);
      if (override) return override.allowed;

      // 3. ロール経由の権限確認
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                where: {
                  permissionId: permission.id,
                },
              },
            },
          },
        },
      });

      return (user?.role?.permissions?.length ?? 0) > 0;
    } catch (error) {
      console.error('❌ [AuthService] 権限チェックエラー:', error);
      return false;
    }
  }

  /**
   * 管理者権限チェック（新しいRole + Permission分離システム）
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      // ADMIN_PANELまたはMANAGE_USERSの権限があれば管理者とみなす
      const hasAdminPanel = await this.hasPermission(userId, 'ADMIN_PANEL');
      const hasManageUsers = await this.hasPermission(userId, 'MANAGE_USERS');

      return hasAdminPanel || hasManageUsers;
    } catch (error) {
      console.error('❌ [AuthService] 管理者権限チェックエラー:', error);
      return false;
    }
  }

  /**
   * スーパー管理者権限チェック
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      // ユーザーのロールがSUPER_ADMINかチェック
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      return user?.role?.name === 'SUPER_ADMIN';
    } catch (error) {
      console.error('❌ [AuthService] スーパー管理者権限チェックエラー:', error);
      return false;
    }
  }

  /**
   * ユーザーの権限一覧（PermissionCache/DB）
   */
  async getUserPermissionsList(userId: string): Promise<string[]> {
    try {
      if (this.permissionCache) {
        const cached = await this.permissionCache.getUserPermissions(userId);
        if (cached) return cached.permissions;
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
      const perms =
        (user?.role?.permissions as Array<{ permission: { name: string } }> | undefined)?.map(
          rp => rp.permission.name
        ) ?? [];
      return perms;
    } catch (e) {
      console.error('❌ [AuthService] getUserPermissionsList error', e);
      return [];
    }
  }

  /**
   * キャッシュ統計情報を取得
   */
  getCacheStats() {
    return this.authCache ? this.authCache.getStats() : null;
  }

  /**
   * 権限キャッシュ統計情報を取得
   */
  async getPermissionCacheStats() {
    return this.permissionCache ? this.permissionCache.getStats() : null;
  }

  /**
   * ユーザーキャッシュを無効化
   */
  async invalidateUserCache(userId: string): Promise<void> {
    if (this.authCache) {
      await this.authCache.invalidateUser(userId);
    }
  }

  /**
   * ユーザー権限キャッシュを無効化
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    if (this.permissionCache) {
      await this.permissionCache.invalidateUser(userId);
    }
  }

  /**
   * 統合セッションを作成
   */
  async createIntegratedSession(
    user: AuthenticatedUser,
    accessToken: string,
    request: FastifyRequest
  ): Promise<void> {
    if (this.sessionManager) {
      const clientIP = extractClientIP(request.headers);
      const userAgent = request.headers['user-agent'];

      await this.sessionManager.createSession({
        user,
        accessToken,
        ipAddress: clientIP || undefined,
        userAgent,
        deviceName: this.extractDeviceName(userAgent),
      });
    }
  }

  /**
   * セッション統計情報を取得
   */
  async getSessionStats(userId: string) {
    return this.sessionManager ? this.sessionManager.getUserSessionStats(userId) : null;
  }

  /**
   * レート制限統計情報を取得
   */
  async getRateLimitStats() {
    try {
      return await rateLimiter.getStats();
    } catch (error) {
      console.error('❌ [AuthService] レート制限統計取得エラー:', error);
      return null;
    }
  }

  /**
   * トークンをブラックリストに追加
   */
  async blacklistToken(
    request: FastifyRequest,
    token: string,
    userId: string,
    reason?: 'logout' | 'security' | 'expired' | 'revoked'
  ): Promise<void> {
    try {
      // sessionManagerを使用してトークンをブラックリストに追加
      const { sessionManager } = await import('@libark/redis-client');
      await sessionManager.blacklistToken(
        token,
        {
          tokenId: token,
          userId,
          reason: reason || 'logout',
          blacklistedAt: new Date().toISOString(),
        },
        24 * 60 * 60
      ); // 24時間

      // セキュリティログ記録
      const clientIP = extractClientIP(request.headers);
      logSecurityEvent({
        eventType: SecurityEventType.TOKEN_BLACKLISTED,
        userId,
        ipAddress: clientIP || undefined,
        userAgent: request.headers['user-agent'],
        severity: 'MEDIUM',
        requestId: request.id,
        details: { reason, tokenPrefix: token.substring(0, 10) + '...' },
      });
    } catch (error) {
      console.error('❌ [AuthService] トークンブラックリスト追加エラー:', error);
    }
  }

  /**
   * JWT生成（公開メソッド）
   */
  async generateAccessToken(
    user: Pick<AuthenticatedUser, 'id' | 'username' | 'email'>
  ): Promise<string> {
    const payload = {
      id: user.id, // 認証プラグインと統一
      username: user.username,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    };

    const secret: Secret = this.config?.jwtSecret || 'default-secret';
    const expiresIn = this.config?.jwtExpiresIn || '15m';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * 認証Cookieを設定（公開メソッド）
   */
  setAuthCookie(reply: FastifyReply, token: string): void {
    reply.setCookie(this.config?.cookieName || 'accessToken', token, {
      httpOnly: true,
      secure: this.config?.cookieSecure || false,
      sameSite: this.config?.cookieSameSite || 'lax',
      maxAge: 15 * 60 * 1000, // 15分
      path: '/',
    });
  }

  /**
   * 認証Cookieをクリア（公開メソッド）
   */
  clearAuthCookies(reply: FastifyReply): void {
    reply.clearCookie(this.config?.cookieName || 'accessToken', {
      httpOnly: true,
      secure: this.config?.cookieSecure || false,
      sameSite: this.config?.cookieSameSite || 'lax',
      path: '/',
    });
  }

  /**
   * ログインレート制限チェック（公開メソッド）
   */
  async checkLoginRateLimit(request: FastifyRequest, identifier: string): Promise<RateLimitResult> {
    const clientIP = extractClientIP(request.headers) || 'unknown';
    const key = `${identifier}:${clientIP}`;

    return await rateLimiter.checkLoginAttempt(key);
  }

  /**
   * ログインレート制限をリセット（公開メソッド）
   */
  async resetLoginRateLimit(request: FastifyRequest, identifier: string): Promise<void> {
    const clientIP = extractClientIP(request.headers) || 'unknown';
    const key = `${identifier}:${clientIP}`;

    await rateLimiter.resetLimit('login', key);
  }

  /**
   * メールでユーザーを検索
   */
  private async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  /**
   * IDでユーザーを検索
   */
  private async findUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  /**
   * 最終ログイン時刻を更新
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      console.warn('⚠️ [AuthService] 最終ログイン時刻更新に失敗:', error);
    }
  }

  /**
   * デバイス名を抽出
   */
  private extractDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';

    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';

    return 'Unknown Device';
  }

  /**
   * 2FA検証
   */
  async verifyTwoFactor(userId: string, code: string): Promise<TwoFactorVerificationResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          backupCodes: true,
        },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return {
          success: false,
          error: new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, '2FAが有効化されていません'),
        };
      }

      // TOTPコード検証（6桁）
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        const isValidTOTP = verifyTOTPCode(user.twoFactorSecret, code);
        if (isValidTOTP) {
          return { success: true };
        }
      }

      // バックアップコード検証（8桁）
      if (code.length === 8 && /^[A-Z0-9]{8}$/.test(code)) {
        // バックアップコードが残っているかチェック
        if (user.backupCodes.length === 0) {
          return {
            success: false,
            error: new AuthError(
              AUTH_ERROR_CODES.INVALID_CREDENTIALS,
              'バックアップコードが残っていません。新しいバックアップコードを生成してください'
            ),
          };
        }

        for (let i = 0; i < user.backupCodes.length; i++) {
          const hashedBackupCode = user.backupCodes[i];
          const isValidBackupCode = await verifyBackupCode(code, hashedBackupCode);

          if (isValidBackupCode) {
            // バックアップコードを使用済みにする（削除）
            const updatedBackupCodes = user.backupCodes.filter(
              (_code: string, index: number) => index !== i
            );

            await this.prisma.user.update({
              where: { id: userId },
              data: { backupCodes: updatedBackupCodes },
            });

            return { success: true, isBackupCode: true };
          }
        }

        // バックアップコード形式だが無効（使用済みまたは間違い）
        return {
          success: false,
          error: new AuthError(
            AUTH_ERROR_CODES.INVALID_CREDENTIALS,
            'このバックアップコードは無効です。使用済みか間違っている可能性があります'
          ),
        };
      }

      return {
        success: false,
        error: new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, '無効な認証コードです'),
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      return {
        success: false,
        error: new AuthError(AUTH_ERROR_CODES.INTERNAL_ERROR, '認証エラーが発生しました'),
      };
    }
  }

  /**
   * 統計情報を取得
   */
  async getStats() {
    const authCacheStats = this.authCache ? this.authCache.getStats() : { enabled: false };
    const permissionCacheStats = this.permissionCache
      ? this.permissionCache.getStats()
      : { enabled: false };
    const rateLimitStats = await rateLimiter.getStats();

    return {
      authCache: authCacheStats,
      permissionCache: permissionCacheStats,
      rateLimit: rateLimitStats,
      config: {
        jwtExpiresIn: this.config?.jwtExpiresIn || '15m',
        maxLoginAttempts: this.config?.maxLoginAttempts || 5,
        lockoutDuration: this.config?.lockoutDuration || 900,
      },
    };
  }
}
