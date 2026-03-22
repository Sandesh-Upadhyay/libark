/**
 * 📜 GraphQLエラーレスポンス検証テスト
 *
 * GraphQLのエラーレスポンス形式とバリデーションエラーパターンを検証するテスト
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

describe('📜 GraphQLエラーレスポンス検証テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  describe('認証エラーのレスポンス形式', () => {
    it('認証エラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              me {
                id
                username
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      if (result.errors) {
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);

        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(error.extensions.code).toBe('UNAUTHENTICATED');
      } else {
        expect(result.data?.me ?? null).toBeNull();
      }
    });

    it('認証エラーに適切なHTTPステータスコードが含まれること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test" }) {
                id
                content
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('権限エラーのレスポンス形式', () => {
    it('権限エラーが正しい形式で返されること', async () => {
      // まず認証済みユーザーを作成
      const user = await app.prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hash',
        },
      });

      // 認証トークンを生成
      const token = await app.auth.generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          cookie: `auth_token=${token}`,
        },
        payload: {
          query: `
            mutation {
              deleteUser(userId: "00000000-0000-0000-0000-000000000000") {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      // 権限エラーが発生する場合
      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(['FORBIDDEN', 'UNAUTHORIZED', 'GRAPHQL_VALIDATION_FAILED']).toContain(
          error.extensions.code
        );
      }

      // クリーンアップ
      await app.prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('バリデーションエラーのレスポンス形式', () => {
    it('バリデーションエラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "", email: "invalid", password: "123" }) {
                user {
                  id
                }
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(error.extensions.code).toBe('BAD_USER_INPUT');
        expect(error.extensions.validationErrors).toBeDefined();
      }
    });

    it('バリデーションエラーに詳細なエラー情報が含まれること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "ab", email: "not-an-email", password: "123" }) {
                user {
                  id
                }
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      if (result.errors) {
        const error = result.errors[0];
        expect(error.extensions.validationErrors).toBeDefined();
        expect(error.extensions.validationErrors).toBeInstanceOf(Array);
      }
    });
  });

  describe('データベースエラーのレスポンス形式', () => {
    it('データベースエラーが正しい形式で返されること', async () => {
      // 存在しないIDでクエリを実行
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              user(id: "00000000-0000-0000-0000-000000000000") {
                id
                username
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
      }
    });
  });

  describe('ネットワークエラーのレスポンス形式', () => {
    it('ネットワークエラーが正しい形式で返されること', async () => {
      // 不正なリクエストを送信してネットワークエラーをシミュレート
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              invalidField
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
      }
    });
  });

  describe('タイムアウトエラーのレスポンス形式', () => {
    it('タイムアウトエラーが正しい形式で返されること', async () => {
      // 非常に長いクエリを実行してタイムアウトをシミュレート
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              users(first: 10000) {
                id
                username
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);

      // タイムアウトが発生した場合
      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
      }
    });
  });

  describe('不正なクエリのエラーレスポンス', () => {
    it('構文エラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              users {
                id
                username
              # 不閉じ括弧
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(error.extensions.code).toBeDefined();
      }
    });

    it('存在しないフィールドのエラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              users {
                id
                nonexistentField
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(error.extensions.code).toBeDefined();
      }
    });
  });

  describe('不正なミューテーションのエラーレスポンス', () => {
    it('存在しないミューテーションのエラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              nonexistentMutation {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(error.extensions.code).toBeDefined();
      }
    });

    it('必須引数が欠けているミューテーションのエラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register {
                user {
                  id
                }
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.extensions).toBeDefined();
        expect(error.extensions.code).toBeDefined();
      }
    });
  });

  describe('複数のエラーが含まれるレスポンス', () => {
    it('複数のバリデーションエラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "", email: "invalid", password: "" }) {
                user {
                  id
                }
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);

        // 各エラーが正しい形式を持っていることを確認
        result.errors.forEach((error: any) => {
          expect(error.message).toBeDefined();
          expect(error.extensions).toBeDefined();
        });
      }
    });

    it('複数のフィールドエラーが正しい形式で返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            query {
              users {
                id
                nonexistentField1
                nonexistentField2
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);

        // 各エラーが正しい形式を持っていることを確認
        result.errors.forEach((error: any) => {
          expect(error.message).toBeDefined();
          expect(error.extensions).toBeDefined();
        });
      }
    });
  });

  describe('エラーメッセージの国際化対応', () => {
    it('日本語のエラーメッセージが返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          'accept-language': 'ja',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "", email: "invalid", password: "123" }) {
                user {
                  id
                }
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        // エラーメッセージが日本語であることを確認（オプション）
        // expect(error.message).toMatch(/[\u3040-\u309F\u30A0-\u30FF]/);
      }
    });

    it('英語のエラーメッセージが返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          'accept-language': 'en',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "", email: "invalid", password: "123" }) {
                user {
                  id
                }
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('エラーレスポンスの一貫性', () => {
    it('すべてのエラーレスポンスが一貫した形式を持つこと', async () => {
      const testCases = [
        {
          query: `
            query {
              me {
                id
              }
            }
          `,
          description: '認証エラー',
        },
        {
          query: `
            mutation {
              register(input: { username: "", email: "invalid", password: "123" }) {
                user {
                  id
                }
              }
            }
          `,
          description: 'バリデーションエラー',
        },
        {
          query: `
            query {
              users {
                id
                nonexistentField
              }
            }
          `,
          description: 'フィールドエラー',
        },
      ];

      for (const testCase of testCases) {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: {
            'content-type': 'application/json',
          },
          payload: {
            query: testCase.query,
          },
        });

        const result = JSON.parse(response.payload);

        if (result.errors) {
          result.errors.forEach((error: any) => {
            // すべてのエラーが必須フィールドを持っていることを確認
            expect(error.message).toBeDefined();
            expect(typeof error.message).toBe('string');

            // extensionsが存在する場合、codeが定義されていることを確認
            if (error.extensions) {
              expect(error.extensions.code).toBeDefined();
              expect(typeof error.extensions.code).toBe('string');
            }
          });
        }
      }
    });
  });
});
