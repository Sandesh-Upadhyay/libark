/**
 * 🧪 テストデータ管理ヘルパー
 */

import { PrismaClient } from '@libark/db';
import { hashPassword } from '@libark/core-server/security/password';

/**
 * テスト用ユーザー作成
 */
export async function createTestUser(
  prisma: PrismaClient,
  userData: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }
) {
  const hashedPassword = await hashPassword(userData.password);

  return await prisma.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      passwordHash: hashedPassword,
      displayName: userData.displayName || userData.username,
      isActive: userData.isActive ?? true,
      isVerified: userData.isVerified ?? true,
    },
  });
}

/**
 * テスト用権限作成
 */
export async function createTestPermission(
  prisma: PrismaClient,
  permissionData: {
    name: string;
    description: string;
  }
) {
  return await prisma.permission.create({
    data: permissionData,
  });
}

/**
 * ユーザーに権限を付与
 */
export async function grantPermissionToUser(
  prisma: PrismaClient,
  userId: string,
  permissionId: string
) {
  return await prisma.userPermissionOverride.create({
    data: {
      userId,
      permissionId,
      allowed: true,
      isActive: true,
    },
  });
}

/**
 * テストデータクリーンアップ
 */
export async function cleanupTestData(prisma: PrismaClient) {
  try {
    // 外部キー制約を考慮した順序でデータを削除

    // 1. ユーザー機能権限を削除（UserFeaturePermissionテーブル）
    try {
      await prisma.userFeaturePermission.deleteMany();
    } catch {
      console.log('⚠️ userFeaturePermissionテーブルが存在しないか、削除に失敗しました');
    }

    // 2. サイト機能設定を削除（SiteFeatureSettingテーブル）
    try {
      await prisma.siteFeatureSetting.deleteMany();
    } catch {
      console.log('⚠️ siteFeatureSettingテーブルが存在しないか、削除に失敗しました');
    }

    // 3. ユーザー権限を削除
    try {
      await prisma.userPermissionOverride.deleteMany();
    } catch {
      console.log('⚠️ userPermissionテーブルが存在しないか、削除に失敗しました');
    }

    // 4. 権限を削除
    try {
      await prisma.permission.deleteMany();
    } catch {
      console.log('⚠️ permissionテーブルが存在しないか、削除に失敗しました');
    }

    // 5. 投稿関連テーブルを削除
    try {
      await prisma.post.deleteMany();
    } catch {
      console.log('⚠️ postsテーブルが存在しないか、削除に失敗しました');
    }

    // 6. メディアテーブルを削除
    try {
      await prisma.media.deleteMany();
    } catch {
      console.log('⚠️ mediaテーブルが存在しないか、削除に失敗しました');
    }

    // 7. メッセージテーブルを削除
    try {
      await prisma.message.deleteMany();
    } catch {
      console.log('⚠️ messagesテーブルが存在しないか、削除に失敗しました');
    }

    // 8. 会話テーブルを削除
    try {
      await prisma.conversation.deleteMany();
    } catch {
      console.log('⚠️ conversationsテーブルが存在しないか、削除に失敗しました');
    }

    // 9. 決済関連テーブルを削除
    try {
      await prisma.nOWPaymentsPayment.deleteMany();
    } catch {
      console.log('⚠️ NOWPaymentsPaymentテーブルが存在しないか、削除に失敗しました');
    }

    try {
      await prisma.paymentRequest.deleteMany();
    } catch {
      console.log('⚠️ PaymentRequestテーブルが存在しないか、削除に失敗しました');
    }

    // 10. ウォレット関連テーブルを削除
    try {
      await prisma.walletTransaction.deleteMany();
    } catch {
      console.log('⚠️ WalletTransactionテーブルが存在しないか、削除に失敗しました');
    }

    try {
      await prisma.userWallet.deleteMany();
    } catch {
      console.log('⚠️ UserWalletテーブルが存在しないか、削除に失敗しました');
    }

    try {
      await prisma.wallet.deleteMany();
    } catch {
      console.log('⚠️ Walletテーブルが存在しないか、削除に失敗しました');
    }

    try {
      await prisma.withdrawalRequest.deleteMany();
    } catch {
      console.log('⚠️ WithdrawalRequestテーブルが存在しないか、削除に失敗しました');
    }

    // 11. ユーザー設定を削除
    try {
      await prisma.userSettings.deleteMany();
    } catch {
      console.log('⚠️ UserSettingsテーブルが存在しないか、削除に失敗しました');
    }

    // 12. 最後にユーザーテーブルを削除
    await prisma.user.deleteMany();

    console.log('✅ テストデータクリーンアップ完了');
  } catch (error) {
    console.error('❌ テストデータクリーンアップエラー:', error);
    // エラーが発生してもテストを続行
  }
}

/**
 * テスト用管理者ユーザー作成
 */
export async function createTestAdminUser(
  prisma: PrismaClient,
  userData: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }
) {
  // ユーザー作成
  const user = await createTestUser(prisma, userData);

  // 管理者権限作成
  const adminPermission = await createTestPermission(prisma, {
    name: 'ADMIN',
    description: 'Administrator permission',
  });

  // 権限付与
  await grantPermissionToUser(prisma, user.id, adminPermission.id);

  return { user, adminPermission };
}

/**
 * 複数のテストユーザー作成
 */
export async function createMultipleTestUsers(
  prisma: PrismaClient,
  count: number,
  baseData: {
    emailPrefix: string;
    usernamePrefix: string;
    password: string;
  }
) {
  const users = [];

  for (let i = 1; i <= count; i++) {
    const user = await createTestUser(prisma, {
      email: `${baseData.emailPrefix}${i}@test.com`,
      username: `${baseData.usernamePrefix}${i}`,
      password: baseData.password,
      displayName: `Test User ${i}`,
    });
    users.push(user);
  }

  return users;
}
