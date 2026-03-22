/**
 * 🧪 通知リゾルバー統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../../__tests__/helpers/test-data.js';

describe('🔔 通知リゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let testUser: any;
  let otherUser: any;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    // テストユーザー作成
    const userData = {
      email: `notify-${Date.now()}@libark.dev`,
      username: `notify-${Date.now()}`,
      password: 'Password123!',
      displayName: 'Notify User',
    };
    testUser = await createTestUser(app.prisma, userData);

    // 他のユーザー作成
    const otherUserData = {
      email: `other-${Date.now()}@libark.dev`,
      username: `other-${Date.now()}`,
      password: 'Password123!',
      displayName: 'Other User',
    };
    otherUser = await createTestUser(app.prisma, otherUserData);

    // ログインしてトークン取得
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) { accessToken }
          }
        `,
        variables: {
          input: { email: userData.email, password: userData.password },
        },
      },
    });
    const cookies = loginRes.cookies;
    const accessCookie = cookies.find(c => c.name === 'accessToken');
    authToken = `${accessCookie?.name}=${accessCookie?.value}`;

    // 通知データの作成
    await app.prisma.notification.createMany({
      data: [
        {
          userId: testUser.id,
          actorId: otherUser.id,
          type: 'FOLLOW',
          content: 'フォローされました',
          isRead: false,
          createdAt: new Date(),
        },
        {
          userId: testUser.id,
          actorId: otherUser.id,
          type: 'LIKE',
          content: 'いいねされました',
          isRead: false,
          createdAt: new Date(Date.now() - 10000), // 少し前
        },
        {
          userId: testUser.id,
          actorId: otherUser.id,
          type: 'FOLLOW',
          content: 'システム通知（FOLLOWとして代用）',
          isRead: true, // 既読
          createdAt: new Date(Date.now() - 20000),
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  describe('📬 notifications', () => {
    const query = `
      query Notifications($first: Int, $isRead: Boolean) {
        notifications(first: $first, isRead: $isRead) {
          id
          type
          content
          isRead
          actor {
            username
          }
        }
      }
    `;

    it('通知一覧を取得できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: { query },
        headers: { cookie: authToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.notifications).toHaveLength(3);
    });

    it('未読のみフィルタリングできる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query,
          variables: { isRead: false }
        },
        headers: { cookie: authToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.notifications).toHaveLength(2);
      expect(result.data.notifications.every((n: any) => !n.isRead)).toBe(true);
    });
  });

  describe('🔢 unreadNotificationsCount', () => {
    const query = `
      query UnreadCount {
        unreadNotificationsCount
      }
    `;

    it('未読数を取得できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: { query },
        headers: { cookie: authToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.unreadNotificationsCount).toBe(2);
    });
  });

  describe('✅ markNotificationAsRead', () => {
    const mutation = `
      mutation MarkAsRead($id: UUID!) {
        markNotificationAsRead(id: $id) {
          id
          isRead
        }
      }
    `;

    it('通知を既読にできる', async () => {
      // 未読の通知IDを取得
      const notif = await app.prisma.notification.findFirst({
        where: { userId: testUser.id, isRead: false }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { id: notif?.id }
        },
        headers: { cookie: authToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.markNotificationAsRead.isRead).toBe(true);

      // 未読数が減っているか確認
      const count = await app.prisma.notification.count({
        where: { userId: testUser.id, isRead: false }
      });
      expect(count).toBe(1);
    });

    it('他人の通知は操作できない', async () => {
      // 他人の通知を作成
      const otherNotif = await app.prisma.notification.create({
        data: {
          userId: otherUser.id,
          type: 'FOLLOW',
          content: 'Other notification',
          isRead: false // 未読
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: { id: otherNotif.id }
        },
        headers: { cookie: authToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });

  describe('📚 markAllNotificationsAsRead', () => {
    const mutation = `
      mutation MarkAllAsRead {
        markAllNotificationsAsRead
      }
    `;

    it('全ての通知を既読にできる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: { query: mutation },
        headers: { cookie: authToken, 'content-type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.markAllNotificationsAsRead).toBeGreaterThanOrEqual(2);

      // 未読数が0になっているか確認
      const count = await app.prisma.notification.count({
        where: { userId: testUser.id, isRead: false }
      });
      expect(count).toBe(0);
    });
  });
});
