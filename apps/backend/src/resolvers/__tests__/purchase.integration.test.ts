import { describe, it, expect, beforeEach, afterAll, beforeAll, vi } from 'vitest';

import { createTestApp, cleanupTestApp } from '../../__tests__/helpers/test-app.js';
import { createTestUser, cleanupTestData } from '../../__tests__/helpers/test-data.js';
import { createGraphQLContext } from '../../graphql/context.js';
import { postMutations } from '../post/mutations.js';

// counterManager のモック
vi.mock('@libark/redis-client', async importOriginal => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    counterManager: {
      incrementUserStat: vi.fn().mockResolvedValue(true),
      incrementGlobalStat: vi.fn().mockResolvedValue(true),
      incrementPostStat: vi.fn().mockResolvedValue(true),
    },
  };
});

describe('Purchase Integration', () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  beforeEach(async () => {
    await cleanupTestData(app.prisma);
    await app.redis.flushdb();

    await app.prisma.siteFeatureSetting.upsert({
      where: { featureName: 'POST_CREATE' },
      update: { isEnabled: true },
      create: { featureName: 'POST_CREATE', isEnabled: true },
    });
  });

  it('有料投稿を購入し、残高が正しく移動することを検証する', async () => {
    const buyerEmail = 'buyer@test.com';
    const sellerEmail = 'seller@test.com';
    const buyerUser = await createTestUser(app.prisma, {
      email: buyerEmail,
      username: 'buyer',
      password: 'Test12345!',
    });
    const sellerUser = await createTestUser(app.prisma, {
      email: sellerEmail,
      username: 'seller',
      password: 'Test12345!',
    });

    // 1. 売り手が有料投稿を作成
    const post = await app.prisma.post.create({
      data: {
        userId: sellerUser.id,
        content: 'Paid Post',
        visibility: 'PAID',
        price: 10.0,
      },
    });
    const postId = post.id;

    // 2. 残高設定
    await app.prisma.wallet.create({
      data: { userId: buyerUser.id, balanceUsd: 15.0 },
    });
    await app.prisma.wallet.create({
      data: { userId: sellerUser.id, balanceUsd: 0.0, salesBalanceUsd: 0.0 },
    });

    // 3. 購入 (リゾルバー直接呼び出し)
    const context = await createGraphQLContext({
      request: { headers: { 'x-test-user-id': buyerUser.id } } as any,
      reply: {} as any,
      fastify: app,
    });

    const result = await postMutations.purchasePost({}, { input: { postId } }, context);
    expect(result.price).toBe(10.0);

    // 4. 残高確認
    const buyerWallet = await app.prisma.wallet.findUnique({ where: { userId: buyerUser.id } });
    const sellerWallet = await app.prisma.wallet.findUnique({ where: { userId: sellerUser.id } });

    console.log('DEBUG: Test - Buyer Wallet:', JSON.stringify(buyerWallet));
    console.log('DEBUG: Test - Seller Wallet:', JSON.stringify(sellerWallet));
    console.log(
      'DEBUG: Test - Seller SalesBalanceUsd:',
      sellerWallet.salesBalanceUsd,
      'type:',
      typeof sellerWallet.salesBalanceUsd
    );

    expect(Number(buyerWallet.balanceUsd)).toBe(5.0);
    expect(Number(sellerWallet.salesBalanceUsd)).toBe(10.0);
  });

  it('残高不足で購入が失敗することを検証する', async () => {
    const buyerEmail = 'buyer2@test.com';
    const sellerEmail = 'seller2@test.com';
    const buyerUser = await createTestUser(app.prisma, {
      email: buyerEmail,
      username: 'buyer2',
      password: 'Test12345!',
    });
    const sellerUser = await createTestUser(app.prisma, {
      email: sellerEmail,
      username: 'seller2',
      password: 'Test12345!',
    });

    const post = await app.prisma.post.create({
      data: {
        userId: sellerUser.id,
        content: 'Expensive Post',
        visibility: 'PAID',
        price: 100.0,
      },
    });
    const postId = post.id;

    await app.prisma.wallet.create({
      data: { userId: buyerUser.id, balanceUsd: 50.0 },
    });

    // 3. 購入 (リゾルバー直接呼び出し)
    const context = await createGraphQLContext({
      request: { headers: { 'x-test-user-id': buyerUser.id } } as any,
      reply: {} as any,
      fastify: app,
    });
    context.prisma = app.prisma; // 確実に Prisma を渡す

    await expect(postMutations.purchasePost({}, { input: { postId } }, context)).rejects.toThrow(
      '残高が不足しています'
    );
  });
});
