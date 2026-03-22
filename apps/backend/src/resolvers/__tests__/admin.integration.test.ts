/**
 * 🧪 管理者リゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData, createTestPermission, grantPermissionToUser } from '../../__tests__/helpers/test-data.js';

describe('🛡️ 管理者リゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let adminUser: any;
  let normalUser: any;
  let adminToken: string;
  let normalToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // 管理者ユーザー作成
    const adminUserData = {
      email: `admin-${Date.now()}@libark.dev`,
      username: `admin-${Date.now()}`,
      password: 'AdminPassword123!',
      displayName: 'Admin User',
    };
    adminUser = await createTestUser(app.prisma, adminUserData);

    // ADMIN_PANEL権限を作成・付与
    const permission = await createTestPermission(app.prisma, {
      name: 'ADMIN_PANEL',
      description: 'Access Admin Panel',
    });
    await grantPermissionToUser(app.prisma, adminUser.id, permission.id);

    // 一般ユーザー作成
    const normalUserData = {
      email: `user-${Date.now()}@libark.dev`,
      username: `user-${Date.now()}`,
      password: 'UserPassword123!',
      displayName: 'Normal User',
    };
    normalUser = await createTestUser(app.prisma, normalUserData);

    // 管理者ログイン
    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) { accessToken }
          }
        `,
        variables: {
          input: { email: adminUserData.email, password: adminUserData.password },
        },
      },
    });
    const adminCookies = adminLoginRes.cookies;
    const adminAccessCookie = adminCookies.find(c => c.name === 'accessToken');
    adminToken = `${adminAccessCookie?.name}=${adminAccessCookie?.value}`;

    // 一般ユーザーログイン
    const userLoginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) { accessToken }
          }
        `,
        variables: {
          input: { email: normalUserData.email, password: normalUserData.password },
        },
      },
    });
    const userCookies = userLoginRes.cookies;
    const userAccessCookie = userCookies.find(c => c.name === 'accessToken');
    normalToken = `${userAccessCookie?.name}=${userAccessCookie?.value}`;
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  describe('📊 systemStats', () => {
    const query = `
      query SystemStats {
        systemStats {
          totalUsers
          activeUsers24h
        }
      }
    `;

    it('管理者はシステム統計を取得できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: { query },
        headers: { cookie: adminToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.systemStats.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('一般ユーザーはシステム統計を取得できない', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: { query },
        headers: { cookie: normalToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });

  describe('👥 adminUsers', () => {
    const query = `
      query AdminUsers($search: String) {
        adminUsers(search: $search) {
          edges {
            node {
              id
              username
              email
            }
          }
          totalCount
        }
      }
    `;

    it('管理者はユーザー一覧を取得できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: { query },
        headers: { cookie: adminToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.adminUsers.edges.length).toBeGreaterThanOrEqual(2); // admin + normal
    });

    it('検索機能が動作する', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { search: normalUser.username }
        },
        headers: { cookie: adminToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.adminUsers.edges).toHaveLength(1);
      expect(result.data.adminUsers.edges[0].node.username).toBe(normalUser.username);
    });
  });

  describe('✏️ adminUpdateUser', () => {
    const mutation = `
      mutation AdminUpdateUser($input: AdminUpdateUserInput!) {
        adminUpdateUser(input: $input) {
          success
          user {
            id
            isVerified
            displayName
          }
        }
      }
    `;

    it('管理者はユーザー情報を更新できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              userId: normalUser.id,
              isVerified: true,
              displayName: 'Updated Name'
            }
          }
        },
        headers: { cookie: adminToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.adminUpdateUser.success).toBe(true);
      expect(result.data.adminUpdateUser.user.isVerified).toBe(true);
      expect(result.data.adminUpdateUser.user.displayName).toBe('Updated Name');
    });
  });

  describe('🗑️ adminDeleteUser', () => {
    const mutation = `
      mutation AdminDeleteUser($userId: UUID!) {
        adminDeleteUser(userId: $userId) {
          success
        }
      }
    `;

    it('管理者はユーザーを削除できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { userId: normalUser.id }
        },
        headers: { cookie: adminToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.adminDeleteUser.success).toBe(true);

      // 削除後の確認（DB直接）
      const deletedUser = await app.prisma.user.findUnique({ where: { id: normalUser.id } });
      expect(deletedUser?.isActive).toBe(false);
      expect(deletedUser?.email).toContain('deleted_');
    });

    it('自分自身は削除できない', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { userId: adminUser.id }
        },
        headers: { cookie: adminToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });
});
