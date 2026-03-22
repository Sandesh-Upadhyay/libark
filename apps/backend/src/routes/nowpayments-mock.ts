import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// 型は厳格に。ただしレスポンスはNOWPaymentsの最低限の互換に留める
interface PaymentRecord {
  payment_id: string;
  purchase_id: string;
  payment_status:
    | 'waiting'
    | 'confirming'
    | 'confirmed'
    | 'sending'
    | 'partially_paid'
    | 'finished'
    | 'failed'
    | 'refunded'
    | 'expired';
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  pay_address: string;
  order_id: string;
  order_description?: string;
  created_at: string;
  updated_at: string;
  payin_extra_id?: string;
  extra_id_name?: string;
}

const BASE = '/mock/nowpayments/v1';

// メモリ内ストア（開発/テスト専用）
const payments: PaymentRecord[] = [];

const MAJOR_COINS = ['btc', 'eth', 'usdt', 'usdc', 'ltc', 'xrp', 'ada', 'dot', 'matic', 'bnb'];

function estimateAmount(amount: number): number {
  // シンプルなダミー: 手数料2%差し引き
  return Math.max(0, Math.round(amount * 0.98 * 1e8) / 1e8);
}

export async function nowpaymentsMockRoutes(app: FastifyInstance) {
  app.log.info('[NOWPayments Mock] registering mock routes');

  // ヘルス
  app.get(`${BASE}/status`, async (_req, reply) => {
    return reply.send({ message: 'OK', status: 'success' });
  });

  // 通貨一覧（簡易）
  app.get(`${BASE}/currencies`, async (_req, reply) => {
    return reply.send({ currencies: MAJOR_COINS });
  });

  // フル通貨情報
  app.get(`${BASE}/full-currencies`, async (_req, reply) => {
    const currencies = MAJOR_COINS.map(code => ({
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      logo_url: `https://dummy.libark.local/${code}.png`,
      enable: true,
      available_for_payment: true,
      available_for_to_conversion: true,
    }));
    return reply.send({ currencies });
  });

  // マーチャント対応通貨
  app.get(`${BASE}/merchant/coins`, async (_req, reply) => {
    return reply.send({ selectedCurrencies: MAJOR_COINS });
  });

  // 最小額
  app.get(
    `${BASE}/min-amount`,
    async (
      req: FastifyRequest<{ Querystring: { currency_from?: string; currency_to?: string } }>,
      reply: FastifyReply
    ) => {
      const { currency_from = 'btc', currency_to = 'usd' } = req.query || {};
      const min = currency_from.toLowerCase() === 'btc' ? 0.0001 : 1;
      return reply.send({ currency_from, currency_to, min_amount: min });
    }
  );

  // 見積り
  app.get(
    `${BASE}/estimate`,
    async (
      req: FastifyRequest<{
        Querystring: { currency_from?: string; currency_to?: string; amount?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { currency_from = 'btc', currency_to = 'usd', amount = '1' } = req.query || {};
      const num = Number(amount) || 0;
      const estimated_amount = estimateAmount(num);
      return reply.send({ currency_from, currency_to, amount: num, estimated_amount });
    }
  );

  // 決済作成
  app.post(
    `${BASE}/payment`,
    async (request: FastifyRequest<{ Body: Record<string, unknown> }>, reply: FastifyReply) => {
      const { price_amount, price_currency, pay_currency, order_id, order_description } =
        (request.body || {}) as {
          price_amount: number;
          price_currency: string;
          pay_currency: string;
          order_id: string;
          order_description?: string;
        };

      if (!price_amount || !price_currency || !pay_currency || !order_id) {
        return reply.status(400).send({ error: 'Missing required fields' });
      }

      const id = randomUUID();
      const now = new Date().toISOString();

      const record: PaymentRecord = {
        payment_id: id,
        purchase_id: `purchase_${id.slice(0, 8)}`,
        payment_status: 'waiting',
        price_amount,
        price_currency,
        pay_amount: estimateAmount(price_amount),
        pay_currency,
        pay_address: `mock_${pay_currency}_${id.slice(0, 6)}`,
        order_id,
        order_description,
        created_at: now,
        updated_at: now,
      };
      payments.push(record);

      return reply.send(record);
    }
  );

  // 決済1件取得
  app.get(
    `${BASE}/payment/:paymentId`,
    async (req: FastifyRequest<{ Params: { paymentId: string } }>, reply: FastifyReply) => {
      const p = payments.find(x => x.payment_id === req.params.paymentId);
      if (!p) return reply.status(404).send({ error: 'Not found' });
      return reply.send(p);
    }
  );

  // 決済一覧
  app.get(
    `${BASE}/payment`,
    async (
      req: FastifyRequest<{ Querystring: { limit?: string; page?: string } }>,
      reply: FastifyReply
    ) => {
      const limit = parseInt(req.query?.limit || '10');
      const page = parseInt(req.query?.page || '0');
      const start = page * limit;
      const slice = payments.slice(start, start + limit);
      return reply.send(slice);
    }
  );

  // ステータス変更（デモ用）
  app.patch(
    `${BASE}/payment/:paymentId/status`,
    async (
      req: FastifyRequest<{
        Params: { paymentId: string };
        Body: { status: PaymentRecord['payment_status'] };
      }>,
      reply: FastifyReply
    ) => {
      const idx = payments.findIndex(x => x.payment_id === req.params.paymentId);
      if (idx < 0) return reply.status(404).send({ error: 'Not found' });
      const status = req.body?.status || 'confirming';
      payments[idx].payment_status = status;
      payments[idx].updated_at = new Date().toISOString();
      return reply.send(payments[idx]);
    }
  );
}

export default nowpaymentsMockRoutes;
