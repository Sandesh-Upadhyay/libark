import { P2PTradeService } from '../../services/P2PTradeService.js';

export const p2pMutations = {
  // P2P取引リクエストを作成（買い手用）
  createP2PTradeRequest: async (_: unknown, args: { input: { offerId: string; amountUsd: number } }, ctx: { user?: { id: string }; prisma: { p2POffer: { findUnique: (arg: { where: { id: string } }) => Promise<{ sellerId: string; minAmountUsd: number; maxAmountUsd: number; isActive: boolean; fiatCurrency: string; paymentMethod: string } | null> } }; authService: { hasPermission: (userId: string, permission: string) => Promise<boolean> } } ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const { input } = args;
    const { offerId, amountUsd } = input;

    const offer = await ctx.prisma.p2POffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new Error('オファーが見つかりません');
    if (!offer.isActive) throw new Error('オファーは非アクティブです');
    if (amountUsd < offer.minAmountUsd || amountUsd > offer.maxAmountUsd) throw new Error('金額が範囲外です');

    const tradeService = new P2PTradeService(ctx.prisma as any);
    return tradeService.createTradeRequest(userId, Number(amountUsd), offer.fiatCurrency, offer.paymentMethod, offerId);
  },

  // P2Pオファーを作成（売り手用）
  createP2POffer: async (_: unknown, args: { input: { paymentMethod: string; minAmountUsd: number; maxAmountUsd: number; fiatCurrency: string; exchangeRateMargin: number; instructions?: string; priority?: number } }, ctx: { user?: { id: string }; prisma: { p2POffer: { create: (arg: { data: Record<string, unknown> }) => Promise<unknown> } }; authService: { hasPermission: (userId: string, permission: string) => Promise<boolean> } } ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const hasPermission = await ctx.authService.hasPermission(userId, 'P2P_TRADER');
    if (!hasPermission) throw new Error('P2P_TRADER権限が必要です');

    const { input } = args;
    if (input.minAmountUsd <= 0 || input.maxAmountUsd <= 0) throw new Error('金額は正の数である必要があります');
    if (input.minAmountUsd >= input.maxAmountUsd) throw new Error('最小金額は最大金額より小さくする必要があります');
    if (!input.fiatCurrency) throw new Error('通貨を指定してください');
    if (input.exchangeRateMargin < 0) throw new Error('マージンは0以上である必要があります');

    return ctx.prisma.p2POffer.create({
      data: {
        sellerId: userId,
        paymentMethod: input.paymentMethod,
        minAmountUsd: input.minAmountUsd,
        maxAmountUsd: input.maxAmountUsd,
        fiatCurrency: input.fiatCurrency,
        exchangeRateMargin: input.exchangeRateMargin,
        instructions: input.instructions,
        priority: input.priority || 0,
      },
    });
  },

  // P2Pオファーを更新（売り手用）
  updateP2POffer: async (_: unknown, args: { input: { offerId: string; [key: string]: unknown } }, ctx: { user?: { id: string }; prisma: { p2POffer: { findUnique: (arg: { where: { id: string } }) => Promise<{ sellerId: string } | null>; update: (arg: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> } }; authService: { hasPermission: (userId: string, permission: string) => Promise<boolean> } } ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const hasPermission = await ctx.authService.hasPermission(userId, 'P2P_TRADER');
    if (!hasPermission) throw new Error('P2P_TRADER権限が必要です');

    const { offerId, ...data } = args.input;
    const offer = await ctx.prisma.p2POffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.sellerId !== userId) throw new Error('認証されていません');

    return ctx.prisma.p2POffer.update({ where: { id: offerId }, data });
  },

  // P2Pオファーを削除（売り手用）
  deleteP2POffer: async (_: unknown, args: { offerId: string }, ctx: { user?: { id: string }; prisma: { p2POffer: { findUnique: (arg: { where: { id: string } }) => Promise<{ sellerId: string } | null>; delete: (arg: { where: { id: string } }) => Promise<void> } }; authService: { hasPermission: (userId: string, permission: string) => Promise<boolean> } } ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const hasPermission = await ctx.authService.hasPermission(userId, 'P2P_TRADER');
    if (!hasPermission) throw new Error('P2P_TRADER権限が必要です');

    const { offerId } = args;
    const offer = await ctx.prisma.p2POffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.sellerId !== userId) throw new Error('認証されていません');

    await ctx.prisma.p2POffer.delete({ where: { id: offerId } });
    return true;
  },

  // P2P取引リクエストをキャンセル
  cancelP2PTradeRequest: async (_: unknown, args: { tradeId: string }, ctx: { user?: { id: string }; prisma: any }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const tradeService = new P2PTradeService(ctx.prisma as any);
    return tradeService.cancelTradeRequest(args.tradeId, userId);
  },

  // P2P取引リクエストを承認（売り手用）
  acceptP2PTradeRequest: async (_: unknown, args: { tradeId: string }, ctx: { user?: { id: string }; prisma: any; authService: { hasPermission: (userId: string, permission: string) => Promise<boolean> } }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const hasPermission = await ctx.authService.hasPermission(userId, 'P2P_TRADER');
    if (!hasPermission) throw new Error('P2P_TRADER権限が必要です');

    const tradeService = new P2PTradeService(ctx.prisma as any);
    return tradeService.acceptTradeRequest(args.tradeId, userId, {});
  },

  // 支払い完了を通知（買い手用）
  markP2PPaymentSent: async (_: unknown, args: { tradeId: string }, ctx: { user?: { id: string }; prisma: any }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const tradeService = new P2PTradeService(ctx.prisma as any);
    return tradeService.markPaymentSent(args.tradeId, userId);
  },

  // 支払い受領を確認（売り手用）
  confirmP2PPaymentReceived: async (_: unknown, args: { input: { tradeId: string } }, ctx: { user?: { id: string }; prisma: any; authService: { hasPermission: (userId: string, permission: string) => Promise<boolean> } } ) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('認証が必要です');

    const hasPermission = await ctx.authService.hasPermission(userId, 'P2P_TRADER');
    if (!hasPermission) throw new Error('P2P_TRADER権限が必要です');

    const tradeService = new P2PTradeService(ctx.prisma as any);
    return await tradeService.confirmPaymentReceived(args.input.tradeId, userId);
  },
};
