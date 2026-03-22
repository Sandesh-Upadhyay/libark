/**
 * 🎯 GraphQLリゾルバー統合
 *
 * 既存tRPCロジックをGraphQLリゾルバーに移植
 */

import { DateTimeResolver, UUIDResolver, JSONResolver } from 'graphql-scalars';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import { userResolvers } from './user.js';
import { postResolvers } from './post/index.js'; // 🔄 分割されたpostリゾルバーを使用
import { authResolvers } from './auth.js';
import { commentResolvers } from './comment.js';
import { likeResolvers } from './like.js';
import { notificationResolvers } from './notification.js';
import { mediaResolvers } from './media/index.js'; // 🔄 分割されたmediaリゾルバーを使用
import { purchaseResolvers } from './purchase/index.js'; // 🔄 新しいpurchaseリゾルバーを追加
import { mediaV2Resolvers } from './media-v2.js';
import { adminResolvers } from './admin.js';
import { walletResolvers } from './wallet/index.js'; // 🔄 分割されたwalletリゾルバーを使用
import { followResolvers } from './follow.js';
import { messageResolvers } from './message.js';
import { siteFeaturesResolvers } from './site-features.js';
import { cacheResolvers } from './cache.js';
import { twoFactorResolvers } from './twoFactor.js';
import { twoFactorLoginResolvers } from './twoFactorLogin.js';
import { timelineResolvers } from './timeline.js';
import { p2pResolvers } from './p2p/index.js'; // 🔄 分割されたp2pリゾルバーを使用
import { disputeResolvers } from './dispute.js';

// 型定義をエクスポート
export type * from '../types/resolvers.js';
// 🚫 FileUpload型は削除されました（プリサインドS3システムに移行済み）

export const resolvers: any = {
  // 型エクスポートに依存する名前付き型のエラー回避（GraphQLツールチェーン仕様上）

  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...postResolvers.Query,
    ...commentResolvers.Query,
    ...notificationResolvers.Query,
    // 🚫 mediaResolvers.Query は削除されました（プリサインドS3システムに移行済み）
    ...mediaV2Resolvers.Query,
    ...adminResolvers.Query,
    ...walletResolvers.Query,
    ...followResolvers.Query,
    ...messageResolvers.Query,
    ...siteFeaturesResolvers.Query,
    ...cacheResolvers.Query,
    ...twoFactorResolvers.Query,
    ...timelineResolvers.Query,
    ...p2pResolvers.Query,
    ...disputeResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...likeResolvers.Mutation,
    ...notificationResolvers.Mutation,
    // 🚫 mediaResolvers.Mutation は削除されました（プリサインドS3システムに移行済み）
    ...mediaV2Resolvers.Mutation,
    ...adminResolvers.Mutation,
    ...walletResolvers.Mutation,
    ...followResolvers.Mutation,
    ...messageResolvers.Mutation,
    ...siteFeaturesResolvers.Mutation,
    ...cacheResolvers.Mutation,
    ...twoFactorResolvers.Mutation,
    ...twoFactorLoginResolvers.Mutation,
    ...p2pResolvers.Mutation,
    ...disputeResolvers.Mutation,
  },

  Subscription: {
    ...notificationResolvers.Subscription,
    ...postResolvers.Subscription,
    ...commentResolvers.Subscription,
    ...likeResolvers.Subscription,
    ...mediaV2Resolvers.Subscription,
    ...walletResolvers.Subscription,
    ...messageResolvers.Subscription,
    ...p2pResolvers.Subscription,
    ...disputeResolvers.Subscription,
  },

  // 型リゾルバー
  User: userResolvers.User,
  Role: {
    // Role型は基本的なフィールドのみなので、デフォルトリゾルバーで十分
    // 必要に応じて後でカスタムリゾルバーを追加可能
  },
  Post: postResolvers.Post,
  PostPurchase: purchaseResolvers.PostPurchase, // 🔄 分割されたpurchaseリゾルバーを使用
  Comment: commentResolvers.Comment,
  Media: mediaResolvers.Media,
  MediaVariant: mediaResolvers.MediaVariant,
  Notification: notificationResolvers.Notification,
  Conversation: messageResolvers.Conversation,
  ConversationParticipant: messageResolvers.ConversationParticipant,
  Message: messageResolvers.Message,

  // カスタムスカラー
  DateTime: DateTimeResolver,
  UUID: UUIDResolver,
  Upload: GraphQLUpload,
  JSON: JSONResolver,
};
