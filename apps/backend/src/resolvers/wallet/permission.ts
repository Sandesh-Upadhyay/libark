import { GraphQLError } from 'graphql';
import { createLogger } from '@libark/core-shared';

import { GraphQLContext } from '../../graphql/context.js';

const logger = createLogger({ name: 'wallet-permission' });

export const walletPermissionMutations = {
  /**
   * 権限付与
   */
  grantPermission: async (
    _parent: unknown,
    { input }: { input: { userId: string; permissionName: string; expiresAt?: string } },
    context: GraphQLContext
  ) => {
    if (!context.user) throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    // 管理者権限チェック
    const hasAdmin = await context.prisma.userPermissionOverride.findFirst({
      where: {
        userId: context.user.id,
        permission: { name: { in: ['ADMIN_PANEL', 'MANAGE_USERS'] } },
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!hasAdmin) throw new GraphQLError('管理者権限が必要です', { extensions: { code: 'FORBIDDEN' } });

    try {
      const permission = await context.prisma.permission.findUnique({ where: { name: input.permissionName } });
      if (!permission) throw new GraphQLError('指定された権限が見つかりません');

      const existing = await context.prisma.userPermissionOverride.findUnique({
        where: { userId_permissionId: { userId: input.userId, permissionId: permission.id } },
      });

      if (existing && existing.isActive) throw new GraphQLError('ユーザーは既にこの権限を持っています');

      return await context.prisma.userPermissionOverride.upsert({
        where: { userId_permissionId: { userId: input.userId, permissionId: permission.id } },
        update: { isActive: true, grantedBy: context.user.id, grantedAt: new Date(), expiresAt: input.expiresAt ? new Date(input.expiresAt) : null },
        create: { userId: input.userId, permissionId: permission.id, allowed: true, grantedBy: context.user.id, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null },
        include: { user: true, permission: true, grantedByUser: true },
      });
    } catch (error) {
      logger.error('権限付与エラー:', error);
      throw new GraphQLError('権限の付与に失敗しました');
    }
  },

  /**
   * 権限取り消し
   */
  revokePermission: async (
    _parent: unknown,
    { input }: { input: { userId: string; permissionName: string } },
    context: GraphQLContext
  ) => {
    if (!context.user) throw new GraphQLError('認証が必要です', { extensions: { code: 'UNAUTHENTICATED' } });

    const hasAdmin = await context.prisma.userPermissionOverride.findFirst({
      where: {
        userId: context.user.id,
        permission: { name: { in: ['ADMIN_PANEL', 'MANAGE_USERS'] } },
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!hasAdmin) throw new GraphQLError('管理者権限が必要です', { extensions: { code: 'FORBIDDEN' } });

    try {
      const permission = await context.prisma.permission.findUnique({ where: { name: input.permissionName } });
      if (!permission) throw new GraphQLError('指定された権限が見つかりません');

      await context.prisma.userPermissionOverride.updateMany({
        where: { userId: input.userId, permissionId: permission.id },
        data: { isActive: false },
      });

      return true;
    } catch (error) {
      logger.error('権限取り消しエラー:', error);
      throw new GraphQLError('権限の取り消しに失敗しました');
    }
  },
};
