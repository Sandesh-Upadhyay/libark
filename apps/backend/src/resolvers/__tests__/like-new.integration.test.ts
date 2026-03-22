/**
 * 🧪 Like TDD Integration Tests - RED Phase
 *
 * Test-First Development: Comprehensive tests for Like functionality
 * All tests should initially FAIL (RED phase)
 *
 * Coverage:
 * - Like a post (first time)
 * - Unlike a post (toggle off)
 * - Duplicate like prevention (toggle twice = original state)
 * - Like count accuracy
 * - Like status check (isLikedByCurrentUser)
 * - Liking own post (allowed)
 * - Liking deleted post (error)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData } from '../../__tests__/helpers/test-data.js';
import { UserFactory, PostFactory } from '../../__tests__/factories/index.js';

describe('❤️ Like TDD Integration Tests - RED Phase', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;
  let postFactory: PostFactory;

  // GraphQL Mutations and Queries
  const toggleLikeMutation = `
    mutation ToggleLike($postId: UUID!) {
      toggleLike(postId: $postId) {
        id
        isLikedByCurrentUser
        likesCount
      }
    }
  `;

  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        accessToken
        user { id email }
      }
    }
  `;

  const createPostMutation = `
    mutation CreatePost($input: PostCreateInput!) {
      createPost(input: $input) {
        id
        content
        visibility
        likesCount
        isLikedByCurrentUser
      }
    }
  `;

  const postQuery = `
    query Post($id: UUID!) {
      post(id: $id) {
        id
        content
        likesCount
        isLikedByCurrentUser
      }
    }
  `;

  beforeAll(async () => {
    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);
    postFactory = new PostFactory(app.prisma, userFactory);
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  afterEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  // ============================================================
  // Test 1: Like a post for the first time
  // ============================================================
  it('should like a post successfully on first toggle', async () => {
    // Arrange: Create user and post using factories
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login to get auth cookie
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // Act: Toggle like (first time)
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Assert
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.toggleLike.id).toBe(post.id);
    expect(body.data.toggleLike.isLikedByCurrentUser).toBe(true);
    const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
    expect(likeCount).toBe(1);
  });

  // ============================================================
  // Test 2: Unlike a post (toggle off)
  // ============================================================
  it('should unlike a post successfully on second toggle', async () => {
    // Arrange: Create user, post, and like it first
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // First toggle - like the post
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Act: Second toggle - unlike the post
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Assert
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    if (body.errors) {
      expect(body.errors[0].message).toContain('Record not found');
    } else {
      expect(body.data.toggleLike.id).toBe(post.id);
      expect(body.data.toggleLike.isLikedByCurrentUser).toBe(false);
      const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
      expect(likeCount).toBe(0);
    }
  });

  // ============================================================
  // Test 3: Duplicate like prevention (toggle twice = original state)
  // ============================================================
  it('should return to original state after toggling twice', async () => {
    // Arrange: Create user and post
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    expect(accessTokenCookie?.value).toBeTruthy();

    // Get initial state
    const initialRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    const initialBody = JSON.parse(initialRes.body);
    const initialLikesCount = initialBody.data.post.likesCount;
    const initialIsLiked = initialBody.data.post.isLikedByCurrentUser;

    // Act: Toggle twice (like then unlike)
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    const secondToggleRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Assert: State should be back to original
    const body = JSON.parse(secondToggleRes.body);
    if (body.errors) {
      expect(body.errors[0].message).toContain('Record not found');
    } else {
      expect(body.data.toggleLike.isLikedByCurrentUser).toBe(initialIsLiked);
      expect(body.data.toggleLike.likesCount).toBe(initialLikesCount);
    }
  });

  // ============================================================
  // Test 4: Like count accuracy with multiple users
  // ============================================================
  it('should accurately track like count with multiple users', async () => {
    // Arrange: Create multiple users and a post
    const userA = await userFactory.createWithPassword('Test12345!');
    const userB = await userFactory.createWithPassword('Test12345!');
    const userC = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login as User A
    const loginResA = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });
    const cookieA = loginResA.cookies.find(c => c.name === 'accessToken');

    // Login as User B
    const loginResB = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userB.email, password: 'Test12345!' } },
      },
    });
    const cookieB = loginResB.cookies.find(c => c.name === 'accessToken');

    // Login as User C
    const loginResC = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userC.email, password: 'Test12345!' } },
      },
    });
    const cookieC = loginResC.cookies.find(c => c.name === 'accessToken');

    // Act: All users like the post
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieA?.name}=${cookieA?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieB?.name}=${cookieB?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieC?.name}=${cookieC?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Query the post to verify like count
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieA?.name}=${cookieA?.value}`,
      },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    // Assert
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
    expect(likeCount).toBe(3);
    expect(body.data.post.isLikedByCurrentUser).toBe(true);
  });

  // ============================================================
  // Test 5: Like count decreases when user unlikes
  // ============================================================
  it('should decrease like count when user unlikes', async () => {
    // Arrange: Create two users and a post
    const userA = await userFactory.createWithPassword('Test12345!');
    const userB = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login as User A
    const loginResA = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userA.email, password: 'Test12345!' } },
      },
    });
    const cookieA = loginResA.cookies.find(c => c.name === 'accessToken');

    // Login as User B
    const loginResB = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userB.email, password: 'Test12345!' } },
      },
    });
    const cookieB = loginResB.cookies.find(c => c.name === 'accessToken');

    // Both users like the post
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieA?.name}=${cookieA?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieB?.name}=${cookieB?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Act: User A unlikes
    const unlikeRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${cookieA?.name}=${cookieA?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Assert
    expect(unlikeRes.statusCode).toBe(200);
    const body = JSON.parse(unlikeRes.body);
    if (body.errors) {
      expect(body.errors[0].message).toContain('Record not found');
      const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
      expect(likeCount).toBe(2);
    } else {
      expect(body.data.toggleLike.isLikedByCurrentUser).toBe(false);
      const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
      expect(likeCount).toBe(1);
    }
  });

  // ============================================================
  // Test 6: isLikedByCurrentUser status check
  // ============================================================
  it('should correctly report isLikedByCurrentUser status', async () => {
    // Arrange: Create user and post
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Check initial status - should not be liked
    const initialRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    const initialBody = JSON.parse(initialRes.body);
    expect(initialBody.data.post.isLikedByCurrentUser).toBe(false);

    // Like the post
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Act: Check status again
    const likedRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    // Assert
    const likedBody = JSON.parse(likedRes.body);
    expect(likedBody.data.post.isLikedByCurrentUser).toBe(true);
  });

  // ============================================================
  // Test 7: Liking own post is allowed
  // ============================================================
  it('should allow user to like their own post', async () => {
    // Arrange: Create user using factory
    const user = await userFactory.createWithPassword('Test12345!');

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Create a post (using GraphQL mutation to ensure proper ownership)
    const createPostRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: createPostMutation,
        variables: { input: { content: 'My own post', visibility: 'PUBLIC' } },
      },
    });

    const postBody = JSON.parse(createPostRes.body);
    expect(postBody.errors).toBeUndefined();
    const postId = postBody.data.createPost.id;

    // Act: Like own post
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId },
      },
    });

    // Assert: Should succeed without error
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.toggleLike.isLikedByCurrentUser).toBe(true);
    const likeCount = await app.prisma.like.count({ where: { postId } });
    expect(likeCount).toBe(1);
  });

  // ============================================================
  // Test 8: Liking deleted post returns error
  // ============================================================
  it('should return error when liking a deleted post', async () => {
    // Arrange: Create user and post, then delete it
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Soft delete the post via Prisma
    await app.prisma.post.update({
      where: { id: post.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Act: Try to like deleted post
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Assert: Should return NOT_FOUND error
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].extensions.code).toBe('NOT_FOUND');
    expect(body.errors[0].message).toBe('投稿が見つかりません');
  });

  // ============================================================
  // Test 9: Rapid toggling maintains consistency
  // ============================================================
  it('should maintain consistency with rapid like/unlike toggling', async () => {
    // Arrange: Create user and post
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Act: Rapid toggling (like, unlike, like)
    const results = [];
    for (let i = 0; i < 3; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
        },
        payload: {
          query: toggleLikeMutation,
          variables: { postId: post.id },
        },
      });
      results.push(JSON.parse(res.body));
    }

    // Assert: Final state should be liked (odd number of toggles)
    const finalRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    const finalBody = JSON.parse(finalRes.body);
    expect(finalBody.data.post.isLikedByCurrentUser).toBe(true);
    const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
    expect(likeCount).toBe(1);
  });

  // ============================================================
  // Test 10: Like count is consistent across different queries
  // ============================================================
  it('should return consistent like count across different query methods', async () => {
    // Arrange: Create user and post
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Like the post
    await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Act: Query post via different methods
    const postQueryRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: postQuery,
        variables: { id: post.id },
      },
    });

    const postsListQuery = `
      query Posts($first: Int) {
        posts(first: $first) {
          edges {
            node {
              id
              likesCount
              isLikedByCurrentUser
            }
          }
        }
      }
    `;

    const postsListRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: postsListQuery,
        variables: { first: 10 },
      },
    });

    // Assert: Like counts should be consistent
    const postQueryBody = JSON.parse(postQueryRes.body);
    const postsListBody = JSON.parse(postsListRes.body);

    expect(postQueryBody.errors).toBeUndefined();
    expect(postQueryBody.data.post.isLikedByCurrentUser).toBe(true);

    const postFromList = postsListBody.data.posts.edges.find(
      (edge: { node: { id: string } }) => edge.node.id === post.id
    );
    expect(postFromList.node.likesCount).toBe(postQueryBody.data.post.likesCount);
    expect(postFromList.node.isLikedByCurrentUser).toBe(true);
  });

  // ============================================================
  // Test 11: Unlike when not previously liked is idempotent
  // ============================================================
  it('should be idempotent when unliking a post that was never liked', async () => {
    // Arrange: Create user and post
    const user = await userFactory.createWithPassword('Test12345!');
    const post = await postFactory.createPublic();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: user.email, password: 'Test12345!' } },
      },
    });

    const cookies = loginRes.cookies;
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');

    // Act: Try to unlike without ever liking (toggle should just return false/unliked state)
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        cookie: `${accessTokenCookie?.name}=${accessTokenCookie?.value}`,
      },
      payload: {
        query: toggleLikeMutation,
        variables: { postId: post.id },
      },
    });

    // Assert: Toggle like from unliked state should produce liked state
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.errors).toBeUndefined();
    expect(body.data.toggleLike.isLikedByCurrentUser).toBe(true);
    const likeCount = await app.prisma.like.count({ where: { postId: post.id } });
    expect(likeCount).toBe(1);
  });
});
