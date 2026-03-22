import { GraphQLError } from 'graphql';

import { GraphQLContext, requireAuthentication } from '../../graphql/context.js';

export const p2pSubscriptions = {
  /**
   * P2P取引の更新を購読
   */
  p2pTradeUpdated: {
    subscribe: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      if (!context.redisPubSub) {
        throw new GraphQLError('Redis PubSub not available');
      }
      await requireAuthentication(context, userId);
      return context.redisPubSub.asyncIterator([`p2p_trade_updated:${userId}`]);
    },
  },

  /**
   * P2P紛争の更新を購読
   */
  p2pDisputeUpdated: {
    subscribe: async (
      _parent: unknown,
      { tradeId }: { tradeId: string },
      context: GraphQLContext
    ) => {
      if (!context.redisPubSub) {
        throw new GraphQLError('Redis PubSub not available');
      }
      if (!context.user?.id) {
        throw new GraphQLError('認証が必要です');
      }
      return context.redisPubSub.asyncIterator([`p2p_dispute_updated:${tradeId}`]);
    },
  },
};
