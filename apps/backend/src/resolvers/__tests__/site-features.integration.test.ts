
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app';
import { createTestUser, cleanupTestData, createTestPermission, grantPermissionToUser } from '../../__tests__/helpers/test-data';

describe('🎯 Site Features Resolver Integration Tests', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  const makeUnique = (prefix: string) => {
    const ts = Date.now() % 1000000;
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${ts}-${rnd}`;
  };

  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        accessToken
      }
    }
  `;

  const featureFlagsQuery = `
    query FeatureFlags {
      featureFlags {
        POST_CREATE
        POST_IMAGE_UPLOAD
        POST_LIKE
        MESSAGES_ACCESS
        MESSAGES_SEND
        WALLET_ACCESS
        WALLET_DEPOSIT
        WALLET_WITHDRAW
      }
    }
  `;

  const siteFeatureSettingsQuery = `
    query SiteFeatureSettings {
      siteFeatureSettings {
        featureName
        isEnabled
        description
        updatedByUser {
          username
        }
      }
    }
  `;

  const updateSiteFeatureMutation = `
    mutation UpdateSiteFeature($input: UpdateSiteFeatureInput!) {
      updateSiteFeature(input: $input) {
        featureName
        isEnabled
        description
        updatedByUser {
          username
        }
      }
    }
  `;

  const myFeaturePermissionsQuery = `
    query MyFeaturePermissions {
      myFeaturePermissions {
        featureName
        isEnabled
        expiresAt
      }
    }
  `;

  const updateUserFeaturePermissionMutation = `
    mutation UpdateUserFeaturePermission($input: UpdateUserFeaturePermissionInput!) {
      updateUserFeaturePermission(input: $input) {
        featureName
        isEnabled
        expiresAt
        user {
          username
        }
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
    await cleanupTestData(app.prisma);
  });

  const getAuthCookie = async (userEmail: string) => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userEmail, password: 'Test12345!' } },
      },
    });
    const accessTokenCookie = loginRes.cookies.find(c => c.name === 'accessToken');
    return `${accessTokenCookie?.name}=${accessTokenCookie?.value}`;
  };

  const createAdminUser = async () => {
    const username = makeUnique('admin');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const adminPerm = await createTestPermission(app.prisma, { name: 'ADMIN_PANEL', description: 'Admin' });
    await grantPermissionToUser(app.prisma, user.id, adminPerm.id);

    return { user, email };
  };

  it('機能フラグ一覧を取得できる（認証なしでもOKかは要確認だが、現状の実装ではリゾルバーでcontext.userなしエラーにならない）', async () => {
    // featureFlags は現在認証ガードがない実装になっているかチェック
    // ソースを見ると checkSiteFeatureEnabled は context.prisma を使うだけだが
    // 認証ガードは query 定義側でされている可能性がある。
    // 実装を見ると featureFlags リゾルバー自体には認証チェックがないため、publicにアクセス可能か、
    // または context.authService がなくても動くか。
    // ここでは念のため一般ユーザーでアクセス

    const username = makeUnique('general');
    const email = `${username}@test.com`;
    await createTestUser(app.prisma, { email, username, password: 'Test12345!' });
    const cookie = await getAuthCookie(email);

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: { query: featureFlagsQuery },
    });

    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.featureFlags).toBeDefined();
    // デフォルトは全て true (サイト機能設定レコードがない場合)
    expect(body.data.featureFlags.POST_CREATE).toBe(true);
  });

  it('管理者はサイト機能設定を更新・取得できる', async () => {
    const { email } = await createAdminUser();
    const cookie = await getAuthCookie(email);

    // 1. 設定更新 (POST_CREATE を無効化)
    const updateRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: updateSiteFeatureMutation,
        variables: {
          input: {
            featureName: 'POST_CREATE',
            isEnabled: false,
            description: 'Disabled for testing',
          },
        },
      },
    });

    const updateBody = JSON.parse(updateRes.body);
    expect(updateBody.errors).toBeUndefined();
    expect(updateBody.data.updateSiteFeature.isEnabled).toBe(false);

    // 2. 設定一覧取得
    const listRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: { query: siteFeatureSettingsQuery },
    });

    const listBody = JSON.parse(listRes.body);
    expect(listBody.errors).toBeUndefined();
    const settings = listBody.data.siteFeatureSettings;
    const postCreateSetting = settings.find((s: any) => s.featureName === 'POST_CREATE');
    expect(postCreateSetting).toBeDefined();
    expect(postCreateSetting.isEnabled).toBe(false);

    // 3. 一般ユーザーで機能フラグ確認（反映されているか）
    const user2 = await createTestUser(app.prisma, { email: makeUnique('u2') + '@test.com', username: makeUnique('u2'), password: 'Test12345!' });
    const cookie2 = await getAuthCookie(user2.email);

    const flagRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie: cookie2 },
      payload: { query: featureFlagsQuery },
    });
    const flagBody = JSON.parse(flagRes.body);
    expect(flagBody.data.featureFlags.POST_CREATE).toBe(false);
  });

  it('一般ユーザーはサイト機能設定を更新できない', async () => {
    const username = makeUnique('general2');
    const email = `${username}@test.com`;
    await createTestUser(app.prisma, { email, username, password: 'Test12345!' });
    const cookie = await getAuthCookie(email);

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: updateSiteFeatureMutation,
        variables: {
          input: {
            featureName: 'POST_CREATE',
            isEnabled: false,
          },
        },
      },
    });

    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('管理者権限が必要です');
  });

  it('管理者はユーザーごとの機能権限を更新できる', async () => {
    const { email: adminEmail } = await createAdminUser();
    const adminCookie = await getAuthCookie(adminEmail);

    const targetUser = await createTestUser(app.prisma, {
      email: makeUnique('target') + '@test.com',
      username: makeUnique('target'),
      password: 'Test12345!'
    });

    // 特定ユーザーに対してのみ MESSAGES_SEND を無効化
    const updateRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      payload: {
        query: updateUserFeaturePermissionMutation,
        variables: {
          input: {
            userId: targetUser.id,
            featureName: 'MESSAGES_SEND',
            isEnabled: false,
          },
        },
      },
    });

    const updateBody = JSON.parse(updateRes.body);
    expect(updateBody.errors).toBeUndefined();
    expect(updateBody.data.updateUserFeaturePermission.isEnabled).toBe(false);

    // ターゲットユーザー自身で権限確認
    const targetCookie = await getAuthCookie(targetUser.email);
    const myPermRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie: targetCookie },
      payload: { query: myFeaturePermissionsQuery },
    });

    const myPermBody = JSON.parse(myPermRes.body);
    expect(myPermBody.errors).toBeUndefined();
    const perm = myPermBody.data.myFeaturePermissions.find((p: any) => p.featureName === 'MESSAGES_SEND');
    expect(perm).toBeDefined();
    expect(perm.isEnabled).toBe(false);
  });
});
