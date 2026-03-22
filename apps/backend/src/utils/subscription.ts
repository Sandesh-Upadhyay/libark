/**
 * 📡 サブスクリプション共通ユーティリティ
 *
 * GraphQLサブスクリプションの共通パターンを統一化
 */

import type { GraphQLContext } from '../graphql/context.js';

/**
 * 基本的なサブスクリプションを作成する
 */
export function createSubscription(channel: string, resolverKey = 'post') {
  return {
    subscribe: async (_: unknown, _args: Record<string, unknown>, context: GraphQLContext) => {
      if (!context.redisPubSub) {
        throw new Error('Redis PubSub not available');
      }

      context.fastify.log.info(`📡 [GraphQL] サブスクリプション開始: ${channel}`);
      return context.redisPubSub.asyncIterator([channel]);
    },
    resolve: (payload: unknown, _args: unknown, context: GraphQLContext) => {
      context.fastify.log.info({
        hasPayload: !!payload,
        payloadType: typeof payload,
        channel,
      }, `📨 [GraphQL] サブスクリプション受信:`);

      // 特定タイプのメッセージのみ処理
      const payloadObj = payload as {
        type?: string;
        id?: string;
        content?: unknown;
        [key: string]: unknown;
      };
      if (payloadObj && payloadObj.type && payloadObj[resolverKey]) {
        return payloadObj[resolverKey];
      }

      // 直接オブジェクトが送信された場合
      if (payloadObj && payloadObj.id && payloadObj.content !== undefined) {
        return payloadObj;
      }

      return null;
    },
  };
}

/**
 * 特定のIDに基づくサブスクリプションを作成する
 */
export function createIdBasedSubscription(channelPrefix: string, resolverKey = 'post') {
  return {
    subscribe: async (_: unknown, args: { postId: string }, context: GraphQLContext) => {
      if (!context.redisPubSub) {
        throw new Error('Redis PubSub not available');
      }

      const channel = `${channelPrefix}:${args.postId}`;
      context.fastify.log.info(`📡 [GraphQL] ID基準サブスクリプション開始: ${channel}`);
      return context.redisPubSub.asyncIterator([channel]);
    },
    resolve: (payload: unknown, _args: unknown, context: GraphQLContext) => {
      context.fastify.log.info({
        hasPayload: !!payload,
        payloadType: typeof payload,
      }, `📨 [GraphQL] ID基準サブスクリプション受信:`);

      // 特定タイプのメッセージのみ処理
      const payloadObj2 = payload as {
        type?: string;
        id?: string;
        content?: unknown;
        [key: string]: unknown;
      };
      if (payloadObj2 && payloadObj2.type && payloadObj2[resolverKey]) {
        return payloadObj2[resolverKey];
      }

      // 直接オブジェクトが送信された場合
      if (payloadObj2 && payloadObj2.id && payloadObj2.content !== undefined) {
        return payloadObj2;
      }

      return null;
    },
  };
}

/**
 * 投稿追加サブスクリプション
 */
export const postAddedSubscription = createSubscription('post_added', 'post');

/**
 * 投稿更新サブスクリプション
 */
export const postUpdatedSubscription = createIdBasedSubscription('post_updated', 'post');

/**
 * 投稿処理完了サブスクリプション
 */
export const postProcessingCompletedSubscription = createIdBasedSubscription(
  'post_processing_completed',
  'post'
);

/**
 * 全投稿処理完了サブスクリプション
 */
export const allPostsProcessingUpdatedSubscription = createSubscription(
  'all_posts_processing_updated',
  'post'
);
