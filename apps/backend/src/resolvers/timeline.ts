/**
 * 📰 タイムラインGraphQLリゾルバー
 *
 * 責任:
 * - TimelineTypeに基づく投稿フィルタリング
 * - フォロー関係を考慮した投稿取得
 * - カーソルベースページネーション
 * - 適切なキャッシュ戦略
 */

import { GraphQLError } from 'graphql';

import type { GraphQLContext } from '../graphql/context.js';

// ページネーション定数
const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// 引数の型定義
interface TimelineArgs {
  type: 'FOLLOWING' | 'RECOMMENDED' | 'ALL';
  first: number;
  after?: string;
}

/**
 * カーソルをエンコード
 */
function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64');
}

/**
 * カーソルをデコード
 */
function decodeCursor(cursor: string): Date {
  try {
    return new Date(Buffer.from(cursor, 'base64').toString());
  } catch {
    throw new GraphQLError('無効なカーソル形式です', {
      extensions: { code: 'INVALID_CURSOR' },
    });
  }
}

/**
 * タイムラインのWHERE条件を構築
 */
async function buildTimelineWhereCondition(
  type: TimelineArgs['type'],
  context: GraphQLContext
): Promise<Record<string, unknown>> {
  const where: Record<string, unknown> = {
    isDeleted: false,
    isProcessing: false,
  };

  switch (type) {
    case 'FOLLOWING': {
      // 認証が必要
      if (!context.user) {
        throw new GraphQLError('フォロー中タイムラインには認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // フォローしているユーザーのIDを取得
      const followingUsers = await context.prisma.follow.findMany({
        where: { followerId: context.user.id },
        select: { followingId: true },
      });

      const followingUserIds = followingUsers.map((f: any) => f.followingId);

      // 自分の投稿も含める
      followingUserIds.push(context.user.id);

      if (followingUserIds.length === 0) {
        // フォローしているユーザーがいない場合は空の結果を返す
        where.userId = { in: [] };
      } else {
        // フォロー中のユーザーの投稿で、かつ公開投稿または自分の投稿
        where.AND = [
          { userId: { in: followingUserIds } },
          {
            OR: [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }, { userId: context.user.id }],
          },
        ];
      }
      break;
    }

    case 'RECOMMENDED': {
      // 現在は推奨アルゴリズムが未実装のため、ALLと同じ動作
      // 将来的にはML/AIベースの推奨システムを実装予定
      if (context.user) {
        where.OR = [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }, { userId: context.user.id }];
      } else {
        where.OR = [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }];
      }
      break;
    }

    case 'ALL':
    default: {
      // すべての公開投稿、Paid投稿、自分の投稿を表示
      if (context.user) {
        where.OR = [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }, { userId: context.user.id }];
      } else {
        where.OR = [{ visibility: 'PUBLIC' }, { visibility: 'PAID' }];
      }
      break;
    }
  }

  return where;
}

export const timelineResolvers = {
  Query: {
    /**
     * タイムライン取得
     */
    timeline: async (
      _parent: unknown,
      { type = 'FOLLOWING', first = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE, after }: TimelineArgs,
      context: GraphQLContext
    ) => {
      try {
        // ページサイズの制限
        const limit = Math.min(first, PAGINATION_CONSTANTS.MAX_PAGE_SIZE);

        // WHERE条件を構築（ページネーション用とカウント用を分離）
        const baseWhere = await buildTimelineWhereCondition(type, context);
        const paginationWhere = { ...baseWhere };

        // ページネーション条件を追加
        if (after) {
          paginationWhere.createdAt = { lt: decodeCursor(after) };
        }

        // 投稿を取得
        const posts = await context.prisma.post.findMany({
          where: paginationWhere,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImageId: true,
                isVerified: true,
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
          take: limit + 1, // 次のページがあるかチェックするため+1
        });

        // ページネーション情報を構築
        const hasNextPage = posts.length > limit;
        const edges = (hasNextPage ? posts.slice(0, -1) : posts).map((post: any) => ({
          node: post,
          cursor: encodeCursor(post.createdAt),
        }));

        // 総数を取得（パフォーマンス考慮で別クエリ）
        // 注意: 複雑なOR条件でのcountクエリは、findManyと同じ条件を使用
        const totalPosts = await context.prisma.post.findMany({
          where: baseWhere,
          select: { id: true },
        });
        const totalCount = totalPosts.length;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: !!after,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          },
          totalCount,
          timelineType: type,
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }

        context.fastify.log.error({ err: error }, 'タイムライン取得エラー:');
        throw new GraphQLError('タイムラインの取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
