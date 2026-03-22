/**
 * 📷 メディアリゾルバー統合
 *
 * 分割されたメディア関連リゾルバーを統合してエクスポート
 */

import { mediaFields } from './mediaFields.js';
import { mediaVariantFields } from './mediaVariantFields.js';

export const mediaResolvers = {
  Media: mediaFields,
  MediaVariant: mediaVariantFields,
};

// 個別エクスポート（必要に応じて）
export { mediaFields, mediaVariantFields };
