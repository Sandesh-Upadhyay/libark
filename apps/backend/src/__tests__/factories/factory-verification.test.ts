import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserFactory, PostFactory } from './index';
import { createTestApp, cleanupTestApp } from '../helpers/test-app';
import { cleanupTestData } from '../helpers/test-data';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

describe('Factory Infrastructure Verification', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  it('UserFactory can create a user', async () => {
    const factory = new UserFactory(app.prisma);
    const user = await factory.create();

    expect(user.id).toBeDefined();
    expect(user.username).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.isActive).toBe(true);
    expect(user.isVerified).toBe(true);

    await cleanupTestData(app.prisma);
  });

  it('PostFactory can create a post with auto-generated user', async () => {
    const userFactory = new UserFactory(app.prisma);
    const postFactory = new PostFactory(app.prisma, userFactory);

    const post = await postFactory.createPublic();

    expect(post.id).toBeDefined();
    expect(post.visibility).toBe('PUBLIC');
    expect(post.userId).toBeDefined();
    expect(post.isDeleted).toBe(false);

    await cleanupTestData(app.prisma);
  });

  it('PostFactory can create PAID post', async () => {
    const userFactory = new UserFactory(app.prisma);
    const postFactory = new PostFactory(app.prisma, userFactory);

    const post = await postFactory.createPaid(1000);

    expect(post.visibility).toBe('PAID');
    expect(post.price?.toString()).toBe('1000');
    expect(post.paidAt).toBeDefined();

    await cleanupTestData(app.prisma);
  });
});
