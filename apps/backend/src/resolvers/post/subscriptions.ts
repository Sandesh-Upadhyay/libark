/**
 * 📡 投稿サブスクリプションリゾルバー
 *
 * 投稿関連のリアルタイム通知GraphQLサブスクリプションリゾルバー
 */

import {
  postAddedSubscription,
  postUpdatedSubscription,
  postProcessingCompletedSubscription,
  allPostsProcessingUpdatedSubscription,
} from '../../utils/subscription.js';

export const postSubscriptions = {
  /**
   * 新しい投稿追加サブスクリプション
   */
  postAdded: postAddedSubscription,

  /**
   * 投稿更新サブスクリプション
   */
  postUpdated: postUpdatedSubscription,

  /**
   * 投稿処理完了サブスクリプション
   */
  postProcessingCompleted: postProcessingCompletedSubscription,

  /**
   * 全投稿処理完了サブスクリプション
   */
  allPostsProcessingUpdated: allPostsProcessingUpdatedSubscription,
};
