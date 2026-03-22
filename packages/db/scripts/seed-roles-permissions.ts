/**
 * 🎯 ロール・権限システム初期データ投入スクリプト
 *
 * LIBARKプロジェクトの新しいRole + Permission分離システムの
 * 初期データを投入します。
 */

import { createPrismaClient } from '@libark/db/server';

const prisma = createPrismaClient();

// 🎯 権限定義
const PERMISSIONS = [
  // 基本権限
  { name: 'READ_POSTS', description: '投稿の閲覧' },
  { name: 'CREATE_POSTS', description: '投稿の作成' },
  { name: 'EDIT_OWN_POSTS', description: '自分の投稿の編集' },
  { name: 'DELETE_OWN_POSTS', description: '自分の投稿の削除' },
  { name: 'COMMENT_ON_POSTS', description: '投稿へのコメント' },
  { name: 'LIKE_POSTS', description: '投稿へのいいね' },

  // メッセージ機能
  { name: 'SEND_MESSAGES', description: 'メッセージの送信' },
  { name: 'READ_MESSAGES', description: 'メッセージの閲覧' },

  // ウォレット機能
  { name: 'USE_WALLET', description: 'ウォレット機能の使用' },
  { name: 'DEPOSIT_FUNDS', description: '入金機能' },
  { name: 'WITHDRAW_FUNDS', description: '出金機能' },

  // コンテンツ販売
  { name: 'SELL_CONTENT', description: 'コンテンツ販売' },
  { name: 'SET_CONTENT_PRICES', description: 'コンテンツ価格設定' },
  { name: 'VIEW_SALES_ANALYTICS', description: '売上分析の閲覧' },

  // P2P取引
  { name: 'P2P_TRADING', description: 'P2P取引機能' },
  { name: 'CREATE_TRADE_OFFERS', description: '取引オファーの作成' },
  { name: 'ACCEPT_TRADE_OFFERS', description: '取引オファーの受諾' },

  // プレミアム機能
  { name: 'PREMIUM_FEATURES', description: 'プレミアム機能の使用' },
  { name: 'ADVANCED_ANALYTICS', description: '高度な分析機能' },
  { name: 'PRIORITY_SUPPORT', description: '優先サポート' },

  // 管理者権限
  { name: 'ADMIN_PANEL', description: '管理者パネルへのアクセス' },
  { name: 'MANAGE_USERS', description: 'ユーザー管理' },
  { name: 'MANAGE_CONTENT', description: 'コンテンツ管理' },
  { name: 'MANAGE_PAYMENTS', description: '決済管理' },
  { name: 'MANAGE_SITE_SETTINGS', description: 'サイト設定管理' },
  { name: 'VIEW_SYSTEM_LOGS', description: 'システムログ閲覧' },
  { name: 'MANAGE_ROLES_PERMISSIONS', description: 'ロール・権限管理' },
] as const;

// 🎯 ロール定義
const ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'システム全体の管理者',
    permissions: [
      // 全ての権限
      ...PERMISSIONS.map(p => p.name),
    ],
  },
  {
    name: 'ADMIN',
    description: 'サイト管理者',
    permissions: [
      // 基本権限
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      // メッセージ
      'SEND_MESSAGES',
      'READ_MESSAGES',
      // ウォレット
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      // 管理者権限
      'ADMIN_PANEL',
      'MANAGE_USERS',
      'MANAGE_CONTENT',
      'MANAGE_PAYMENTS',
      'MANAGE_SITE_SETTINGS',
      'VIEW_SYSTEM_LOGS',
    ],
  },
  {
    name: 'CONTENT_SELLER',
    description: 'コンテンツ販売者',
    permissions: [
      // 基本権限
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      // メッセージ
      'SEND_MESSAGES',
      'READ_MESSAGES',
      // ウォレット
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      // コンテンツ販売
      'SELL_CONTENT',
      'SET_CONTENT_PRICES',
      'VIEW_SALES_ANALYTICS',
    ],
  },
  {
    name: 'P2P_TRADER',
    description: 'P2P取引者',
    permissions: [
      // 基本権限
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      // メッセージ
      'SEND_MESSAGES',
      'READ_MESSAGES',
      // ウォレット
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      // P2P取引
      'P2P_TRADING',
      'CREATE_TRADE_OFFERS',
      'ACCEPT_TRADE_OFFERS',
    ],
  },
  {
    name: 'PREMIUM_USER',
    description: 'プレミアムユーザー',
    permissions: [
      // 基本権限
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      // メッセージ
      'SEND_MESSAGES',
      'READ_MESSAGES',
      // ウォレット
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      // プレミアム機能
      'PREMIUM_FEATURES',
      'ADVANCED_ANALYTICS',
      'PRIORITY_SUPPORT',
    ],
  },
  {
    name: 'BASIC_USER',
    description: '一般ユーザー',
    permissions: [
      // 基本権限のみ
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      // メッセージ
      'SEND_MESSAGES',
      'READ_MESSAGES',
    ],
  },
] as const;

async function seedRolesAndPermissions() {
  console.log('🎯 ロール・権限システムの初期データを投入開始...');

  try {
    // 1. 権限を作成
    console.log('📝 権限を作成中...');
    for (const permission of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: {
          name: permission.name,
          description: permission.description,
        },
      });
    }
    console.log(`✅ ${PERMISSIONS.length}個の権限を作成しました`);

    // 2. ロールを作成
    console.log('👥 ロールを作成中...');
    for (const role of ROLES) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: {
          name: role.name,
          description: role.description,
        },
      });
    }
    console.log(`✅ ${ROLES.length}個のロールを作成しました`);

    // 3. ロール-権限関係を作成
    console.log('🔗 ロール-権限関係を作成中...');
    for (const role of ROLES) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: role.name },
      });

      if (!roleRecord) continue;

      for (const permissionName of role.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (!permission) continue;

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permission.id,
          },
        });
      }
    }
    console.log('✅ ロール-権限関係を作成しました');

    // 4. 既存ユーザーにデフォルトロールを割り当て
    console.log('👤 既存ユーザーにロールを割り当て中...');

    // 管理者ユーザーを特定（admin@libark.devまたはusername: admin）
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: 'admin@libark.dev' }, { username: 'admin' }],
      },
    });

    if (adminUser) {
      const adminRole = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });

      if (adminRole) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: adminRole.id },
        });
        console.log(
          `✅ 管理者ユーザー (${adminUser.username}) にSUPER_ADMINロールを割り当てました`
        );
      }
    }

    // その他のユーザーにBASIC_USERロールを割り当て
    const basicRole = await prisma.role.findUnique({
      where: { name: 'BASIC_USER' },
    });

    if (basicRole) {
      const usersWithoutRole = await prisma.user.findMany({
        where: { roleId: null },
      });

      for (const user of usersWithoutRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: basicRole.id },
        });
      }
      console.log(`✅ ${usersWithoutRole.length}人のユーザーにBASIC_USERロールを割り当てました`);
    }

    console.log('🎉 ロール・権限システムの初期データ投入が完了しました！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
seedRolesAndPermissions().catch(error => {
  console.error(error);
  process.exit(1);
});

export { seedRolesAndPermissions };
