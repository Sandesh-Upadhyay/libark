/**
 * P2P取引関連シーダー
 * P2Pオファー、取引リクエスト、通貨マスタの作成を担当
 */

import { PrismaClient } from '@prisma/client';

import type { User, SeedResult } from '../utils/types';
import {
  p2pTradeRequestsData,
  p2pWalletTransactionsData,
  p2pConfig,
} from '../data/p2p';
import { logProgress } from '../utils/database';

/**
 * 通貨マスタデータ
 */
const fiatCurrenciesData = [
  { code: 'JPY', name: '日本円', symbol: '¥' },
  { code: 'USD', name: '米ドル', symbol: '$' },
  { code: 'EUR', name: 'ユーロ', symbol: '€' },
  { code: 'GBP', name: '英ポンド', symbol: '£' },
  { code: 'KRW', name: '韓国ウォン', symbol: '₩' },
  { code: 'CNY', name: '中国元', symbol: '¥' },
];

/**
 * P2Pオファーデータ（新しいP2POfferモデル用）
 */
const p2pOffersData = [
  {
    sellerUsername: 'p2p_trader_ken',
    paymentMethod: 'BANK_TRANSFER' as const,
    fiatCurrency: 'JPY',
    minAmountUsd: 10,
    maxAmountUsd: 500,
    exchangeRateMargin: 2.5,
    priority: 1,
    isActive: true,
  },
  {
    sellerUsername: 'p2p_trader_ken',
    paymentMethod: 'PAYPAY' as const,
    fiatCurrency: 'JPY',
    minAmountUsd: 10,
    maxAmountUsd: 300,
    exchangeRateMargin: 2.0,
    priority: 2,
    isActive: true,
  },
  {
    sellerUsername: 'p2p_trader_yumi',
    paymentMethod: 'BANK_TRANSFER' as const,
    fiatCurrency: 'JPY',
    minAmountUsd: 20,
    maxAmountUsd: 1000,
    exchangeRateMargin: 1.5,
    priority: 1,
    isActive: true,
  },
  {
    sellerUsername: 'p2p_trader_naoki',
    paymentMethod: 'PAYPAY' as const,
    fiatCurrency: 'JPY',
    minAmountUsd: 50,
    maxAmountUsd: 2000,
    exchangeRateMargin: 3.0,
    priority: 1,
    isActive: true,
  },
  {
    sellerUsername: 'p2p_trader_naoki',
    paymentMethod: 'LINE_PAY' as const,
    fiatCurrency: 'JPY',
    minAmountUsd: 50,
    maxAmountUsd: 1500,
    exchangeRateMargin: 3.0,
    priority: 2,
    isActive: true,
  },
];

/**
 * 通貨マスタを作成
 */
async function createFiatCurrencies(prisma: PrismaClient): Promise<any[]> {
  console.log('通貨マスタを作成しています...');

  const currencies: any[] = [];

  for (const data of fiatCurrenciesData) {
    const currency = await prisma.fiatCurrency.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        symbol: data.symbol,
        isActive: true,
      },
      create: {
        code: data.code,
        name: data.name,
        symbol: data.symbol,
        isActive: true,
      },
    });
    currencies.push(currency);
  }

  console.log(`${currencies.length} 件の通貨マスタを作成しました`);
  return currencies;
}

/**
 * P2Pオファーを作成
 */
async function createP2POffer(
  prisma: PrismaClient,
  offerData: (typeof p2pOffersData)[0],
  users: User[]
): Promise<any> {
  const seller = users.find(u => u.username === offerData.sellerUsername);
  if (!seller) {
    throw new Error(`売り手ユーザー ${offerData.sellerUsername} が見つかりません`);
  }

  // 既存のオファーを確認（sellerId, paymentMethod, fiatCurrencyのユニーク制約）
  const existingOffer = await prisma.p2POffer.findUnique({
    where: {
      sellerId_paymentMethod_fiatCurrency: {
        sellerId: seller.id,
        paymentMethod: offerData.paymentMethod,
        fiatCurrency: offerData.fiatCurrency,
      },
    },
  });

  if (existingOffer) {
    console.log(
      `オファー ${offerData.sellerUsername}/${offerData.paymentMethod}/${offerData.fiatCurrency} は既に存在します`
    );
    return existingOffer;
  }

  // オファーを作成
  const offer = await prisma.p2POffer.create({
    data: {
      sellerId: seller.id,
      paymentMethod: offerData.paymentMethod,
      fiatCurrency: offerData.fiatCurrency,
      minAmountUsd: offerData.minAmountUsd,
      maxAmountUsd: offerData.maxAmountUsd,
      exchangeRateMargin: offerData.exchangeRateMargin,
      priority: offerData.priority,
      isActive: offerData.isActive,
    },
  });

  return offer;
}

/**
 * 取引リクエストを作成
 */
async function createTradeRequest(
  prisma: PrismaClient,
  tradeData: (typeof p2pTradeRequestsData)[0],
  users: User[],
  offers: any[]
): Promise<any> {
  const buyer = users.find(u => u.username === tradeData.buyerUsername);
  const seller = users.find(u => u.username === tradeData.sellerUsername);

  if (!buyer) {
    throw new Error(`買い手ユーザー ${tradeData.buyerUsername} が見つかりません`);
  }
  if (!seller) {
    throw new Error(`売り手ユーザー ${tradeData.sellerUsername} が見つかりません`);
  }

  // 関連するオファーを取得
  const relatedOffer = offers.find(
    o =>
      o.sellerId === seller.id &&
      o.paymentMethod === tradeData.paymentMethod &&
      o.fiatCurrency === tradeData.fiatCurrency
  );

  // 金額を計算
  const fiatAmount = tradeData.amountUsd * tradeData.exchangeRate;

  // 期限を設定
  const now = new Date();
  const expiresAt =
    tradeData.expiresAt || new Date(now.getTime() + p2pConfig.tradeExpiryMinutes * 60 * 1000);

  // 取引リクエストを作成
  const tradeRequest = await prisma.p2PTradeRequest.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      offerId: relatedOffer?.id || null,
      amountUsd: tradeData.amountUsd,
      fiatCurrency: tradeData.fiatCurrency,
      fiatAmount,
      exchangeRate: tradeData.exchangeRate,
      status: tradeData.status,
      paymentMethod: tradeData.paymentMethod || null,
      paymentDetails: tradeData.paymentDetails || null,
      escrowAmount: tradeData.escrowAmount || null,
      expiresAt,
      completedAt: tradeData.completedAt || null,
    },
  });

  return tradeRequest;
}

/**
 * ウォレット取引を作成
 */
async function createWalletTransaction(
  prisma: PrismaClient,
  transactionData: (typeof p2pWalletTransactionsData)[0],
  users: User[],
  tradeRequests: any[]
): Promise<any> {
  const user = users.find(u => u.username === transactionData.username);
  if (!user) {
    throw new Error(`ユーザー ${transactionData.username} が見つかりません`);
  }

  // 関連取引を取得
  let p2pTradeId: string | null = null;
  if (transactionData.relatedTradeIndex !== undefined) {
    const trade = tradeRequests[transactionData.relatedTradeIndex];
    if (trade) {
      p2pTradeId = trade.id;
    }
  }

  // ウォレット取引を作成
  const transaction = await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      paymentRequestId: null,
      type: transactionData.type,
      balanceType: transactionData.balanceType,
      amountUsd: transactionData.amountUsd,
      description: transactionData.description,
      metadata: {
        ...transactionData.metadata,
        p2pTradeId,
      },
    },
  });

  return transaction;
}

/**
 * ウォレット残高を更新
 */
async function updateWalletBalance(
  prisma: PrismaClient,
  username: string,
  p2pBalanceUsd: number,
  p2pLockedUsd: number
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error(`ユーザー ${username} が見つかりません`);
  }

  await prisma.wallet.update({
    where: { userId: user.id },
    data: {
      p2pBalanceUsd: { increment: p2pBalanceUsd },
      p2pLockedUsd: { increment: p2pLockedUsd },
    },
  });
}

/**
 * P2Pオファーを作成
 */
async function createP2POffers(prisma: PrismaClient, users: User[]): Promise<any[]> {
  console.log('P2Pオファーを作成しています...');

  const offers: any[] = [];

  for (let i = 0; i < p2pOffersData.length; i++) {
    const offer = await createP2POffer(prisma, p2pOffersData[i], users);
    offers.push(offer);
    logProgress(i + 1, p2pOffersData.length, 'P2Pオファー');
  }

  console.log(`${offers.length} 件のP2Pオファーを作成しました`);
  return offers;
}

/**
 * 取引リクエストを作成
 */
async function createTradeRequests(
  prisma: PrismaClient,
  users: User[],
  offers: any[]
): Promise<any[]> {
  console.log('P2P取引リクエストを作成しています...');

  const tradeRequests: any[] = [];

  for (let i = 0; i < p2pTradeRequestsData.length; i++) {
    const trade = await createTradeRequest(prisma, p2pTradeRequestsData[i], users, offers);
    tradeRequests.push(trade);
    logProgress(i + 1, p2pTradeRequestsData.length, '取引リクエスト');
  }

  console.log(`${tradeRequests.length} 件の取引リクエストを作成しました`);
  return tradeRequests;
}

/**
 * ウォレット取引を作成
 */
async function createWalletTransactions(
  prisma: PrismaClient,
  users: User[],
  tradeRequests: any[]
): Promise<any[]> {
  console.log('P2Pウォレット取引を作成しています...');

  const transactions: any[] = [];

  for (let i = 0; i < p2pWalletTransactionsData.length; i++) {
    const transaction = await createWalletTransaction(
      prisma,
      p2pWalletTransactionsData[i],
      users,
      tradeRequests
    );
    transactions.push(transaction);
    logProgress(i + 1, p2pWalletTransactionsData.length, 'ウォレット取引');
  }

  console.log(`${transactions.length} 件のウォレット取引を作成しました`);
  return transactions;
}

/**
 * ウォレット残高を更新
 */
async function updateWalletBalances(prisma: PrismaClient): Promise<void> {
  console.log('P2Pウォレット残高を更新しています...');

  // p2p_trader_kenの残高設定
  await updateWalletBalance(prisma, 'p2p_trader_ken', 0, 725);

  // CONFIRMED状態の取引: エスクロー解放
  await updateWalletBalance(prisma, 'p2p_trader_ken', 0, -150);
  await updateWalletBalance(prisma, 'user4', 150, 0);

  // COMPLETED状態の取引: エスクロー解放
  await updateWalletBalance(prisma, 'p2p_trader_ken', 0, -200);
  await updateWalletBalance(prisma, 'user5', 200, 0);

  // CANCELLED状態の取引: 返金
  await updateWalletBalance(prisma, 'p2p_trader_ken', 80, -80);

  // 期限切れのCANCELLED状態の取引: 返金
  await updateWalletBalance(prisma, 'p2p_trader_ken', 120, -120);

  console.log('P2Pウォレット残高の更新が完了しました');
}

/**
 * P2P取引関連のシード実行
 */
export async function seedP2PTrades(prisma: PrismaClient): Promise<SeedResult> {
  try {
    // 通貨マスタを作成
    await createFiatCurrencies(prisma);

    // 既存ユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        username: {
          in: [
            'p2p_trader_ken',
            'p2p_trader_yumi',
            'p2p_trader_naoki',
            'user1',
            'user2',
            'user3',
            'user4',
            'user5',
            'user6',
            'user7',
          ],
        },
      },
    });

    // 必要なユーザーが存在するか確認
    const requiredUsernames = [
      'p2p_trader_ken',
      'p2p_trader_yumi',
      'p2p_trader_naoki',
      'user1',
      'user2',
      'user3',
      'user4',
      'user5',
      'user6',
      'user7',
    ];
    const foundUsernames = users.map((u: User) => u.username);
    const missingUsernames = requiredUsernames.filter(
      username => !foundUsernames.includes(username)
    );

    if (missingUsernames.length > 0) {
      throw new Error(`必要なユーザーが見つかりません: ${missingUsernames.join(', ')}`);
    }

    // トランザクションでデータ作成
    await prisma.$transaction(async tx => {
      // P2Pオファーを作成
      const offers = await createP2POffers(tx, users);

      // 取引リクエストを作成
      const tradeRequests = await createTradeRequests(tx, users, offers);

      // ウォレット取引を作成
      const transactions = await createWalletTransactions(tx, users, tradeRequests);

      // ウォレット残高を更新
      await updateWalletBalances(tx);

      return {
        offers,
        tradeRequests,
        transactions,
      };
    });

    return {
      success: true,
      count: fiatCurrenciesData.length + p2pOffersData.length + p2pTradeRequestsData.length + p2pWalletTransactionsData.length,
      message: 'P2P取引関連のシードが正常に完了しました',
    };
  } catch (error) {
    console.error('P2P取引関連のシードでエラーが発生しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('不明なエラー'),
      message: 'P2P取引関連のシードでエラーが発生しました',
    };
  }
}
