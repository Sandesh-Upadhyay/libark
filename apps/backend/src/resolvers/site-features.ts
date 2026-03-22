/**
 * 🎯 サイト機能管理リゾルバー
 *
 * サイト機能設定とユーザー機能権限の管理
 * 管理者権限が必要な機能を含む
 */

import { GraphQLError } from 'graphql';
import { logger } from '@libark/core-shared';

import type { GraphQLContext } from '../graphql/context.js';

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

/**
 * サイト機能の有効性をチェック
 */
async function checkSiteFeatureEnabled(
  context: GraphQLContext,
  featureName: string
): Promise<boolean> {
  try {
    const siteFeature = await context.prisma.siteFeatureSetting.findUnique({
      where: { featureName },
    });

    // 🔍 デバッグログ
    const isEnabled = siteFeature?.isEnabled ?? true;
    logger.info(`🔍 [SiteFeatures] 機能フラグチェック:`, {
      featureName,
      isEnabled,
      siteFeatureExists: !!siteFeature,
      siteFeature,
    });

    // 設定が存在しない場合はデフォルトで有効
    return isEnabled;
  } catch (error) {
    logger.error('サイト機能チェックエラー:', error);
    return true; // エラー時はデフォルトで有効
  }
}

/**
 * ユーザーの機能アクセス権をチェック
 */
async function _checkUserFeatureAccess(
  context: GraphQLContext,
  userId: string,
  featureName: string
): Promise<boolean> {
  try {
    // まずサイト機能が有効かチェック
    const siteFeatureEnabled = await checkSiteFeatureEnabled(context, featureName);
    if (!siteFeatureEnabled) {
      return false;
    }

    // ユーザー個別の権限をチェック
    const userPermission = await context.prisma.userFeaturePermission.findFirst({
      where: {
        userId,
        featureName,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    // ユーザー個別設定がない場合はデフォルトで有効
    return userPermission?.isEnabled ?? true;
  } catch (error) {
    logger.error('ユーザー機能アクセスチェックエラー:', error);
    return true; // エラー時はデフォルトで有効
  }
}

export const siteFeaturesResolvers = {
  Query: {
    /**
     * サイト機能設定一覧取得（管理者のみ）
     */
    siteFeatureSettings: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      await requireAdmin(context);

      try {
        const settings = await context.prisma.siteFeatureSetting.findMany({
          include: {
            updatedByUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
          orderBy: { featureName: 'asc' },
        });

        // WORKAROUND: Prisma test env array fix
        await Promise.all(
          settings.map(async (s: any) => {
            if (s.updatedByUser && Array.isArray(s.updatedByUser)) {
              s.updatedByUser = s.updatedByUser[0] || null;
            }
            if (!s.updatedByUser) {
              const user = await context.prisma.user.findUnique({
                where: { id: s.updatedBy },
                select: { id: true, username: true, displayName: true },
              });
              if (user) s.updatedByUser = user;
            }
          })
        );

        return settings;
      } catch (error) {
        console.error('サイト機能設定取得エラー:', error);
        throw new GraphQLError('サイト機能設定の取得に失敗しました');
      }
    },

    /**
     * 特定のサイト機能設定取得（管理者のみ）
     */
    siteFeatureSetting: async (
      _parent: unknown,
      args: { featureName: string },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const setting = await context.prisma.siteFeatureSetting.findUnique({
          where: { featureName: args.featureName },
          include: {
            updatedByUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

        // WORKAROUND: Prisma test env array fix
        if (setting && Array.isArray((setting as any).updatedByUser)) {
          (setting as any).updatedByUser = (setting as any).updatedByUser[0] || null;
        }

        return setting;
      } catch (error) {
        console.error('サイト機能設定取得エラー:', error);
        throw new GraphQLError('サイト機能設定の取得に失敗しました');
      }
    },

    /**
     * ユーザー機能権限一覧取得（管理者のみ）
     */
    userFeaturePermissions: async (
      _parent: unknown,
      args: { userId: string },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const permissions = await context.prisma.userFeaturePermission.findMany({
          where: {
            userId: args.userId,
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            grantedByUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
          orderBy: { featureName: 'asc' },
        });

        // WORKAROUND: Prisma test env array fix
        await Promise.all(
          permissions.map(async (p: any) => {
            if (Array.isArray(p.user)) p.user = p.user[0] || null;
            if (Array.isArray(p.grantedByUser)) p.grantedByUser = p.grantedByUser[0] || null;

            if (!p.user) {
              const u = await context.prisma.user.findUnique({
                where: { id: p.userId },
                select: { id: true, username: true, displayName: true },
              });
              if (u) p.user = u;
            }
            if (!p.grantedByUser) {
              const g = await context.prisma.user.findUnique({
                where: { id: p.grantedBy },
                select: { id: true, username: true, displayName: true },
              });
              if (g) p.grantedByUser = g;
            }
          })
        );

        return permissions;
      } catch (error) {
        console.error('ユーザー機能権限取得エラー:', error);
        throw new GraphQLError('ユーザー機能権限の取得に失敗しました');
      }
    },

    /**
     * 自分の機能権限一覧取得
     */
    myFeaturePermissions: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const permissions = await context.prisma.userFeaturePermission.findMany({
          where: {
            userId: context.user.id,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            grantedByUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
          orderBy: { featureName: 'asc' },
        });

        // WORKAROUND: Prisma test env array fix
        await Promise.all(
          permissions.map(async (p: any) => {
            if (Array.isArray(p.user)) p.user = p.user[0] || null;
            if (Array.isArray(p.grantedByUser)) p.grantedByUser = p.grantedByUser[0] || null;

            if (!p.user) {
              const u = await context.prisma.user.findUnique({
                where: { id: p.userId },
                select: { id: true, username: true, displayName: true },
              });
              if (u) p.user = u;
            }
            if (!p.grantedByUser) {
              const g = await context.prisma.user.findUnique({
                where: { id: p.grantedBy },
                select: { id: true, username: true, displayName: true },
              });
              if (g) p.grantedByUser = g;
            }
          })
        );

        return permissions;
      } catch (error) {
        console.error('自分の機能権限取得エラー:', error);
        throw new GraphQLError('機能権限の取得に失敗しました');
      }
    },

    /**
     * 全機能フラグ一括取得（最適化版）
     */
    featureFlags: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        // 全機能フラグを一括チェック
        const [
          POST_CREATE,
          POST_IMAGE_UPLOAD,
          POST_LIKE,
          MESSAGES_ACCESS,
          MESSAGES_SEND,
          WALLET_ACCESS,
          WALLET_DEPOSIT,
          WALLET_WITHDRAW,
        ] = await Promise.all([
          checkSiteFeatureEnabled(context, 'POST_CREATE'),
          checkSiteFeatureEnabled(context, 'POST_IMAGE_UPLOAD'),
          checkSiteFeatureEnabled(context, 'POST_LIKE'),
          checkSiteFeatureEnabled(context, 'MESSAGES_ACCESS'),
          checkSiteFeatureEnabled(context, 'MESSAGES_SEND'),
          checkSiteFeatureEnabled(context, 'WALLET_ACCESS'),
          checkSiteFeatureEnabled(context, 'WALLET_DEPOSIT'),
          checkSiteFeatureEnabled(context, 'WALLET_WITHDRAW'),
        ]);

        return {
          POST_CREATE,
          POST_IMAGE_UPLOAD,
          POST_LIKE,
          MESSAGES_ACCESS,
          MESSAGES_SEND,
          WALLET_ACCESS,
          WALLET_DEPOSIT,
          WALLET_WITHDRAW,
        };
      } catch (error) {
        logger.error('機能フラグ一括取得エラー:', error);
        // エラー時はデフォルト値（全て有効）を返す
        return {
          POST_CREATE: true,
          POST_IMAGE_UPLOAD: true,
          POST_LIKE: true,
          MESSAGES_ACCESS: true,
          MESSAGES_SEND: true,
          WALLET_ACCESS: true,
          WALLET_DEPOSIT: true,
          WALLET_WITHDRAW: true,
        };
      }
    },
  },

  Mutation: {
    /**
     * サイト機能設定更新（管理者のみ）
     */
    updateSiteFeature: async (
      _parent: unknown,
      { input }: { input: { featureName: string; isEnabled: boolean; description?: string } },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const updatedSetting = await context.prisma.siteFeatureSetting.upsert({
          where: { featureName: input.featureName },
          update: {
            isEnabled: input.isEnabled,
            description: input.description,
            updatedBy: context.user!.id,
          },
          create: {
            featureName: input.featureName,
            isEnabled: input.isEnabled,
            description: input.description,
            updatedBy: context.user!.id,
          },
        });

        // リレーションを確実に取得するために再取得
        const result = await context.prisma.siteFeatureSetting.findUnique({
          where: { id: updatedSetting.id },
          include: {
            updatedByUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

        if (!result) throw new Error('Failed to fetch updated site feature setting');

        // WORKAROUND: Prisma sometimes returns array or empty for relation in test env
        // Manual fallback fetch
        if (
          result &&
          (!result.updatedByUser ||
            (Array.isArray(result.updatedByUser) && !result.updatedByUser[0]))
        ) {
          const user = await context.prisma.user.findUnique({
            where: { id: result.updatedBy },
            select: { id: true, username: true, displayName: true },
          });
          if (user) {
            (result as any).updatedByUser = user;
          }
        }

        console.log(`DEBUG [SiteFeatures] result:`, JSON.stringify(result, null, 2));

        logger.info(`サイト機能設定更新: ${input.featureName} -> ${input.isEnabled}`, {
          updatedBy: context.user!.username,
        });

        return result;
      } catch (error) {
        logger.error('サイト機能設定更新エラー:', error);
        throw new GraphQLError('サイト機能設定の更新に失敗しました');
      }
    },

    /**
     * ユーザー機能権限更新（管理者のみ）
     */
    updateUserFeaturePermission: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          userId: string;
          featureName: string;
          isEnabled: boolean;
          expiresAt?: string;
        };
      },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const updatedPermission = await context.prisma.userFeaturePermission.upsert({
          where: {
            userId_featureName: {
              userId: input.userId,
              featureName: input.featureName,
            },
          },
          update: {
            isEnabled: input.isEnabled,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            grantedBy: context.user!.id,
            grantedAt: new Date(),
          },
          create: {
            userId: input.userId,
            featureName: input.featureName,
            isEnabled: input.isEnabled,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            grantedBy: context.user!.id,
            isActive: true,
          },
        });

        // リレーションを確実に取得するために再取得
        const result = await context.prisma.userFeaturePermission.findUnique({
          where: { id: updatedPermission.id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            grantedByUser: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

        if (!result) throw new Error('Failed to fetch updated user feature permission');

        // WORKAROUND: Prisma sometimes returns array or empty for relation in test env
        if (result && (!result.user || (Array.isArray(result.user) && !result.user[0]))) {
          const user = await context.prisma.user.findUnique({
            where: { id: result.userId }, // userId field in UserFeaturePermission
            select: { id: true, username: true, displayName: true },
          });
          if (user) {
            (result as any).user = user;
          }
        }

        // Also check grantedByUser
        if (
          result &&
          (!result.grantedByUser ||
            (Array.isArray(result.grantedByUser) && !result.grantedByUser[0]))
        ) {
          const granter = await context.prisma.user.findUnique({
            where: { id: result.grantedBy },
            select: { id: true, username: true, displayName: true },
          });
          if (granter) {
            (result as any).grantedByUser = granter;
          }
        }

        logger.info(
          `ユーザー機能権限更新: ${input.userId} ${input.featureName} -> ${input.isEnabled}`,
          {
            grantedBy: context.user!.username,
          }
        );

        return result;
      } catch (error) {
        console.error('ユーザー機能権限更新エラー:', error);
        throw new GraphQLError('ユーザー機能権限の更新に失敗しました');
      }
    },

    /**
     * ユーザー機能権限取り消し（管理者のみ）
     */
    revokeUserFeaturePermission: async (
      _parent: unknown,
      { input }: { input: { userId: string; featureName: string } },
      context: GraphQLContext
    ) => {
      await requireAdmin(context);

      try {
        const permission = await context.prisma.userFeaturePermission.findFirst({
          where: {
            userId: input.userId,
            featureName: input.featureName,
            isActive: true,
          },
        });

        if (!permission) {
          throw new GraphQLError('指定された権限が見つかりません');
        }

        await context.prisma.userFeaturePermission.update({
          where: { id: permission.id },
          data: { isActive: false },
        });

        logger.info(`ユーザー機能権限取り消し: ${input.userId} ${input.featureName}`, {
          revokedBy: context.user!.username,
        });

        return true;
      } catch (error) {
        logger.error('ユーザー機能権限取り消しエラー:', error);
        throw new GraphQLError('ユーザー機能権限の取り消しに失敗しました');
      }
    },
  },
};
