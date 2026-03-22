/**
 * 🧪 Upload Session GraphQLリゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { createTestUser, cleanupTestData } from './helpers/test-data.js';

describe('📤 Upload Session GraphQLリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  // テスト用ユーザーデータ
  let testUser = {
    email: '',
    username: '',
    password: 'UploadTest123!',
    displayName: 'Upload Test User',
  };

  // JWT Secret (環境変数から取得)
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // ユニークなテストユーザーデータを生成
    const timestamp = Date.now() % 1000000;
    const randomId = Math.random().toString(36).substring(2, 8);
    testUser = {
      email: `upload-${timestamp}-${randomId}@libark.dev`,
      username: `upload-${timestamp}-${randomId}`,
      password: 'UploadTest123!',
      displayName: 'Upload Test User',
    };

    await createTestUser(app.prisma, testUser);
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  // ヘルパー関数: ユーザーでログインしてCookieを取得
  async function loginAndGetCookie() {
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
    return `${accessTokenCookie?.name}=${accessTokenCookie?.value}`;
  }

  // ヘルパー関数: ユーザーをDBから取得
  async function getUserFromDb() {
    return await app.prisma.user.findUnique({
      where: { email: testUser.email },
    });
  }

  // ヘルパー関数: Redisからセッションを取得
  async function getSessionFromRedis(uploadId: string) {
    const key = `upload:session:${uploadId}`;
    const data = await app.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ヘルパー関数: Redisセッションを更新
  async function updateSessionInRedis(uploadId: string, updates: any) {
    const key = `upload:session:${uploadId}`;
    const currentData = await getSessionFromRedis(uploadId);
    if (currentData) {
      const updatedData = { ...currentData, ...updates };
      await app.redis.set(key, JSON.stringify(updatedData));
      // TTLを再設定（10分）
      await app.redis.expire(key, 600);
    }
  }

  // ヘルパー関数: Redisセッションを削除
  async function deleteSessionFromRedis(uploadId: string) {
    const key = `upload:session:${uploadId}`;
    await app.redis.del(key);
  }

  // ヘルパー関数: トークンを検証
  function verifyUploadToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as {
        uploadId: string;
        userId: string;
        aud: string;
        exp: number;
      };
    } catch {
      // トークン検証エラーは無視してnullを返す
      return null;
    }
  }

  // ヘルパー関数: 期限切れのトークンを作成
  function createExpiredToken(uploadId: string, userId: string) {
    return jwt.sign({ uploadId, userId, aud: 's3-gateway-upload' }, JWT_SECRET, {
      expiresIn: '-1h',
    });
  }

  describe('createUploadSession', () => {
    const createUploadSessionMutation = `
      mutation CreateUploadSession($input: CreateUploadSessionInput!) {
        createUploadSession(input: $input) {
          uploadId
          uploadPath
          uploadAuthToken
          expiresAt
          requiredHeaders {
            key
            value
          }
          maxBytes
        }
      }
    `;

    it('正しいUploadSessionが返される', async () => {
      const cookie = await loginAndGetCookie();
      const user = await getUserFromDb();

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.createUploadSession).toBeDefined();

      const { uploadId, uploadPath, uploadAuthToken, expiresAt, requiredHeaders, maxBytes } =
        result.data.createUploadSession;

      // uploadIdがUUID形式であることを確認
      expect(uploadId).toBeDefined();
      expect(uploadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // uploadPathが正しい形式であることを確認
      expect(uploadPath).toBeDefined();
      expect(uploadPath).toContain('/upload/');

      // uploadAuthTokenがJWTであることを確認
      expect(uploadAuthToken).toBeDefined();
      const decodedToken = verifyUploadToken(uploadAuthToken);
      expect(decodedToken).toBeDefined();
      expect(decodedToken?.uploadId).toBe(uploadId);
      if (user) {
        expect(decodedToken?.userId).toBe(user.id);
      }
      expect(decodedToken?.aud).toBe('s3-gateway-upload');

      // expiresAtが未来であることを確認
      expect(expiresAt).toBeDefined();
      const expiresDate = new Date(expiresAt);
      expect(expiresDate.getTime()).toBeGreaterThan(Date.now());

      // requiredHeadersが正しく返ることを確認
      expect(requiredHeaders).toBeDefined();
      expect(Array.isArray(requiredHeaders)).toBe(true);
      expect(requiredHeaders.length).toBeGreaterThan(0);

      // maxBytesが正しく返ることを確認
      expect(maxBytes).toBeDefined();
      expect(maxBytes).toBeGreaterThan(0);
    });

    it('異なるkindで正しいmaxBytesが返る', async () => {
      const cookie = await loginAndGetCookie();

      const testCases = [
        { kind: 'POST', expectedMaxBytes: 10 * 1024 * 1024 }, // 10MB
        { kind: 'AVATAR', expectedMaxBytes: 5 * 1024 * 1024 }, // 5MB
        { kind: 'COVER', expectedMaxBytes: 10 * 1024 * 1024 }, // 10MB
      ];

      for (const testCase of testCases) {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createUploadSessionMutation,
            variables: {
              input: {
                kind: testCase.kind,
                filename: 'test.jpg',
                contentType: 'image/jpeg',
                byteSize: 1024,
              },
            },
          },
          headers: {
            'content-type': 'application/json',
            cookie,
          },
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.createUploadSession.maxBytes).toBe(testCase.expectedMaxBytes);
      }
    });
  });

  describe('createUploadSession - 異常系', () => {
    const createUploadSessionMutation = `
      mutation CreateUploadSession($input: CreateUploadSessionInput!) {
        createUploadSession(input: $input) {
          uploadId
        }
      }
    `;

    it('無効なContentTypeでエラー', async () => {
      const cookie = await loginAndGetCookie();

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.pdf',
              contentType: 'application/pdf',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.errors[0].message).toContain('サポートされているファイル形式');
    });

    it('サイズ超過でエラー', async () => {
      const cookie = await loginAndGetCookie();

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 11 * 1024 * 1024, // 11MB (POSTの制限は10MB)
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('FILE_SIZE_TOO_LARGE');
    });

    it('認証なしでエラー', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
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

    it('機能無効でエラー', async () => {
      const cookie = await loginAndGetCookie();
      const user = await getUserFromDb();

      if (!user) {
        throw new Error('User not found');
      }

      // サイト機能を無効化
      const existingFeature = await app.prisma.siteFeatureSetting.findUnique({
        where: { featureName: 'POST_IMAGE_UPLOAD' },
      });

      if (existingFeature) {
        await app.prisma.siteFeatureSetting.update({
          where: { featureName: 'POST_IMAGE_UPLOAD' },
          data: { isEnabled: false, updatedBy: user.id },
        });
      } else {
        await app.prisma.siteFeatureSetting.create({
          data: {
            featureName: 'POST_IMAGE_UPLOAD',
            description: 'Allow users to upload images for posts',
            isEnabled: false,
            updatedBy: user.id,
          },
        });
      }

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('FEATURE_DISABLED');
    });
  });

  describe('completeUploadSession', () => {
    const completeUploadSessionMutation = `
      mutation CompleteUploadSession($uploadId: ID!) {
        completeUploadSession(uploadId: $uploadId) {
          id
          user {
            id
          }
          filename
          mimeType
          fileSize
          s3Key
          createdAt
        }
      }
    `;

    const createUploadSessionMutation = `
      mutation CreateUploadSession($input: CreateUploadSessionInput!) {
        createUploadSession(input: $input) {
          uploadId
          uploadPath
          uploadAuthToken
          expiresAt
          requiredHeaders {
            key
            value
          }
          maxBytes
        }
      }
    `;

    it('正しいMediaが返される', async () => {
      const cookie = await loginAndGetCookie();
      const user = await getUserFromDb();

      if (!user) {
        throw new Error('User not found');
      }

      // 1. createUploadSessionでセッション作成
      const createResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const createResult = JSON.parse(createResponse.body);
      expect(createResult.errors).toBeUndefined();

      const { uploadId } = createResult.data.createUploadSession;

      // 2. RedisセッションをUPLOADED状態に更新
      await updateSessionInRedis(uploadId, {
        status: 'UPLOADED',
        receivedBytes: 1024,
      });

      // 3. completeUploadSessionを呼び出し
      const completeResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(completeResponse.statusCode).toBe(200);

      const completeResult = JSON.parse(completeResponse.body);
      expect(completeResult.errors).toBeUndefined();
      expect(completeResult.data.completeUploadSession).toBeDefined();

      const media = completeResult.data.completeUploadSession;
      expect(media.id).toBeDefined();
      expect(media.user.id).toBe(user.id);
      expect(media.filename).toBe('test.jpg');
      expect(media.mimeType).toBe('image/jpeg');
      expect(media.fileSize).toBe(1024);
      expect(media.s3Key).toBeDefined();
      expect(media.createdAt).toBeDefined();
    });

    it('冪等性：同じuploadIdで2回呼び出しても同じMediaが返る', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const createResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const createResult = JSON.parse(createResponse.body);
      const { uploadId } = createResult.data.createUploadSession;

      // 2. RedisセッションをUPLOADED状態に更新
      await updateSessionInRedis(uploadId, {
        status: 'UPLOADED',
        receivedBytes: 1024,
      });

      // 3. completeUploadSessionを呼び出し（1回目）
      const completeResponse1 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const completeResult1 = JSON.parse(completeResponse1.body);
      expect(completeResult1.errors).toBeUndefined();
      const media1 = completeResult1.data.completeUploadSession;

      // 4. Redisセッションを再びUPLOADED状態に更新（2回目の呼び出しの準備）
      await updateSessionInRedis(uploadId, {
        status: 'UPLOADED',
        receivedBytes: 1024,
      });

      // 5. completeUploadSessionを呼び出し（2回目）
      const completeResponse2 = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const completeResult2 = JSON.parse(completeResponse2.body);
      expect(completeResult2.errors).toBeUndefined();
      const media2 = completeResult2.data.completeUploadSession;

      // 2回とも同じMediaオブジェクトが返る
      expect(media1.id).toBe(media2.id);
      expect(media1.user.id).toBe(media2.user.id);
      expect(media1.filename).toBe(media2.filename);
      expect(media1.mimeType).toBe(media2.mimeType);
      expect(media1.fileSize).toBe(media2.fileSize);
      expect(media1.s3Key).toBe(media2.s3Key);
    });
  });

  describe('completeUploadSession - 異常系', () => {
    const completeUploadSessionMutation = `
      mutation CompleteUploadSession($uploadId: ID!) {
        completeUploadSession(uploadId: $uploadId) {
          id
        }
      }
    `;

    const createUploadSessionMutation = `
      mutation CreateUploadSession($input: CreateUploadSessionInput!) {
        createUploadSession(input: $input) {
          uploadId
        }
      }
    `;

    it('セッションが存在しないでエラー', async () => {
      const cookie = await loginAndGetCookie();

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId: '00000000-0000-0000-0000-000000000000',
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('UPLOAD_SESSION_NOT_FOUND');
    });

    it('TTL切れでエラー', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const createResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const createResult = JSON.parse(createResponse.body);
      const { uploadId } = createResult.data.createUploadSession;

      // 2. Redisセッションを削除（TTL切れをシミュレート）
      await deleteSessionFromRedis(uploadId);

      // 3. completeUploadSessionを呼び出し
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('UPLOAD_SESSION_NOT_FOUND');
    });

    it('無効なステータスでエラー', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const createResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const createResult = JSON.parse(createResponse.body);
      const { uploadId } = createResult.data.createUploadSession;

      // 2. RedisセッションをCREATED状態のままにする（何もしない）

      // 3. completeUploadSessionを呼び出し
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('INVALID_SESSION_STATUS');
    });

    it('サイズ不一致でエラー', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const createResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const createResult = JSON.parse(createResponse.body);
      const { uploadId } = createResult.data.createUploadSession;

      // 2. RedisセッションをUPLOADED状態に更新（receivedBytes: 0）
      await updateSessionInRedis(uploadId, {
        status: 'UPLOADED',
        receivedBytes: 0,
      });

      // 3. completeUploadSessionを呼び出し
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: completeUploadSessionMutation,
          variables: {
            uploadId,
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      expect(response.statusCode).toBe(200);

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('INVALID_FILE_SIZE');
    });
  });

  describe('Redisセッション管理', () => {
    const createUploadSessionMutation = `
      mutation CreateUploadSession($input: CreateUploadSessionInput!) {
        createUploadSession(input: $input) {
          uploadId
        }
      }
    `;

    it('セッションが正しく作成される', async () => {
      const cookie = await loginAndGetCookie();
      const user = await getUserFromDb();

      if (!user) {
        throw new Error('User not found');
      }

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadId } = result.data.createUploadSession;

      // 2. Redisからセッションを取得
      const session = await getSessionFromRedis(uploadId);

      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.kind).toBe('POST');
      expect(session.contentType).toBe('image/jpeg');
      expect(session.maxBytes).toBeGreaterThan(0);
      expect(session.s3Key).toBeDefined();
      expect(session.status).toBe('CREATED');
      // receivedBytesは初期値で設定されない場合があるため、0またはundefinedを許容
      expect(session.receivedBytes === 0 || session.receivedBytes === undefined).toBe(true);
    });

    it('セッションが正しく更新される', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadId } = result.data.createUploadSession;

      // 2. RedisセッションをUPLOADED状態に更新
      await updateSessionInRedis(uploadId, {
        status: 'UPLOADED',
        receivedBytes: 1024,
      });

      // 3. Redisからセッションを取得
      const session = await getSessionFromRedis(uploadId);

      expect(session).toBeDefined();
      expect(session.status).toBe('UPLOADED');
      expect(session.receivedBytes).toBe(1024);
    });

    it('セッションが正しく削除される', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadId } = result.data.createUploadSession;

      // 2. Redisセッションを削除
      await deleteSessionFromRedis(uploadId);

      // 3. Redisからセッションを取得
      const session = await getSessionFromRedis(uploadId);

      expect(session).toBeNull();
    });

    it('TTLが正しく設定される', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadId } = result.data.createUploadSession;

      // 2. RedisセッションのTTLを確認
      const key = `upload:session:${uploadId}`;
      const ttl = await app.redis.ttl(key);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(600); // 10分以内
    });
  });

  describe('トークン生成と検証', () => {
    const createUploadSessionMutation = `
      mutation CreateUploadSession($input: CreateUploadSessionInput!) {
        createUploadSession(input: $input) {
          uploadId
          uploadAuthToken
        }
      }
    `;

    it('トークンが正しく生成される', async () => {
      const cookie = await loginAndGetCookie();

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadAuthToken } = result.data.createUploadSession;

      // 2. uploadAuthTokenを取得
      expect(uploadAuthToken).toBeDefined();
      expect(typeof uploadAuthToken).toBe('string');
      expect(uploadAuthToken.length).toBeGreaterThan(0);

      // JWT形式であることを確認
      const parts = uploadAuthToken.split('.');
      expect(parts.length).toBe(3);
    });

    it('トークンが正しく検証される', async () => {
      const cookie = await loginAndGetCookie();
      const user = await getUserFromDb();

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadId, uploadAuthToken } = result.data.createUploadSession;

      // 2. uploadAuthTokenを取得
      expect(uploadAuthToken).toBeDefined();

      // 3. トークンを検証
      const decoded = verifyUploadToken(uploadAuthToken);

      expect(decoded).toBeDefined();
      expect(decoded?.uploadId).toBe(uploadId);
      if (user) {
        expect(decoded?.userId).toBe(user.id);
      }
      expect(decoded?.aud).toBe('s3-gateway-upload');
      expect(decoded?.exp).toBeDefined();
      expect(decoded?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('無効なトークンでエラー', async () => {
      const invalidToken = 'invalid.token.here';

      const decoded = verifyUploadToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('期限切れトークンでエラー', async () => {
      const cookie = await loginAndGetCookie();
      const user = await getUserFromDb();

      if (!user) {
        throw new Error('User not found');
      }

      // 1. createUploadSessionでセッション作成
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: createUploadSessionMutation,
          variables: {
            input: {
              kind: 'POST',
              filename: 'test.jpg',
              contentType: 'image/jpeg',
              byteSize: 1024,
            },
          },
        },
        headers: {
          'content-type': 'application/json',
          cookie,
        },
      });

      const result = JSON.parse(response.body);
      const { uploadId } = result.data.createUploadSession;

      // 2. 期限切れのトークンを作成
      const expiredToken = createExpiredToken(uploadId, user.id);

      // 3. トークンを検証
      const decoded = verifyUploadToken(expiredToken);

      expect(decoded).toBeNull();
    });
  });
});
