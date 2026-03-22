/**
 * メッセージ機能統合テスト
 * ベストプラクティス: 明示的なデータ検証と堅牢なテスト設計
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { messageResolvers } from '../message.js';

describe('Message Extension Integration', () => {
  let app: FastifyInstance;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeAll(async () => {
    app = await createTestApp();

    user1 = await app.prisma.user.create({
      data: { email: 'msg_ext_u1@test.com', username: 'msg_ext_u1', password: 'password' },
    });
    user2 = await app.prisma.user.create({
      data: { email: 'msg_ext_u2@test.com', username: 'msg_ext_u2', password: 'password' },
    });
    user3 = await app.prisma.user.create({
      data: { email: 'msg_ext_u3@test.com', username: 'msg_ext_u3', password: 'password' },
    });

    await app.prisma.siteFeatureSetting.upsert({
      where: { featureName: 'MESSAGES_ACCESS' },
      update: { isEnabled: true },
      create: { featureName: 'MESSAGES_ACCESS', isEnabled: true },
    });
    await app.prisma.siteFeatureSetting.upsert({
      where: { featureName: 'MESSAGES_SEND' },
      update: { isEnabled: true },
      create: { featureName: 'MESSAGES_SEND', isEnabled: true },
    });
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  describe('sendMessage with Extensions', () => {
    it('IMAGEタイプのメッセージを送信できる', async () => {
      const context = {
        prisma: app.prisma,
        user: user1,
        fastify: app,
        redisPubSub: (app as any).redisPubSub,
      };

      const res = await messageResolvers.Mutation.sendMessage(
        {},
        {
          input: {
            recipientId: user2.id,
            content: 'https://example.com/image.png',
            type: 'IMAGE',
          },
        },
        context as any
      );

      expect(res.success).toBe(true);
      expect(res.messageData.type).toBe('IMAGE');
      expect(res.messageData.content).toBe('https://example.com/image.png');
    });

    it('replyTo付きのメッセージを送信できる', async () => {
      const context = {
        prisma: app.prisma,
        user: user1,
        fastify: app,
        redisPubSub: (app as any).redisPubSub,
      };

      const original = await messageResolvers.Mutation.sendMessage(
        {},
        { input: { recipientId: user2.id, content: 'Original Message' } },
        context as any
      );

      const reply = await messageResolvers.Mutation.sendMessage(
        {},
        {
          input: {
            conversationId: original.conversation.id,
            content: 'Reply Message',
            replyToId: original.messageData.id,
          },
        },
        context as any
      );

      expect(reply.success).toBe(true);
      expect(reply.messageData.replyToId).toBe(original.messageData.id);
    });
  });

  describe('Group Conversations', () => {
    it('グループ会話を作成し参加者が正しく追加される', async () => {
      const context = {
        prisma: app.prisma,
        user: user1,
        fastify: app,
        redisPubSub: (app as any).redisPubSub,
      };

      const res = await messageResolvers.Mutation.createConversation(
        {},
        {
          input: {
            participantIds: [user2.id, user3.id],
            title: 'Test Group',
            type: 'GROUP',
            initialMessage: 'Welcome to the group!',
          },
        },
        context as any
      );

      expect(res.success).toBe(true);
      expect(res.conversation.type).toBe('GROUP');
      expect(res.conversation.title).toBe('Test Group');

      // リゾルバーの戻り値で直接確認（明示的取得に修正済み）
      expect(res.conversation.participants).toHaveLength(3);
      expect(res.conversation.messages).toHaveLength(1);
      expect(res.conversation.messages[0].content).toBe('Welcome to the group!');
    });

    it('addParticipantで新規参加者を追加できる', async () => {
      const context = {
        prisma: app.prisma,
        user: user1,
        fastify: app,
        redisPubSub: (app as any).redisPubSub,
      };

      // グループ作成（user1とuser2のみ）
      const convRes = await messageResolvers.Mutation.createConversation(
        {},
        { input: { participantIds: [user2.id], title: 'Add Test Group', type: 'GROUP' } },
        context as any
      );

      expect(convRes.conversation.participants).toHaveLength(2);

      // user3を追加
      const res = await messageResolvers.Mutation.addParticipant(
        {},
        { input: { conversationId: convRes.conversation.id, userId: user3.id } },
        context as any
      );

      expect(res.success).toBe(true);

      // DBから最終確認
      const finalParticipants = await app.prisma.conversationParticipant.findMany({
        where: { conversationId: convRes.conversation.id },
      });
      expect(finalParticipants).toHaveLength(3);
    });
  });
});
