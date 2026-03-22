import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { createTestApp, cleanupTestApp } from './helpers/test-app.js';

/**
 * NOWPayments モックルート 統合テスト
 * - 開発/テストではモックでエンドツーエンドの動作確認が可能
 */

describe('NOWPayments Mock Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.NOWPAYMENTS_USE_MOCK = 'true';
    app = await createTestApp();
    // テスト用にモックルートを登録
    try {
      const { nowpaymentsMockRoutes } = await import('../routes/nowpayments-mock.js');
      await app.register(nowpaymentsMockRoutes);
    } catch (error) {
      console.error('Failed to register nowpayments mock routes:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestApp(app as unknown);
  });

  it('status が取得できる', async () => {
    const res = await app.inject({ method: 'GET', url: '/mock/nowpayments/v1/status' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('success');
  });

  it('payment を作成して取得できる', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/mock/nowpayments/v1/payment',
      payload: {
        price_amount: 10,
        price_currency: 'USD',
        pay_currency: 'BTC',
        order_id: 'order-1',
        order_description: 'demo',
      },
    });
    expect(create.statusCode).toBe(200);
    const created = JSON.parse(create.body);
    expect(created.payment_id).toBeDefined();

    const get = await app.inject({
      method: 'GET',
      url: `/mock/nowpayments/v1/payment/${created.payment_id}`,
    });
    expect(get.statusCode).toBe(200);
    const fetched = JSON.parse(get.body);
    expect(fetched.payment_id).toBe(created.payment_id);
  });
});
