/**
 * 🧪 NOWPayments IPN エンドポイント統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';
import { hmacSha512Hex } from '@libark/core-server/security/server-crypto';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { createTestUser, cleanupTestData } from './helpers/test-data.js';

/**
 * IPNエンドポイントの統合テスト
 * Webhook受信→ウォレット残高反映までの全フローをテスト
 */

describe('NOWPayments IPN Endpoint Integration Test', () => {
  let app: FastifyInstance & { prisma: PrismaClient };
  const ipnSecret = 'test-ipn-secret';

  // Prisma モデル名差異を吸収（nOWPaymentsPayment vs nowPaymentsPayment）
  const getNOWPaymentsRepo = (prisma: PrismaClient) => {
    const p = prisma as any;
    return (
      p.nowPaymentsPayment ??
      p.nOWPaymentsPayment ??
      (() => {
        throw new Error('NOWPaymentsPayment repository not found on prisma');
      })()
    );
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.NOWPAYMENTS_USE_MOCK = 'true';
    process.env.NOWPAYMENTS_IPN_SECRET = ipnSecret;
    app = await createTestApp({ initializeGraphQL: false });

    const { nowpaymentsRoutes } = await import('../routes/nowpayments.js');
    await app.register(nowpaymentsRoutes);
  });

  afterAll(async () => {
    await cleanupTestData(app.prisma);
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    await cleanupTestData(app.prisma);
  });

  /**
   * 有効なIPNシグネチャを生成
   */
  async function generateValidSignature(payload: string): Promise<string> {
    return await hmacSha512Hex(ipnSecret, payload);
  }

  /**
   * テスト用IPNペイロードを作成
   */
  function createIPNPayload(overrides: Partial<any> = {}) {
    return {
      payment_id: 'test-payment-123',
      payment_status: 'finished',
      pay_address: 'test-address',
      price_amount: 12.0,
      price_currency: 'USD',
      pay_amount: 0.0003,
      actually_paid: 0.0003,
      pay_currency: 'BTC',
      order_id: 'test-order-123',
      order_description: 'Test payment',
      purchase_id: 'test-purchase-123',
      outcome_amount: 0.0003,
      outcome_currency: 'BTC',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T01:00:00Z',
      ...overrides,
    };
  }

  it('有効なIPNを受信してウォレット残高を更新する', async () => {
    // 1) テストユーザーを作成
    const user = await createTestUser(app.prisma, {
      email: `ipn-test-${Date.now()}@libark.dev`,
      username: `ipn-test-${Date.now()}`,
      password: 'Test12345!',
    });

    // 2) 決済データを事前に作成（決済作成時に保存される想定）
    const paymentId = 'test-payment-123';
    await getNOWPaymentsRepo(app.prisma).create({
      data: {
        userId: user.id,
        paymentId: paymentId,
        orderId: 'test-order-123',
        purchaseId: 'test-purchase-123',
        paymentStatus: 'WAITING',
        priceAmount: 12.0,
        priceCurrency: 'USD',
        payAmount: 0.0003,
        payCurrency: 'BTC',
        payAddress: 'test-address',
      },
    });

    // 3) IPNペイロードを作成
    const ipnPayload = createIPNPayload({
      payment_id: paymentId,
      payment_status: 'finished',
    });
    const payloadString = JSON.stringify(ipnPayload);
    const signature = await generateValidSignature(payloadString);

    // 4) IPNエンドポイントを呼び出し
    const response = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/ipn',
      payload: ipnPayload,
      headers: {
        'x-nowpayments-sig': signature,
        'content-type': 'application/json',
      },
    });

    // 5) レスポンスを検証
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.status).toBe('ok');

    // 6) ウォレットトランザクションが作成されているか確認
    const walletTransaction = await app.prisma.walletTransaction.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    expect(walletTransaction).not.toBeNull();
    expect(walletTransaction!.type).toBe('DEPOSIT');
    expect(walletTransaction!.description).toContain('暗号通貨入金完了');
    expect(walletTransaction!.amountUsd).toBe('12');

    const metadata = walletTransaction!.metadata as any;
    expect(metadata.paymentId).toBe(paymentId);
    expect(metadata.source).toBe('nowpayments');

    // 7) 決済ステータスが更新されているか確認
    const updatedPayment = await getNOWPaymentsRepo(app.prisma).findUnique({
      where: { paymentId: paymentId },
    });
    expect((updatedPayment as any)!.paymentStatus).toBe('FINISHED');
  });

  it('無効なシグネチャのIPNを拒否する', async () => {
    const ipnPayload = createIPNPayload();
    const invalidSignature = 'invalid-signature';

    const response = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/ipn',
      payload: ipnPayload,
      headers: {
        'x-nowpayments-sig': invalidSignature,
        'content-type': 'application/json',
      },
    });

    expect(response.statusCode).toBe(401);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Invalid signature');
  });

  it('シグネチャなしのIPNを拒否する', async () => {
    const ipnPayload = createIPNPayload();

    const response = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/ipn',
      payload: ipnPayload,
      headers: {
        'content-type': 'application/json',
      },
    });

    expect(response.statusCode).toBe(400);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Missing signature');
  });

  it('存在しない決済のIPNを適切に処理する', async () => {
    const ipnPayload = createIPNPayload({
      payment_id: 'non-existent-payment',
      payment_status: 'finished',
    });
    const payloadString = JSON.stringify(ipnPayload);
    const signature = await generateValidSignature(payloadString);

    const response = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/ipn',
      payload: ipnPayload,
      headers: {
        'x-nowpayments-sig': signature,
        'content-type': 'application/json',
      },
    });

    // IPNの処理は成功として扱う（重複送信を避けるため）
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.status).toBe('ok');
  });

  it('既に完了済みの決済のIPNを適切に処理する', async () => {
    // 1) テストユーザーを作成
    const user = await createTestUser(app.prisma, {
      email: `ipn-duplicate-${Date.now()}@libark.dev`,
      username: `ipn-duplicate-${Date.now()}`,
      password: 'Test12345!',
    });

    // 2) 既に完了済みの決済データを作成
    const paymentId = 'test-payment-finished';
    await getNOWPaymentsRepo(app.prisma).create({
      data: {
        userId: user.id,
        paymentId: paymentId,
        orderId: 'test-order-finished',
        purchaseId: 'test-purchase-finished',
        paymentStatus: 'FINISHED', // 既に完了済み
        priceAmount: 12.0,
        priceCurrency: 'USD',
        payAmount: 0.0003,
        payCurrency: 'BTC',
        payAddress: 'test-address',
      },
    });

    // 3) IPNペイロードを作成
    const ipnPayload = createIPNPayload({
      payment_id: paymentId,
      payment_status: 'finished',
    });
    const payloadString = JSON.stringify(ipnPayload);
    const signature = await generateValidSignature(payloadString);

    // 4) IPNエンドポイントを呼び出し
    const response = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/ipn',
      payload: ipnPayload,
      headers: {
        'x-nowpayments-sig': signature,
        'content-type': 'application/json',
      },
    });

    // 5) レスポンスを検証
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.status).toBe('ok');

    // 6) 重複したウォレットトランザクションが作成されていないことを確認
    const walletTransactions = await app.prisma.walletTransaction.findMany({
      where: { userId: user.id },
    });
    expect(walletTransactions.length).toBe(0); // 重複処理されていない
  });

  it('非完了ステータスのIPNは残高更新しない', async () => {
    // 1) テストユーザーを作成
    const user = await createTestUser(app.prisma, {
      email: `ipn-pending-${Date.now()}@libark.dev`,
      username: `ipn-pending-${Date.now()}`,
      password: 'Test12345!',
    });

    // 2) 決済データを作成
    const paymentId = 'test-payment-pending';
    await getNOWPaymentsRepo(app.prisma).create({
      data: {
        userId: user.id,
        paymentId: paymentId,
        orderId: 'test-order-pending',
        purchaseId: 'test-purchase-pending',
        paymentStatus: 'WAITING',
        priceAmount: 12.0,
        priceCurrency: 'USD',
        payAmount: 0.0003,
        payCurrency: 'BTC',
        payAddress: 'test-address',
      },
    });

    // 3) 非完了ステータスのIPNペイロードを作成
    const ipnPayload = createIPNPayload({
      payment_id: paymentId,
      payment_status: 'confirming', // 非完了ステータス
    });
    const payloadString = JSON.stringify(ipnPayload);
    const signature = await generateValidSignature(payloadString);

    // 4) IPNエンドポイントを呼び出し
    const response = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/ipn',
      payload: ipnPayload,
      headers: {
        'x-nowpayments-sig': signature,
        'content-type': 'application/json',
      },
    });

    // 5) レスポンスを検証
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.status).toBe('ok');

    // 6) ウォレットトランザクションが作成されていないことを確認
    const walletTransactions = await app.prisma.walletTransaction.findMany({
      where: { userId: user.id },
    });
    expect(walletTransactions.length).toBe(0); // 残高更新されていない
  });
});
