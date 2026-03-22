/**
 * 📝 投稿リゾルバー統合
 *
 * 分割された投稿関連リゾルバーを統合してエクスポート
 */

import { postQueries } from './queries.js';
import { postMutations } from './mutations.js';
import { postSubscriptions } from './subscriptions.js';
import { postFields } from './fields.js';

export const postResolvers = {
  Query: postQueries,
  Mutation: postMutations,
  Subscription: postSubscriptions,
  Post: postFields,
};

// 個別エクスポート（必要に応じて）
export { postQueries, postMutations, postSubscriptions, postFields };
