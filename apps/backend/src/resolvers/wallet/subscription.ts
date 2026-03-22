import { GraphQLError } from 'graphql';

import { GraphQLContext, requireAuthentication } from '../../graphql/context.js';

export const walletSubscriptions = {
  walletBalanceUpdated: {
    subscribe: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      if (!context.redisPubSub) throw new GraphQLError('Redis PubSub not available');
      await requireAuthentication(context, userId);
      return context.redisPubSub.asyncIterator([`wallet_balance_updated:${userId}`]);
    },
  },
  walletTransactionAdded: {
    subscribe: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      if (!context.redisPubSub) throw new GraphQLError('Redis PubSub not available');
      await requireAuthentication(context, userId);
      return context.redisPubSub.asyncIterator([`wallet_transaction_added:${userId}`]);
    },
  },
  depositRequestUpdated: {
    subscribe: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      if (!context.redisPubSub) throw new GraphQLError('Redis PubSub not available');
      await requireAuthentication(context, userId);
      return context.redisPubSub.asyncIterator([`deposit_request_updated:${userId}`]);
    },
  },
  withdrawalRequestUpdated: {
    subscribe: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      if (!context.redisPubSub) throw new GraphQLError('Redis PubSub not available');
      await requireAuthentication(context, userId);
      return context.redisPubSub.asyncIterator([`withdrawal_request_updated:${userId}`]);
    },
  },
};
