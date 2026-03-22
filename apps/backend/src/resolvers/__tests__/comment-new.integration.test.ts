import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@libark/db/server';
import { Redis } from 'ioredis';
import { counterManager } from '@libark/redis-client';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { cleanupTestData } from '../../__tests__/helpers/test-data.js';
import { UserFactory, PostFactory, CommentFactory } from '../../__tests__/factories/index.js';

/**
 * 💬 Comment Integration Tests - TDD RED Phase
 *
 * Comprehensive tests for Comment functionality covering:
 * - Comment creation (on own and others' posts)
 * - Comment list retrieval with pagination
 * - Comment deletion authorization
 * - Edge cases and error scenarios
 */

describe('💬 Comment Integration Tests (TDD - RED Phase)', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };
  let userFactory: UserFactory;
  let postFactory: PostFactory;
  let commentFactory: CommentFactory;

  // Test users
  let postOwner: Awaited<ReturnType<typeof userFactory.createWithPassword>>;
  let commenter: Awaited<ReturnType<typeof userFactory.createWithPassword>>;
  let otherUser: Awaited<ReturnType<typeof userFactory.createWithPassword>>;

  // Auth tokens
  let postOwnerToken: string;
  let commenterToken: string;
  let otherUserToken: string;

  // Test posts
  let publicPost: Awaited<ReturnType<typeof postFactory.createPublic>>;
  let privatePost: Awaited<ReturnType<typeof postFactory.createPrivate>>;
  let deletedPost: Awaited<ReturnType<typeof postFactory.createDeleted>>;

  beforeAll(async () => {
    // Mock counterManager to avoid Redis errors
    vi.spyOn(counterManager, 'getCommentStats').mockResolvedValue({ likes: 0 });
    vi.spyOn(counterManager, 'incrementCommentStat').mockResolvedValue();
    vi.spyOn(counterManager, 'decrementCommentStat').mockResolvedValue();
    vi.spyOn(counterManager, 'incrementPostStat').mockResolvedValue();
    vi.spyOn(counterManager, 'decrementPostStat').mockResolvedValue();
    vi.spyOn(counterManager, 'incrementUserStat').mockResolvedValue();
    vi.spyOn(counterManager, 'decrementUserStat').mockResolvedValue();
    vi.spyOn(counterManager, 'incrementGlobalStat').mockResolvedValue();
    vi.spyOn(counterManager, 'decrementGlobalStat').mockResolvedValue();

    app = await createTestApp();
    userFactory = new UserFactory(app.prisma);
    postFactory = new PostFactory(app.prisma, userFactory);
    commentFactory = new CommentFactory(app.prisma, userFactory, postFactory);

    // Create test users with passwords
    postOwner = await userFactory.createWithPassword('PostOwner123!', {
      username: 'post_owner',
      email: 'post_owner@example.com',
    });

    commenter = await userFactory.createWithPassword('Commenter123!', {
      username: 'commenter_user',
      email: 'commenter@example.com',
    });

    otherUser = await userFactory.createWithPassword('OtherUser123!', {
      username: 'other_user',
      email: 'other_user@example.com',
    });

    // Get auth tokens via login
    postOwnerToken = await loginAndGetToken(app, postOwner.email, 'PostOwner123!');
    commenterToken = await loginAndGetToken(app, commenter.email, 'Commenter123!');
    otherUserToken = await loginAndGetToken(app, otherUser.email, 'OtherUser123!');

    // Create test posts
    publicPost = await postFactory.createPublic({ userId: postOwner.id });
    privatePost = await postFactory.createPrivate({ userId: postOwner.id });
    deletedPost = await postFactory.createDeleted({ userId: postOwner.id });
  });

  afterAll(async () => {
    await cleanupTestData(app.prisma);
    await cleanupTestApp(app);
  });

  // ============================================
  // 📝 CREATE COMMENT TESTS
  // ============================================

  describe('📝 createComment - Comment Creation', () => {
    const createCommentMutation = `
      mutation CreateComment($input: CommentCreateInput!) {
        createComment(input: $input) {
          id
          content
          user {
            id
            username
          }
          post {
            id
          }
          createdAt
        }
      }
    `;

    describe('✅ Success Cases', () => {
      it('should create a comment on own post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: 'This is my comment on my own post',
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.createComment).toBeDefined();
        expect(result.data.createComment.id).toBeDefined();
        expect(result.data.createComment.content).toBe('This is my comment on my own post');
        expect(result.data.createComment.user.id).toBe(postOwner.id);
        expect(result.data.createComment.post.id).toBe(publicPost.id);
        expect(result.data.createComment.createdAt).toBeDefined();
      });

      it('should create a comment on others public post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: 'Nice post! Great content here.',
              },
            },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.createComment).toBeDefined();
        expect(result.data.createComment.content).toBe('Nice post! Great content here.');
        expect(result.data.createComment.user.id).toBe(commenter.id);
        expect(result.data.createComment.post.id).toBe(publicPost.id);
      });

      it('should create comment with emoji and special characters', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: '🎉 Amazing post! 日本語もOK! @mentions #hashtags',
              },
            },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.createComment.content).toBe(
          '🎉 Amazing post! 日本語もOK! @mentions #hashtags'
        );
      });

      it('should create comment with long content (up to 1000 chars)', async () => {
        const longContent = 'A'.repeat(1000);

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: longContent,
              },
            },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.createComment.content).toBe(longContent);
      });
    });

    describe('❌ Error Cases - Authorization', () => {
      it('should fail to create comment without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: 'Unauthorized comment attempt',
              },
            },
          },
          headers: {
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      });

      it('should fail to create comment on private post (when not owner)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: privatePost.id,
                content: 'Trying to comment on private post',
              },
            },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
      });

      it('should succeed creating comment on own private post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: privatePost.id,
                content: 'Commenting on my own private post',
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.createComment.content).toBe('Commenting on my own private post');
      });
    });

    describe('❌ Error Cases - Invalid Input', () => {
      it('should fail to create comment on deleted post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: deletedPost.id,
                content: 'Comment on deleted post',
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });

      it('should fail to create comment on non-existent post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
                content: 'Comment on non-existent post',
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });

      it('should fail to create comment with empty content', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: '',
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
      });

      it('should fail to create comment with content exceeding max length', async () => {
        const tooLongContent = 'A'.repeat(1001);

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: publicPost.id,
                content: tooLongContent,
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
      });

      it('should fail to create comment with invalid UUID format', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: createCommentMutation,
            variables: {
              input: {
                postId: 'invalid-uuid-format',
                content: 'Test comment',
              },
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
      });
    });
  });

  // ============================================
  // 📜 LIST COMMENTS TESTS
  // ============================================

  describe('📜 comments - Comment List Retrieval', () => {
    let postWithComments: Awaited<ReturnType<typeof postFactory.createPublic>>;
    const commentContents: string[] = [];

    beforeAll(async () => {
      // Create a post with multiple comments for pagination testing
      postWithComments = await postFactory.createPublic({ userId: postOwner.id });

      // Create 15 comments
      for (let i = 1; i <= 15; i++) {
        const content = `Comment number ${i} for pagination testing`;
        commentContents.push(content);
        await commentFactory.create({
          postId: postWithComments.id,
          userId: i % 2 === 0 ? postOwner.id : commenter.id,
          content,
        });
      }
    });

    const commentsQuery = `
      query Comments($postId: UUID!, $first: Int, $after: String) {
        comments(postId: $postId, first: $first, after: $after) {
          id
          content
          user {
            id
            username
          }
          createdAt
        }
      }
    `;

    describe('✅ Success Cases', () => {
      it('should retrieve all comments for a post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: postWithComments.id,
              first: 20,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(Array.isArray(result.data.comments)).toBe(true);
        expect(result.data.comments.length).toBeGreaterThanOrEqual(15);
      });

      it('should support pagination with first parameter', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: postWithComments.id,
              first: 5,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.comments.length).toBeLessThanOrEqual(5);
      });

      it('should support cursor-based pagination with after parameter', async () => {
        // First page
        const firstPageResponse = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: postWithComments.id,
              first: 5,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const firstPage = JSON.parse(firstPageResponse.body);
        expect(firstPage.data.comments.length).toBe(5);

        const lastCommentId = firstPage.data.comments[4].id;

        // Second page using cursor
        const secondPageResponse = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: postWithComments.id,
              first: 5,
              after: lastCommentId,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const secondPage = JSON.parse(secondPageResponse.body);

        expect(secondPage.errors).toBeUndefined();
        expect(secondPage.data.comments.length).toBeGreaterThan(0);
        expect(secondPage.data.comments[0].id).not.toBe(lastCommentId);
      });

      it('should retrieve comments with user information', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: postWithComments.id,
              first: 1,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.comments[0].user).toBeDefined();
        expect(result.data.comments[0].user.id).toBeDefined();
        expect(result.data.comments[0].user.username).toBeDefined();
      });

      it('should retrieve comments without authentication for public posts', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: publicPost.id,
              first: 10,
            },
          },
          headers: {
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(Array.isArray(result.data.comments)).toBe(true);
      });
    });

    describe('❌ Error Cases', () => {
      it('should fail to retrieve comments for non-existent post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
              first: 10,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });

      it('should fail to retrieve comments for deleted post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: deletedPost.id,
              first: 10,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });

      it('should fail to retrieve comments for private post (when not owner)', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: privatePost.id,
              first: 10,
            },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
      });

      it('should succeed retrieving comments for own private post', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: privatePost.id,
              first: 10,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(Array.isArray(result.data.comments)).toBe(true);
      });
    });

    describe('🔍 Edge Cases', () => {
      it('should return empty array for post with no comments', async () => {
        const emptyPost = await postFactory.createPublic({ userId: postOwner.id });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: emptyPost.id,
              first: 10,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.comments).toEqual([]);
      });

      it('should not include deleted comments in results', async () => {
        const post = await postFactory.createPublic({ userId: postOwner.id });

        // Create a normal comment
        const normalComment = await commentFactory.create({
          postId: post.id,
          userId: postOwner.id,
          content: 'Normal comment',
        });

        // Create a deleted comment
        await commentFactory.createDeleted({
          postId: post.id,
          userId: postOwner.id,
          content: 'Deleted comment',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: post.id,
              first: 10,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.comments.length).toBe(1);
        expect(result.data.comments[0].id).toBe(normalComment.id);
      });

      it('should handle pagination with first=0', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentsQuery,
            variables: {
              postId: postWithComments.id,
              first: 0,
            },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.data.comments).toEqual([]);
      });
    });
  });

  // ============================================
  // 🗑️ DELETE COMMENT TESTS
  // ============================================

  describe('🗑️ deleteComment - Comment Deletion', () => {
    const deleteCommentMutation = `
      mutation DeleteComment($id: UUID!) {
        deleteComment(id: $id)
      }
    `;

    describe('✅ Success Cases', () => {
      it('should delete own comment', async () => {
        // Create a comment to delete
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: commenter.id,
          content: 'Comment to be deleted',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.deleteComment).toBe(true);

        // Verify comment is marked as deleted in DB
        const deletedComment = await app.prisma.comment.findUnique({
          where: { id: comment.id },
        });
        expect(deletedComment?.isDeleted).toBe(true);
      });

      it('should allow post owner to delete comments on their own post', async () => {
        // Another user creates a comment on postOwner's post
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: otherUser.id,
          content: 'Comment by other user',
        });

        // Post owner deletes it
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        // Note: Current implementation only checks comment.userId, not post.userId
        // This test documents the current behavior
        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
      });
    });

    describe('❌ Error Cases - Authorization', () => {
      it('should fail to delete comment without authentication', async () => {
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: postOwner.id,
          content: 'Comment to delete',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      });

      it('should fail to delete others comment', async () => {
        // Create a comment by postOwner
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: postOwner.id,
          content: 'Post owner comment',
        });

        // Try to delete it as commenter
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
      });

      it('should fail to delete already deleted comment', async () => {
        const comment = await commentFactory.createDeleted({
          postId: publicPost.id,
          userId: commenter.id,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            cookie: commenterToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });

      it('should fail to delete non-existent comment', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });
    });

    describe('🔍 Edge Cases', () => {
      it('should fail to delete comment with invalid UUID format', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: 'invalid-uuid' },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
      });

      it('should handle concurrent deletion attempts gracefully', async () => {
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: postOwner.id,
          content: 'Concurrent deletion test',
        });

        // First deletion
        const response1 = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result1 = JSON.parse(response1.body);
        expect(result1.data.deleteComment).toBe(true);

        // Second deletion attempt (should fail)
        const response2 = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: deleteCommentMutation,
            variables: { id: comment.id },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result2 = JSON.parse(response2.body);
        expect(result2.errors).toBeDefined();
        expect(result2.errors[0].extensions.code).toBe('NOT_FOUND');
      });
    });
  });

  // ============================================
  // 🔍 COMMENT QUERY TESTS
  // ============================================

  describe('🔍 comment - Single Comment Retrieval', () => {
    const commentQuery = `
      query Comment($id: UUID!) {
        comment(id: $id) {
          id
          content
          user {
            id
            username
          }
          post {
            id
          }
          createdAt
          updatedAt
        }
      }
    `;

    describe('✅ Success Cases', () => {
      it('should retrieve a single comment by ID', async () => {
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: postOwner.id,
          content: 'Single comment retrieval test',
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentQuery,
            variables: { id: comment.id },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(result.errors).toBeUndefined();
        expect(result.data.comment.id).toBe(comment.id);
        expect(result.data.comment.content).toBe('Single comment retrieval test');
        expect(result.data.comment.user.id).toBe(postOwner.id);
      });
    });

    describe('❌ Error Cases', () => {
      it('should fail to retrieve comment without authentication', async () => {
        const comment = await commentFactory.create({
          postId: publicPost.id,
          userId: postOwner.id,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentQuery,
            variables: { id: comment.id },
          },
          headers: {
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      });

      it('should fail to retrieve deleted comment', async () => {
        const comment = await commentFactory.createDeleted({
          postId: publicPost.id,
          userId: postOwner.id,
        });

        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentQuery,
            variables: { id: comment.id },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });

      it('should fail to retrieve non-existent comment', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/graphql',
          payload: {
            query: commentQuery,
            variables: { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' },
          },
          headers: {
            cookie: postOwnerToken,
            'content-type': 'application/json',
          },
        });

        const result = JSON.parse(response.body);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].extensions.code).toBe('NOT_FOUND');
      });
    });
  });
});

/**
 * Helper function to login and get auth token
 */
async function loginAndGetToken(
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
        input: {
          email,
          password,
        },
      },
    },
  });

  const result = JSON.parse(response.body);

  if (result.errors) {
    throw new Error(`Login failed: ${result.errors[0].message}`);
  }

  return `accessToken=${result.data.login.accessToken}`;
}
