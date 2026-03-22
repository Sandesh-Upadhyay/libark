import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData } from '../../__tests__/helpers/test-data.js';
import {
  UserFactory,
  ConversationFactory,
  MessageFactory,
} from '../../__tests__/factories/index.js';

describe('💬 メッセージリゾルバー統合テスト', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;
  let testUser: any;
  let otherUser: any;
  let userToken: string;
  let otherUserToken: string;
  let conversationId: string;
  let messageId: string;

  beforeAll(async () => {
    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);

    // テストユーザー作成
    testUser = await userFactory.createWithPassword('password123', {
      username: 'msg_tester',
      email: 'msg_tester@example.com',
    });

    otherUser = await userFactory.createWithPassword('password123', {
      username: 'msg_other',
      email: 'msg_other@example.com',
    });

    // トークン取得
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              accessToken
            }
          }
        `,
        variables: {
          input: {
            email: testUser.email,
            password: 'password123',
          },
        },
      },
    });
    const loginResult = JSON.parse(loginResponse.body);
    userToken = `accessToken=${loginResult.data.login.accessToken}`;

    const otherLoginResponse = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              accessToken
            }
          }
        `,
        variables: {
          input: {
            email: otherUser.email,
            password: 'password123',
          },
        },
      },
    });
    const otherLoginResult = JSON.parse(otherLoginResponse.body);
    otherUserToken = `accessToken=${otherLoginResult.data.login.accessToken}`;
  });

  afterAll(async () => {
    await cleanupTestData(app.prisma);
    await cleanupTestApp(app);
  });

  describe('📨 sendMessage', () => {
    const mutation = `
      mutation SendMessage($input: SendMessageInput!) {
        sendMessage(input: $input) {
          success
          message
          messageData {
            id
            content
            sender { id }
          }
          conversation {
            id
          }
        }
      }
    `;

    it('新規会話を作成してメッセージを送信できる（recipientId指定）', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              recipientId: otherUser.id,
              content: 'Hello, world!',
            },
          },
        },
        headers: {
          cookie: userToken,
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.sendMessage.success).toBe(true);
      expect(result.data.sendMessage.messageData.content).toBe('Hello, world!');
      expect(result.data.sendMessage.conversation.id).toBeDefined();

      conversationId = result.data.sendMessage.conversation.id;
      messageId = result.data.sendMessage.messageData.id;
    });

    it('既存の会話にメッセージを送信できる（conversationId指定）', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              conversationId: conversationId,
              content: 'Second message',
            },
          },
        },
        headers: {
          cookie: otherUserToken, // 相手から返信
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.sendMessage.success).toBe(true);
      expect(result.data.sendMessage.conversation.id).toBe(conversationId);
      expect(result.data.sendMessage.messageData.sender.id).toBe(otherUser.id);
    });

    it('自分自身には送信できない', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              recipientId: testUser.id,
              content: 'Talking to myself',
            },
          },
        },
        headers: {
          cookie: userToken,
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
    });
  });

  describe('💬 conversations', () => {
    const _query = `
      query Conversations {
        conversations {
          edges {
            node {
              id
              lastMessage {
                content
              }
              unreadCount
            }
          }
          totalCount
        }
      }
    `;

    it('会話一覧を取得できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { cookie: userToken },
        payload: {
          query: `
            query Conversations {
              conversations(first: 20) {
                edges {
                  node {
                    id
                    lastMessage {
                      content
                    }
                    unreadCount
                  }
                }
                totalCount
              }
            }
          `,
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.conversations.totalCount).toBeGreaterThanOrEqual(1);
      const conversation = result.data.conversations.edges[0].node;
      expect(conversation.id).toBe(conversationId);
      // otherUserが返信しているので、testUserから見て未読があるはず(1件: Second message)
      expect(conversation.unreadCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('✅ markAsRead', () => {
    const mutation = `
      mutation MarkAsRead($input: MarkAsReadInput!) {
        markAsRead(input: $input) {
          success
          conversation {
            id
            unreadCount
          }
        }
      }
    `;

    it('メッセージを既読にできる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              conversationId: conversationId,
            },
          },
        },
        headers: {
          cookie: userToken, // testUserが既読にする
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.markAsRead.success).toBe(true);
      // 既読にしたので未読数は0になるはず
      expect(result.data.markAsRead.conversation.unreadCount).toBe(0);
    });
  });

  describe('🗑️ deleteMessage', () => {
    const mutation = `
      mutation DeleteMessage($input: DeleteMessageInput!) {
        deleteMessage(input: $input) {
          success
          deleteType
        }
      }
    `;

    it('送信取り消し（UNSEND）ができる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              messageId: messageId, // 最初のメッセージ（自分が送信）
              deleteType: 'UNSEND',
            },
          },
        },
        headers: {
          cookie: userToken,
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeUndefined();
      expect(result.data.deleteMessage.success).toBe(true);
      expect(result.data.deleteMessage.deleteType).toBe('UNSEND');
    });

    it('他人のメッセージは送信取り消しできない', async () => {
      // otherUserが送信したメッセージを探す
      const messages = await app.prisma.message.findFirst({
        where: { conversationId, senderId: otherUser.id },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              messageId: messages!.id,
              deleteType: 'UNSEND',
            },
          },
        },
        headers: {
          cookie: userToken,
          'content-type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });
});
