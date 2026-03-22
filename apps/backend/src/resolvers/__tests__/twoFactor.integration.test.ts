/**
 * 🔐 2FA統合テスト (System Integration)
 *
 * 実際のDBとAuthServiceを使用した2FAフローのE2Eテスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { Redis } from 'ioredis';
import { generateTOTPCode } from '@libark/core-server/security/totp';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app';
import { createTestUser, cleanupTestData } from '../../__tests__/helpers/test-data';

describe('🔐 2FA System Integration Tests', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let testUser: any;
  let cookie: string;

  // GraphQLクエリ・ミューテーション定義
  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        requiresTwoFactor
        tempUserId
        accessToken
      }
    }
  `;

  const setupTwoFactorMutation = `
    mutation SetupTwoFactor($input: TwoFactorSetupInput!) {
      setupTwoFactor(input: $input) {
        secret
        qrCodeUrl
        manualEntryKey
      }
    }
  `;

  const enableTwoFactorMutation = `
    mutation EnableTwoFactor($input: TwoFactorEnableInput!) {
      enableTwoFactor(input: $input) {
        success
        backupCodes {
          codes
        }
      }
    }
  `;

  const loginWithTwoFactorMutation = `
    mutation LoginWithTwoFactor($input: TwoFactorLoginInput!) {
      loginWithTwoFactor(input: $input) {
        success
        accessToken
      }
    }
  `;

  const disableTwoFactorMutation = `
    mutation DisableTwoFactor($input: TwoFactorDisableInput!) {
      disableTwoFactor(input: $input) {
        success
      }
    }
  `;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    const timestamp = Date.now() % 1000000;
    const randomId = Math.random().toString(36).substring(2, 8);

    // ユーザー作成
    testUser = await createTestUser(app.prisma, {
      email: `2fa-${timestamp}-${randomId}@libark.dev`,
      username: `2fa-${timestamp}-${randomId}`,
      password: 'Password123!',
      displayName: '2FA Test User',
    });

    // 初期ログインしてアクセストークン取得
    const _loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: loginMutation,
        variables: {
          input: {
            email: testUser.email,
            password: 'Password123!',
          },
        },
      },
    });

    // Cookieの取得
    const cookieHeader = _loginRes.headers['set-cookie'];
    if (Array.isArray(cookieHeader)) {
      cookie = cookieHeader[0].split(';')[0];
    } else {
      cookie = (cookieHeader as string)?.split(';')[0];
    }
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  it('2FAのセットアップ、有効化、ログイン、無効化のフローを検証する', async () => {
    // 1. 2FAセットアップ
    const setupRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      payload: {
        query: setupTwoFactorMutation,
        variables: {
          input: { password: 'Password123!' },
        },
      },
    });

    const setupBody = JSON.parse(setupRes.body);
    expect(setupBody.errors).toBeUndefined();
    const { secret, manualEntryKey } = setupBody.data.setupTwoFactor;
    expect(secret).toBeDefined();
    expect(manualEntryKey).toBeDefined();

    // 2. 2FA有効化
    const totpCode = generateTOTPCode(secret);
    const enableRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      payload: {
        query: enableTwoFactorMutation,
        variables: {
          input: {
            password: 'Password123!',
            totpCode,
          },
        },
      },
    });

    const enableBody = JSON.parse(enableRes.body);
    expect(enableBody.errors).toBeUndefined();
    expect(enableBody.data.enableTwoFactor.success).toBe(true);
    expect(enableBody.data.enableTwoFactor.backupCodes.codes).toHaveLength(10);

    // 3. 通常ログイン（2FA要求されることを確認）
    // 一度Cookieをクリアするため、ヘッダーなしでリクエスト
    const loginAttemptRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        query: loginMutation,
        variables: {
          input: {
            email: testUser.email,
            password: 'Password123!',
          },
        },
      },
    });

    const loginAttemptBody = JSON.parse(loginAttemptRes.body);
    expect(loginAttemptBody.errors).toBeUndefined();
    expect(loginAttemptBody.data.login.success).toBe(false);
    expect(loginAttemptBody.data.login.requiresTwoFactor).toBe(true);
    expect(loginAttemptBody.data.login.accessToken).toBeNull();

    const tempUserId = loginAttemptBody.data.login.tempUserId;
    expect(tempUserId).toBeDefined();

    // 4. 2FAコードでログイン
    const loginCode = generateTOTPCode(secret);
    const twoFactorLoginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        query: loginWithTwoFactorMutation,
        variables: {
          input: {
            tempUserId,
            code: loginCode,
          },
        },
      },
    });

    const twoFactorLoginBody = JSON.parse(twoFactorLoginRes.body);
    expect(twoFactorLoginBody.errors).toBeUndefined();
    expect(twoFactorLoginBody.data.loginWithTwoFactor.success).toBe(true);
    expect(twoFactorLoginBody.data.loginWithTwoFactor.accessToken).toBeDefined();

    // Cookieの更新
    let newCookie = '';
    const newCookieHeader = twoFactorLoginRes.headers['set-cookie'];
    if (Array.isArray(newCookieHeader)) {
      newCookie = newCookieHeader[0].split(';')[0];
    } else {
      newCookie = (newCookieHeader as string)?.split(';')[0];
    }

    // 5. 2FA無効化
    const disableCode = generateTOTPCode(secret);
    const disableRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: newCookie,
      },
      payload: {
        query: disableTwoFactorMutation,
        variables: {
          input: {
            password: 'Password123!',
            code: disableCode,
          },
        },
      },
    });

    const disableBody = JSON.parse(disableRes.body);
    expect(disableBody.errors).toBeUndefined();
    expect(disableBody.data.disableTwoFactor.success).toBe(true);
  });
});
