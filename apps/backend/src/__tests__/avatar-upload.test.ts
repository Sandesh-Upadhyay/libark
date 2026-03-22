/**
 * アバターアップロード修正のテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GraphQLError } from 'graphql';
import { PrismaClient } from '@libark/db';

import { userResolvers } from '../resolvers/user';

import { createTestApp, cleanupTestApp } from './helpers/test-app';

describe('Avatar Upload Fix', () => {
  let app: any;
  let prisma: PrismaClient;
  let mockUser: any;
  let mockMedia: any;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.prisma;

    // テスト用ユーザーを作成
    const timestamp = Date.now();
    mockUser = await prisma.user.create({
      data: {
        username: `testuser-${timestamp}`,
        email: `test-${timestamp}@example.com`,
        passwordHash: 'hashedpassword',
        displayName: 'Test User',
      },
    });

    // テスト用メディアレコードを作成（PROCESSING状態）
    mockMedia = await prisma.media.create({
      data: {
        userId: mockUser.id,
        filename: `avatar-${timestamp}.webp`,
        s3Key: `avatar/2025-07-16/test-avatar-${timestamp}.webp`,
        mimeType: 'image/webp',
        fileSize: 1024,
        type: 'AVATAR',
        status: 'PROCESSING', // 重要: PROCESSING状態
      },
    });
  });

  afterEach(async () => {
    await cleanupTestApp(app);
  });

  it('should allow avatar update with PROCESSING status', async () => {
    const input = {
      mediaId: mockMedia.id,
    };

    const graphqlContext = {
      prisma,
      user: mockUser,
      request: {},
      reply: {},
      fastify: app,
    };

    const result = await userResolvers.Mutation.updateUserAvatar(null, { input }, graphqlContext);

    expect(result.success).toBe(true);
    expect(result.user.profileImageId).toBe(mockMedia.id);
    expect(result.message).toBe('アバター画像を更新しました');
  });

  it('should reject non-existent media', async () => {
    const input = {
      mediaId: '99999999-9999-9999-9999-999999999999',
    };

    const graphqlContext = {
      prisma,
      user: mockUser,
      request: {},
      reply: {},
      fastify: app,
    };

    await expect(
      userResolvers.Mutation.updateUserAvatar(null, { input }, graphqlContext)
    ).rejects.toThrow(GraphQLError);
  });

  it('should reject media owned by different user', async () => {
    // 別のユーザーを作成
    const otherTimestamp = Date.now() + 1;
    const otherUser = await prisma.user.create({
      data: {
        username: `otheruser-${otherTimestamp}`,
        email: `other-${otherTimestamp}@example.com`,
        passwordHash: 'hashedpassword',
      },
    });

    // 別のユーザーのメディアを作成
    const otherMedia = await prisma.media.create({
      data: {
        userId: otherUser.id,
        filename: `other-avatar-${otherTimestamp}.webp`,
        s3Key: `avatar/2025-07-16/other-avatar-${otherTimestamp}.webp`,
        mimeType: 'image/webp',
        fileSize: 1024,
        type: 'AVATAR',
        status: 'READY',
      },
    });

    const input = {
      mediaId: otherMedia.id,
    };

    const graphqlContext = {
      prisma,
      user: mockUser,
      request: {},
      reply: {},
      fastify: app,
    };

    await expect(
      userResolvers.Mutation.updateUserAvatar(null, { input }, graphqlContext)
    ).rejects.toThrow(GraphQLError);
  });

  it('should work with READY status media (existing functionality)', async () => {
    // READYステータスのメディアを作成
    const readyTimestamp = Date.now() + 2;
    const readyMedia = await prisma.media.create({
      data: {
        userId: mockUser.id,
        filename: `ready-avatar-${readyTimestamp}.webp`,
        s3Key: `avatar/2025-07-16/ready-avatar-${readyTimestamp}.webp`,
        mimeType: 'image/webp',
        fileSize: 1024,
        type: 'AVATAR',
        status: 'READY',
      },
    });

    const input = {
      mediaId: readyMedia.id,
    };

    const graphqlContext = {
      prisma,
      user: mockUser,
      request: {},
      reply: {},
      fastify: app,
    };

    const result = await userResolvers.Mutation.updateUserAvatar(null, { input }, graphqlContext);

    expect(result.success).toBe(true);
    expect(result.user.profileImageId).toBe(readyMedia.id);
  });

  it('should reject FAILED status media', async () => {
    // FAILEDステータスのメディアを作成
    const failedTimestamp = Date.now() + 3;
    const failedMedia = await prisma.media.create({
      data: {
        userId: mockUser.id,
        filename: `failed-avatar-${failedTimestamp}.webp`,
        s3Key: `avatar/2025-07-16/failed-avatar-${failedTimestamp}.webp`,
        mimeType: 'image/webp',
        fileSize: 1024,
        type: 'AVATAR',
        status: 'FAILED',
      },
    });

    const input = {
      mediaId: failedMedia.id,
    };

    const graphqlContext = {
      prisma,
      user: mockUser,
      request: {},
      reply: {},
      fastify: app,
    };

    await expect(
      userResolvers.Mutation.updateUserAvatar(null, { input }, graphqlContext)
    ).rejects.toThrow(GraphQLError);
  });
});
