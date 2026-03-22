/**
 * ユーザー関連シーダー
 * ユーザー、ロール、権限、ユーザー権限の作成を担当
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import type { User, SeedResult } from '../utils/types';
import { usersData, userPermissionMappings } from '../data/users';
import { logProgress } from '../utils/database';

/**
 * ロールを作成
 */
// 役割の生成は role-permission-seeder に一本化（ここでは参照のみ）
export async function createRoles(prisma: PrismaClient): Promise<any[]> {
  console.log('ロールを取得しています...');

  const roles = await prisma.role.findMany();

  console.log(`${roles.length} 個のロールを取得しました`);
  return roles;
}

/**
 * 権限を作成
 */
// 権限の生成は role-permission-seeder に一本化（ここでは参照のみ）
export async function createPermissions(prisma: PrismaClient): Promise<any[]> {
  console.log('権限を取得しています...');
  const permissions = await prisma.permission.findMany();
  console.log(`${permissions.length} 個の権限を取得しました`);
  return permissions;
}

/**
 * ユーザーを作成
 */
async function createUser(
  prisma: PrismaClient,
  userData: (typeof usersData)[0],
  roleMap: Record<string, unknown>
): Promise<User> {
  try {
    // パスワードのハッシュ化
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // ユーザーが既に存在するか確認
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      console.log(`ユーザー ${userData.email} または ${userData.username} は既に存在します`);
      return existingUser;
    }

    // ユーザーの作成データ
    const createData: any = {
      username: userData.username,
      email: userData.email,
      passwordHash,
      displayName: userData.displayName,
      bio: userData.bio,
      isVerified: true,
      isActive: true,
      roleId: roleMap[userData.role || 'USER']?.id,
    };

    // システムユーザーには固定UUIDを設定
    if (userData.username === 'system') {
      createData.id = '00000000-0000-0000-0000-000000000000';
    }

    const user = await prisma.user.create({
      data: createData,
    });

    return user;
  } catch (error) {
    console.error(`ユーザー ${userData.email} の作成に失敗しました:`, error);
    throw error;
  }
}

/**
 * すべてのユーザーを作成
 */
export async function createUsers(
  prisma: PrismaClient,
  roleMap: Record<string, unknown>
): Promise<User[]> {
  console.log('ユーザーを作成しています...');

  const createdUsers: User[] = [];

  // ユーザーデータのロール名マッピング
  const roleNameMap: Record<string, string> = {
    USER: 'BASIC_USER',
    ADMIN: 'SUPER_ADMIN',
    SELLER: 'CONTENT_SELLER',
    P2P_SELLER: 'P2P_TRADER',
  };

  for (let i = 0; i < usersData.length; i++) {
    const userData = { ...usersData[i] };
    const mappedRole = roleNameMap[userData.role || 'USER'] || 'BASIC_USER';
    userData.role = mappedRole as unknown;

    const user = await createUser(prisma, userData, roleMap);
    createdUsers.push(user);

    logProgress(i + 1, usersData.length, 'ユーザー');
  }

  console.log(`${createdUsers.length} 人のユーザーを作成しました`);
  return createdUsers;
}

/**
 * ユーザー権限を作成
 */

/**
 * ロールに必要な権限を関連付け（最小セット）
 */
export async function createAdminRolePermissions(
  prisma: PrismaClient,
  roles: unknown[],
  permissions: unknown[]
): Promise<void> {
  const roleMap = roles.reduce(
    (map, role) => {
      map[role.name] = role;
      return map;
    },
    {} as Record<string, unknown>
  );

  const permissionMap = permissions.reduce(
    (map, perm) => {
      map[perm.name] = perm;
      return map;
    },
    {} as Record<string, unknown>
  );

  const adminRole = roleMap['ADMIN'];
  const required = ['ADMIN_PANEL', 'MANAGE_USERS'] as const;

  if (!adminRole) return;

  for (const permName of required) {
    const perm = permissionMap[permName];
    if (!perm) continue;

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
}

export async function createUserPermissions(
  prisma: PrismaClient,
  users: User[],
  permissions: unknown[]
): Promise<any[]> {
  console.log('ユーザー権限を作成しています...');

  const userPermissions: unknown[] = [];

  // 権限名でマップを作成
  const permissionMap = permissions.reduce(
    (map, permission) => {
      map[permission.name] = permission;
      return map;
    },
    {} as Record<string, unknown>
  );

  for (const user of users) {
    try {
      // 特定ユーザーに追加権限を付与
      const additionalPermissions =
        userPermissionMappings[user.username as keyof typeof userPermissionMappings];
      if (additionalPermissions) {
        for (const permissionName of additionalPermissions) {
          const permission = permissionMap[permissionName];
          if (!permission) {
            console.warn(`権限 ${permissionName} が見つかりません (ユーザー: ${user.username})`);
            continue;
          }

          const userPermission = await prisma.userPermissionOverride.upsert({
            where: {
              userId_permissionId: {
                userId: user.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              permissionId: permission.id,
              allowed: true,
              isActive: true,
            },
          });
          userPermissions.push(userPermission);
        }
      }
    } catch (error) {
      console.error(`ユーザー ${user.username} の権限作成中にエラー:`, error);
    }
  }

  console.log(`${userPermissions.length} 件のユーザー権限を作成しました`);
  return userPermissions;
}
/**
 * admin@libark.io を確実に管理者に昇格させる
 */
async function ensureAdminUser(
  prisma: PrismaClient,
  roles: unknown[],
  permissions: unknown[]
): Promise<void> {
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: 'admin@libark.io' }, { username: 'admin' }],
    },
    include: { role: true },
  });

  if (!adminUser) return;

  const roleMap = roles.reduce(
    (m, r) => {
      m[r.name] = r;
      return m;
    },
    {} as Record<string, unknown>
  );
  const permissionMap = permissions.reduce(
    (m, p) => {
      m[p.name] = p;
      return m;
    },
    {} as Record<string, unknown>
  );

  const superAdminRole = roleMap['SUPER_ADMIN'];
  if (superAdminRole && adminUser.roleId !== superAdminRole.id) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        roleId: superAdminRole.id,
        isVerified: true,
        isActive: true,
      },
    });
  }

  // 管理者に必要なパーミッションを個別付与（冪等）
  for (const permName of ['ADMIN_PANEL', 'MANAGE_USERS'] as const) {
    const perm = permissionMap[permName];
    if (!perm) continue;
    await prisma.userPermissionOverride.upsert({
      where: {
        userId_permissionId: {
          userId: adminUser.id,
          permissionId: perm.id,
        },
      },
      update: { allowed: true, isActive: true },
      create: {
        userId: adminUser.id,
        permissionId: perm.id,
        allowed: true,
        isActive: true,
      },
    });
  }
}

/**
 * ユーザー関連のシード実行
 */
export async function seedUsers(prisma: PrismaClient): Promise<SeedResult> {
  try {
    // ロールを作成
    const roles = await createRoles(prisma);
    const roleMap = roles.reduce(
      (map, role) => {
        map[role.name] = role;
        return map;
      },
      {} as Record<string, unknown>
    );

    // 権限を作成
    const permissions = await createPermissions(prisma);

    // ユーザーを作成
    const users = await createUsers(prisma, roleMap);

    // ロールに管理者向け権限（ADMIN_PANEL, MANAGE_USERS）を関連付け
    await createAdminRolePermissions(prisma, roles, permissions);

    // adminユーザーのロール・権限を保証
    await ensureAdminUser(prisma, roles, permissions);

    return {
      success: true,
      data: users,
      count: users.length,
      message: 'ユーザー関連のシードが正常に完了しました',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('不明なエラー'),
      message: 'ユーザー関連のシードでエラーが発生しました',
    };
  }
}
