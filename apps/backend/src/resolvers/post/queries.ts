/**
 * 📝 投稿クエリリゾルバー
 *
 * 投稿の取得関連のGraphQLクエリリゾルバー
 */

import { GraphQLError } from 'graphql';
import { PAGINATION_CONSTANTS } from '@libark/core-shared';

import type { GraphQLContext } from '../../graphql/context.js';
import type { PostsArgs } from '../../types/resolvers.js';
import { validatePostAccess } from '../../utils/validators.js';

export const postQueries = {
  /**
   * 投稿詳細取得
   */
  post: async (
    _parent: unknown,
    { id, includeProcessing }: { id: string; includeProcessing?: boolean },
    context: GraphQLContext
  ) => {
    const post = await context.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
        media: {
          include: {
            variants: {
              select: {
                id: true,
                type: true,
                s3Key: true,
                width: true,
                height: true,
                fileSize: true,
                quality: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post || post.isDeleted) {
      throw new GraphQLError('投稿が見つかりません', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // 投稿のアクセス権限を確認
    await validatePostAccess(post, context, includeProcessing);

    return post;
  },

  /**
   * 投稿一覧取得（Connection形式）
   */
  posts: async (_parent: unknown, args: PostsArgs, context: GraphQLContext) => {
    const { first = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE, after } = args;

    const countWhere = buildPostsWhereCondition({ ...args, after: undefined }, context);
    const where = buildPostsWhereCondition(args, context);

    const posts = await context.prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
        media: {
          include: {
            variants: {
              select: {
                id: true,
                type: true,
                s3Key: true,
                width: true,
                height: true,
                fileSize: true,
                quality: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: first + 1, // 次のページがあるかチェックするため+1
    });

    // ページネーション情報を構築
    const hasNextPage = posts.length > first;
    const edges = (hasNextPage ? posts.slice(0, -1) : posts).map((post: any) => ({
      node: post,
      cursor: post.createdAt.toISOString(), // createdAtをカーソルとして使用
    }));

    const totalCount = await context.prisma.post.count({ where: countWhere });

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      totalCount,
    };
  },

  /**
   * ユーザーがいいねした投稿一覧取得
   */
  likedPosts: async (
    _parent: unknown,
    args: { first?: number; after?: string; userId: string },
    context: GraphQLContext
  ) => {
    const { first = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE, after, userId } = args;

    // いいねした投稿のIDを取得
    const likedPostIds = await context.prisma.like.findMany({
      where: { userId },
      select: { postId: true },
      orderBy: { createdAt: 'desc' },
    });

    const postIds = likedPostIds.map((like: any) => like.postId);

    if (postIds.length === 0) {
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };
    }

    // WHERE条件を構築
    const where: Record<string, unknown> = {
      id: { in: postIds },
      isDeleted: false,
      isProcessing: false,
    };

    // カーソルベースページネーション
    if (after) {
      where.createdAt = { lt: new Date(after) };
    }

    const posts = await context.prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
        media: {
          include: {
            variants: {
              select: {
                id: true,
                type: true,
                s3Key: true,
                width: true,
                height: true,
                fileSize: true,
                quality: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: first + 1,
    });

    // ページネーション情報を構築
    const hasNextPage = posts.length > first;
    const edges = (hasNextPage ? posts.slice(0, -1) : posts).map((post: any) => ({
      node: post,
      cursor: post.createdAt.toISOString(),
    }));

    const totalCount = postIds.length;

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      totalCount,
    };
  },

  /**
   * メディアを含む投稿一覧取得
   */
  mediaPosts: async (
    _parent: unknown,
    args: { first?: number; after?: string; userId?: string },
    context: GraphQLContext
  ) => {
    const { first = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE, after, userId } = args;

    // WHERE条件を構築
    const where: Record<string, unknown> = {
      isDeleted: false,
      isProcessing: false,
      media: {
        some: {}, // メディアが存在する投稿のみ
      },
    };

    // ユーザー指定がある場合
    if (userId) {
      where.userId = userId;
    }

    // カーソルベースページネーション
    if (after) {
      where.createdAt = { lt: new Date(after) };
    }

    const posts = await context.prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
        media: {
          include: {
            variants: {
              select: {
                id: true,
                type: true,
                s3Key: true,
                width: true,
                height: true,
                fileSize: true,
                quality: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: first + 1,
    });

    // ページネーション情報を構築
    const hasNextPage = posts.length > first;
    const edges = (hasNextPage ? posts.slice(0, -1) : posts).map((post: any) => ({
      node: post,
      cursor: post.createdAt.toISOString(),
    }));

    const totalCount = await context.prisma.post.count({ where });

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      totalCount,
    };
  },
};

/**
 * 投稿一覧取得のWHERE条件を構築
 */
function buildPostsWhereCondition(
  args: PostsArgs,
  context: GraphQLContext
): Record<string, unknown> {
  const { after, userId, visibility, includeProcessing = false } = args;

  const where: Record<string, unknown> = {
    isDeleted: false,
  };

  // 処理中の投稿を含めるかどうか
  if (!includeProcessing) {
    where.isProcessing = false;
  }

  // ユーザー指定がある場合
  if (userId) {
    where.userId = userId;
  }

  // 可視性指定がある場合
  if (visibility) {
    where.visibility = visibility;
  }

  if (!userId && !visibility) {
    if (context.user) {
      where.OR = [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }, { userId: context.user.id }];
    } else {
      where.OR = [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }];
    }
  }

  // カーソルベースページネーション（createdAtベース）
  if (after) {
    // afterはcreatedAtのISO文字列として扱う
    where.createdAt = { lt: new Date(after) };
  }

  return where;
}
