/**
 * ロール・権限シーダー（統合版・ユーザー割当なし）
 */
import { PrismaClient } from '@prisma/client';

import type { SeedResult } from '../utils/types';

// 🎯 権限定義（包括的）
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

  // 管理者権限（AuthService.isAdmin が参照）
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
      // 全権限
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
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'SELL_CONTENT',
      'SET_CONTENT_PRICES',
      'VIEW_SALES_ANALYTICS',
    ],
  },
  {
    name: 'P2P_TRADER',
    description: 'P2P取引者',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'P2P_TRADING',
      'CREATE_TRADE_OFFERS',
      'ACCEPT_TRADE_OFFERS',
    ],
  },
  {
    name: 'PREMIUM_USER',
    description: 'プレミアムユーザー',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
      'USE_WALLET',
      'DEPOSIT_FUNDS',
      'WITHDRAW_FUNDS',
      'PREMIUM_FEATURES',
      'ADVANCED_ANALYTICS',
      'PRIORITY_SUPPORT',
    ],
  },
  {
    name: 'BASIC_USER',
    description: '一般ユーザー',
    permissions: [
      'READ_POSTS',
      'CREATE_POSTS',
      'EDIT_OWN_POSTS',
      'DELETE_OWN_POSTS',
      'COMMENT_ON_POSTS',
      'LIKE_POSTS',
      'SEND_MESSAGES',
      'READ_MESSAGES',
    ],
  },
] as const;

export async function seedRolesAndPermissions(prisma: PrismaClient): Promise<SeedResult> {
  try {
    console.log('🎯 ロール・権限の初期データを投入開始...');

    // 1. 権限
    console.log('📝 権限を作成中...');
    for (const permission of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: { name: permission.name, description: permission.description },
      });
    }
    console.log(`✅ ${PERMISSIONS.length}個の権限を作成しました`);

    // 2. ロール
    console.log('👥 ロールを作成中...');
    for (const role of ROLES) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: { name: role.name, description: role.description },
      });
    }
    console.log(`✅ ${ROLES.length}個のロールを作成しました`);

    // 3. ロール-権限関係
    console.log('🔗 ロール-権限関係を作成中...');
    for (const role of ROLES) {
      const roleRecord = await prisma.role.findUnique({ where: { name: role.name } });
      if (!roleRecord) continue;

      for (const permissionName of role.permissions) {
        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (!permission) continue;

        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleRecord.id, permissionId: permission.id } },
          update: {},
          create: { roleId: roleRecord.id, permissionId: permission.id },
        });
      }
    }
    console.log('✅ ロール-権限関係を作成しました');

    return {
      success: true,
      count: ROLES.length + PERMISSIONS.length,
      message: 'ロール・権限のシード完了',
    };
  } catch (error) {
    console.error('❌ ロール・権限シードでエラー:', error);
    return { success: false, error: error as Error, message: 'ロール・権限のシードでエラー' };
  }
}
