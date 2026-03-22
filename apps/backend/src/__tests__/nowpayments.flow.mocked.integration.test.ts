import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';
import { createTestUser, cleanupTestData } from './helpers/test-data.js';

/**
 * 作成→完了→ウォレット更新フロー（モック時間短縮版）
 */

describe('NOWPayments Mocked Flow: create -> finish -> wallet updated', () => {
  let app: FastifyInstance & { prisma: PrismaClient };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.NOWPAYMENTS_USE_MOCK = 'true';
    app = await createTestApp({ initializeGraphQL: false });

    const { nowpaymentsRoutes } = await import('../routes/nowpayments.js');
    await app.register(nowpaymentsRoutes);
  });

  afterAll(async () => {
    await cleanupTestData(app.prisma);
    await cleanupTestApp(app);
  });

  it('should create payment, mark finished, and record wallet transaction', async () => {
    // 1) ユーザー作成
    const user = await createTestUser(app.prisma, {
      email: `flow_${Date.now()}@example.com`,
      username: `flow_${Date.now()}`,
      password: 'TestPassword123!',
      displayName: 'Flow Tester',
    });

    // 2) 認証トークン発行
    const token = await app.auth.generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName!,
      role: 'USER' as const,
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3) 決済作成（モックレスポンス、ただしレート計算は実API使用）
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/payment',
      payload: {
        price_amount: 12,
        price_currency: 'USD',
        pay_currency: 'BTC',
        order_id: `order-flow-${Date.now()}`,
      },
      headers: { cookie: `accessToken=${token}` },
    });
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body).data;

    // レート計算が正しく行われているか確認（12 USD ≠ 12 BTC）
    expect(created.pay_amount).not.toBe(created.price_amount);
    const payAmountNum = parseFloat(created.pay_amount);
    expect(payAmountNum).toBeGreaterThan(0);
    expect(payAmountNum).toBeLessThan(1); // 12 USD は 1 BTC 未満のはず

    // 4) 完了へ更新
    const finishRes = await app.inject({
      method: 'PATCH',
      url: `/api/nowpayments/payment/${created.payment_id}/status`,
      payload: {
        status: 'FINISHED',
      },
      headers: { cookie: `accessToken=${token}` },
    });
    if (finishRes.statusCode !== 200) {
      // デバッグ: レスポンス本文を出力
      console.error(
        'PATCH /nowpayments/payment/:id/status failed:',
        finishRes.statusCode,
        finishRes.body
      );
    }
    expect(finishRes.statusCode).toBe(200);

    // 5) ウォレットトランザクションが作成されているか（最新1件で検証）
    const tx = await app.prisma.walletTransaction.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(tx).not.toBeNull();
    expect(tx!.type).toBe('DEPOSIT');
    // Prismaスキーマ上、statusフィールドは存在しないため、descriptionとmetadataで検証
    expect(tx!.description).toContain('暗号通貨入金完了');
    const meta = tx!.metadata as { paymentId?: string };
    expect(meta.paymentId).toBe(created.payment_id);
  });
});
