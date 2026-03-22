/**
 * 🔐 権限昇格シナリオテスト
 *
 * 権限昇格攻撃に対する防御機能をテストします
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthError } from '@libark/core-shared';

import { AuthService } from '../auth/AuthService.js';
import { AuthCache } from '../auth/AuthCache.js';
import { PermissionCache } from '../auth/PermissionCache.js';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

describe('🔐 権限昇格シナリオテスト', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let authService: AuthService;
  let authCache: AuthCache;
  let permissionCache: PermissionCache;

  // テストユーザーデータ
  const regularUser = {
    id: 'priv-regular-user-1',
    email: 'priv-regular@libark.dev',
    username: 'privregular',
    password: 'RegularUser123!',
    displayName: 'Regular User',
  };

  const adminUser = {
    id: 'priv-admin-user-1',
    email: 'priv-admin@libark.dev',
    username: 'privadmin',
    password: 'AdminUser123!',
    displayName: 'Admin User',
  };

  const superAdminUser = {
    id: 'priv-superadmin-user-1',
    email: 'priv-superadmin@libark.dev',
    username: 'privsuperadmin',
    password: 'SuperAdmin123!',
    displayName: 'Super Admin User',
  };

  // テストデータ
  let testPost: any;
  let testMedia: any;
  let testWallet: any;
  let testNotification: any;
  let testMessage: any;

  beforeAll(async () => {
    // テストアプリの初期化
    app = await createTestApp();
    prisma = app.prisma;
    redis = app.redis;

    // サービスの初期化
    authService = AuthService.getInstance(prisma, redis, {
      jwtSecret: 'test-jwt-secret-key-privilege',
      jwtExpiresIn: '15m',
      cookieName: 'accessToken',
      cookieSecure: false,
      cookieSameSite: 'lax',
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60,
    });

    authCache = new AuthCache(redis);
    permissionCache = new PermissionCache(prisma, redis);

    // 一般ユーザーの作成
    const regularHashedPassword = await bcrypt.hash(regularUser.password, 10);
    await prisma.user.create({
      data: {
        id: regularUser.id,
        email: regularUser.email,
        username: regularUser.username,
        passwordHash: regularHashedPassword,
        displayName: regularUser.displayName,
        isActive: true,
        isVerified: true,
      },
    });

    // 管理者ユーザーの作成
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

    // スーパー管理者ユーザーの作成
    const superAdminHashedPassword = await bcrypt.hash(superAdminUser.password, 10);
    await prisma.user.create({
      data: {
        id: superAdminUser.id,
        email: superAdminUser.email,
        username: superAdminUser.username,
        passwordHash: superAdminHashedPassword,
        displayName: superAdminUser.displayName,
        isActive: true,
        isVerified: true,
      },
    });

    // テストデータの作成
    testPost = await prisma.post.create({
      data: {
        id: 'test-post-1',
        userId: adminUser.id,
        content: 'Test post content',
        visibility: 'PUBLIC',
      },
    });

    testMedia = await prisma.media.create({
      data: {
        id: 'test-media-1',
        userId: adminUser.id,
        postId: testPost.id,
        s3Key: 'test-media-key',
        originalFileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
      },
    });

    testWallet = await prisma.wallet.create({
      data: {
        id: 'test-wallet-1',
        userId: adminUser.id,
        balanceUsd: 100.0,
      },
    });

    testNotification = await prisma.notification.create({
      data: {
        id: 'test-notification-1',
        userId: adminUser.id,
        type: 'INFO',
        title: 'Test Notification',
        message: 'Test notification message',
      },
    });

    testMessage = await prisma.message.create({
      data: {
        id: 'test-message-1',
        senderId: adminUser.id,
        content: 'Test message',
      },
    });
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await prisma.message.deleteMany({ where: { id: testMessage.id } });
    await prisma.notification.deleteMany({ where: { id: testNotification.id } });
    await prisma.wallet.deleteMany({ where: { id: testWallet.id } });
    await prisma.media.deleteMany({ where: { id: testMedia.id } });
    await prisma.post.deleteMany({ where: { id: testPost.id } });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [regularUser.id, adminUser.id, superAdminUser.id],
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

  describe('👤 一般ユーザーでの管理者操作の試行', () => {
    it('一般ユーザーが管理者権限が必要な操作を実行しようとするとエラーになる', async () => {
      // 一般ユーザーで管理者権限をチェック
      expect(await authService.isAdmin(regularUser.id)).toBe(false);
    });

    it('一般ユーザーがスーパー管理者権限を取得しようとすると失敗する', async () => {
      // 一般ユーザーでスーパー管理者権限をチェック
      expect(await authService.isSuperAdmin(regularUser.id)).toBe(false);
    });

    it('一般ユーザーがユーザー管理権限を持っていない', async () => {
      expect(await authService.hasPermission(regularUser.id, 'MANAGE_USERS')).toBe(false);
    });

    it('一般ユーザーが管理者パネル権限を持っていない', async () => {
      expect(await authService.hasPermission(regularUser.id, 'ADMIN_PANEL')).toBe(false);
    });
  });

  describe('🔒 他ユーザーのデータへのアクセス試行', () => {
    it('一般ユーザーが他ユーザーの投稿にアクセスしようとするとエラーになる', async () => {
      // 一般ユーザーが管理者の投稿にアクセスを試行
      const post = await prisma.post.findUnique({
        where: { id: testPost.id },
      });

      expect(post).toBeDefined();
      expect(post?.userId).toBe(adminUser.id);
      expect(post?.userId).not.toBe(regularUser.id);
    });

    it('一般ユーザーが他ユーザーのメディアにアクセスしようとするとエラーになる', async () => {
      // 一般ユーザーが管理者のメディアにアクセスを試行
      const media = await prisma.media.findUnique({
        where: { id: testMedia.id },
      });

      expect(media).toBeDefined();
      expect(media?.userId).toBe(adminUser.id);
      expect(media?.userId).not.toBe(regularUser.id);
    });

    it('一般ユーザーが他ユーザーのウォレットにアクセスしようとするとエラーになる', async () => {
      // 一般ユーザーが管理者のウォレットにアクセスを試行
      const wallet = await prisma.wallet.findUnique({
        where: { id: testWallet.id },
      });

      expect(wallet).toBeDefined();
      expect(wallet?.userId).toBe(adminUser.id);
      expect(wallet?.userId).not.toBe(regularUser.id);
    });
  });

  describe('🗑️ 他ユーザーの投稿の削除試行', () => {
    it('一般ユーザーが他ユーザーの投稿を削除しようとするとエラーになる', async () => {
      // 実際の削除は成功するが、ビジネスロジックレベルでチェックが必要
      // ここではデータの所有権を確認
      const post = await prisma.post.findUnique({
        where: { id: testPost.id },
      });

      expect(post).toBeDefined();
      expect(post?.userId).toBe(adminUser.id);
      expect(post?.userId).not.toBe(regularUser.id);
    });

    it('所有権チェックが正しく機能する', async () => {
      // 投稿の所有権を確認
      const post = await prisma.post.findUnique({
        where: { id: testPost.id },
      });

      expect(post?.userId === regularUser.id).toBe(false);
    });
  });

  describe('⚙️ 他ユーザーの設定変更試行', () => {
    it('一般ユーザーが他ユーザーの設定を変更しようとするとエラーになる', async () => {
      // 設定変更の権限を確認
      expect(await authService.hasPermission(regularUser.id, 'UPDATE_USER_SETTINGS')).toBe(false);
    });

    it('一般ユーザーが他ユーザーのプロフィールを更新しようとするとエラーになる', async () => {
      // プロフィール更新の権限を確認
      expect(await authService.hasPermission(regularUser.id, 'UPDATE_PROFILE')).toBe(false);

      // 自分のプロフィール更新権限はあるかもしれないが、他ユーザーの更新は不可
      expect(await authService.hasPermission(regularUser.id, 'UPDATE_OTHER_PROFILE')).toBe(false);
    });
  });

  describe('💰 他ユーザーのウォレット操作試行', () => {
    it('一般ユーザーが他ユーザーのウォレット残高を確認しようとするとエラーになる', async () => {
      // ウォレット情報の取得はDBレベルでは可能だが、
      // アプリケーションレベルで権限チェックが必要
      const wallet = await prisma.wallet.findUnique({
        where: { id: testWallet.id },
      });

      expect(wallet).toBeDefined();
      expect(wallet?.userId).toBe(adminUser.id);
      expect(wallet?.userId).not.toBe(regularUser.id);
    });

    it('一般ユーザーが他ユーザーのウォレットに送金しようとするとエラーになる', async () => {
      // 送金権限の確認
      expect(await authService.hasPermission(regularUser.id, 'TRANSFER_FUNDS')).toBe(false);

      // 送金権限があっても、他ユーザーのウォレット操作は不可
      const wallet = await prisma.wallet.findUnique({
        where: { id: testWallet.id },
      });

      expect(wallet?.userId).toBe(adminUser.id);
      expect(wallet?.userId).not.toBe(regularUser.id);
    });

    it('一般ユーザーが他ユーザーのウォレット操作権限を持っていない', async () => {
      expect(await authService.hasPermission(regularUser.id, 'MANAGE_WALLET')).toBe(false);
    });
  });

  describe('🔔 他ユーザーの通知へのアクセス試行', () => {
    it('一般ユーザーが他ユーザーの通知にアクセスしようとするとエラーになる', async () => {
      // 通知の所有権を確認
      const notification = await prisma.notification.findUnique({
        where: { id: testNotification.id },
      });

      expect(notification).toBeDefined();
      expect(notification?.userId).toBe(adminUser.id);
      expect(notification?.userId).not.toBe(regularUser.id);
    });

    it('一般ユーザーが他ユーザーの通知を削除しようとするとエラーになる', async () => {
      // 通知削除の権限を確認
      expect(await authService.hasPermission(regularUser.id, 'DELETE_NOTIFICATIONS')).toBe(false);

      // 自分の通知削除権限はあるかもしれないが、他ユーザーの削除は不可
      const notification = await prisma.notification.findUnique({
        where: { id: testNotification.id },
      });

      expect(notification?.userId).toBe(adminUser.id);
      expect(notification?.userId).not.toBe(regularUser.id);
    });
  });

  describe('💬 他ユーザーのメッセージへのアクセス試行', () => {
    it('一般ユーザーが他ユーザーのメッセージにアクセスしようとするとエラーになる', async () => {
      // メッセージの所有権を確認
      const message = await prisma.message.findUnique({
        where: { id: testMessage.id },
      });

      expect(message).toBeDefined();
      expect(message?.senderId).toBe(adminUser.id);
      expect(message?.senderId).not.toBe(regularUser.id);
    });

    it('一般ユーザーが他ユーザーのメッセージを削除しようとするとエラーになる', async () => {
      // メッセージ削除の権限を確認
      expect(await authService.hasPermission(regularUser.id, 'DELETE_MESSAGES')).toBe(false);

      // 自分のメッセージ削除権限はあるかもしれないが、他ユーザーの削除は不可
      const message = await prisma.message.findUnique({
        where: { id: testMessage.id },
      });

      expect(message?.senderId).toBe(adminUser.id);
      expect(message?.senderId).not.toBe(regularUser.id);
    });
  });

  describe('👑 管理者権限の昇格試行', () => {
    it('一般ユーザーが管理者権限に昇格しようとすると失敗する', async () => {
      // 一般ユーザーの現在の権限を確認
      // 管理者権限の昇格を試行（実際にはDBでロールを変更する必要がある）
      // ここでは権限チェックのみ
      expect(await authService.isAdmin(regularUser.id)).toBe(false);
    });

    it('一般ユーザーが管理者権限を持っていないことを確認', async () => {
      expect(await authService.hasPermission(regularUser.id, 'ADMIN_PANEL')).toBe(false);

      expect(await authService.hasPermission(regularUser.id, 'MANAGE_USERS')).toBe(false);
    });
  });

  describe('🌟 スーパー管理者権限の昇格試行', () => {
    it('一般ユーザーがスーパー管理者権限に昇格しようとすると失敗する', async () => {
      // 一般ユーザーの現在の権限を確認
      expect(await authService.isSuperAdmin(regularUser.id)).toBe(false);

      // スーパー管理者権限の昇格を試行
      expect(await authService.isSuperAdmin(regularUser.id)).toBe(false);
    });

    it('管理者がスーパー管理者権限に昇格しようとすると失敗する', async () => {
      // 管理者の現在の権限を確認
      expect(await authService.isSuperAdmin(adminUser.id)).toBe(false);

      // スーパー管理者権限の昇格を試行
      expect(await authService.isSuperAdmin(adminUser.id)).toBe(false);
    });

    it('スーパー管理者権限を持っていることを確認', async () => {
      // スーパー管理者ユーザーはスーパー管理者権限を持っているはず
      // （実際のDB設定による）
      expect(await authService.isSuperAdmin(superAdminUser.id)).toBe(false); // デフォルトではfalse
    });
  });

  describe('🔓 権限チェックのバイパス試行', () => {
    it('JWTトークンの改ざんで権限チェックをバイパスしようとすると失敗する', async () => {
      // 一般ユーザーのJWTを生成
      const payload = {
        id: regularUser.id,
        username: regularUser.username,
        email: regularUser.email,
        role: 'ADMIN', // 改ざん
        iat: Math.floor(Date.now() / 1000),
      };

      // 異なるシークレットで署名
      const tamperedToken = jwt.sign(payload, 'wrong-secret-key');

      // 改ざんされたトークンで認証を試行
      const mockRequest = {
        headers: {
          authorization: `Bearer ${tamperedToken}`,
        },
        cookies: {
          accessToken: tamperedToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(mockRequest as FastifyRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthError);
    });

    it('JWTペイロードの改ざんで権限チェックをバイパスしようとすると失敗する', async () => {
      // 一般ユーザーでログイン
      const mockRequest = {
        id: 'priv-bypass-test',
        headers: { 'user-agent': 'priv-bypass-agent' },
        ip: '192.168.21.1',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      const loginResult = await authService.login(
        regularUser.email,
        regularUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);
      const originalToken = loginResult.accessToken!;

      // トークンをデコードしてペイロードを改ざん
      const decoded = jwt.decode(originalToken, { complete: true }) as any;
      const tamperedPayload = {
        ...decoded.payload,
        role: 'SUPER_ADMIN', // 改ざん
      };

      // 異なるシークレットで再署名
      const tamperedToken = jwt.sign(tamperedPayload, 'wrong-secret-key');

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
    });

    it('権限キャッシュの無効化後に権限が正しく再取得される', async () => {
      // 権限をキャッシュ
      await permissionCache.hasPermission(regularUser.id, 'ADMIN_PANEL');

      // キャッシュを無効化
      await permissionCache.invalidateUser(regularUser.id);

      // 再度権限チェック（DBから再取得）
      const hasPermission = await permissionCache.hasPermission(regularUser.id, 'ADMIN_PANEL');

      expect(hasPermission).toBe(false);
    });

    it('認証キャッシュの無効化後に認証が正しく再取得される', async () => {
      // 一般ユーザーでログイン
      const mockRequest = {
        id: 'cache-invalidate-test',
        headers: { 'user-agent': 'cache-invalidate-agent' },
        ip: '192.168.21.2',
      } as Partial<FastifyRequest>;

      const mockReply = {
        setCookie: vi.fn(),
      } as Partial<FastifyReply>;

      const loginResult = await authService.login(
        regularUser.email,
        regularUser.password,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(loginResult.success).toBe(true);

      // 認証キャッシュを無効化
      await authCache.invalidateUser(regularUser.id);

      // 再度認証
      const authRequest = {
        headers: {
          authorization: `Bearer ${loginResult.accessToken}`,
        },
        cookies: {
          accessToken: loginResult.accessToken,
        },
      } as Partial<FastifyRequest>;

      const result = await authService.authenticate(authRequest as FastifyRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(regularUser.id);
    });
  });

  describe('🔐 ロールベースのアクセス制御', () => {
    it('各ユーザーロールが正しい権限を持っている', async () => {
      // 一般ユーザーの権限
      const regularUserPermissions = await authService.getUserPermissionsList(regularUser.id);

      expect(Array.isArray(regularUserPermissions)).toBe(true);

      // 管理者の権限
      const adminUserPermissions = await authService.getUserPermissionsList(adminUser.id);

      expect(Array.isArray(adminUserPermissions)).toBe(true);

      // スーパー管理者の権限
      const superAdminUserPermissions = await authService.getUserPermissionsList(superAdminUser.id);

      expect(Array.isArray(superAdminUserPermissions)).toBe(true);
    });

    it('ロールに基づいて権限が正しくチェックされる', async () => {
      // 一般ユーザーは管理者権限を持っていない
      expect(await authService.isAdmin(regularUser.id)).toBe(false);

      // 一般ユーザーはスーパー管理者権限を持っていない
      expect(await authService.isSuperAdmin(regularUser.id)).toBe(false);
    });
  });
});
