/**
 * 本番環境用サイト機能設定データ
 * システムの基本機能の有効/無効設定
 */

export interface SiteFeatureData {
  featureName: string;
  isEnabled: boolean;
  description: string;
}

/**
 * 本番環境用サイト機能設定
 */
export const PRODUCTION_SITE_FEATURES: SiteFeatureData[] = [
  {
    featureName: 'POST_CREATE',
    isEnabled: true,
    description: '投稿作成機能 - ユーザーが新しい投稿を作成できる機能',
  },
  {
    featureName: 'POST_IMAGE_UPLOAD',
    isEnabled: true,
    description: '画像アップロード機能 - 投稿に画像を添付できる機能',
  },
  {
    featureName: 'POST_LIKE',
    isEnabled: true,
    description: 'いいね機能 - 投稿にいいねを付けられる機能',
  },
  {
    featureName: 'MESSAGES_ACCESS',
    isEnabled: true,
    description: 'メッセージ機能 - ユーザー間でメッセージを送受信できる機能',
  },
  {
    featureName: 'MESSAGES_SEND',
    isEnabled: true,
    description: 'メッセージ送信機能 - メッセージを送信できる機能',
  },
  {
    featureName: 'WALLET_ACCESS',
    isEnabled: true,
    description: 'ウォレット機能 - 暗号通貨ウォレットにアクセスできる機能',
  },
  {
    featureName: 'WALLET_DEPOSIT',
    isEnabled: true,
    description: 'ウォレット入金機能 - ウォレットに資金を入金できる機能',
  },
  {
    featureName: 'WALLET_WITHDRAW',
    isEnabled: true,
    description: 'ウォレット出金機能 - ウォレットから資金を出金できる機能',
  },
];
