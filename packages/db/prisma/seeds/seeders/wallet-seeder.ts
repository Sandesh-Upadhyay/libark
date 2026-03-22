/**
 * ウォレット関連シーダー
 * ウォレット、ユーザーウォレット、為替レート、取引履歴の作成を担当
 */

import { PrismaClient } from '@prisma/client';

import type { User, SeedResult, DepositStatus, WithdrawalStatus } from '../utils/types';
import {
  supportedCurrencies,
  exchangeRatesData,
  walletConfig,
  transactionConfig,
} from '../data/currencies';
import {
  getRandomElement,
  getRandomDate,
  getRandomFloat,
  getRandomInt,
  getRandomBoolean,
  generateWalletAddress,
} from '../utils/random';
import { logProgress } from '../utils/database';

/**
 * 為替レートを作成
 */
export async function createExchangeRates(prisma: PrismaClient): Promise<any[]> {
  console.log('為替レートを作成しています...');
  const exchangeRates: unknown[] = [];

  for (const rate of exchangeRatesData) {
    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        currency_source: {
          currency: rate.currency,
          source: 'mexc',
        },
      },
      update: {
        usdRate: rate.usdRate,
        isActive: true,
      },
      create: {
        currency: rate.currency,
        usdRate: rate.usdRate,
        source: 'mexc',
        isActive: true,
      },
    });

    exchangeRates.push(exchangeRate);
  }

  console.log(`${exchangeRates.length} 個の為替レートを作成しました`);
  return exchangeRates;
}

/**
 * ウォレットを作成
 */
export async function createWallets(prisma: PrismaClient, users: User[]): Promise<any[]> {
  console.log('ウォレットを作成しています...');
  const wallets: unknown[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    // 各ユーザーにウォレットを作成（残高はランダム）
    const balanceUsd = getRandomFloat(0, walletConfig.maxBalance);
    const salesBalanceUsd = ['SELLER', 'ADMIN'].includes(user.role || '')
      ? getRandomFloat(0, walletConfig.maxSalesBalance)
      : 0;
    const p2pBalanceUsd = ['P2P_SELLER', 'ADMIN'].includes(user.role || '')
      ? getRandomFloat(0, walletConfig.maxP2pBalance)
      : 0;

    const wallet = await prisma.wallet.upsert({
      where: {
        userId: user.id,
      },
      update: {
        balanceUsd: balanceUsd,
        salesBalanceUsd: salesBalanceUsd,
        p2pBalanceUsd: p2pBalanceUsd,
        isActive: true,
      },
      create: {
        userId: user.id,
        balanceUsd: balanceUsd,
        salesBalanceUsd: salesBalanceUsd,
        p2pBalanceUsd: p2pBalanceUsd,
        isActive: true,
      },
    });

    wallets.push(wallet);
    logProgress(i + 1, users.length, 'ウォレット');
  }

  console.log(`${wallets.length} 個のウォレットを作成しました`);
  return wallets;
}

/**
 * ユーザーウォレットを作成
 */
export async function createUserWallets(prisma: PrismaClient, users: User[]): Promise<any[]> {
  console.log('ユーザーウォレットを作成しています...');
  const userWallets: unknown[] = [];

  for (const user of users) {
    // 各ユーザーに1-3個のウォレットアドレスを作成
    const walletCount = getRandomInt(1, 3);

    for (let i = 0; i < walletCount; i++) {
      const currencyData = getRandomElement(supportedCurrencies);
      const address = generateWalletAddress(currencyData.currency);

      const userWallet = await prisma.userWallet.create({
        data: {
          userId: user.id,
          walletName: `${user.displayName}の${currencyData.name}ウォレット`,
          currency: currencyData.currency,
          network: currencyData.network,
          address: address,
          isVerified: getRandomBoolean(walletConfig.verificationRate),
          isActive: true,
        },
      });

      userWallets.push(userWallet);
    }
  }

  console.log(`${userWallets.length} 個のユーザーウォレットを作成しました`);
  return userWallets;
}

/**
 * 入金申請を作成
 */
export async function createDepositRequests(
  prisma: PrismaClient,
  users: User[],
  exchangeRates: unknown[]
): Promise<any[]> {
  console.log('入金申請を作成しています...');
  const depositRequests: unknown[] = [];

  for (let i = 0; i < 30; i++) {
    const user = getRandomElement(users);
    const currencyData = getRandomElement(supportedCurrencies);
    const exchangeRate = exchangeRates.find(r => r.currency === currencyData.currency);

    if (!exchangeRate) continue;

    const requestedUsdAmount = getRandomFloat(
      transactionConfig.depositRange.min,
      transactionConfig.depositRange.max
    );
    const rate = Number(exchangeRate.usdRate);
    const expectedCryptoAmount = requestedUsdAmount / rate;

    const createdAt = getRandomDate();
    const expiresAt = new Date(
      createdAt.getTime() + transactionConfig.expirationHours * 60 * 60 * 1000
    );

    const status = getRandomBoolean(transactionConfig.completionRate)
      ? ('COMPLETED' as DepositStatus)
      : getRandomBoolean(0.5)
        ? ('PENDING' as DepositStatus)
        : ('EXPIRED' as DepositStatus);

    const depositRequest = await prisma.depositRequest.create({
      data: {
        userId: user.id,
        requestedUsdAmount,
        currency: currencyData.currency,
        network: currencyData.network,
        expectedCryptoAmount,
        exchangeRate: rate,
        ourDepositAddress: `mexc_deposit_${getRandomInt(100000, 999999)}`,
        status,
        expiresAt,
        completedAt:
          status === 'COMPLETED'
            ? new Date(createdAt.getTime() + getRandomInt(0, 23 * 60 * 60 * 1000))
            : null,
        createdAt,
      },
    });

    depositRequests.push(depositRequest);
  }

  console.log(`${depositRequests.length} 個の入金申請を作成しました`);
  return depositRequests;
}

/**
 * 出金申請を作成
 */
export async function createWithdrawalRequests(
  prisma: PrismaClient,
  users: User[],
  exchangeRates: unknown[]
): Promise<any[]> {
  console.log('出金申請を作成しています...');
  const withdrawalRequests: unknown[] = [];

  for (let i = 0; i < 20; i++) {
    const user = getRandomElement(users);
    const currencyData = getRandomElement(supportedCurrencies);
    const exchangeRate = exchangeRates.find(r => r.currency === currencyData.currency);

    if (!exchangeRate) continue;

    const amountUsd = getRandomFloat(
      transactionConfig.withdrawalRange.min,
      transactionConfig.withdrawalRange.max
    );
    const rate = Number(exchangeRate.usdRate);
    const amount = amountUsd / rate;

    const createdAt = getRandomDate();

    const statusRandom = Math.random();
    let status: WithdrawalStatus;
    if (statusRandom > 0.8) status = 'COMPLETED';
    else if (statusRandom > 0.6) status = 'PROCESSING';
    else if (statusRandom > 0.4) status = 'PENDING';
    else status = 'FAILED';

    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        currency: currencyData.currency,
        amount,
        amountUsd,
        destinationAddress: generateWalletAddress(currencyData.currency),
        network: currencyData.network,
        status,
        mexcWithdrawId:
          status !== 'PENDING' ? `mexc_withdraw_${getRandomInt(100000, 999999)}` : null,
        processedAt:
          status === 'COMPLETED'
            ? new Date(createdAt.getTime() + getRandomInt(0, 2 * 60 * 60 * 1000))
            : null,
        createdAt,
        updatedAt: createdAt,
      },
    });

    withdrawalRequests.push(withdrawalRequest);
  }

  console.log(`${withdrawalRequests.length} 個の出金申請を作成しました`);
  return withdrawalRequests;
}

/**
 * ウォレット関連のシード実行
 */
export async function seedWallet(prisma: PrismaClient, users: User[]): Promise<SeedResult> {
  try {
    // 為替レートを作成
    const exchangeRates = await createExchangeRates(prisma);

    // ウォレットを作成
    const wallets = await createWallets(prisma, users);

    // ユーザーウォレットを作成
    const userWallets = await createUserWallets(prisma, users);

    // 入金申請を作成
    const depositRequests = await createDepositRequests(prisma, users, exchangeRates);

    // 出金申請を作成
    const withdrawalRequests = await createWithdrawalRequests(prisma, users, exchangeRates);

    const totalItems =
      exchangeRates.length +
      wallets.length +
      userWallets.length +
      depositRequests.length +
      withdrawalRequests.length;

    return {
      success: true,
      data: { exchangeRates, wallets, userWallets, depositRequests, withdrawalRequests },
      count: totalItems,
      message: 'ウォレット関連のシードが正常に完了しました',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('不明なエラー'),
      message: 'ウォレット関連のシードでエラーが発生しました',
    };
  }
}
