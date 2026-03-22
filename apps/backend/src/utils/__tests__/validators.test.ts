import { describe, it, expect, vi } from 'vitest';
import { GraphQLError } from 'graphql';
import type { AuthenticatedUser } from '@libark/core-shared';
import DataLoader from 'dataloader';

import type { GraphQLContext } from '../../graphql/context';
import {
  verifyPostOwnership,
  validatePaidPostPrice,
  validatePostContent,
  verifyMediaOwnership,
  validatePostAccess,
} from '../validators';

// モックのAuthenticatedUserを作成
const createMockUser = (overrides = {}): AuthenticatedUser => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  isActive: true,
  isVerified: true,
  role: 'BASIC_USER',
  permissions: [],
  createdAt: new Date(),
  lastLoginAt: new Date(),
  ...overrides,
});

// モックのGraphQLContextを作成
const createMockContext = (overrides = {}): GraphQLContext => {
  const mockPrisma: any = {
    post: {
      findUnique: vi.fn(),
    },
    media: {
      count: vi.fn(),
    },
    follow: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };

  return {
    prisma: mockPrisma,
    user: createMockUser(),
    request: null as any,
    reply: null as any,
    fastify: {
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any,
    authService: {} as any,
    redisPubSub: null,
    dataloaders: {
      postLikeLoader: new DataLoader<string, boolean>(async keys => keys.map(() => false)),
      commentLikeLoader: new DataLoader<string, boolean>(async keys => keys.map(() => false)),
      postPurchaseLoader: new DataLoader<string, boolean>(async keys => keys.map(() => false)),
    },
    ...overrides,
  };
};

describe('Validators Utils', () => {
  describe('verifyPostOwnership', () => {
    it('should return post when user is owner', async () => {
      const context = createMockContext();
      const mockPost = {
        id: 'post-1',
        userId: 'user-1',
        isDeleted: false,
      };

      (context.prisma.post.findUnique as any).mockResolvedValue(mockPost);

      const result = await verifyPostOwnership(context, 'post-1');

      expect(result).toEqual(mockPost);
      expect(context.prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        select: { id: true, userId: true, isDeleted: true },
      });
    });

    it('should throw UNAUTHENTICATED error when user is not authenticated', async () => {
      const context = createMockContext({ user: undefined });

      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow(GraphQLError);
      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow('認証が必要です');
    });

    it('should throw NOT_FOUND error when post does not exist', async () => {
      const context = createMockContext();
      (context.prisma.post.findUnique as any).mockResolvedValue(null);

      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow(GraphQLError);
      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow('投稿が見つかりません');
    });

    it('should throw NOT_FOUND error when post is deleted', async () => {
      const context = createMockContext();
      const mockPost = {
        id: 'post-1',
        userId: 'user-1',
        isDeleted: true,
      };

      (context.prisma.post.findUnique as any).mockResolvedValue(mockPost);

      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow(GraphQLError);
      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow('投稿が見つかりません');
    });

    it('should throw FORBIDDEN error when user is not owner', async () => {
      const context = createMockContext();
      const mockPost = {
        id: 'post-1',
        userId: 'user-2',
        isDeleted: false,
      };

      (context.prisma.post.findUnique as any).mockResolvedValue(mockPost);

      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow(GraphQLError);
      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow(
        'この投稿を編集する権限がありません'
      );
    });
  });

  describe('validatePaidPostPrice', () => {
    it('should not throw when visibility is PAID with valid price', () => {
      expect(() => {
        validatePaidPostPrice('PAID', 100);
      }).not.toThrow();
    });

    it('should throw BAD_USER_INPUT when visibility is PAID without price', () => {
      expect(() => {
        validatePaidPostPrice('PAID', null);
      }).toThrow(GraphQLError);
      expect(() => {
        validatePaidPostPrice('PAID', null);
      }).toThrow('Paid投稿には有効な価格が必要です');
    });

    it('should throw BAD_USER_INPUT when visibility is PAID with zero price', () => {
      expect(() => {
        validatePaidPostPrice('PAID', 0);
      }).toThrow(GraphQLError);
      expect(() => {
        validatePaidPostPrice('PAID', 0);
      }).toThrow('Paid投稿には有効な価格が必要です');
    });

    it('should throw BAD_USER_INPUT when visibility is PAID with negative price', () => {
      expect(() => {
        validatePaidPostPrice('PAID', -10);
      }).toThrow(GraphQLError);
      expect(() => {
        validatePaidPostPrice('PAID', -10);
      }).toThrow('Paid投稿には有効な価格が必要です');
    });

    it('should throw BAD_USER_INPUT when visibility is not PAID but price is set', () => {
      expect(() => {
        validatePaidPostPrice('PUBLIC', 100);
      }).toThrow(GraphQLError);
      expect(() => {
        validatePaidPostPrice('PUBLIC', 100);
      }).toThrow('Paid以外の投稿に価格は設定できません');
    });

    it('should not throw when visibility is not PAID and price is not set', () => {
      expect(() => {
        validatePaidPostPrice('PUBLIC', null);
      }).not.toThrow();

      expect(() => {
        validatePaidPostPrice('PRIVATE', undefined);
      }).not.toThrow();
    });

    it('should handle edge cases with price values', () => {
      expect(() => {
        validatePaidPostPrice('PAID', 0.01);
      }).not.toThrow();

      expect(() => {
        validatePaidPostPrice('PAID', 999999.99);
      }).not.toThrow();
    });
  });

  describe('validatePostContent', () => {
    it('should not throw when content is provided', () => {
      expect(() => {
        validatePostContent('Test content');
      }).not.toThrow();
    });

    it('should not throw when mediaIds are provided', () => {
      expect(() => {
        validatePostContent(undefined, ['media-1', 'media-2']);
      }).not.toThrow();
    });

    it('should not throw when both content and mediaIds are provided', () => {
      expect(() => {
        validatePostContent('Test content', ['media-1']);
      }).not.toThrow();
    });

    it('should throw BAD_USER_INPUT when neither content nor mediaIds are provided', () => {
      expect(() => {
        validatePostContent();
      }).toThrow(GraphQLError);
      expect(() => {
        validatePostContent();
      }).toThrow('テキストまたは画像が必要です');
    });

    it('should throw BAD_USER_INPUT when content is empty string and mediaIds is empty array', () => {
      expect(() => {
        validatePostContent('', []);
      }).toThrow(GraphQLError);
      expect(() => {
        validatePostContent('', []);
      }).toThrow('テキストまたは画像が必要です');
    });

    it('should handle whitespace-only content', () => {
      expect(() => {
        validatePostContent('   ');
      }).not.toThrow();
    });

    it('should handle empty mediaIds array with content', () => {
      expect(() => {
        validatePostContent('Test', []);
      }).not.toThrow();
    });
  });

  describe('verifyMediaOwnership', () => {
    it('should not throw when user owns all media', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockResolvedValue(2);

      await expect(verifyMediaOwnership(context, ['media-1', 'media-2'])).resolves.not.toThrow();
      expect(context.prisma.media.count).toHaveBeenCalledWith({
        where: {
          id: { in: ['media-1', 'media-2'] },
          userId: 'user-1',
          postId: null,
        },
      });
    });

    it('should throw UNAUTHENTICATED error when user is not authenticated', async () => {
      const context = createMockContext({ user: undefined });

      await expect(verifyMediaOwnership(context, ['media-1'])).rejects.toThrow(GraphQLError);
      await expect(verifyMediaOwnership(context, ['media-1'])).rejects.toThrow('認証が必要です');
    });

    it('should throw FORBIDDEN error when media count does not match', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockResolvedValue(1);

      await expect(verifyMediaOwnership(context, ['media-1', 'media-2'])).rejects.toThrow(
        GraphQLError
      );
      await expect(verifyMediaOwnership(context, ['media-1', 'media-2'])).rejects.toThrow(
        '指定されたメディアが見つからないか、権限がありません'
      );
    });

    it('should throw FORBIDDEN error when media count is zero', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockResolvedValue(0);

      await expect(verifyMediaOwnership(context, ['media-1'])).rejects.toThrow(GraphQLError);
    });

    it('should handle empty mediaIds array', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockResolvedValue(0);

      await expect(verifyMediaOwnership(context, [])).resolves.not.toThrow();
    });

    it('should handle single mediaId', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockResolvedValue(1);

      await expect(verifyMediaOwnership(context, ['media-1'])).resolves.not.toThrow();
    });

    it('should handle multiple mediaIds', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockResolvedValue(5);

      await expect(
        verifyMediaOwnership(context, ['media-1', 'media-2', 'media-3', 'media-4', 'media-5'])
      ).resolves.not.toThrow();
    });
  });

  describe('validatePostAccess', () => {
    it('should not throw for PUBLIC post', async () => {
      const post = {
        visibility: 'PUBLIC',
        userId: 'user-1',
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context)).resolves.toBeUndefined();
    });

    it('should not throw for PRIVATE post when user is owner', async () => {
      const post = {
        visibility: 'PRIVATE',
        userId: 'user-1',
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context)).resolves.toBeUndefined();
    });

    it('should throw FORBIDDEN for PRIVATE post when user is not owner', async () => {
      const post = {
        visibility: 'PRIVATE',
        userId: 'user-2',
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context)).rejects.toThrow(GraphQLError);
      await expect(validatePostAccess(post, context)).rejects.toThrow(
        'この投稿にアクセスする権限がありません'
      );
    });

    it('should throw FORBIDDEN for PRIVATE post when user is not authenticated', async () => {
      const post = {
        visibility: 'PRIVATE',
        userId: 'user-1',
      };
      const context = createMockContext({ user: undefined });

      await expect(validatePostAccess(post, context)).rejects.toThrow(GraphQLError);
      await expect(validatePostAccess(post, context)).rejects.toThrow(
        'この投稿にアクセスする権限がありません'
      );
    });

    it('should throw NOT_FOUND for processing post when includeProcessing is false', async () => {
      const post = {
        visibility: 'PUBLIC',
        userId: 'user-1',
        isProcessing: true,
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context, false)).rejects.toThrow(GraphQLError);
      await expect(validatePostAccess(post, context, false)).rejects.toThrow(
        '投稿が見つかりません'
      );
    });

    it('should throw NOT_FOUND for processing post when user is not owner', async () => {
      const post = {
        visibility: 'PUBLIC',
        userId: 'user-2',
        isProcessing: true,
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context, true)).rejects.toThrow(GraphQLError);
      await expect(validatePostAccess(post, context, true)).rejects.toThrow('投稿が見つかりません');
    });

    it('should not throw for processing post when user is owner and includeProcessing is true', async () => {
      const post = {
        visibility: 'PUBLIC',
        userId: 'user-1',
        isProcessing: true,
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context, true)).resolves.toBeUndefined();
    });

    it('should handle PAID visibility', async () => {
      const post = {
        visibility: 'PAID',
        userId: 'user-1',
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context)).resolves.toBeUndefined();
    });

    it('should handle undefined isProcessing', async () => {
      const post = {
        visibility: 'PUBLIC',
        userId: 'user-1',
        isProcessing: undefined,
      };
      const context = createMockContext();

      await expect(validatePostAccess(post, context)).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully in verifyPostOwnership', async () => {
      const context = createMockContext();
      (context.prisma.post.findUnique as any).mockRejectedValue(new Error('Database error'));

      await expect(verifyPostOwnership(context, 'post-1')).rejects.toThrow('Database error');
    });

    it('should handle database errors gracefully in verifyMediaOwnership', async () => {
      const context = createMockContext();
      (context.prisma.media.count as any).mockRejectedValue(new Error('Database error'));

      await expect(verifyMediaOwnership(context, ['media-1'])).rejects.toThrow('Database error');
    });

    it('should handle very long content strings', () => {
      const longContent = 'a'.repeat(10000);
      expect(() => {
        validatePostContent(longContent);
      }).not.toThrow();
    });

    it('should handle very large mediaIds array', () => {
      const mediaIds = Array.from({ length: 100 }, (_, i) => `media-${i}`);
      expect(() => {
        validatePostContent(undefined, mediaIds);
      }).not.toThrow();
    });

    it('should handle special characters in content', () => {
      const specialContent = '🎉 テスト 🇯🇵 日本語 🌍 World! @#$%^&*()';
      expect(() => {
        validatePostContent(specialContent);
      }).not.toThrow();
    });

    it('should handle price with decimal places', () => {
      expect(() => {
        validatePaidPostPrice('PAID', 99.99);
      }).not.toThrow();

      expect(() => {
        validatePaidPostPrice('PAID', 0.01);
      }).not.toThrow();
    });

    it('should handle very large price values', () => {
      expect(() => {
        validatePaidPostPrice('PAID', 999999999.99);
      }).not.toThrow();
    });
  });
});
