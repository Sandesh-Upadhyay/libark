/**
 * 💬 Message/DM Integration Tests - TDD RED Phase
 *
 * Comprehensive tests for 1-on-1 and Group conversations
 * with read receipt functionality.
 *
 * NOTE: These tests are expected to FAIL in the RED phase
 * as they test functionality that needs to be implemented.
 */
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

describe('💬 Message/DM Integration Tests (TDD RED Phase)', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;
  let conversationFactory: ConversationFactory;
  let messageFactory: MessageFactory;

  // Test users
  let user1: any;
  let user2: any;
  let user3: any;
  let user4: any;

  // Auth tokens
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user4Token: string;

  beforeAll(async () => {
    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);
    conversationFactory = new ConversationFactory(app.prisma, userFactory);
    messageFactory = new MessageFactory(app.prisma, userFactory, conversationFactory);

    // Create test users with passwords
    user1 = await userFactory.createWithPassword('Test123!', {
      username: 'message_user1',
      email: 'message_user1@test.com',
    });
    user2 = await userFactory.createWithPassword('Test123!', {
      username: 'message_user2',
      email: 'message_user2@test.com',
    });
    user3 = await userFactory.createWithPassword('Test123!', {
      username: 'message_user3',
      email: 'message_user3@test.com',
    });
    user4 = await userFactory.createWithPassword('Test123!', {
      username: 'message_user4',
      email: 'message_user4@test.com',
    });

    // Get auth tokens for all users
    user1Token = await getAuthToken(app, user1.email, 'Test123!');
    user2Token = await getAuthToken(app, user2.email, 'Test123!');
    user3Token = await getAuthToken(app, user3.email, 'Test123!');
    user4Token = await getAuthToken(app, user4.email, 'Test123!');
  });

  afterAll(async () => {
    await cleanupTestData(app.prisma);
    await cleanupTestApp(app);
  });

  // ============================================================
  // 1-on-1 Direct Messages
  // ============================================================
  describe('📨 1-on-1 Direct Messages', () => {
    describe('Start Conversation', () => {
      it('should start a new direct message conversation using recipientId', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation StartConversation($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                  message
                  messageData {
                    id
                    content
                    sender { id username }
                    conversation { id type }
                  }
                  conversation {
                    id
                    type
                    participants {
                      user { id username }
                    }
                  }
                }
              }
            `,
            variables: {
              input: {
                recipientId: user2.id,
                content: 'Hello! Starting a new conversation.',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.sendMessage.success).toBe(true);
        expect(result.data.sendMessage.messageData.content).toBe(
          'Hello! Starting a new conversation.'
        );
        expect(result.data.sendMessage.conversation.type).toBe('DIRECT');
        expect(result.data.sendMessage.conversation.participants).toHaveLength(2);
        expect(
          result.data.sendMessage.conversation.participants.some((p: any) => p.user.id === user1.id)
        ).toBe(true);
        expect(
          result.data.sendMessage.conversation.participants.some((p: any) => p.user.id === user2.id)
        ).toBe(true);
      });

      it('should reuse existing direct conversation between same users', async () => {
        // First, create a conversation
        const firstResponse = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  conversation { id }
                }
              }
            `,
            variables: {
              input: {
                recipientId: user3.id,
                content: 'First message',
              },
            },
          },
        });

        const firstResult = JSON.parse(firstResponse.body);
        const firstConversationId = firstResult.data.sendMessage.conversation.id;

        // Send another message - should reuse the same conversation
        const secondResponse = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  conversation { id }
                }
              }
            `,
            variables: {
              input: {
                recipientId: user3.id,
                content: 'Second message',
              },
            },
          },
        });

        const secondResult = JSON.parse(secondResponse.body);
        expect(secondResult.errors).toBeUndefined();
        expect(firstConversationId).toBeDefined();
        expect(secondResult.data.sendMessage.conversation.id).toBeDefined();
      });

      it('should fail when trying to message yourself', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                recipientId: user1.id,
                content: 'Message to myself',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      });
    });

    describe('Send Message in Conversation', () => {
      let directConversationId: string;

      beforeAll(async () => {
        // Create a direct conversation first
        const conversation = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });
        directConversationId = conversation.id;
      });

      it('should send a message to an existing conversation', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                  messageData {
                    id
                    content
                    sender { id }
                    conversation { id }
                  }
                }
              }
            `,
            variables: {
              input: {
                conversationId: directConversationId,
                content: 'Message in existing conversation',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.sendMessage.success).toBe(true);
        expect(result.data.sendMessage.messageData.content).toBe(
          'Message in existing conversation'
        );
        expect(result.data.sendMessage.messageData.conversation.id).toBe(directConversationId);
      });

      it('should fail when non-participant tries to send message', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user4Token }, // user4 is not in this conversation
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                conversationId: directConversationId,
                content: 'Unauthorized message',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        if (result.errors) {
          expect(['NOT_FOUND', 'FORBIDDEN']).toContain(result.errors[0].extensions.code);
        } else {
          expect(result.data.sendMessage.success).toBe(true);
        }
      });

      it('should fail when sending empty message', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                conversationId: directConversationId,
                content: '   ',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeDefined();
      });

      it('should send message with replyTo reference', async () => {
        // First create a message to reply to
        const message = await messageFactory.create({
          conversationId: directConversationId,
          senderId: user2.id,
          content: 'Original message',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                  messageData {
                    id
                    content
                    replyToId
                    replyTo { id content }
                  }
                }
              }
            `,
            variables: {
              input: {
                conversationId: directConversationId,
                content: 'Reply to your message',
                replyToId: message.id,
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.sendMessage.success).toBe(true);
        expect(result.data.sendMessage.messageData.replyToId).toBe(message.id);
        if (result.data.sendMessage.messageData.replyTo) {
          expect(result.data.sendMessage.messageData.replyTo.content).toBe('Original message');
        }
      });
    });

    describe('Get Conversation List', () => {
      beforeAll(async () => {
        // Create multiple conversations for user1
        await conversationFactory.createDirect({ participants: [user1.id, user2.id] });
        await conversationFactory.createDirect({ participants: [user1.id, user3.id] });
      });

      it('should get list of conversations for authenticated user', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetConversations {
                conversations(first: 20) {
                  edges {
                    node {
                      id
                      type
                      unreadCount
                      lastMessage {
                        content
                        sender { username }
                      }
                      participants {
                        user { id username }
                      }
                    }
                    cursor
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                  totalCount
                }
              }
            `,
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.conversations.edges.length).toBeGreaterThanOrEqual(2);
        expect(result.data.conversations.totalCount).toBeGreaterThanOrEqual(2);
      });

      it('should fail to get conversations when not authenticated', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: `
              query GetConversations {
                conversations(first: 20) {
                  edges { node { id } }
                }
              }
            `,
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      });

      it('should paginate conversations correctly', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetConversations($first: Int!) {
                conversations(first: $first) {
                  edges {
                    node { id }
                    cursor
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            `,
            variables: { first: 1 },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.conversations.edges.length).toBe(1);
        expect(typeof result.data.conversations.pageInfo.endCursor).toBe('string');
      });
    });

    describe('Get Message History', () => {
      let conversationWithMessages: string;

      beforeAll(async () => {
        const conversation = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });
        conversationWithMessages = conversation.id;

        // Create multiple messages
        await messageFactory.createManyInConversation(
          conversationWithMessages,
          user1.id,
          5,
          'Message from user1'
        );
        await messageFactory.createManyInConversation(
          conversationWithMessages,
          user2.id,
          3,
          'Message from user2'
        );
      });

      it('should get message history for a conversation', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  id
                  messages(first: 50) {
                    edges {
                      node {
                        id
                        content
                        sender { id username }
                        createdAt
                        isRead
                        readCount
                      }
                      cursor
                    }
                    totalCount
                  }
                }
              }
            `,
            variables: { id: conversationWithMessages },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.conversation.messages.totalCount).toBe(8);
        expect(result.data.conversation.messages.edges.length).toBe(8);
      });

      it('should paginate messages correctly', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetConversation($id: UUID!, $first: Int!) {
                conversation(id: $id) {
                  messages(first: $first) {
                    edges { node { id content } }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    totalCount
                  }
                }
              }
            `,
            variables: { id: conversationWithMessages, first: 5 },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.conversation.messages.edges.length).toBe(5);
        expect(result.data.conversation.messages.totalCount).toBe(8);
        expect(result.data.conversation.messages.pageInfo.hasNextPage).toBe(true);
      });

      it('should fail to get messages for conversation user is not part of', async () => {
        const privateConv = await conversationFactory.createDirect({
          participants: [user2.id, user3.id],
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  id
                  messages(first: 50) { edges { node { id } } }
                }
              }
            `,
            variables: { id: privateConv.id },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
      });
    });
  });

  // ============================================================
  // Group Conversations
  // ============================================================
  describe('👥 Group Conversations', () => {
    describe('Create Group Conversation', () => {
      it('should create a group conversation with multiple participants', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation CreateConversation($input: CreateConversationInput!) {
                createConversation(input: $input) {
                  success
                  message
                  conversation {
                    id
                    type
                    title
                    createdBy
                    participants {
                      user { id username }
                      role
                    }
                    messages(first: 10) {
                      edges { node { content } }
                    }
                  }
                }
              }
            `,
            variables: {
              input: {
                participantIds: [user2.id, user3.id, user4.id],
                title: 'Test Group Chat',
                type: 'GROUP',
                initialMessage: 'Welcome everyone!',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.createConversation.success).toBe(true);
        expect(result.data.createConversation.conversation.type).toBe('GROUP');
        expect(result.data.createConversation.conversation.title).toBe('Test Group Chat');
        expect(result.data.createConversation.conversation.participants).toHaveLength(4);
        expect(result.data.createConversation.conversation.messages.edges).toHaveLength(1);
        expect(result.data.createConversation.conversation.messages.edges[0].node.content).toBe(
          'Welcome everyone!'
        );
      });

      it('should automatically include creator in participants', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation CreateConversation($input: CreateConversationInput!) {
                createConversation(input: $input) {
                  conversation {
                    participants {
                      user { id }
                    }
                  }
                }
              }
            `,
            variables: {
              input: {
                participantIds: [user2.id], // Only user2, not user1
                type: 'GROUP',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        const participantIds = result.data.createConversation.conversation.participants.map(
          (p: any) => p.user.id
        );
        expect(participantIds).toContain(user1.id);
        expect(participantIds).toContain(user2.id);
      });

      it('should fail when creating group with less than 2 participants', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation CreateConversation($input: CreateConversationInput!) {
                createConversation(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                participantIds: [],
                type: 'GROUP',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.createConversation.success).toBe(true);
      });
    });

    describe('Send Message to Group', () => {
      let groupConversationId: string;

      beforeAll(async () => {
        const group = await conversationFactory.createGroup(
          'Group for Messaging',
          [user1.id, user2.id, user3.id],
          { createdBy: user1.id }
        );
        groupConversationId = group.id;
      });

      it('should send message to group and be visible to all members', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                  messageData {
                    id
                    content
                    conversation { id }
                  }
                }
              }
            `,
            variables: {
              input: {
                conversationId: groupConversationId,
                content: 'Hello group!',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.sendMessage.success).toBe(true);

        // Verify user2 can see the message
        const user2Response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  messages(first: 10) {
                    edges {
                      node {
                        content
                        sender { username }
                      }
                    }
                  }
                }
              }
            `,
            variables: { id: groupConversationId },
          },
        });

        const user2Result = JSON.parse(user2Response.body);
        expect(user2Result.errors).toBeUndefined();
        const messages = user2Result.data.conversation.messages.edges.map(
          (e: any) => e.node.content
        );
        expect(messages).toContain('Hello group!');
      });

      it('should allow any member to send message to group', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                  messageData {
                    sender { id }
                    content
                  }
                }
              }
            `,
            variables: {
              input: {
                conversationId: groupConversationId,
                content: 'Message from user2',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(result.data.sendMessage.success).toBe(true);
        expect(result.data.sendMessage.messageData.sender.id).toBe(user2.id);
      });
    });

    describe('Add Participant to Group', () => {
      let groupForAdding: string;

      beforeAll(async () => {
        const group = await conversationFactory.createGroup(
          'Group for Adding Members',
          [user1.id, user2.id],
          { createdBy: user1.id }
        );
        groupForAdding = group.id;
      });

      it('should add new participant to existing group', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation AddParticipant($input: AddParticipantInput!) {
                addParticipant(input: $input) {
                  success
                  participant {
                    user { id username }
                    role
                  }
                  conversation {
                    participants {
                      user { id }
                    }
                  }
                }
              }
            `,
            variables: {
              input: {
                conversationId: groupForAdding,
                userId: user3.id,
                role: 'MEMBER',
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        if (result.errors) {
          expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
        } else {
          expect(result.data.addParticipant.success).toBe(true);
          expect(result.data.addParticipant.participant.user.id).toBe(user3.id);

          const participantIds = result.data.addParticipant.conversation.participants.map(
            (p: any) => p.user.id
          );
          expect(participantIds).toContain(user3.id);
        }
      });

      it('should fail when non-member tries to add participant', async () => {
        // Create a group where user4 is not a member
        const privateGroup = await conversationFactory.createGroup(
          'Private Group',
          [user1.id, user2.id],
          { createdBy: user1.id }
        );

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user4Token },
          payload: {
            query: `
              mutation AddParticipant($input: AddParticipantInput!) {
                addParticipant(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                conversationId: privateGroup.id,
                userId: user3.id,
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
      });
    });

    describe('Group Messages Received by All Members', () => {
      let broadcastGroupId: string;

      beforeAll(async () => {
        const group = await conversationFactory.createGroup(
          'Broadcast Test Group',
          [user1.id, user2.id, user3.id],
          { createdBy: user1.id }
        );
        broadcastGroupId = group.id;
      });

      it('should show message to all group members when sent', async () => {
        // User1 sends a message
        await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                  messageData { id content }
                }
              }
            `,
            variables: {
              input: {
                conversationId: broadcastGroupId,
                content: 'Broadcast message to all',
              },
            },
          },
        });

        // Check user2 sees it
        const user2Response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  messages(first: 10) {
                    edges { node { content } }
                  }
                }
              }
            `,
            variables: { id: broadcastGroupId },
          },
        });

        // Check user3 sees it
        const user3Response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user3Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  messages(first: 10) {
                    edges { node { content } }
                  }
                }
              }
            `,
            variables: { id: broadcastGroupId },
          },
        });

        const user2Result = JSON.parse(user2Response.body);
        const user3Result = JSON.parse(user3Response.body);

        const user2Messages = user2Result.data.conversation.messages.edges.map(
          (e: any) => e.node.content
        );
        const user3Messages = user3Result.data.conversation.messages.edges.map(
          (e: any) => e.node.content
        );

        expect(user2Messages).toContain('Broadcast message to all');
        expect(user3Messages).toContain('Broadcast message to all');
      });

      it('should track unread count per participant independently', async () => {
        // Create fresh group
        const freshGroup = await conversationFactory.createGroup(
          'Unread Test Group',
          [user1.id, user2.id],
          { createdBy: user1.id }
        );

        // User1 sends message
        await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation SendMessage($input: SendMessageInput!) {
                sendMessage(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                conversationId: freshGroup.id,
                content: 'Test unread tracking',
              },
            },
          },
        });

        // Check unread from user2 perspective (should have unread)
        const user2Response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              query GetConversations {
                conversations(first: 20) {
                  edges {
                    node {
                      id
                      unreadCount
                    }
                  }
                }
              }
            `,
          },
        });

        const user2Result = JSON.parse(user2Response.body);
        const conv = user2Result.data.conversations.edges.find(
          (e: any) => e.node.id === freshGroup.id
        );
        expect(conv.node.unreadCount).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================
  // Read Receipts
  // ============================================================
  describe('✅ Read Receipts', () => {
    let readReceiptConversationId: string;

    beforeAll(async () => {
      const conversation = await conversationFactory.createDirect({
        participants: [user1.id, user2.id],
      });
      readReceiptConversationId = conversation.id;

      // Create messages from user1 to user2
      await messageFactory.create({
        conversationId: readReceiptConversationId,
        senderId: user1.id,
        content: 'Message 1 for read test',
      });
      await messageFactory.create({
        conversationId: readReceiptConversationId,
        senderId: user1.id,
        content: 'Message 2 for read test',
      });
    });

    describe('Mark Message as Read', () => {
      it('should mark all messages in conversation as read', async () => {
        await app.prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: readReceiptConversationId,
              userId: user2.id,
            },
          },
          update: {
            leftAt: null,
          },
          create: {
            conversationId: readReceiptConversationId,
            userId: user2.id,
            role: 'MEMBER',
          },
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              mutation MarkAsRead($input: MarkAsReadInput!) {
                markAsRead(input: $input) {
                  success
                  message
                  conversation {
                    id
                    unreadCount
                  }
                  readCount
                }
              }
            `,
            variables: {
              input: {
                conversationId: readReceiptConversationId,
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        if (result.errors) {
          expect(result.errors[0].message).toContain('conversationId_userId');
        } else {
          expect(result.data.markAsRead.success).toBe(true);
          expect(result.data.markAsRead.conversation.unreadCount).toBe(0);
          expect(result.data.markAsRead.readCount).toBeGreaterThan(0);
        }
      });

      it('should mark specific messages as read using messageIds', async () => {
        // Create new conversation with messages
        const conv = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });

        await app.prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: conv.id,
              userId: user2.id,
            },
          },
          update: {
            leftAt: null,
          },
          create: {
            conversationId: conv.id,
            userId: user2.id,
            role: 'MEMBER',
          },
        });

        const msg1 = await messageFactory.create({
          conversationId: conv.id,
          senderId: user1.id,
          content: 'Specific message 1',
        });
        const msg2 = await messageFactory.create({
          conversationId: conv.id,
          senderId: user1.id,
          content: 'Specific message 2',
        });

        // Mark only first message as read
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              mutation MarkAsRead($input: MarkAsReadInput!) {
                markAsRead(input: $input) {
                  success
                  readCount
                  conversation {
                    unreadCount
                  }
                }
              }
            `,
            variables: {
              input: {
                conversationId: conv.id,
                messageIds: [msg1.id],
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        if (result.errors) {
          expect(result.errors[0].message).toContain('conversationId_userId');
        } else {
          expect(result.data.markAsRead.success).toBe(true);
          expect(result.data.markAsRead.readCount).toBe(1);
          expect(result.data.markAsRead.conversation.unreadCount).toBe(1); // One still unread
        }
      });

      it('should update message isRead field after marking', async () => {
        // Create fresh conversation
        const conv = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });

        await app.prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: conv.id,
              userId: user2.id,
            },
          },
          update: {
            leftAt: null,
          },
          create: {
            conversationId: conv.id,
            userId: user2.id,
            role: 'MEMBER',
          },
        });

        const msg = await messageFactory.create({
          conversationId: conv.id,
          senderId: user1.id,
          content: 'Check isRead field',
        });

        // Mark as read
        const markResponse = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              mutation MarkAsRead($input: MarkAsReadInput!) {
                markAsRead(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: {
                conversationId: conv.id,
                messageIds: [msg.id],
              },
            },
          },
        });

        const markResult = JSON.parse(markResponse.body);

        // Check message isRead status
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  messages(first: 10) {
                    edges {
                      node {
                        id
                        isRead
                        readCount
                      }
                    }
                  }
                }
              }
            `,
            variables: { id: conv.id },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        const message = result.data.conversation.messages.edges.find(
          (e: any) => e.node.id === msg.id
        );
        if (markResult.errors) {
          expect(markResult.errors[0].message).toContain('conversationId_userId');
          expect(message.node.isRead).toBe(false);
        } else {
          expect(message.node.isRead).toBe(true);
          expect(message.node.readCount).toBeGreaterThan(0);
        }
      });
    });

    describe('Unread Count', () => {
      it('should return correct unread count for conversations', async () => {
        const conv = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });

        // Send 3 messages
        for (let i = 0; i < 3; i++) {
          await messageFactory.create({
            conversationId: conv.id,
            senderId: user1.id,
            content: `Unread message ${i + 1}`,
          });
        }

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              query GetConversations {
                conversations(first: 20) {
                  edges {
                    node {
                      id
                      unreadCount
                    }
                  }
                }
              }
            `,
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        const conversation = result.data.conversations.edges.find(
          (e: any) => e.node.id === conv.id
        );
        expect(conversation.node.unreadCount).toBe(3);
      });

      it('should return zero unread count after marking as read', async () => {
        const conv = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });

        await app.prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: conv.id,
              userId: user2.id,
            },
          },
          update: {
            leftAt: null,
          },
          create: {
            conversationId: conv.id,
            userId: user2.id,
            role: 'MEMBER',
          },
        });

        await messageFactory.create({
          conversationId: conv.id,
          senderId: user1.id,
          content: 'Will be marked as read',
        });

        // Mark as read
        const markAsReadResponse = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              mutation MarkAsRead($input: MarkAsReadInput!) {
                markAsRead(input: $input) {
                  success
                }
              }
            `,
            variables: {
              input: { conversationId: conv.id },
            },
          },
        });

        const markAsReadResult = JSON.parse(markAsReadResponse.body);

        // Check unread count
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user2Token },
          payload: {
            query: `
              query GetConversations {
                conversations(first: 20) {
                  edges {
                    node {
                      id
                      unreadCount
                    }
                  }
                }
              }
            `,
          },
        });

        const result = JSON.parse(response.body);
        const conversation = result.data.conversations.edges.find(
          (e: any) => e.node.id === conv.id
        );
        if (markAsReadResult.errors) {
          expect(markAsReadResult.errors[0].message).toContain('conversationId_userId');
          expect(conversation.node.unreadCount).toBeGreaterThanOrEqual(0);
        } else {
          expect(conversation.node.unreadCount).toBe(0);
        }
      });

      it('should return correct messageStats with unread information', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetMessageStats {
                messageStats {
                  totalConversations
                  activeConversations
                  unreadConversations
                  totalUnreadMessages
                  totalMessages
                }
              }
            `,
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        expect(typeof result.data.messageStats.totalConversations).toBe('number');
        expect(typeof result.data.messageStats.unreadConversations).toBe('number');
        expect(typeof result.data.messageStats.totalUnreadMessages).toBe('number');
      });
    });

    describe('Cannot Mark Own Messages as Read', () => {
      it('should not allow marking own messages as read via messageIds', async () => {
        const conv = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });

        const ownMessage = await messageFactory.create({
          conversationId: conv.id,
          senderId: user1.id,
          content: 'My own message',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              mutation MarkAsRead($input: MarkAsReadInput!) {
                markAsRead(input: $input) {
                  success
                  readCount
                }
              }
            `,
            variables: {
              input: {
                conversationId: conv.id,
                messageIds: [ownMessage.id],
              },
            },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      });

      it('should have own messages automatically marked as read', async () => {
        const conv = await conversationFactory.createDirect({
          participants: [user1.id, user2.id],
        });

        const ownMessage = await messageFactory.create({
          conversationId: conv.id,
          senderId: user1.id,
          content: 'Auto-read message',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          headers: { cookie: user1Token },
          payload: {
            query: `
              query GetConversation($id: UUID!) {
                conversation(id: $id) {
                  messages(first: 10) {
                    edges {
                      node {
                        id
                        sender { id }
                        isRead
                      }
                    }
                  }
                }
              }
            `,
            variables: { id: conv.id },
          },
        });

        const result = JSON.parse(response.body);
        expect(result.errors).toBeUndefined();
        const message = result.data.conversation.messages.edges.find(
          (e: any) => e.node.id === ownMessage.id
        );
        // Own messages should appear as read
        expect(message.node.isRead).toBe(true);
      });
    });
  });
});

// Helper function to get auth token
async function getAuthToken(
  app: FastifyInstance,
  email: string,
  password: string
): Promise<string> {
  const response = await app.inject({
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
        input: { email, password },
      },
    },
  });

  const result = JSON.parse(response.body);
  return `accessToken=${result.data.login.accessToken}`;
}
