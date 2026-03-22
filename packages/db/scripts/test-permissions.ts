/**
 * 🧪 新しいロール・権限システムのテストスクリプト
 *
 * 実装した Role + Permission分離システムが正しく動作するかテストします。
 */

import { createPrismaClient } from '@libark/db/server';

const prisma = createPrismaClient();

async function testPermissionSystem() {
  console.log('🧪 ロール・権限システムのテストを開始...');

  try {
    // 1. 管理者ユーザーの権限テスト
    console.log('\n📋 テスト1: 管理者ユーザーの権限確認');
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' },
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
      },
    });

    if (adminUser) {
      console.log(`✅ 管理者ユーザー: ${adminUser.username}`);
      console.log(`✅ ロール: ${adminUser.role?.name}`);
      console.log(`✅ 権限数: ${adminUser.role?.permissions?.length || 0}`);

      const permissions = adminUser.role?.permissions?.map(rp => rp.permission.name) || [];
      console.log('✅ 権限一覧:');
      permissions.forEach(permission => {
        console.log(`   - ${permission}`);
      });
    } else {
      console.log('❌ 管理者ユーザーが見つかりません');
    }

    // 2. 一般ユーザーの権限テスト
    console.log('\n📋 テスト2: 一般ユーザーの権限確認');
    const basicUser = await prisma.user.findFirst({
      where: {
        role: { name: 'BASIC_USER' },
      },
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
      },
    });

    if (basicUser) {
      console.log(`✅ 一般ユーザー: ${basicUser.username}`);
      console.log(`✅ ロール: ${basicUser.role?.name}`);
      console.log(`✅ 権限数: ${basicUser.role?.permissions?.length || 0}`);

      const permissions = basicUser.role?.permissions?.map(rp => rp.permission.name) || [];
      console.log('✅ 権限一覧:');
      permissions.forEach(permission => {
        console.log(`   - ${permission}`);
      });
    } else {
      console.log('❌ 一般ユーザーが見つかりません');
    }

    // 3. 権限チェック関数のテスト
    console.log('\n📋 テスト3: 権限チェック関数のテスト');

    if (adminUser && basicUser) {
      // 管理者権限のテスト
      const adminHasAdminPanel = await hasPermission(adminUser.id, 'ADMIN_PANEL');
      const adminHasManageUsers = await hasPermission(adminUser.id, 'MANAGE_USERS');
      const adminHasReadPosts = await hasPermission(adminUser.id, 'READ_POSTS');

      console.log(`✅ 管理者のADMIN_PANEL権限: ${adminHasAdminPanel}`);
      console.log(`✅ 管理者のMANAGE_USERS権限: ${adminHasManageUsers}`);
      console.log(`✅ 管理者のREAD_POSTS権限: ${adminHasReadPosts}`);

      // 一般ユーザー権限のテスト
      const userHasAdminPanel = await hasPermission(basicUser.id, 'ADMIN_PANEL');
      const userHasReadPosts = await hasPermission(basicUser.id, 'READ_POSTS');
      const userHasCreatePosts = await hasPermission(basicUser.id, 'CREATE_POSTS');

      console.log(`✅ 一般ユーザーのADMIN_PANEL権限: ${userHasAdminPanel}`);
      console.log(`✅ 一般ユーザーのREAD_POSTS権限: ${userHasReadPosts}`);
      console.log(`✅ 一般ユーザーのCREATE_POSTS権限: ${userHasCreatePosts}`);
    }

    // 4. 個別権限上書きのテスト
    console.log('\n📋 テスト4: 個別権限上書きのテスト');

    if (basicUser) {
      // 一般ユーザーにコンテンツ販売権限を個別付与
      const sellContentPermission = await prisma.permission.findUnique({
        where: { name: 'SELL_CONTENT' },
      });

      if (sellContentPermission) {
        await prisma.userPermissionOverride.upsert({
          where: {
            userId_permissionId: {
              userId: basicUser.id,
              permissionId: sellContentPermission.id,
            },
          },
          update: {
            allowed: true,
            isActive: true,
          },
          create: {
            userId: basicUser.id,
            permissionId: sellContentPermission.id,
            allowed: true,
            isActive: true,
          },
        });

        console.log('✅ 一般ユーザーにSELL_CONTENT権限を個別付与しました');

        // 権限チェック
        const hasSellContent = await hasPermission(basicUser.id, 'SELL_CONTENT');
        console.log(`✅ 一般ユーザーのSELL_CONTENT権限（上書き後）: ${hasSellContent}`);
      }
    }

    // 5. ロール統計の表示
    console.log('\n📋 テスト5: ロール統計');
    const roleStats = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });

    roleStats.forEach(role => {
      console.log(
        `✅ ${role.name}: ユーザー数=${role._count.users}, 権限数=${role._count.permissions}`
      );
    });

    console.log('\n🎉 全てのテストが完了しました！');
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 権限チェック関数（AuthServiceと同じロジック）
 */
async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    // 1. パーミッション定義を取得
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });
    if (!permission) return false;

    // 2. ユーザーのオーバーライド確認
    const override = await prisma.userPermissionOverride.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (override) return override.allowed;

    // 3. ロールに紐づくパーミッション確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              where: { permissionId: permission.id },
            },
          },
        },
      },
    });

    return user?.role?.permissions?.length > 0;
  } catch (error) {
    console.error('❌ 権限チェックエラー:', error);
    return false;
  }
}

// スクリプト実行
testPermissionSystem().catch(error => {
  console.error(error);
  process.exit(1);
});

export { testPermissionSystem };
