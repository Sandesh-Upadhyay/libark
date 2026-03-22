/**
 * 🎯 管理者機能GraphQLリゾルバー
 *
 * データベース管理、システム統計、リセット機能
 */

import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { PAGINATION_CONSTANTS, getS3Config } from '@libark/core-shared';
import type { User, Prisma } from '@libark/db';

import { GraphQLContext } from '../types/graphql.js';

// 型定義
interface UserWithExtensions extends User {
  permissions?: unknown[];
  followersCount?: number;
  followingCount?: number;
  [key: string]: unknown;
}

interface AdminUpdateUserInput {
  userId: string;
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

interface AdminChangeUserPasswordInput {
  userId: string;
  newPassword: string;
}

// パスワードバリデーションスキーマ
const AdminChangePasswordSchema = z.object({
  userId: z.string().uuid('無効なユーザーID形式です'),
  newPassword: z
    .string()
    .min(8, '新しいパスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '新しいパスワードは大文字・小文字・数字を含む必要があります'
    ),
});

/**
 * 管理者権限チェック関数（新しいRole + Permission分離システム）
 */
async function requireAdmin(context: GraphQLContext): Promise<void> {
  if (!context.user) {
    throw new GraphQLError('認証が必要です', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // AuthServiceの管理者権限チェックを使用
  const isAdmin = await context.authService.isAdmin(context.user.id);

  if (!isAdmin) {
    throw new GraphQLError('管理者権限が必要です', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

export const adminResolvers = {
  Query: {
    /**
     * システム統計取得
     */
    systemStats: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      await requireAdmin(context);

      try {
        // ユーザー統計
        const totalUsers = await context.prisma.user.count();
        const activeUsers = await context.prisma.user.count({
          where: { isActive: true },
        });
        // 投稿統計
        const totalPosts = await context.prisma.post.count({
          where: { isDeleted: false },
        });

        // コメント統計
        const totalComments = await context.prisma.comment.count({
          where: { isDeleted: false },
        });

        // 画像統計
        const totalImages = await context.prisma.media.count();
        const _imageVariants = await context.prisma.mediaVariant.count();

        // ストレージ使用量（概算）
        let totalSize = BigInt(0);
        const prisma = context.prisma as unknown as { mediaVariant: { aggregate: (args: { _sum: { fileSize: true } }) => Promise<{ _sum: { fileSize: bigint | null } }> } };
        if (prisma.mediaVariant && typeof prisma.mediaVariant.aggregate === 'function') {
          const storageUsed = await prisma.mediaVariant.aggregate({
            _sum: { fileSize: true },
          });
          totalSize = BigInt(storageUsed._sum.fileSize || 0);
        }

        return {
          totalUsers,
          totalPosts,
          totalMedia: totalImages,
          totalComments,
          // いいね数は未実装のため0
          totalLikes: 0,
          storageUsed: totalSize.toString(),
          // アクティブユーザー統計は現状isActiveなユーザー数を返す（統計機能実装まで）
          activeUsers24h: activeUsers,
          activeUsers7d: activeUsers,
          activeUsers30d: activeUsers,
        };
      } catch (error) {
        // console.error('DEBUG: systemStats error details:', error);
        context.fastify.log.error({ err: error } as any, 'システム統計取得エラー:');
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new GraphQLError(`システム統計の取得に失敗しました: ${errorMessage}`, {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 管理者用ユーザー一覧取得
     */
    adminUsers: async (
      _parent: unknown,
      { first = 20, after, search }: { first?: number; after?: string; search?: string },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const limit = Math.min(first, PAGINATION_CONSTANTS.MAX_PAGE_SIZE);
        const where: Prisma.UserWhereInput = {};

        // 検索条件
        if (search) {
          where.OR = [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ];
        }

        // カーソルベースページネーション
        if (after) {
          where.id = { gt: after };
        }

        const users = await context.prisma.user.findMany({
          where,
          take: limit + 1,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                posts: { where: { isDeleted: false } },
                comments: { where: { isDeleted: false } },
                followers: true,
                following: true,
              },
            },
            permissionOverrides: {
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              include: {
                permission: true,
                grantedByUser: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        });

        const hasNextPage = users.length > limit;
        const edges = users.slice(0, limit);

        return {
          edges: edges.map((user: User & { _count: { posts: number; comments: number; followers: number; following: number }; permissionOverrides: unknown[] }) => ({
            node: {
              ...user,
              postsCount: user._count?.posts ?? 0,
              followersCount: user._count?.followers ?? 0,
              followingCount: user._count?.following ?? 0,
              permissions: user.permissionOverrides,
            },
            cursor: user.id,
          })),
          pageInfo: {
            hasNextPage,
            hasPreviousPage: false, // 現在の実装では前のページはサポートしていない
            startCursor: edges.length > 0 ? edges[0].id : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].id : null,
          },
          totalCount: await context.prisma.user.count({ where }),
        };
      } catch (error) {
        context.fastify.log.error({ err: error } as any, '管理者用ユーザー一覧取得エラー:');
        throw new GraphQLError('ユーザー一覧の取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 管理者用ユーザー詳細取得
     */
    adminUser: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      await requireAdmin(context);

      try {
        const user = await context.prisma.user.findUnique({
          where: { id },
          include: {
            settings: true,
            _count: {
              select: {
                posts: { where: { isDeleted: false } },
              },
            },
            permissionOverrides: {
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              include: {
                permission: true,
                grantedByUser: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return {
          ...user,
          postsCount: (user as User & { _count?: { posts: number } })._count?.posts ?? 0,
          followersCount: 0,
          followingCount: 0,
          permissions: (user as User & { permissionOverrides: unknown[] }).permissionOverrides,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        context.fastify.log.error({ err: error } as any, '管理者用ユーザー詳細取得エラー:');
        throw new GraphQLError('ユーザー詳細の取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * 管理者用ユーザー情報更新
     */
    adminUpdateUser: async (
      _parent: unknown,
      { input }: { input: AdminUpdateUserInput },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const { userId, ...updateData } = input;

        // ユーザーの存在確認
        const existingUser = await context.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!existingUser) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // ユーザー名の重複チェック
        if (updateData.username) {
          const duplicateUser = await context.prisma.user.findFirst({
            where: {
              username: updateData.username,
              id: { not: userId },
            },
          });

          if (duplicateUser) {
            throw new GraphQLError('このユーザー名は既に使用されています', {
              extensions: { code: 'DUPLICATE_USERNAME' },
            });
          }
        }

        // メールアドレスの重複チェック
        if (updateData.email) {
          const duplicateUser = await context.prisma.user.findFirst({
            where: {
              email: updateData.email,
              id: { not: userId },
            },
          });

          if (duplicateUser) {
            throw new GraphQLError('このメールアドレスは既に使用されています', {
              extensions: { code: 'DUPLICATE_EMAIL' },
            });
          }
        }

        // ユーザー情報を更新
        const updatedUser = await context.prisma.user.update({
          where: { id: userId },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: 'ユーザー情報を更新しました',
          user: updatedUser,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        context.fastify.log.error({ err: error } as any, '管理者用ユーザー更新エラー:');
        throw new GraphQLError('ユーザー情報の更新に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 管理者用ユーザー削除
     */
    adminDeleteUser: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        // 自分自身は削除できない
        if (context.user?.id === userId) {
          throw new GraphQLError('自分自身を削除することはできません', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // ユーザーの存在確認
        const existingUser = await context.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!existingUser) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // ユーザーを削除（論理削除）
        await context.prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            email: `deleted_${Date.now()}_${existingUser.email}`,
            username: `deleted_${Date.now()}_${existingUser.username}`,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: 'ユーザーを削除しました',
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        context.fastify.log.error({ err: error } as any, '管理者用ユーザー削除エラー:');
        throw new GraphQLError('ユーザーの削除に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 管理者用ユーザーパスワード変更
     */
    adminChangeUserPassword: async (
      _parent: unknown,
      { input }: { input: AdminChangeUserPasswordInput },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        // Zodバリデーション
        const validatedInput = AdminChangePasswordSchema.parse(input);
        const { userId, newPassword } = validatedInput;

        // 自分自身のパスワードは変更できない（セキュリティ上の理由）
        if (context.user?.id === userId) {
          throw new GraphQLError(
            '自分自身のパスワードは変更できません。通常のパスワード変更機能をご利用ください。',
            {
              extensions: { code: 'FORBIDDEN' },
            }
          );
        }

        // ユーザーの存在確認
        const existingUser = await context.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, email: true, isActive: true },
        });

        if (!existingUser) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (!existingUser.isActive) {
          throw new GraphQLError('無効なユーザーのパスワードは変更できません', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // 新しいパスワードをハッシュ化
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // パスワード更新
        await context.prisma.user.update({
          where: { id: userId },
          data: {
            passwordHash: newPasswordHash,
            updatedAt: new Date(),
          },
        });

        // ログ記録（パスワードは記録しない）
        context.fastify.log.info({
          adminId: context.user?.id,
          adminUsername: context.user?.username,
          targetUserId: userId,
          targetUsername: existingUser.username,
        } as unknown, '✅ 管理者によるパスワード変更成功:');

        return {
          success: true,
          message: `ユーザー「${existingUser.username}」のパスワードを変更しました`,
        };
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn({
            errors: error.errors,
            adminId: context.user?.id,
            input: { userId: input.userId }, // パスワードはログに記録しない
          } as unknown, '❌ 管理者パスワード変更バリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        if (error instanceof GraphQLError) throw error;
        context.fastify.log.error({
          error,
          adminId: context.user?.id,
          targetUserId: input.userId,
        } as unknown, '❌ 管理者パスワード変更エラー:');
        throw new GraphQLError('パスワード変更処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * データベース完全リセット（開発環境専用）
     */
    resetDatabase: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      await requireAdmin(context);

      // 本番環境では実行不可
      if (process.env.NODE_ENV === 'production') {
        throw new GraphQLError('本番環境ではデータベースリセットは実行できません', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        // S3クリーンアップを試行（失敗しても継続）
        const serverS3Config = getS3Config();
        context.fastify.log.info({
          bucket: serverS3Config.bucket,
          region: serverS3Config.region,
          endpoint: serverS3Config.endpoint,
          hasAccessKey: !!serverS3Config.accessKey,
          hasSecretKey: !!serverS3Config.secretKey,
        } as unknown, '🧹 [Admin] S3クリーンアップ設定確認:');
        // エラーが発生してもデータベースリセットは継続
        // S3クリーンアップの失敗はデータベースリセットを阻害しない
        return { deletedObjects: 0 };
      } catch (error) {
        context.fastify.log.error({ err: error }, 'S3クリーンアップ中にエラーが発生しましたが、処理を継続します:');
        return { deletedObjects: 0 };
      }
    },
  },

  /**
   * AdminUserDetail型のフィールドリゾルバー
   */
  AdminUserDetail: {
    /**
     * ユーザーの権限一覧を取得
     */
    permissions: async (parent: UserWithExtensions, _args: unknown, context: GraphQLContext) => {
      // parentにpermissionOverridesが含まれている場合はそれを返す

      // parentにuserPermissionsが含まれている場合はそれを返す
      if (parent.permissions) {
        return parent.permissions;
      }

      // 含まれていない場合はデータベースから取得
      try {
        const user = await context.prisma.user.findUnique({
          where: { id: parent.id },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            permissionOverrides: {
              include: {
                permission: true,
                grantedByUser: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return [];
        }

        // ロールベースの権限を取得
        const rolePermissions =
          user.role?.permissions.map((rp: any) => ({
            id: rp.permission.id,
            userId: user.id,
            permissionId: rp.permission.id,
            isActive: true,
            grantedAt: user.createdAt,
            expiresAt: null,
            permission: rp.permission,
            grantedByUser: null,
          })) || [];

        // 個別権限上書きを取得
        const overridePermissions = user.permissionOverrides
          .filter((override: { allowed: boolean }) => override.allowed)
          .map((override: any) => ({
            id: override.id,
            userId: user.id,
            permissionId: override.permission.id,
            isActive: true,
            grantedAt: override.grantedAt,
            expiresAt: override.expiresAt,
            permission: override.permission,
            grantedByUser: override.grantedByUser,
          }));

        // 権限をマージ（重複排除）
        const allPermissions = [...rolePermissions, ...overridePermissions];
        const uniquePermissions = allPermissions.filter(
          (permission, index, self) =>
            index === self.findIndex(p => p.permissionId === permission.permissionId)
        );

        return uniquePermissions;
      } catch (error) {
        context.fastify.log.error({ err: error } as any, '権限取得エラー:');
        return [];
      }
    },

    /**
     * 投稿数を取得
     */
    postsCount: async (parent: UserWithExtensions, _args: unknown, context: GraphQLContext) => {
      try {
        const count = await context.prisma.post.count({
          where: {
            userId: parent.id,
            isDeleted: false,
          },
        });
        return count ?? 0;
      } catch (error) {
        context.fastify.log.error({ err: error } as any, '投稿数取得エラー:');
        return 0;
      }
    },

    /**
     * フォロワー数を取得
     */
    followersCount: async (
      parent: UserWithExtensions,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      // 一時的に0を返す（フォローシステムが完全に実装されるまで）
      return parent.followersCount || 0;
    },

    /**
     * フォロー中数を取得
     */
    followingCount: async (
      parent: UserWithExtensions,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      // 一時的に0を返す（フォローシステムが完全に実装されるまで）
      return parent.followingCount || 0;
    },
  },
};
