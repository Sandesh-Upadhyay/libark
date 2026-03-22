/**
 * システム設定シーダー
 * サイト機能設定の作成を担当
 */

import { PrismaClient } from '@prisma/client';

import type { SeedResult, SiteFeatureData } from '../utils/types';

/**
 * サイト機能設定データ
 */
const siteFeatureData: SiteFeatureData[] = [
  // 投稿機能
  {
    featureName: 'POST_CREATE',
    isEnabled: true,
    description: 'PostCreator自体の表示・非表示',
  },
  {
    featureName: 'POST_IMAGE_UPLOAD',
    isEnabled: true,
    description: 'PostCreatorの画像追加ボタンの表示・非表示',
  },
  {
    featureName: 'POST_LIKE',
    isEnabled: true,
    description: 'いいねボタンの動作制御',
  },
  {
    featureName: 'POST_COMMENT',
    isEnabled: true,
    description: 'コメント機能の表示・非表示',
  },
  {
    featureName: 'POST_SHARE',
    isEnabled: true,
    description: '投稿シェア機能の表示・非表示',
  },

  // メッセージ機能
  {
    featureName: 'MESSAGES_ACCESS',
    isEnabled: true,
    description: 'メッセージ画面自体の表示・非表示',
  },
  {
    featureName: 'MESSAGES_SEND',
    isEnabled: true,
    description: 'メッセージ送信フォームの表示・非表示',
  },
  {
    featureName: 'MESSAGES_GROUP',
    isEnabled: true,
    description: 'グループメッセージ機能の表示・非表示',
  },
  {
    featureName: 'MESSAGES_FILE_UPLOAD',
    isEnabled: true,
    description: 'メッセージでのファイル添付機能',
  },

  // ウォレット機能
  {
    featureName: 'WALLET_ACCESS',
    isEnabled: true,
    description: 'ウォレット画面自体の表示・非表示',
  },
  {
    featureName: 'WALLET_DEPOSIT',
    isEnabled: true,
    description: 'ウォレット入金画面の表示・非表示',
  },
  {
    featureName: 'WALLET_WITHDRAW',
    isEnabled: true,
    description: 'ウォレット出金画面の表示・非表示',
  },
  {
    featureName: 'WALLET_P2P',
    isEnabled: true,
    description: 'P2P取引機能の表示・非表示',
  },
  {
    featureName: 'WALLET_HISTORY',
    isEnabled: true,
    description: 'ウォレット取引履歴の表示・非表示',
  },

  // プロフィール機能
  {
    featureName: 'PROFILE_EDIT',
    isEnabled: true,
    description: 'プロフィール編集機能の表示・非表示',
  },
  {
    featureName: 'PROFILE_AVATAR_UPLOAD',
    isEnabled: true,
    description: 'アバター画像アップロード機能',
  },
  {
    featureName: 'PROFILE_FOLLOW',
    isEnabled: true,
    description: 'フォロー機能の表示・非表示',
  },
  {
    featureName: 'PROFILE_VERIFICATION',
    isEnabled: true,
    description: 'プロフィール認証機能',
  },

  // 通知機能
  {
    featureName: 'NOTIFICATIONS_ACCESS',
    isEnabled: true,
    description: '通知画面の表示・非表示',
  },
  {
    featureName: 'NOTIFICATIONS_PUSH',
    isEnabled: true,
    description: 'プッシュ通知機能',
  },
  {
    featureName: 'NOTIFICATIONS_EMAIL',
    isEnabled: true,
    description: 'メール通知機能',
  },

  // 検索機能
  {
    featureName: 'SEARCH_POSTS',
    isEnabled: true,
    description: '投稿検索機能',
  },
  {
    featureName: 'SEARCH_USERS',
    isEnabled: true,
    description: 'ユーザー検索機能',
  },
  {
    featureName: 'SEARCH_ADVANCED',
    isEnabled: true,
    description: '高度な検索機能',
  },

  // コンテンツ販売機能
  {
    featureName: 'CONTENT_SALES',
    isEnabled: true,
    description: 'コンテンツ販売機能',
  },
  {
    featureName: 'CONTENT_SUBSCRIPTION',
    isEnabled: true,
    description: 'サブスクリプション機能',
  },
  {
    featureName: 'CONTENT_TIP',
    isEnabled: true,
    description: 'チップ・投げ銭機能',
  },

  // 管理機能
  {
    featureName: 'ADMIN_PANEL',
    isEnabled: true,
    description: '管理者パネルの表示・非表示',
  },
  {
    featureName: 'ADMIN_USER_MANAGEMENT',
    isEnabled: true,
    description: 'ユーザー管理機能',
  },
  {
    featureName: 'ADMIN_CONTENT_MODERATION',
    isEnabled: true,
    description: 'コンテンツモデレーション機能',
  },
  {
    featureName: 'ADMIN_ANALYTICS',
    isEnabled: true,
    description: 'アナリティクス機能',
  },

  // セキュリティ機能
  {
    featureName: 'SECURITY_2FA',
    isEnabled: true,
    description: '二要素認証機能',
  },
  {
    featureName: 'SECURITY_LOGIN_HISTORY',
    isEnabled: true,
    description: 'ログイン履歴機能',
  },
  {
    featureName: 'SECURITY_DEVICE_MANAGEMENT',
    isEnabled: true,
    description: 'デバイス管理機能',
  },

  // API機能
  {
    featureName: 'API_ACCESS',
    isEnabled: true,
    description: 'API アクセス機能',
  },
  {
    featureName: 'API_RATE_LIMITING',
    isEnabled: true,
    description: 'API レート制限機能',
  },
];

/**
 * サイト機能設定を作成
 */
export async function createSiteFeatureSettings(prisma: PrismaClient): Promise<any[]> {
  console.log('サイト機能設定を作成しています...');

  // 管理者ユーザーを取得（設定の更新者として使用）
  const adminUser = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (!adminUser) {
    throw new Error('管理者ユーザーが見つかりません');
  }

  const siteFeatures: unknown[] = [];

  for (const data of siteFeatureData) {
    const siteFeature = await prisma.siteFeatureSetting.upsert({
      where: { featureName: data.featureName },
      update: {
        description: data.description,
        updatedBy: adminUser.id,
      },
      create: {
        ...data,
        updatedBy: adminUser.id,
      },
    });
    siteFeatures.push(siteFeature);
  }

  console.log(`${siteFeatures.length} 個のサイト機能設定を作成しました`);
  return siteFeatures;
}

/**
 * システム設定関連のシード実行
 */
export async function seedSystem(prisma: PrismaClient): Promise<SeedResult> {
  try {
    // サイト機能設定を作成
    const siteFeatures = await createSiteFeatureSettings(prisma);

    return {
      success: true,
      data: siteFeatures,
      count: siteFeatures.length,
      message: 'システム設定関連のシードが正常に完了しました',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('不明なエラー'),
      message: 'システム設定関連のシードでエラーが発生しました',
    };
  }
}
