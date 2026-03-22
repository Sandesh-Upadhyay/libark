/**
 * 👤 ユーザーGraphQLリゾルバー
 *
 * 既存tRPCユーザーロジックをGraphQLに移植
 */

import { GraphQLError } from 'graphql';
import { verifyPassword, hashPassword } from '@libark/core-server/security/password';
import { z } from 'zod';
import { PAGINATION_CONSTANTS, VALIDATION_CONSTANTS } from '@libark/core-shared';

import { GraphQLContext } from '../graphql/context.js';
import type { UserParent } from '../types/resolvers.js';

// 🎯 Zodバリデーションスキーマ
const ProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名は必須です')
    .max(VALIDATION_CONSTANTS.MAX_NAME_LENGTH, '表示名は50文字以内で入力してください')
    .optional(),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
  coverImageId: z.string().uuid('無効なカバー画像ID形式です').nullable().optional(),
});

const _UsersQuerySchema = z.object({
  first: z.number().int().min(1).max(100).default(20),
  after: z.string().optional(),
  search: z.string().min(1).max(100).optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードは必須です'),
  newPassword: z
    .string()
    .min(8, '新しいパスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '新しいパスワードは大文字・小文字・数字を含む必要があります'
    ),
});

const UpdateUserAvatarSchema = z.object({
  mediaId: z.string().uuid('無効なメディアID形式です'),
});

const UpdateUserCoverSchema = z.object({
  mediaId: z.string().uuid('無効なメディアID形式です'),
});

const UpdateEmailSchema = z.object({
  newEmail: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

// 🎯 Zodスキーマを使用した型定義
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type _UsersQueryArgs = z.infer<typeof _UsersQuerySchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateUserAvatarInput = z.infer<typeof UpdateUserAvatarSchema>;
export type UpdateUserCoverInput = z.infer<typeof UpdateUserCoverSchema>;
export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
type UserSettingsUpdateInput = {
  theme?: string;
  animationsEnabled?: boolean;
  locale?: string;
  contentFilter?: string;
  displayMode?: string;
  timezone?: string;
};

export const userResolvers = {
  Query: {
    /**
     * IDでユーザー取得
     */
    user: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const user = await context.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          bio: true,
          profileImageId: true,
          coverImageId: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user || !user.isActive) {
        throw new GraphQLError('ユーザーが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return user;
    },

    /**
     * ユーザー名でユーザー取得
     */
    userByUsername: async (
      _parent: unknown,
      { username }: { username: string },
      context: GraphQLContext
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          bio: true,
          profileImageId: true,
          coverImageId: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user || !user.isActive) {
        throw new GraphQLError('ユーザーが見つかりません', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return user;
    },

    /**
     * ユーザー一覧・検索
     */
    users: async (
      _parent: unknown,
      { first = PAGINATION_CONSTANTS.USER_PAGE_SIZE, after, search }: { first?: number; after?: string; search?: string },
      context: GraphQLContext
    ) => {
      const limit = Math.min(first, 100); // 最大100件に制限
      const skip = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;

      const where = {
        isActive: true,
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [users, totalCount] = await Promise.all([
        context.prisma.user.findMany({
          where,
          skip,
          take: limit + 1, // hasNextPageを判定するため+1
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            bio: true,
            profileImageId: true,
            coverImageId: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        }),
        context.prisma.user.count({ where }),
      ]);

      const hasNextPage = users.length > limit;
      const nodes = hasNextPage ? users.slice(0, -1) : users;

      const edges = nodes.map((user: unknown, index: number) => {
        const u = user as Record<string, unknown>;
        return {
          node: u,
          cursor: Buffer.from((skip + index + 1).toString()).toString('base64'),
        };
      });

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: skip > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      };
    },

    /**
     * 現在のユーザーの設定取得
     */
    mySettings: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const settings = await context.prisma.userSettings.findUnique({
        where: { userId: context.user.id },
      });

      // 設定が存在しない場合はデフォルト値で作成
      if (!settings) {
        return await context.prisma.userSettings.create({
          data: {
            userId: context.user.id,
            theme: 'system',
            animationsEnabled: true,
            locale: 'ja',
            contentFilter: 'all',
            displayMode: 'card',
            timezone: 'Asia/Tokyo',
          },
        });
      }

      return settings;
    },

    /**
     * 為替レート取得
     */
    getExchangeRate: async (_parent: unknown, { currency }: { currency: string }, context: GraphQLContext) => {
      // This resolver body was not provided in the instruction,
      // so a placeholder is used to maintain syntactical correctness.
      // Please replace with actual logic for fetching exchange rates.
      context.fastify.log.info({ currency }, '為替レート取得リクエスト');
      return {
        fromCurrency: 'JPY',
        toCurrency: currency,
        rate: 100.0, // Placeholder rate
        updatedAt: new Date().toISOString(),
      };
    },

    /**
     * ユーザーのウォレットトランザクション一覧
     */
    myWalletTransactions: async (
      _parent: unknown,
      { first = 20, after }: { first?: number; after?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // This resolver body was not provided in the instruction,
      // so a placeholder is used to maintain syntactical correctness.
      // Please replace with actual logic for fetching wallet transactions.
      context.fastify.log.info({ userId: context.user.id, first, after }, 'ウォレットトランザクション取得リクエスト');
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
    },

    /**
     * 現在のユーザーのウォレット情報取得
     */
    myWallet: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      // This resolver body was not provided in the instruction,
      // so a placeholder is used to maintain syntactical correctness.
      // Please replace with actual logic for fetching wallet information.
      context.fastify.log.info({ userId: context.user.id }, 'ウォレット情報取得リクエスト');
      return {
        id: 'wallet-id-placeholder',
        userId: context.user.id,
        balance: 0,
        currency: 'JPY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },

  /**
   * User型のフィールドリゾルバー
   */
  User: {
    /**
     * ユーザーのロール
     */
    role: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        const user = await context.prisma.user.findUnique({
          where: { id: parent.id },
          include: { role: true },
        });
        return user?.role ?? null;
      } catch (error) {
        context.fastify.log.error({ err: error }, 'ユーザーロール取得エラー:');
        return null;
      }
    },
    /**
     * 投稿数を取得
     */
    postsCount: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        const count = await context.prisma.post.count({
          where: {
            userId: parent.id,
            isDeleted: false,
          },
        });
        return count ?? 0; // nullの場合は0を返す
      } catch (error) {
        context.fastify.log.error({ err: error }, '投稿数取得エラー:');
        return 0; // エラーの場合は0を返す
      }
    },

    /**
     * フォロワー数を取得
     */
    followersCount: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        return await context.prisma.follow.count({
          where: { followingId: parent.id },
        });
      } catch (error) {
        context.fastify.log.error({ err: error }, 'フォロワー数取得エラー:');
        return 0;
      }
    },

    /**
     * フォロー中数を取得
     */
    followingCount: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        return await context.prisma.follow.count({
          where: { followerId: parent.id },
        });
      } catch (error) {
        context.fastify.log.error({ err: error }, 'フォロー中数取得エラー:');
        return 0;
      }
    },

    /**
     * 現在のユーザーがこのユーザーをフォローしているか
     */
    isFollowing: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        return false;
      }

      try {
        const follow = await context.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: context.user.id,
              followingId: parent.id,
            },
          },
        });
        return !!follow;
      } catch (error) {
        context.fastify.log.error({ err: error }, 'フォロー状態確認エラー:');
        return false;
      }
    },

    /**
     * このユーザーが現在のユーザーをフォローしているか
     */
    isFollowedBy: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        return false;
      }

      try {
        const follow = await context.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: parent.id,
              followingId: context.user.id,
            },
          },
        });
        return !!follow;
      } catch (error) {
        context.fastify.log.error({ err: error }, 'フォロー状態確認エラー:');
        return false;
      }
    },

    /**
     * ユーザーの投稿一覧
     */
    posts: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        return await context.prisma.post.findMany({
          where: {
            userId: parent.id,
            isDeleted: false,
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        context.fastify.log.error({ err: error }, 'ユーザー投稿一覧取得エラー:');
        return [];
      }
    },

    /**
     * ユーザーのいいね一覧
     */
    likes: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        return await context.prisma.like.findMany({
          where: { userId: parent.id },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        context.fastify.log.error({ err: error }, 'ユーザーいいね一覧取得エラー:');
        return [];
      }
    },

    /**
     * ユーザーのコメント一覧
     */
    comments: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        return await context.prisma.comment.findMany({
          where: {
            userId: parent.id,
            isDeleted: false,
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        context.fastify.log.error({ err: error }, 'ユーザーコメント一覧取得エラー:');
        return [];
      }
    },

    /**
     * ユーザーの通知一覧
     */
    notifications: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        // 自分の通知のみ取得可能
        if (!context.user || context.user.id !== parent.id) {
          return [];
        }

        return await context.prisma.notification.findMany({
          where: { userId: parent.id },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        context.fastify.log.error({ err: error }, 'ユーザー通知一覧取得エラー:');
        return [];
      }
    },

    /**
     * ユーザーの設定を取得
     */
    settings: async (parent: UserParent, _args: unknown, context: GraphQLContext) => {
      try {
        // 自分の設定のみ取得可能
        if (!context.user || context.user.id !== parent.id) {
          return null;
        }

        const settings = await context.prisma.userSettings.findUnique({
          where: { userId: parent.id },
        });

        // 設定が存在しない場合はデフォルト値で作成
        if (!settings) {
          return await context.prisma.userSettings.create({
            data: {
              userId: parent.id,
              theme: 'system',
              animationsEnabled: true,
              locale: 'ja',
              contentFilter: 'all',
              displayMode: 'card',
              timezone: 'Asia/Tokyo',
            },
          });
        }

        return settings;
      } catch (error) {
        context.fastify.log.error({ err: error }, 'ユーザー設定取得エラー:');
        return null;
      }
    },
  },

  Mutation: {
    /**
     * プロフィール更新
     */
    updateProfile: async (
      _parent: unknown,
      { input }: { input: ProfileUpdateInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Zodバリデーション
        const validatedInput = ProfileUpdateSchema.parse(input);

        const updatedUser = await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            ...validatedInput,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            bio: true,
            profileImageId: true,
            coverImageId: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        });

        return updatedUser;
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn({
            errors: error.errors,
            input,
          }, '❌ プロフィール更新バリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify.log.error({ err: error }, '❌ プロフィール更新エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('プロフィール更新処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * ユーザーアバター更新（統一Mediaシステム）
     */
    updateUserAvatar: async (
      _parent: unknown,
      { input }: { input: UpdateUserAvatarInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Zodバリデーション
        const validatedInput = UpdateUserAvatarSchema.parse(input);
        const { mediaId } = validatedInput;

        // 1. Mediaレコードの存在確認とユーザー所有権チェック
        const media = await context.prisma.media.findFirst({
          where: {
            id: mediaId,
            userId: context.user.id,
            status: {
              in: ['READY', 'PROCESSING'], // アバターの場合はPROCESSINGも許可
            },
          },
        });

        if (!media) {
          throw new GraphQLError('指定されたメディアが見つからないか、アクセス権限がありません', {
            extensions: { code: 'MEDIA_NOT_FOUND' },
          });
        }

        // アバター画像の場合、PROCESSINGステータスでも更新を許可
        if (media.status === 'PROCESSING' && media.type === 'AVATAR') {
          context.fastify.log.info({
            mediaId,
            status: media.status,
            type: media.type,
          }, '🖼️ [Avatar] PROCESSING状態のアバターメディアを許可:');
        }

        // 2. ユーザー情報を更新（profileImageIdを設定）
        const updatedUser = await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            profileImageId: mediaId,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            bio: true,
            profileImageId: true,
            coverImageId: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        });

        // 🔄 分散キャッシュの無効化（削除済み - 不要）

        context.fastify.log.info({
          userId: context.user.id,
          mediaId,
          s3Key: media.s3Key,
        }, '✅ GraphQL アバター更新成功:');

        return {
          success: true,
          message: 'アバター画像を更新しました',
          user: updatedUser,
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ GraphQL アバター更新エラー:');

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('アバター更新に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * ユーザーアバター削除（統一Mediaシステム）
     */
    deleteUserAvatar: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        // ユーザー情報を更新（profileImageIdをnullに設定）
        const updatedUser = await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            profileImageId: null,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            bio: true,
            profileImageId: true,
            coverImageId: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        });

        context.fastify.log.info({
          userId: context.user.id,
        }, '✅ GraphQL アバター削除成功:');

        return {
          success: true,
          message: 'アバター画像を削除しました',
          user: updatedUser,
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ GraphQL アバター削除エラー:');
        throw new GraphQLError('アバター画像の削除に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * ユーザーカバー画像更新（統一Mediaシステム）
     */
    updateUserCover: async (
      _parent: unknown,
      { input }: { input: UpdateUserCoverInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Zodバリデーション
        const validatedInput = UpdateUserCoverSchema.parse(input);
        const { mediaId } = validatedInput;

        // 1. Mediaレコードの存在確認とユーザー所有権チェック
        const media = await context.prisma.media.findFirst({
          where: {
            id: mediaId,
            userId: context.user.id,
            status: {
              in: ['READY', 'PROCESSING'], // カバー画像の場合はPROCESSINGも許可
            },
          },
        });

        if (!media) {
          throw new GraphQLError('指定されたメディアが見つからないか、アクセス権限がありません', {
            extensions: { code: 'MEDIA_NOT_FOUND' },
          });
        }

        // カバー画像の場合、PROCESSINGステータスでも更新を許可
        if (media.status === 'PROCESSING' && media.type === 'COVER') {
          context.fastify.log.info({
            mediaId,
            status: media.status,
            type: media.type,
          }, '🖼️ [Cover] PROCESSING状態のカバーメディアを許可:');
        }

        // 2. ユーザー情報を更新（coverImageIdを設定）
        const updatedUser = await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            coverImageId: mediaId,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            bio: true,
            profileImageId: true,
            coverImageId: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        });

        // 🔄 分散キャッシュの無効化（削除済み - 不要）

        context.fastify.log.info({
          userId: context.user.id,
          mediaId,
          s3Key: media.s3Key,
        }, '✅ GraphQL カバー画像更新成功:');

        return {
          success: true,
          message: 'カバー画像を更新しました',
          user: updatedUser,
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ GraphQL カバー画像更新エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('カバー画像の更新に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * ユーザーカバー画像削除
     */
    deleteUserCover: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // ユーザーのカバー画像IDをnullに設定
        const updatedUser = await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            coverImageId: null,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            bio: true,
            profileImageId: true,
            coverImageId: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        });

        context.fastify.log.info({
          userId: context.user.id,
        }, '✅ GraphQL カバー画像削除成功:');

        return {
          success: true,
          message: 'カバー画像を削除しました',
          user: updatedUser,
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ GraphQL カバー画像削除エラー:');
        throw new GraphQLError('カバー画像の削除に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * ユーザー設定更新
     */
    updateUserSettings: async (
      _parent: unknown,
      { input }: { input: UserSettingsUpdateInput },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const updatedSettings = await context.prisma.userSettings.upsert({
        where: { userId: context.user.id },
        update: {
          ...input,
          updatedAt: new Date(),
        },
        create: {
          userId: context.user.id,
          theme: input.theme || 'system',
          animationsEnabled: input.animationsEnabled ?? true,
          locale: input.locale || 'ja',
          contentFilter: input.contentFilter || 'all',
          displayMode: input.displayMode || 'card',
          timezone: input.timezone || 'Asia/Tokyo',
        },
      });

      return updatedSettings;
    },

    /**
     * 🔐 パスワード変更
     */
    changePassword: async (
      _parent: unknown,
      { input }: { input: ChangePasswordInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Zodバリデーション
        const validatedInput = ChangePasswordSchema.parse(input);
        const { currentPassword, newPassword } = validatedInput;

        // 現在のユーザー情報取得
        const currentUser = await context.prisma.user.findUnique({
          where: { id: context.user.id },
          select: { passwordHash: true },
        });

        if (!currentUser) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // 現在のパスワード検証
        const isValidPassword = await verifyPassword(currentPassword, currentUser.passwordHash);

        if (!isValidPassword) {
          throw new GraphQLError('現在のパスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 新しいパスワードをハッシュ化
        const saltRounds = 12;
        const newPasswordHash = await hashPassword(newPassword, { saltRounds });

        // パスワード更新
        await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            passwordHash: newPasswordHash,
            updatedAt: new Date(),
          },
        });

        context.fastify.log.info({ username: context.user.username }, '✅ GraphQL パスワード変更成功:');

        return {
          success: true,
          message: 'パスワードを変更しました',
        };
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn({
            errors: error.errors,
            input,
          }, '❌ パスワード変更バリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify.log.error({ err: error }, '❌ パスワード変更エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('パスワード変更処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * 📧 メールアドレス変更
     */
    updateEmail: async (
      _parent: unknown,
      { input }: { input: UpdateEmailInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Zodバリデーション
        const validatedInput = UpdateEmailSchema.parse(input);
        const { newEmail, password } = validatedInput;

        // 既存メールアドレスチェック
        const existingUser = await context.prisma.user.findUnique({
          where: { email: newEmail },
        });

        if (existingUser && existingUser.id !== context.user.id) {
          throw new GraphQLError('このメールアドレスは既に使用されています', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // 現在のユーザー情報取得
        const currentUser = await context.prisma.user.findUnique({
          where: { id: context.user.id },
          select: { passwordHash: true },
        });

        if (!currentUser) {
          throw new GraphQLError('ユーザーが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // パスワード検証
        const isValidPassword = await verifyPassword(password, currentUser.passwordHash);

        if (!isValidPassword) {
          throw new GraphQLError('パスワードが正しくありません', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // メールアドレス更新
        const updatedUser = await context.prisma.user.update({
          where: { id: context.user.id },
          data: {
            email: newEmail,
            isVerified: false, // メール変更時は再認証が必要
            updatedAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            isVerified: true,
          },
        });

        context.fastify.log.info({ username: context.user.username }, '✅ GraphQL メールアドレス変更成功:');

        return {
          success: true,
          message: 'メールアドレスを変更しました。再認証が必要です。',
          user: updatedUser,
        };
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn({
            errors: error.errors,
            input,
          }, '❌ メールアドレス変更バリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify.log.error({ err: error }, '❌ メールアドレス変更エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('メールアドレス変更処理中にエラーが発生しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
