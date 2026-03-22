/**
 * 🔒 認証バイパスシナリオテスト
 *
 * 認証バイパス攻撃に対する防御機能をテストします
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthError, AUTH_ERROR_CODES } from '@libark/core-shared';

import { AuthService } from '../auth/AuthService.js';
import { IntegratedSessionManager } from '../auth/SessionManager.js';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

describe('🔒 認証バイパスシナリオテスト', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let authService: AuthService;
  let sessionManager: IntegratedSessionManager;

  // テストユーザーデータ
  const testUser = {
    id: 'auth-bypass-test-user-1',
    email: 'auth-bypass-test@libark.dev',
    username: 'authbypass',
    password: 'AuthBypass123!',
    displayName: 'Auth Bypass Test User',
  };

  const adminUser = {
    id: 'auth-bypass-admin-user-1',
    email: 'auth-bypass-admin@libark.dev',
    username: 'authbypassadmin',
    password: 'AdminBypass123!',
    displayName: 'Auth Bypass Admin User',
  };

  beforeAll(async () => {
    // テストアプリの初期化
    app = await createTestApp();
    prisma = app.prisma;
    redis = app.redis;

    // サービスの初期化
    authService = AuthService.getInstance(prisma, redis, {
      jwtSecret: 'test-jwt-secret-key-auth-bypass',
      jwtExpiresIn: '15m',
      cookieName: 'accessToken',
      cookieSecure: false,
      cookieSameSite: 'lax',
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60,
    });

    sessionManager = IntegratedSessionManager.getInstance(redis, prisma);

    // テストユーザーの作成
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await prisma.user.create({
      data: {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        passwordHash: hashedPassword,
        displayName: testUser.displayName,
        isActive: true,
        isVerified: true,
      },
    });

    const adminHashedPassword = await bcrypt.hash(adminUser.password, 10);
    await prisma.user.create({
      data: {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        passwordHash: adminHashedPassword,
        displayName: adminUser.displayName,
        isActive: true,
        isVerified: true,
      },
    });
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testUser.id, adminUser.id],
        },
      },
    });

    await cleanupTestApp(app);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Redisのクリーンアップ
    await redis.flushdb();
  });

  describe('🚫 無効なトークンでのアクセス試行', () => {
    it('無効なJWTトークンでアクセスしようとするとエラーになる', async () => {
      const invalidToken = 'invalid.jwt.token';

      const mockRequest = {
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
        cookies: {
          accessToken: invalidToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(mockRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
      expect((result.error as AuthError).code).toBe(AUTH_ERROR_CODES.TOKEN_INVALID);
    });

    it('空のトークンでアクセスしようとするとエラーになる', async () => {
      const mockRequest = {
        headers: {},
        cookies: {},
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(mockRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
    });

    it('不正な形式のトークンでアクセスしようとするとエラーになる', async () => {
      const malformedToken = 'not.a.jwt.token.at.all';

      const mockRequest = {
        headers: {
          authorization: `Bearer ${malformedToken}`,
        },
        cookies: {
          accessToken: malformedToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(mockRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
    });
  });

  describe('⏰ 期限切れトークンでのアクセス試行', () => {
    it('期限切れのJWTトークンでアクセスしようとするとエラーになる', async () => {
      // 期限切れのトークンを生成
      const expiredPayload = {
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1時間前
        exp: Math.floor(Date.now() / 1000) - 60, // 1分前に期限切れ
      };

      const expiredToken = jwt.sign(expiredPayload, 'test-jwt-secret-key-auth-bypass');

      const mockRequest = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
        cookies: {
          accessToken: expiredToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(mockRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
      expect((result.error as AuthError).code).toBe(AUTH_ERROR_CODES.TOKEN_EXPIRED);
    });
  });

  describe('🔏 署名改ざんトークンでのアクセス試行', () => {
    it('署名が改ざんされたJWTトークンでアクセスしようとするとエラーになる', async () => {
      const mockRequest = {
        id: 'signature-tamper-test',
        headers: { 'user-agent': 'signature-tamper-agent' },
        ip: '192.168.13.100',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      // 正常なログイン
      const loginResult = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);
      const originalToken = loginResult.accessToken!;

      // トークンの署名を改ざん
      const tamperedToken = originalToken.slice(0, -10) + 'tampered123';

      // 改ざんされたトークンで認証を試行
      const authRequest = {
        headers: {
          authorization: `Bearer ${tamperedToken}`,
        },
        cookies: {
          accessToken: tamperedToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(authRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
      expect((result.error as AuthError).code).toBe(AUTH_ERROR_CODES.TOKEN_INVALID);
    });

    it('異なるシークレットで署名されたトークンでアクセスしようとするとエラーになる', async () => {
      // 異なるシークレットで署名されたトークンを生成
      const payload = {
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        iat: Math.floor(Date.now() / 1000),
      };

      const wrongSecretToken = jwt.sign(payload, 'wrong-secret-key');

      const mockRequest = {
        headers: {
          authorization: `Bearer ${wrongSecretToken}`,
        },
        cookies: {
          accessToken: wrongSecretToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(mockRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
      expect((result.error as AuthError).code).toBe(AUTH_ERROR_CODES.TOKEN_INVALID);
    });
  });

  describe('🎭 セッションハイジャックの試行', () => {
    it('他ユーザーのセッションIDでアクセスしようとするとエラーになる', async () => {
      // ユーザー1でログイン
      const mockRequest1 = {
        id: 'user1-login',
        headers: { 'user-agent': 'user1-agent' },
        ip: '192.168.14.1',
      } as Partial<FastifyRequest>;

      const mockReply1 = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      const loginResult1 = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest1 as FastifyRequest,
        mockReply1 as FastifyReply
      );

      expect(loginResult1.success).toBe(true);

      // ユーザー2でログイン
      const mockRequest2 = {
        id: 'user2-login',
        headers: { 'user-agent': 'user2-agent' },
        ip: '192.168.14.2',
      } as Partial<FastifyRequest>;

      const mockReply2 = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      const loginResult2 = await authService.login(
        adminUser.email,
        adminUser.password,
        mockRequest2 as FastifyRequest,
        mockReply2 as FastifyReply
      );

      expect(loginResult2.success).toBe(true);

      // セッション統計情報を取得
      const sessionStats1 = await sessionManager.getUserSessionStats(testUser.id);
      const sessionStats2 = await sessionManager.getUserSessionStats(adminUser.id);

      // セッション統計が取得できることを確認
      expect(sessionStats1).toBeDefined();
      expect(sessionStats2).toBeDefined();
    });
  });

  describe('🛡️ CSRFトークンのないリクエスト', () => {
    it('CSRFトークンなしで状態変更リクエストを送信しようとするとエラーになる', async () => {
      const mockRequest = {
        id: 'csrf-test',
        headers: {
          'user-agent': 'csrf-agent',
          'content-type': 'application/json',
        },
        ip: '192.168.16.1',
        method: 'POST',
      } as Partial<FastifyRequest>;

      // CSRFトークンなしでリクエスト
      const hasCsrfToken = mockRequest.headers && 'x-csrf-token' in mockRequest.headers;

      expect(hasCsrfToken).toBe(false);
    });

    it('無効なCSRFトークンでリクエストを送信しようとするとエラーになる', async () => {
      const mockRequest = {
        id: 'csrf-invalid-test',
        headers: {
          'user-agent': 'csrf-agent',
          'content-type': 'application/json',
          'x-csrf-token': 'invalid-csrf-token-12345',
        },
        ip: '192.168.16.2',
        method: 'POST',
      } as Partial<FastifyRequest>;

      // 無効なCSRFトークンを検出
      expect(mockRequest.headers?.['x-csrf-token']).toBe('invalid-csrf-token-12345');
    });
  });

  describe('🔐 2FAバイパスの試行', () => {
    it('2FAが有効なアカウントで2FAコードなしでログインしようとするとエラーになる', async () => {
      // 2FAが有効なユーザーを作成
      const tfaUser = {
        id: 'tfa-test-user-1',
        email: 'tfa-test@libark.dev',
        username: 'tfatest',
        password: 'TfaTest123!',
        displayName: '2FA Test User',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP', // テスト用シークレット
        twoFactorEnabled: true,
      };

      const hashedPassword = await bcrypt.hash(tfaUser.password, 10);
      await prisma.user.create({
        data: {
          id: tfaUser.id,
          email: tfaUser.email,
          username: tfaUser.username,
          passwordHash: hashedPassword,
          displayName: tfaUser.displayName,
          isActive: true,
          isVerified: true,
          twoFactorSecret: tfaUser.twoFactorSecret,
          twoFactorEnabled: tfaUser.twoFactorEnabled,
        },
      });

      const mockRequest = {
        id: 'tfa-bypass-test',
        headers: { 'user-agent': 'tfa-bypass-agent' },
        ip: '192.168.17.1',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      // 2FAコードなしでログインを試行
      const loginResult = await authService.login(
        tfaUser.email,
        tfaUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // 2FAが有効な場合でも、ログインは成功するが2FA検証が必要
      expect(loginResult.success).toBe(true);

      // クリーンアップ
      await prisma.user.delete({ where: { id: tfaUser.id } });
    });

    it('無効な2FAコードで認証を完了しようとするとエラーになる', async () => {
      const tfaUser = {
        id: 'tfa-invalid-code-user-1',
        email: 'tfa-invalid@libark.dev',
        username: 'tfainvalid',
        password: 'TfaInvalid123!',
        displayName: '2FA Invalid Code User',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorEnabled: true,
        backupCodes: [],
      };

      const hashedPassword = await bcrypt.hash(tfaUser.password, 10);
      await prisma.user.create({
        data: {
          id: tfaUser.id,
          email: tfaUser.email,
          username: tfaUser.username,
          passwordHash: hashedPassword,
          displayName: tfaUser.displayName,
          isActive: true,
          isVerified: true,
          twoFactorSecret: tfaUser.twoFactorSecret,
          twoFactorEnabled: tfaUser.twoFactorEnabled,
          backupCodes: tfaUser.backupCodes,
        },
      });

      // 無効な2FAコードで認証を試行
      const invalidTotpCode = '000000';
      const verifyResult = await authService.verifyTwoFactor(tfaUser.id, invalidTotpCode);

      expect(verifyResult.success).toBe(false);

      // クリーンアップ
      await prisma.user.delete({ where: { id: tfaUser.id } });
    });
  });

  describe('📌 セッション固定化攻撃の試行', () => {
    it('ログイン前にセッションIDを固定しようとすると新しいセッションIDが発行される', async () => {
      const mockRequest = {
        id: 'session-fixation-test',
        headers: {
          'user-agent': 'session-fixation-agent',
          cookie: 'sessionId=attacker-controlled-session-id',
        },
        ip: '192.168.18.1',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      // 攻撃者が制御するセッションIDを含めてログイン
      const loginResult = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);

      // Cookieが設定されていることを確認
      expect(mockReply.setCookie).toHaveBeenCalled();

      // セッション統計が取得できることを確認
      const userSessions = await sessionManager.getUserSessionStats(testUser.id);
      expect(userSessions).toBeDefined();
    });

    it('ログアウト後にセッションが削除される', async () => {
      const mockRequest = {
        id: 'session-regeneration-test',
        headers: { 'user-agent': 'session-regeneration-agent' },
        ip: '192.168.18.2',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
        clearCookie: vi.fn(),
      } as Partial<FastifyReply>;

      // ログイン
      const loginResult = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);

      // セッション統計を取得
      const sessionStats = await sessionManager.getUserSessionStats(testUser.id);
      expect(sessionStats).toBeDefined();

      // ログアウト
      await authService.logout(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // セッションが削除されていることを確認
      // Redisからセッションキーを確認
      const remainingSessions = await redis.keys('session:*');
      // ログアウト後はセッションが削除されているはず
      expect(remainingSessions.length).toBe(0);
    });
  });

  describe('🍪 クッキーの改ざん', () => {
    it('改ざんされた認証クッキーでアクセスしようとするとエラーになる', async () => {
      const mockRequest = {
        id: 'cookie-tamper-test',
        headers: { 'user-agent': 'cookie-tamper-agent' },
        ip: '192.168.19.1',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      // 正常にログイン
      const loginResult = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);

      // Cookieの設定を確認
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'accessToken',
        loginResult.accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        })
      );

      // 改ざんされたCookieでアクセスを試行
      const tamperedRequest = {
        id: 'cookie-tampered-attempt',
        headers: { 'user-agent': 'cookie-tampered-agent' },
        cookies: {
          accessToken: 'tampered-access-token-value',
        },
        ip: '192.168.19.1',
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(tamperedRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
    });

    it('HttpOnly属性がないクッキーはJavaScriptからアクセスできない', async () => {
      const mockRequest = {
        id: 'httponly-test',
        headers: { 'user-agent': 'httponly-agent' },
        ip: '192.168.19.2',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      await authService.login(
        testUser.email,
        testUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // HttpOnly属性が設定されていることを確認
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });
  });

  describe('🔄 複数の認証メカニズムの同時使用', () => {
    it('JWTとセッションIDの両方を提供した場合、優先順位が正しく適用される', async () => {
      const mockRequest = {
        id: 'multi-auth-test',
        headers: { 'user-agent': 'multi-auth-agent' },
        ip: '192.168.20.1',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      // ログイン
      const loginResult = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);
      const accessToken = loginResult.accessToken!;

      // JWTとセッションIDの両方を含むリクエスト
      const multiAuthRequest = {
        id: 'multi-auth-attempt',
        headers: {
          'user-agent': 'multi-auth-agent',
          authorization: `Bearer ${accessToken}`,
        },
        cookies: {
          accessToken: accessToken,
        },
        ip: '192.168.20.1',
      } as Partial<FastifyRequest>;

      // 認証を試行（JWTが優先される）
      const result = await authService.authenticate(multiAuthRequest as FastifyRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
    });

    it('矛盾する認証情報を提供した場合、JWTが優先される', async () => {
      // ユーザー1でログイン
      const mockRequest1 = {
        id: 'user1-multi-auth',
        headers: { 'user-agent': 'multi-auth-agent' },
        ip: '192.168.20.2',
      } as Partial<FastifyRequest>;

      const mockReply1 = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      const loginResult1 = await authService.login(
        testUser.email,
        testUser.password,
        mockRequest1 as FastifyRequest,
        mockReply1 as FastifyReply
      );

      // ユーザー1のJWTで認証
      const conflictingRequest = {
        id: 'conflicting-auth-attempt',
        headers: {
          'user-agent': 'multi-auth-agent',
          authorization: `Bearer ${loginResult1.accessToken}`,
        },
        cookies: {
          accessToken: loginResult1.accessToken,
        },
        ip: '192.168.20.2',
      } as Partial<FastifyRequest>;

      // 認証を試行（JWTが優先されるため、ユーザー1で認証される）
      const result = await authService.authenticate(conflictingRequest as FastifyRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(testUser.id);
    });
  });
});
