/**
 * 👥 フォローGraphQLリゾルバー
 *
 * フォロー/アンフォロー機能のGraphQLリゾルバー実装
 */

import { GraphQLError } from 'graphql';
import { PAGINATION_CONSTANTS } from '@libark/core-shared';

import { GraphQLContext } from '../graphql/context.js';

// 🎯 フォロー関連の型定義
interface FollowUserArgs {
  userId: string;
}

interface UnfollowUserArgs {
  userId: string;
}

interface FollowersArgs {
  userId: string;
  first?: number;
  after?: string;
}

interface FollowingArgs {
  userId: string;
  first?: number;
  after?: string;
}

interface IsFollowingArgs {
  userId: string;
}

// 🎯 ページネーション用のカーソル変換関数
function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64');
}

function decodeCursor(cursor: string): Date {
  try {
    return new Date(Buffer.from(cursor, 'base64').toString());
  } catch {
    throw new GraphQLError('無効なカーソル形式です', {
      extensions: { code: 'INVALID_CURSOR' },
    });
  }
}

export const followResolvers = {
  Query: {
    /**
     * フォロワー一覧取得
     */
    followers: async (
      _parent: unknown,
      { userId, first = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE, after }: FollowersArgs,
      context: GraphQLContext
    ) => {
      try {
        // ユーザーの存在確認
        const user = await context.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'USER_NOT_FOUND' },
          });
        }

        // カーソルベースのページネーション
        const where = {
          followingId: userId,
          ...(after && {
            createdAt: {
              lt: decodeCursor(after),
            },
          }),
        };

        const [follows, totalCount] = await Promise.all([
          context.prisma.follow.findMany({
            where,
            include: {
              follower: true,
            },
            orderBy: { createdAt: 'desc' },
            take: first + 1, // hasNextPageの判定用
          }),
          context.prisma.follow.count({
            where: { followingId: userId },
          }),
        ]);

        const hasNextPage = follows.length > first;
        const edges = follows.slice(0, first).map((follow: { follower: unknown; createdAt: Date }) => ({
          node: follow.follower,
          cursor: encodeCursor(follow.createdAt),
          followedAt: follow.createdAt,
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: !!after,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          },
          totalCount,
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, 'フォロワー一覧取得エラー:');
        throw new GraphQLError('フォロワー一覧の取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * フォロー中一覧取得
     */
    following: async (
      _parent: unknown,
      { userId, first = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE, after }: FollowingArgs,
      context: GraphQLContext
    ) => {
      try {
        // ユーザーの存在確認
        const user = await context.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'USER_NOT_FOUND' },
          });
        }

        // カーソルベースのページネーション
        const where = {
          followerId: userId,
          ...(after && {
            createdAt: {
              lt: decodeCursor(after),
            },
          }),
        };

        const [follows, totalCount] = await Promise.all([
          context.prisma.follow.findMany({
            where,
            include: {
              following: true,
            },
            orderBy: { createdAt: 'desc' },
            take: first + 1, // hasNextPageの判定用
          }),
          context.prisma.follow.count({
            where: { followerId: userId },
          }),
        ]);

        const hasNextPage = follows.length > first;
        const edges = follows.slice(0, first).map((follow: { following: unknown; createdAt: Date }) => ({
          node: follow.following,
          cursor: encodeCursor(follow.createdAt),
          followedAt: follow.createdAt,
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: !!after,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          },
          totalCount,
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, 'フォロー中一覧取得エラー:');
        throw new GraphQLError('フォロー中一覧の取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * フォロー状態確認
     */
    isFollowing: async (_parent: unknown, { userId }: IsFollowingArgs, context: GraphQLContext) => {
      if (!context.user) {
        return false;
      }

      try {
        const follow = await context.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: context.user.id,
              followingId: userId,
            },
          },
        });
        return !!follow;
      } catch (error) {
        context.fastify.log.error({ err: error }, 'フォロー状態確認エラー:');
        return false;
      }
    },
  },

  Mutation: {
    /**
     * ユーザーをフォロー
     */
    followUser: async (_parent: unknown, { userId }: FollowUserArgs, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // 自分自身をフォローしようとした場合
      if (context.user.id === userId) {
        throw new GraphQLError('自分自身をフォローすることはできません', {
          extensions: { code: 'INVALID_OPERATION' },
        });
      }

      try {
        // フォロー対象ユーザーの存在確認
        const targetUser = await context.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          throw new GraphQLError('フォロー対象のユーザーが見つかりません', {
            extensions: { code: 'USER_NOT_FOUND' },
          });
        }

        if (!targetUser.isActive) {
          throw new GraphQLError('このユーザーはアクティブではありません', {
            extensions: { code: 'USER_INACTIVE' },
          });
        }

        // 既存のフォロー関係をチェック
        const existingFollow = await context.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: context.user.id,
              followingId: userId,
            },
          },
        });

        if (existingFollow) {
          throw new GraphQLError('既にフォローしています', {
            extensions: { code: 'ALREADY_FOLLOWING' },
          });
        }

        // フォロー関係を作成
        const follow = await context.prisma.follow.create({
          data: {
            followerId: context.user.id,
            followingId: userId,
          },
          include: {
            follower: true,
            following: true,
          },
        });

        return {
          success: true,
          message: 'フォローしました',
          follow,
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, 'フォローエラー:');
        throw new GraphQLError('フォローに失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * ユーザーのフォローを解除
     */
    unfollowUser: async (
      _parent: unknown,
      { userId }: UnfollowUserArgs,
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        // 既存のフォロー関係をチェック
        const existingFollow = await context.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: context.user.id,
              followingId: userId,
            },
          },
        });

        if (!existingFollow) {
          throw new GraphQLError('フォローしていません', {
            extensions: { code: 'NOT_FOLLOWING' },
          });
        }

        // フォロー関係を削除
        await context.prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId: context.user.id,
              followingId: userId,
            },
          },
        });

        return {
          success: true,
          message: 'フォローを解除しました',
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        context.fastify.log.error({ err: error }, 'フォロー解除エラー:');
        throw new GraphQLError('フォロー解除に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
