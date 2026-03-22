/**
 * 💰 投稿購入リゾルバー統合
 *
 * 投稿購入関連リゾルバーを統合してエクスポート
 */

import { postPurchaseFields } from './fields.js';

export const purchaseResolvers = {
  PostPurchase: postPurchaseFields,
};

// 個別エクスポート（必要に応じて）
export { postPurchaseFields };
