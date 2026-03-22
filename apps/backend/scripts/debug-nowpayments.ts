import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@libark/db';

import { createTestApp, cleanupTestApp } from '../src/__tests__/helpers/test-app.js';

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.NOWPAYMENTS_USE_MOCK = 'true';
  const app = (await createTestApp({ initializeGraphQL: false })) as FastifyInstance & {
    prisma: PrismaClient;
  };
  const { nowpaymentsRoutes } = await import('../src/routes/nowpayments.js');
  await app.register(nowpaymentsRoutes);

  try {
    const user = await app.prisma.user.create({
      data: {
        email: `debug_${Date.now()}@example.com`,
        username: `debug_${Date.now()}`,
        passwordHash: 'x',
        isActive: true,
      } as unknown,
    });

    const token = await app.auth.generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: 'D',
      role: 'USER',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown);

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
  } finally {
    await cleanupTestApp(app);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
