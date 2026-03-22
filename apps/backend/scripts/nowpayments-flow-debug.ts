import { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@libark/db';

import { createTestApp, cleanupTestApp } from '../src/__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../src/__tests__/helpers/test-data.js';

(async () => {
  let app: FastifyInstance & { prisma: PrismaClient };
  try {
    process.env.NODE_ENV = 'test';
    process.env.NOWPAYMENTS_USE_MOCK = 'true';

    app = await createTestApp();
    const { nowpaymentsRoutes } = await import('../src/routes/nowpayments.js');
    await app.register(nowpaymentsRoutes);

    const user = await createTestUser(app.prisma, {
      email: `debug_${Date.now()}@example.com`,
      username: `debug_${Date.now()}`,
      password: 'TestPassword123!',
      displayName: 'Debug User',
    });

    const token = await app.auth.generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName!,
      role: 'USER',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/nowpayments/payment',
      payload: {
        price_amount: 12,
        price_currency: 'USD',
        pay_currency: 'BTC',
        order_id: `order-debug-${Date.now()}`,
      },
      headers: { cookie: `accessToken=${token}` },
    });
    console.log('CREATE', createRes.statusCode, createRes.body);
    const created = JSON.parse(createRes.body).data;

    const finishRes = await app.inject({
      method: 'PATCH',
      url: `/api/nowpayments/payment/${created.payment_id}/status`,
      payload: { status: 'FINISHED' },
      headers: { cookie: `accessToken=${token}` },
    });
    console.log('FINISH', finishRes.statusCode, finishRes.body);
  } catch (e) {
    console.error('DEBUG_SCRIPT_ERROR', e);
  } finally {
    if (app) {
      try {
        await cleanupTestData(app.prisma);
      } catch {
        // Ignore cleanup errors
      }
      await cleanupTestApp(app);
    }
  }
})();
