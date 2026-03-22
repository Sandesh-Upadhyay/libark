import { p2pQueries } from './query.js';
import { p2pMutations } from './mutation.js';
import { p2pSubscriptions } from './subscription.js';

// P2POfferリゾルバー
const p2pOfferResolvers = {
  P2POffer: {
    seller: async (parent: any, _args: any, ctx: any) => {
      return ctx.prisma.user.findUnique({ where: { id: parent.sellerId } });
    },
  },
};

// P2PTradeRequestリゾルバー
const p2pTradeRequestResolvers = {
  P2PTradeRequest: {
    buyer: async (parent: any, _args: any, ctx: any) => {
      return ctx.prisma.user.findUnique({ where: { id: parent.buyerId } });
    },
    seller: async (parent: any, _args: any, ctx: any) => {
      if (!parent.sellerId) return null;
      return ctx.prisma.user.findUnique({ where: { id: parent.sellerId } });
    },
    offer: async (parent: any, _args: any, ctx: any) => {
      if (!parent.offerId) return null;
      return ctx.prisma.p2POffer.findUnique({ where: { id: parent.offerId } });
    },
  },
};

export const p2pResolvers = {
  ...p2pOfferResolvers,
  ...p2pTradeRequestResolvers,
  Query: {
    ...p2pQueries,
  },
  Mutation: {
    ...p2pMutations,
  },
  Subscription: {
    ...p2pSubscriptions,
  },
};
