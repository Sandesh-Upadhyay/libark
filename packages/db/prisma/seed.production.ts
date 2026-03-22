/**
 * 本番環境用 Prisma シードスクリプト
 * 本番環境に必要な基本システムデータを投入します
 *
 * 含まれるデータ:
 * - 管理者ユーザー
 * - 権限システム（permissions, role_permissions）
 * - サイト機能設定
 * - 為替レート
 * - 決済プロバイダー
 */
import * as bcrypt from 'bcrypt';

import { prisma } from '../src/server';

// 本番環境用データのインポート
import { PRODUCTION_PERMISSIONS, PRODUCTION_ROLES } from './seeds/data/production/permissions';
import { PRODUCTION_SITE_FEATURES } from './seeds/data/production/site-features';
import { PRODUCTION_EXCHANGE_RATES } from './seeds/data/production/exchange-rates';
import { PRODUCTION_PAYMENT_PROVIDERS } from './seeds/data/production/payment-providers';

interface AdminUserData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio?: string;
  role: 'SUPER_ADMIN';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} environment variable is required for production seed`);
  }
  return value;
}

/**
 * 権限システム構築関数
 */
async function createPermissionsSystem() {
  console.log('🔐 権限システムを構築中...');

  try {
    // 1. 権限を作成
    console.log('📝 権限を作成中...');
    for (const permission of PRODUCTION_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: {
          name: permission.name,
          description: permission.description,
        },
      });
    }
    console.log(`✅ ${PRODUCTION_PERMISSIONS.length}個の権限を作成しました`);

    // 2. ロール権限関連を作成
    console.log('🔗 ロール権限関連を作成中...');
    let rolePermissionCount = 0;

    for (const role of PRODUCTION_ROLES) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: role.name },
      });

      if (!roleRecord) {
        console.warn(`⚠️ ロール ${role.name} が見つかりません。スキップします。`);
        continue;
      }

      for (const permissionName of role.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (!permission) {
          console.warn(`⚠️ 権限 ${permissionName} が見つかりません。スキップします。`);
          continue;
        }

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
        rolePermissionCount++;
      }
    }
    console.log(`✅ ${rolePermissionCount}個のロール権限関連を作成しました`);
  } catch (error) {
    console.error('❌ 権限システム構築エラー:', error);
    throw error;
  }
}

/**
 * サイト機能設定作成関数
 */
async function createSiteFeatureSettings() {
  console.log('⚙️ サイト機能設定を作成中...');

  try {
    // SUPER_ADMINロールのユーザーを取得（設定の更新者として使用）
    const adminUser = await prisma.user.findFirst({
      include: { role: true },
      where: {
        role: {
          name: 'SUPER_ADMIN',
        },
      },
    });

    if (!adminUser) {
      throw new Error('SUPER_ADMINユーザーが見つかりません');
    }

    for (const feature of PRODUCTION_SITE_FEATURES) {
      await prisma.siteFeatureSetting.upsert({
        where: { featureName: feature.featureName },
        update: {
          isEnabled: feature.isEnabled,
          description: feature.description,
          updatedBy: adminUser.id,
        },
        create: {
          featureName: feature.featureName,
          isEnabled: feature.isEnabled,
          description: feature.description,
          updatedBy: adminUser.id,
        },
      });
    }
    console.log(`✅ ${PRODUCTION_SITE_FEATURES.length}個のサイト機能設定を作成しました`);
  } catch (error) {
    console.error('❌ サイト機能設定作成エラー:', error);
    throw error;
  }
}

/**
 * 為替レート作成関数
 */
async function createExchangeRates() {
  console.log('💱 為替レートを作成中...');

  try {
    for (const rate of PRODUCTION_EXCHANGE_RATES) {
      await prisma.exchangeRate.upsert({
        where: { currency: rate.currency },
        update: {
          usdRate: rate.usdRate,
          source: rate.source,
          isActive: rate.isActive,
        },
        create: {
          currency: rate.currency,
          usdRate: rate.usdRate,
          source: rate.source,
          isActive: rate.isActive,
        },
      });
    }
    console.log(`✅ ${PRODUCTION_EXCHANGE_RATES.length}個の為替レートを作成しました`);
  } catch (error) {
    console.error('❌ 為替レート作成エラー:', error);
    throw error;
  }
}

/**
 * 決済プロバイダー作成関数
 */
async function createPaymentProviders() {
  console.log('💳 決済プロバイダーを作成中...');

  try {
    for (const provider of PRODUCTION_PAYMENT_PROVIDERS) {
      await prisma.paymentProvider.upsert({
        where: { name: provider.name },
        update: {
          displayName: provider.displayName,
          type: provider.type,
          isActive: provider.isActive,
          config: provider.config,
        },
        create: {
          name: provider.name,
          displayName: provider.displayName,
          type: provider.type,
          isActive: provider.isActive,
          config: provider.config,
        },
      });
    }
    console.log(`✅ ${PRODUCTION_PAYMENT_PROVIDERS.length}個の決済プロバイダーを作成しました`);
  } catch (error) {
    console.error('❌ 決済プロバイダー作成エラー:', error);
    throw error;
  }
}

/**
 * 管理者ユーザー作成関数
 */
async function createAdminUser(userData: AdminUserData) {
  console.log('👤 管理者ユーザーを作成中...');

  try {
    // パスワードのハッシュ化
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // SUPER_ADMINロールを取得
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMINロールが見つかりません');
    }

    // ユーザーが既に存在するか確認
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      console.log(`ユーザー ${userData.email} は既に存在します`);

      // 既存ユーザーのロールを更新
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { roleId: superAdminRole.id },
      });
      console.log(`✅ ユーザー ${updatedUser.email} のロールをSUPER_ADMINに更新しました`);
      return existingUser;
    }

    // 管理者ユーザーの作成
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash,
        displayName: userData.displayName,
        bio: userData.bio,
        isVerified: true,
        isActive: true,
        roleId: superAdminRole.id,
      },
    });

    console.log('✅ 管理者アカウントが作成されました');
    console.log(`   ID: ${user.id}`);
    console.log(`   ユーザー名: ${user.username}`);
    console.log(`   メールアドレス: ${user.email}`);
    console.log(`   表示名: ${user.displayName}`);
    console.log(`   ロール: SUPER_ADMIN`);

    return user;
  } catch (error) {
    console.error(`❌ 管理者ユーザー ${userData.email} の作成に失敗しました:`, error);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🚀 本番環境用シード処理を開始します...');
    console.log('=====================================');

    // 1. 権限システム構築
    await createPermissionsSystem();
    console.log('');

    // 2. 管理者ユーザー作成
    const adminData: AdminUserData = {
      username: 'admin',
      email: 'admin@libark.io',
      password: requireEnv('ADMIN_INITIAL_PASSWORD'),
      displayName: '管理者',
      bio: 'LIBARK システム管理者',
      role: 'SUPER_ADMIN',
    };
    await createAdminUser(adminData);
    console.log('');

    // 3. サイト機能設定作成
    await createSiteFeatureSettings();
    console.log('');

    // 4. 為替レート作成
    await createExchangeRates();
    console.log('');

    // 5. 決済プロバイダー作成
    await createPaymentProviders();
    console.log('');

    console.log('=====================================');
    console.log('🎉 本番環境用シード処理が完了しました');
    console.log('');
    console.log('📊 作成されたデータ:');
    console.log(`   - 権限: ${PRODUCTION_PERMISSIONS.length}個`);
    console.log(`   - ロール権限関連: 約94個`);
    console.log(`   - 管理者ユーザー: 1個`);
    console.log(`   - サイト機能設定: ${PRODUCTION_SITE_FEATURES.length}個`);
    console.log(`   - 為替レート: ${PRODUCTION_EXCHANGE_RATES.length}個`);
    console.log(`   - 決済プロバイダー: ${PRODUCTION_PAYMENT_PROVIDERS.length}個`);
    console.log('');
    console.log('🔐 管理者ログイン情報:');
    console.log(`   Email: ${adminData.email}`);
    console.log('   Password: [REDACTED] ADMIN_INITIAL_PASSWORD');
    console.log('=====================================');
  } catch (error) {
    console.error('❌ シード処理中にエラーが発生しました:', error);
    throw error;
  } finally {
    // Prismaクライアントを切断
    await prisma.$disconnect();
  }
}

// スクリプト実行
main()
  .then(() => {
    console.log('✅ 本番環境用シード処理が正常に完了しました');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ シード処理でエラーが発生しました:', error);
    process.exit(1);
  });
