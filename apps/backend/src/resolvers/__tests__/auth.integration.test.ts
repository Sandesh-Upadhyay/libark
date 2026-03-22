/**
 * 🧪 GraphQL認証リゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData } from '../../__tests__/helpers/test-data.js';
import { UserFactory } from '../../__tests__/factories/index.js';

describe('🔐 GraphQL認証リゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;

  // テスト用ユーザーデータ（ユニークにするためタイムスタンプとランダム値を追加）
  let testUser: { email: string; username: string; password: string; displayName: string };

  beforeAll(async () => {
    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // ユニークなテストユーザーデータを生成（短縮版）
    const timestamp = Date.now() % 1000000; // 下位6桁のみ
    const randomId = Math.random().toString(36).substring(2, 8); // 6文字のランダム文字列
    const email = `gql-${timestamp}-${randomId}@libark.dev`;
    const username = `gql-${timestamp}-${randomId}`;

    const user = await userFactory.createWithPassword('GraphQLTest123!', {
      email,
      username,
      displayName: 'GraphQL Test User',
    });

    testUser = {
      email: user.email,
      username: user.username,
      password: 'GraphQLTest123!',
      displayName: user.displayName || 'GraphQL Test User',
    };
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  describe('🔑 ログインミューテーション', () => {
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          success
          message
          user {
            id
            username
            email
            displayName
            isActive
          }
          accessToken
        }
      }
    `;

    it('正常なログインが成功する', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: testUser.email,
              password: testUser.password,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.login.success).toBe(true);
      expect(result.data.login.user.email).toBe(testUser.email);
      expect(result.data.login.accessToken).toBeDefined();

      // Cookieが設定されているか確認
      const cookies = response.cookies;
      expect(cookies.some(cookie => cookie.name === 'accessToken')).toBe(true);
    });

    it('無効なパスワードでログインが失敗する', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: testUser.email,
              password: 'wrong-password',
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    it('存在しないユーザーでログインが失敗する', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: 'nonexistent@example.com',
              password: testUser.password,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      // レート制限が発動している場合とそうでない場合の両方を許可
      expect(['UNAUTHENTICATED', 'RATE_LIMIT_EXCEEDED']).toContain(
        result.errors[0].extensions.code
      );
    });

    it('バリデーションエラーが正しく処理される', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: 'invalid-email',
              password: '123', // 短すぎるパスワード
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
  });

  describe('👤 meクエリ', () => {
    const meQuery = `
      query Me {
        me {
          id
          username
          email
          displayName
          isActive
        }
      }
    `;

    it('認証済みユーザーの情報を取得できる', async () => {
      // まずログインしてCookieを取得
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                success
                accessToken
              }
            }
          `,
          variables: {
            input: {
              email: testUser.email,
              password: testUser.password,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      const loginCookies = loginResponse.cookies;
      const accessTokenCookie = loginCookies.find(cookie => cookie.name === 'accessToken');

      // meクエリを実行
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: meQuery,
        },
        headers: {
          'content-type': 'application/json',
          cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();

      if (!result.data.me) {
        throw new Error('meクエリがnullを返しました。認証に失敗している可能性があります。');
      }

      expect(result.data.me).toBeDefined();
      expect(result.data.me.email).toBe(testUser.email);
    });

    it('未認証ユーザーはnullを返す', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: meQuery,
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.me).toBeNull();
    });
  });

  describe('🚪 ログアウトミューテーション', () => {
    const logoutMutation = `
      mutation Logout {
        logout {
          success
          message
        }
      }
    `;

    it('認証済みユーザーがログアウトできる', async () => {
      // まずログイン
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                success
                accessToken
              }
            }
          `,
          variables: {
            input: {
              email: testUser.email,
              password: testUser.password,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      const loginCookies = loginResponse.cookies;
      const accessTokenCookie = loginCookies.find(cookie => cookie.name === 'accessToken');

      // ログアウト
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: logoutMutation,
        },
        headers: {
          'content-type': 'application/json',
          cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.logout.success).toBe(true);

      // Cookieがクリアされているか確認
      const logoutCookies = response.cookies;
      const clearedCookie = logoutCookies.find(cookie => cookie.name === 'accessToken');
      expect(clearedCookie?.value).toBe('');
    });
  });
});
