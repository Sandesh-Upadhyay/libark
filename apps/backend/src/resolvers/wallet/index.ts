import { walletQueries } from './query.js';
import { walletMutations } from './mutation.js';
import { walletPermissionMutations } from './permission.js';
import { walletSubscriptions } from './subscription.js';

export const walletResolvers = {
  Query: {
    ...walletQueries,
  },
  Mutation: {
    ...walletMutations,
    ...walletPermissionMutations,
  },
  Subscription: {
    ...walletSubscriptions,
  },
};
