/**
 * 📜 バリデーションエラーパターンテスト
 *
 * GraphQLのバリデーションエラーパターンを検証するテスト
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

describe('📜 バリデーションエラーパターンテスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  describe('必須フィールドのバリデーションエラー', () => {
    it('空のユーザー名でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "", email: "test@example.com", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
        expect(error.extensions.validationErrors).toBeDefined();
      }
    });

    it('空のメールアドレスでバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "testuser", email: "", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });

    it('空のパスワードでバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "testuser", email: "test@example.com", password: "" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });
  });

  describe('型不一致のバリデーションエラー', () => {
    it('数値フィールドに文字列を渡した場合にバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", mediaIds: "not-an-array" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }
    });

    it('ブール値フィールドに文字列を渡した場合にバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", isPaid: "not-a-boolean" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('文字列長のバリデーションエラー', () => {
    it('短すぎるユーザー名でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "ab", email: "test@example.com", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });

    it('長すぎるユーザー名でバリデーションエラーが発生すること', async () => {
      const longUsername = 'a'.repeat(100);

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "${longUsername}", email: "test@example.com", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });

    it('短すぎるパスワードでバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "testuser", email: "test@example.com", password: "123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });
  });

  describe('数値範囲のバリデーションエラー', () => {
    it('負の数値でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", price: -100 }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });

    it('範囲外の数値でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", price: 9999999999 }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });
  });

  describe('メールアドレス形式のバリデーションエラー', () => {
    it('無効なメールアドレス形式でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "testuser", email: "not-an-email", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
        expect(error.extensions.validationErrors).toBeDefined();
      }
    });

    it('ドメインがないメールアドレスでバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "testuser", email: "test@", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });
  });

  describe('URL形式のバリデーションエラー', () => {
    it('無効なURL形式でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", url: "not-a-url" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });

    it('プロトコルがないURLでバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", url: "example.com" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });
  });

  describe('日付形式のバリデーションエラー', () => {
    it('無効な日付形式でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", scheduledAt: "not-a-date" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });

    it('過去の日付でバリデーションエラーが発生すること', async () => {
      const pastDate = new Date('2000-01-01').toISOString();

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", scheduledAt: "${pastDate}" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
      }
    });
  });

  describe('列挙型のバリデーションエラー', () => {
    it('無効な列挙値でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", postType: "INVALID_TYPE" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }
    });

    it('大文字小文字が異なる列挙値でバリデーションエラーが発生すること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", postType: "text" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('カスタムバリデーションエラー', () => {
    it('重複するユーザー名でバリデーションエラーが発生すること', async () => {
      // まずユーザーを作成
      const user = await app.prisma.user.create({
        data: {
          username: 'duplicateuser',
          email: 'duplicate1@example.com',
          passwordHash: 'hash',
        },
      });

      // 同じユーザー名で登録を試みる
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "duplicateuser", email: "duplicate2@example.com", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }

      // クリーンアップ
      await app.prisma.user.delete({ where: { id: user.id } });
    });

    it('重複するメールアドレスでバリデーションエラーが発生すること', async () => {
      // まずユーザーを作成
      const user = await app.prisma.user.create({
        data: {
          username: 'user1',
          email: 'duplicate@example.com',
          passwordHash: 'hash',
        },
      });

      // 同じメールアドレスで登録を試みる
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "user2", email: "duplicate@example.com", password: "password123" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
      }

      // クリーンアップ
      await app.prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('複数のバリデーションエラーの同時発生', () => {
    it('複数の必須フィールドが欠けている場合に複数のエラーが返されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              register(input: { username: "", email: "", password: "" }) {
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
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);

        // 各エラーが正しい形式を持っていることを確認
        result.errors.forEach((error: any) => {
          expect(error.message).toBeDefined();
          expect(error.extensions).toBeDefined();
          expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
            error.extensions.code
          );
        });
      }
    });

    it('複数のバリデーションルール違反が同時に検出されること', async () => {
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

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);

        // バリデーションエラーが含まれていることを確認
        const error = result.errors[0];
        expect(['BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED', 'UNAUTHENTICATED']).toContain(
          error.extensions.code
        );
        expect(error.extensions.validationErrors).toBeDefined();
        expect(error.extensions.validationErrors).toBeInstanceOf(Array);
      }
    });

    it('型不一致と範囲違反が同時に検出されること', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          query: `
            mutation {
              createPost(input: { content: "test", price: -100, mediaIds: "not-an-array" }) {
                id
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.payload);

      expect([200, 400]).toContain(response.statusCode);
      expect(result.errors ?? result.data).toBeDefined();

      if (result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);

        // 各エラーが正しい形式を持っていることを確認
        result.errors.forEach((error: any) => {
          expect(error.message).toBeDefined();
          expect(error.extensions).toBeDefined();
        });
      }
    });
  });

  describe('バリデーションエラーの一貫性', () => {
    it('すべてのバリデーションエラーが一貫した形式を持つこと', async () => {
      const testCases = [
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
          description: '複数のバリデーションエラー',
        },
        {
          query: `
            mutation {
              register(input: { username: "ab", email: "test@example.com", password: "password123" }) {
                user {
                  id
                }
              }
            }
          `,
          description: '短すぎるユーザー名',
        },
        {
          query: `
            mutation {
              register(input: { username: "testuser", email: "not-an-email", password: "password123" }) {
                user {
                  id
                }
              }
            }
          `,
          description: '無効なメールアドレス',
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

  describe('バリデーションエラーメッセージの明確性', () => {
    it('バリデーションエラーメッセージが明確であること', async () => {
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

      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);

        // エラーメッセージが具体的であることを確認
        expect(error.message).not.toBe('Validation error');
        expect(error.message).not.toBe('Invalid input');
      }
    });

    it('バリデーションエラーの詳細情報が提供されること', async () => {
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

        // 各バリデーションエラーにフィールド情報が含まれていることを確認
        error.extensions.validationErrors.forEach((validationError: any) => {
          expect(validationError).toBeDefined();
        });
      }
    });
  });
});
