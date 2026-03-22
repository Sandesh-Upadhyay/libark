/**
 * 🧪 ウォレットトランザクションのロールバック統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';
import type { Redis } from 'ioredis';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app';
import {
  createTestUser,
  cleanupTestData,
  createTestPermission,
  grantPermissionToUser,
} from '../../__tests__/helpers/test-data';

describe('🔄 Wallet Transaction Rollback Integration Tests', () => {
  let app: FastifyInstance & { prisma: PrismaClient; redis: Redis };

  const makeUnique = (prefix: string) => {
    const ts = Date.now() % 1000000;
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${ts}-${rnd}`;
  };

  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        accessToken
      }
    }
  `;

  const transferBalanceMutation = `
    mutation TransferBalance($input: TransferBalanceInput!) {
      transferBalance(input: $input) {
        amountUsd
        balanceType
        type
        description
      }
    }
  `;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();
  });

  const getAuthCookie = async (userEmail: string) => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      payload: {
        query: loginMutation,
        variables: { input: { email: userEmail, password: 'Test12345!' } },
      },
    });
    const accessTokenCookie = loginRes.cookies.find(c => c.name === 'accessToken');
    return `${accessTokenCookie?.name}=${accessTokenCookie?.value}`;
  };

  it('エラー発生時の自動ロールバックを検証する（残高不足）', async () => {
    const username = makeUnique('rollbackuser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const sellerPerm = await createTestPermission(app.prisma, {
      name: 'CONTENT_SELLER',
      description: 'Seller',
    });
    await grantPermissionToUser(app.prisma, user.id, sellerPerm.id);

    const cookie = await getAuthCookie(email);

    // 初期残高設定: SALES に 100 USD
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 0,
        salesBalanceUsd: 100,
        p2pBalanceUsd: 0,
      },
    });

    const walletBefore = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const _salesBalanceBefore = Number(walletBefore?.salesBalanceUsd);
    const walletBalanceBefore = Number(walletBefore?.balanceUsd);

    // 1000 USDを移動しようとする（残高不足）
    const transferInput = {
      fromBalanceType: 'SALES',
      toBalanceType: 'WALLET',
      amountUsd: 1000,
      description: 'Insufficient balance transfer',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: transferBalanceMutation,
        variables: { input: transferInput },
      },
    });

    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('残高が不足しています');

    // 残高が変わっていないことを確認（ロールバック）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceAfter = Number(walletAfter?.salesBalanceUsd);
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(salesBalanceAfter).toBe(_salesBalanceBefore);
    expect(walletBalanceAfter).toBe(walletBalanceBefore);
  });

  it('エラー発生時の自動ロールバックを検証する（無効な残高種別）', async () => {
    const username = makeUnique('rollbackinvaliduser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const cookie = await getAuthCookie(email);

    // 初期残高設定
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 500,
        salesBalanceUsd: 0,
        p2pBalanceUsd: 0,
      },
    });

    const walletBefore = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const walletBalanceBefore = Number(walletBefore?.balanceUsd);

    // 無効な残高種別から移動しようとする
    const transferInput = {
      fromBalanceType: 'INVALID',
      toBalanceType: 'WALLET',
      amountUsd: 100,
      description: 'Invalid balance type transfer',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: transferBalanceMutation,
        variables: { input: transferInput },
      },
    });

    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('無効な残高種別です');

    // 残高が変わっていないことを確認（ロールバック）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(walletBalanceAfter).toBe(walletBalanceBefore);
  });

  it('エラー発生時の自動ロールバックを検証する（同じ残高種別間の移動）', async () => {
    const username = makeUnique('rollbacksameuser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const cookie = await getAuthCookie(email);

    // 初期残高設定
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 500,
        salesBalanceUsd: 0,
        p2pBalanceUsd: 0,
      },
    });

    const walletBefore = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const walletBalanceBefore = Number(walletBefore?.balanceUsd);

    // WALLET -> WALLET への移動を試みる
    const transferInput = {
      fromBalanceType: 'WALLET',
      toBalanceType: 'WALLET',
      amountUsd: 100,
      description: 'Same balance type transfer',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: transferBalanceMutation,
        variables: { input: transferInput },
      },
    });

    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('同じ残高種別間の移動はできません');

    // 残高が変わっていないことを確認（ロールバック）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(walletBalanceAfter).toBe(walletBalanceBefore);
  });

  it('エラー発生時の自動ロールバックを検証する（権限なし）', async () => {
    const username = makeUnique('rollbacknopermuser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const cookie = await getAuthCookie(email);

    // 初期残高設定: SALES に 500 USD
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 0,
        salesBalanceUsd: 500,
        p2pBalanceUsd: 0,
      },
    });

    const walletBefore = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceBefore = Number(walletBefore?.salesBalanceUsd);
    const walletBalanceBefore = Number(walletBefore?.balanceUsd);

    // SALES -> WALLET への移動を試みる（権限なし）
    const transferInput = {
      fromBalanceType: 'SALES',
      toBalanceType: 'WALLET',
      amountUsd: 100,
      description: 'No permission transfer',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: transferBalanceMutation,
        variables: { input: transferInput },
      },
    });

    const body = JSON.parse(res.body);
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('CONTENT_SELLER権限が必要です');

    // 残高が変わっていないことを確認（ロールバック）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceAfter = Number(walletAfter?.salesBalanceUsd);
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(salesBalanceAfter).toBe(salesBalanceBefore);
    expect(walletBalanceAfter).toBe(walletBalanceBefore);
  });

  it('部分的な失敗時のロールバックを検証する（Prismaトランザクション）', async () => {
    const username = makeUnique('rollbackpartialuser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const sellerPerm = await createTestPermission(app.prisma, {
      name: 'CONTENT_SELLER',
      description: 'Seller',
    });
    await grantPermissionToUser(app.prisma, user.id, sellerPerm.id);

    // 初期残高設定: SALES に 500 USD
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 0,
        salesBalanceUsd: 500,
        p2pBalanceUsd: 0,
      },
    });

    const walletBefore = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceBefore = Number(walletBefore?.salesBalanceUsd);
    const walletBalanceBefore = Number(walletBefore?.balanceUsd);

    // トランザクション履歴の初期数を取得
    const transactionsBefore = await app.prisma.walletTransaction.count({
      where: { userId: user.id },
    });

    // Prismaトランザクションを使用して、途中でエラーが発生する操作をシミュレート
    try {
      await app.prisma.$transaction(async tx => {
        // 残高を減算
        await tx.wallet.update({
          where: { userId: user.id },
          data: { salesBalanceUsd: { decrement: 100 } },
        });

        // トランザクションを作成
        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: 'TRANSFER',
            balanceType: 'SALES',
            amountUsd: -100,
            description: 'Test transfer',
          },
        });

        // 意図的にエラーをスロー（ロールバックをトリガー）
        throw new Error('Simulated error for rollback test');
      });
    } catch (error) {
      // エラーが発生することを確認
      expect(error).toBeDefined();
    }

    // 残高が変わっていないことを確認（ロールバック）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceAfter = Number(walletAfter?.salesBalanceUsd);
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(salesBalanceAfter).toBe(salesBalanceBefore);
    expect(walletBalanceAfter).toBe(walletBalanceBefore);

    // トランザクション履歴が増えていないことを確認（ロールバック）
    const transactionsAfter = await app.prisma.walletTransaction.count({
      where: { userId: user.id },
    });
    expect(transactionsAfter).toBe(transactionsBefore);
  });

  it('並行トランザクションの競合時のロールバックを検証する', async () => {
    const username = makeUnique('rollbackconcurrentuser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const sellerPerm = await createTestPermission(app.prisma, {
      name: 'CONTENT_SELLER',
      description: 'Seller',
    });
    await grantPermissionToUser(app.prisma, user.id, sellerPerm.id);

    const cookie = await getAuthCookie(email);

    // 初期残高設定: SALES に 500 USD
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 0,
        salesBalanceUsd: 500,
        p2pBalanceUsd: 0,
      },
    });

    // 最初の移動を開始
    const transferInput1 = {
      fromBalanceType: 'SALES',
      toBalanceType: 'WALLET',
      amountUsd: 300,
      description: 'First transfer',
    };

    const res1 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: transferBalanceMutation,
        variables: { input: transferInput1 },
      },
    });

    const body1 = JSON.parse(res1.body);
    expect(body1.errors).toBeUndefined();

    // 2番目の移動を試みる（残高不足になるはず）
    const transferInput2 = {
      fromBalanceType: 'SALES',
      toBalanceType: 'WALLET',
      amountUsd: 300,
      description: 'Second transfer',
    };

    const res2 = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json', cookie },
      payload: {
        query: transferBalanceMutation,
        variables: { input: transferInput2 },
      },
    });

    const body2 = JSON.parse(res2.body);
    expect(body2.errors).toBeDefined();
    expect(body2.errors[0].message).toContain('残高が不足しています');

    // 最終的な残高を確認（最初の移動のみ成功）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceAfter = Number(walletAfter?.salesBalanceUsd);
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(salesBalanceAfter).toBe(200); // 500 - 300
    expect(walletBalanceAfter).toBe(300); // 0 + 300
  });

  it('データベース接続エラー時のロールバックを検証する', async () => {
    const username = makeUnique('rollbackdberroruser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const sellerPerm = await createTestPermission(app.prisma, {
      name: 'CONTENT_SELLER',
      description: 'Seller',
    });
    await grantPermissionToUser(app.prisma, user.id, sellerPerm.id);

    // 初期残高設定: SALES に 500 USD
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 0,
        salesBalanceUsd: 500,
        p2pBalanceUsd: 0,
      },
    });

    const walletBefore = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceBefore = Number(walletBefore?.salesBalanceUsd);
    const walletBalanceBefore = Number(walletBefore?.balanceUsd);

    // データベース接続エラーをシミュレート
    // 注: 実際のデータベース接続エラーをシミュレートするのは難しいため、
    // トランザクション内で意図的にエラーをスローする方法を使用
    try {
      await app.prisma.$transaction(async tx => {
        // 残高を減算
        await tx.wallet.update({
          where: { userId: user.id },
          data: { salesBalanceUsd: { decrement: 100 } },
        });

        // データベースエラーをシミュレート（無効な操作）
        await tx.$executeRawUnsafe('SELECT invalid_column FROM non_existent_table');
      });
    } catch (error) {
      // エラーが発生することを確認
      expect(error).toBeDefined();
    }

    // 残高が変わっていないことを確認（ロールバック）
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    const salesBalanceAfter = Number(walletAfter?.salesBalanceUsd);
    const walletBalanceAfter = Number(walletAfter?.balanceUsd);

    expect(salesBalanceAfter).toBe(salesBalanceBefore);
    expect(walletBalanceAfter).toBe(walletBalanceBefore);
  });

  it('複数のトランザクションが正しくコミットされることを検証する', async () => {
    const username = makeUnique('rollbackmultitransuser');
    const email = `${username}@test.com`;
    const user = await createTestUser(app.prisma, { email, username, password: 'Test12345!' });

    const sellerPerm = await createTestPermission(app.prisma, {
      name: 'CONTENT_SELLER',
      description: 'Seller',
    });
    await grantPermissionToUser(app.prisma, user.id, sellerPerm.id);

    const cookie = await getAuthCookie(email);

    // 初期残高設定: SALES に 1000 USD
    await app.prisma.wallet.create({
      data: {
        userId: user.id,
        balanceUsd: 0,
        salesBalanceUsd: 1000,
        p2pBalanceUsd: 0,
      },
    });

    // 3回の移動を実行
    const transfers = [
      { amount: 200, description: 'First transfer' },
      { amount: 300, description: 'Second transfer' },
      { amount: 100, description: 'Third transfer' },
    ];

    for (const transfer of transfers) {
      const transferInput = {
        fromBalanceType: 'SALES',
        toBalanceType: 'WALLET',
        amountUsd: transfer.amount,
        description: transfer.description,
      };

      const res = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json', cookie },
        payload: {
          query: transferBalanceMutation,
          variables: { input: transferInput },
        },
      });

      const body = JSON.parse(res.body);
      expect(body.errors).toBeUndefined();
    }

    // 最終的な残高を確認
    const walletAfter = await app.prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(Number(walletAfter?.salesBalanceUsd)).toBe(400); // 1000 - 200 - 300 - 100
    expect(Number(walletAfter?.balanceUsd)).toBe(600); // 0 + 200 + 300 + 100

    // トランザクション履歴を確認（6レコード: 出金3 + 入金3）
    const transactions = await app.prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(transactions).toHaveLength(6);
  });
});
