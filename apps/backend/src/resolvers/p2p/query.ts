export const p2pQueries = {
  // P2P取引リクエストを取得（単一）
  p2pTradeRequest: async (
    _: unknown,
    args: { tradeId: string },
    ctx: {
      user?: { id: string };
      prisma: {
        p2PTradeRequest: {
          findUnique: (arg: {
            where: { id: string };
          }) => Promise<{ buyerId: string; sellerId: string } | null>;
        };
      };
    }
  ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const trade = await ctx.prisma.p2PTradeRequest.findUnique({ where: { id: args.tradeId } });
    if (!trade) throw new Error('取引が見つかりません');
    if (trade.buyerId !== userId && trade.sellerId !== userId)
      throw new Error('認証されていません');

    return trade;
  },

  // 自分のP2P取引リクエスト一覧を取得
  myP2PTradeRequests: async (
    _: unknown,
    args: { status?: string; first?: number; after?: string },
    ctx: {
      user?: { id: string };
      prisma: { p2PTradeRequest: { findMany: (arg: any) => Promise<unknown[]> } };
    }
  ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const { status, first = 20, after } = args;
    const where: Record<string, unknown> = { OR: [{ buyerId: userId }, { sellerId: userId }] };
    if (status) where.status = status;

    return ctx.prisma.p2PTradeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: first || 20,
      skip: after ? 1 : 0,
      cursor: after ? { id: after } : undefined,
    });
  },

  // 利用可能なP2Pオファー一覧を取得（Relay方式対応）
  availableP2POffers: async (
    _: unknown,
    args: {
      fiatCurrency?: string;
      paymentMethod?: string;
      amountUsd?: number;
      first?: number;
      after?: string;
      orderBy?: { field?: string; order?: string };
    },
    ctx: {
      prisma: {
        p2POffer: {
          findMany: (arg: any) => Promise<unknown[]>;
          count: (arg: any) => Promise<number>;
        };
      };
    }
  ) => {
    const { fiatCurrency, paymentMethod, amountUsd, first = 20, after, orderBy } = args;
    const where: Record<string, unknown> = { isActive: true };

    if (fiatCurrency) where.fiatCurrency = fiatCurrency;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (amountUsd) {
      where.minAmountUsd = { lte: amountUsd };
      where.maxAmountUsd = { gte: amountUsd };
    }

    const prismaOrderBy: Record<string, string | unknown>[] = [];
    const order = orderBy?.order?.toLowerCase() || 'asc';

    if (orderBy) {
      switch (orderBy.field) {
        case 'RATE':
          prismaOrderBy.push({ exchangeRateMargin: order });
          break;
        case 'MIN_AMOUNT':
          prismaOrderBy.push({ minAmountUsd: order });
          break;
        case 'MAX_AMOUNT':
          prismaOrderBy.push({ maxAmountUsd: order });
          break;
        case 'CREATED_AT':
          prismaOrderBy.push({ createdAt: order });
          break;
      }
    } else {
      prismaOrderBy.push({ priority: 'desc' }, { createdAt: 'desc' });
    }
    prismaOrderBy.push({ id: 'desc' });

    const offers = (await ctx.prisma.p2POffer.findMany({
      where,
      take: first + 1,
      cursor: after ? { id: after } : undefined,
      skip: after ? 1 : 0,
      orderBy: prismaOrderBy,
      include: { seller: true },
    })) as Array<{ id: string; [key: string]: unknown }>;

    const hasNextPage = offers.length > first;
    if (hasNextPage) offers.pop();

    const totalCount = await ctx.prisma.p2POffer.count({ where });

    return {
      edges: offers.map((offer: { id: string }) => ({ cursor: offer.id, node: offer })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: offers.length > 0 ? offers[0].id : null,
        endCursor: offers.length > 0 ? offers[offers.length - 1].id : null,
      },
      totalCount,
    };
  },

  // 自分のP2Pオファー一覧を取得
  myP2POffers: async (
    _: unknown,
    args: { fiatCurrency?: string; paymentMethod?: string; isActive?: boolean },
    ctx: {
      user?: { id: string };
      prisma: { p2POffer: { findMany: (arg: any) => Promise<unknown[]> } };
    }
  ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const where: Record<string, unknown> = { sellerId: userId };
    if (args.fiatCurrency) where.fiatCurrency = args.fiatCurrency;
    if (args.paymentMethod) where.paymentMethod = args.paymentMethod;
    if (args.isActive !== undefined) where.isActive = args.isActive;

    return ctx.prisma.p2POffer.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  },
};
