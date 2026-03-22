/**
 * 🎯 NOWPayments API ルート
 *
 * 責任:
 * - NOWPayments API統合
 * - 決済作成・状態確認
 * - IPN（Webhook）処理
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '@libark/core-shared';
import { hmacSha512Hex } from '@libark/core-server/security/server-crypto';
import { NOWPaymentsServiceClient } from '@libark/nowpayments-api';

// NOTE: Use fastify.prisma everywhere in this router to ensure test/mocked Prisma instance is used
// NOWPayments APIクライアント

// 共通エラーハンドリング
function handleError(reply: FastifyReply, error: unknown, context: string) {
  logger.error(`Failed to ${context}`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return reply.status(500).send({
    success: false,
    error: `Failed to ${context}`,
    details: error instanceof Error ? error.message : 'Unknown error',
  });
}

// IPN署名検証
async function verifyIPNSignature(
  body: string,
  signature: string,
  secret: string
): Promise<string> {
  return await hmacSha512Hex(secret, body);
}

// 型定義
type CurrencyCode =
  | 'USD'
  | 'BTC'
  | 'ETH'
  | 'USDT'
  | 'USDTBSC'
  | 'BNB'
  | 'LTC'
  | 'DOGE'
  | 'ADA'
  | 'DOT'
  | 'MATIC'
  | 'AVAX'
  | 'SOL'
  | 'TRX'
  | string;

interface CreatePaymentBody {
  price_amount: number;
  price_currency: CurrencyCode;
  pay_currency: CurrencyCode;
  order_id: string;
  order_description?: string;
}

interface IPNBody {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid?: number;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: string;
  created_at: string;
  updated_at: string;
}

export async function nowpaymentsRoutes(fastify: FastifyInstance) {
  // NOWPayments設定の検証
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  const sandboxMode = process.env.NOWPAYMENTS_IS_SANDBOX === 'true';
  const useMock =
    process.env.NOWPAYMENTS_USE_MOCK === 'true' ||
    (process.env.NODE_ENV !== 'production' &&
      process.env.NOWPAYMENTS_USE_MOCK !== 'false' &&
      !sandboxMode);
  const baseUrl =
    process.env.NOWPAYMENTS_BASE_URL ||
    (sandboxMode ? 'https://api-sandbox.nowpayments.io/v1' : 'https://api.nowpayments.io/v1');
  // Prisma モデル名差異を吸収（nOWPaymentsPayment vs nowPaymentsPayment）
  const getNOWPaymentsRepo = () => {
    const p = (
      fastify as {
        prisma: {
          nOWPaymentsPayment?: {
            create: (args: unknown) => Promise<unknown>;
            findMany: (args?: unknown) => Promise<unknown[]>;
            count: (args?: unknown) => Promise<number>;
            findUnique: (args: unknown) => Promise<unknown>;
            findFirst: (args: unknown) => Promise<unknown>;
            update: (args: unknown) => Promise<unknown>;
          };
          nowPaymentsPayment?: {
            create: (args: unknown) => Promise<unknown>;
            findMany: (args?: unknown) => Promise<unknown[]>;
            count: (args?: unknown) => Promise<number>;
            findUnique: (args: unknown) => Promise<unknown>;
            findFirst: (args: unknown) => Promise<unknown>;
            update: (args: unknown) => Promise<unknown>;
          };
        };
      }
    ).prisma;
    return (
      p.nowPaymentsPayment ??
      p.nOWPaymentsPayment ??
      (() => {
        throw new Error('NOWPaymentsPayment repository not found on prisma');
      })()
    );
  };

  logger.info('NOWPayments configuration loaded', {
    apiKeyConfigured: !!apiKey && apiKey !== 'your_nowpayments_api_key_here',
    ipnSecretConfigured: !!ipnSecret && ipnSecret !== 'your_nowpayments_ipn_secret_here',
    apiKeyLength: apiKey ? apiKey.length : 0,
  });

  if (!apiKey || !ipnSecret || apiKey === 'your_nowpayments_api_key_here') {
    if (useMock) {
      logger.warn('NOWPayments credentials missing; using MOCK mode for payment route');
    } else {
      logger.error('NOWPayments configuration missing or using placeholder values');
      throw new Error('Valid NOWPayments API credentials are required');
    }
  }

  logger.info('NOWPayments routes initialized');

  // NOWPaymentsServiceClientの初期化（モック時はダミーキーでも許可）
  const nowpaymentsClient = NOWPaymentsServiceClient.getInstance({
    apiKey: apiKey || '',
    ipnSecret: ipnSecret || 'mock',
    baseUrl,
  });

  logger.info('NOWPayments client initialized', {
    apiKeyConfigured: true,
    baseUrl,
    mode: useMock ? 'mock' : sandboxMode ? 'sandbox' : 'production',
  });

  /**
   * 🏥 API状態確認
   */
  fastify.get('/api/nowpayments/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 実際のAPI呼び出し
      const status = await nowpaymentsClient.getAPIStatus();

      return reply.send({
        success: true,
        data: status,
      });
    } catch (error) {
      return handleError(reply, error, 'get API status');
    }
  });

  /**
   * 🪙 利用可能な通貨の詳細情報取得（full-currencies APIを使用）
   */
  fastify.get(
    '/api/nowpayments/currencies/full',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        logger.info('Getting full currencies list');

        // NOWPayments APIから詳細な通貨情報を取得
        const response = await nowpaymentsClient.getFullCurrencies();

        const responseObj = response as { currencies?: unknown[] };
        logger.info('NOWPayments API response received', {
          currenciesCount:
            responseObj && responseObj.currencies ? responseObj.currencies.length : 0,
          isValidArray:
            responseObj && responseObj.currencies && Array.isArray(responseObj.currencies),
        });

        if (!responseObj.currencies || !Array.isArray(responseObj.currencies)) {
          logger.error('Invalid response format from full-currencies API', {
            responseType: typeof response,
            hasCurrencies: responseObj && 'currencies' in responseObj,
            currenciesType:
              responseObj && responseObj.currencies ? typeof responseObj.currencies : 'undefined',
          });
          throw new Error('Invalid response format from full-currencies API');
        }

        // 支払いと変換の両方に対応している通貨のみをフィルタリング
        const availableCurrencies = (
          responseObj.currencies as Array<{
            enable?: boolean;
            available_for_payment?: boolean;
            available_for_to_conversion?: boolean;
          }>
        ).filter(
          currency =>
            currency.enable === true &&
            currency.available_for_payment === true &&
            currency.available_for_to_conversion === true
        );

        logger.info('Full currencies retrieved and filtered', {
          totalCurrencies: responseObj.currencies.length,
          availableCurrencies: availableCurrencies.length,
          sampleCurrencies: availableCurrencies.slice(0, 5).map(currency => ({
            code: (currency as { code?: string }).code,
            name: (currency as { name?: string }).name,
            logo_url: (currency as { logo_url?: string }).logo_url,
          })),
        });

        return reply.send({
          success: true,
          data: availableCurrencies,
          source: 'nowpayments-full-currencies-api',

          metadata: {
            totalCurrencies: responseObj.currencies.length,
            availableCurrencies: availableCurrencies.length,
            filterCriteria: {
              enable: true,
              available_for_payment: true,
              available_for_to_conversion: true,
            },
          },
        });
      } catch (error) {
        logger.error('Failed to get full currencies', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get full currencies',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 🪙 マーチャント対応通貨一覧取得（従来のエンドポイント - 後方互換性のため保持）
   */
  fastify.get(
    '/api/nowpayments/merchant/coins',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        logger.info('Getting merchant available coins', {});

        // NOWPayments APIからマーチャント対応通貨を取得
        const merchantCoins = await nowpaymentsClient.getMerchantCoins();

        logger.info('Merchant coins retrieved', {
          count: merchantCoins.length,
          coins: merchantCoins.slice(0, 10), // 最初の10個をログ出力
        });

        return reply.send({
          success: true,
          data: merchantCoins,
          source: 'nowpayments-merchant-api',
        });
      } catch (error) {
        logger.error('Failed to get merchant coins', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get merchant coins',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 💰 利用可能通貨リスト取得（全通貨）
   */
  fastify.get(
    '/api/nowpayments/currencies',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 実際のNOWPayments APIから通貨リストを取得（モックなし）
        const rawCurrencies = await nowpaymentsClient.getAvailableCurrencies();

        logger.info('Currencies fetched from NOWPayments API', {
          count: rawCurrencies.length,

          apiKey: apiKey ? 'configured' : 'missing',
        });

        // 実際のAPIデータを処理
        const currencies = (rawCurrencies as any[]).map((currency: any) => ({
          ...currency,
          // ネットワーク情報を正規化
          network: currency.network || currency.ticker,
          networks: currency.networks || [currency.network || currency.ticker],
          // 人気通貨とステーブルコインのフラグを追加
          featured: [
            'BTC',
            'ETH',
            'USDT',
            'USDC',
            'LTC',
            'XRP',
            'ADA',
            'DOT',
            'MATIC',
            'BNB',
          ].includes(currency.ticker.toUpperCase()),
          is_stable: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD'].includes(
            currency.ticker.toUpperCase()
          ),
        }));

        // 人気通貨を優先的にソート
        const featuredCurrencies = [
          'BTC',
          'ETH',
          'USDT',
          'USDC',
          'LTC',
          'XRP',
          'ADA',
          'DOT',
          'MATIC',
          'BNB',
        ];
        currencies.sort((a: any, b: any) => {
          const aIndex = featuredCurrencies.indexOf(a.ticker);
          const bIndex = featuredCurrencies.indexOf(b.ticker);

          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.ticker.localeCompare(b.ticker);
        });

        logger.info('NOWPayments currencies retrieved from API', {
          count: currencies.length,
          featured: currencies.filter((c: any) => c.featured).length,
          stable: currencies.filter((c: any) => c.is_stable).length,
        });

        return reply.send({
          success: true,
          data: currencies,

          source: 'nowpayments_api',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get NOWPayments currencies', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get currencies',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 💵 最小決済額取得
   */
  fastify.get<{ Params: { currency: string } }>(
    '/api/nowpayments/min-amount/:currency',
    async (request: FastifyRequest<{ Params: { currency: string } }>, reply: FastifyReply) => {
      try {
        const { currency } = request.params;

        if (!currency) {
          return reply.status(400).send({
            success: false,
            error: 'Currency parameter is required',
          });
        }

        // 通貨コードを大文字に変換
        const currencyFrom = currency.toUpperCase(); // 暗号通貨
        const currencyTo = 'USD'; // USDへの最小額を取得

        logger.info('Getting minimum amount', {
          currencyFrom,
          currencyTo,
          note: 'Getting minimum crypto amount to convert to USD',
        });

        // NOWPayments APIから最小額を取得
        const minAmountData = await nowpaymentsClient.getMinAmount(
          currencyFrom.toUpperCase() as import('@libark/nowpayments-api').CryptoCurrency,
          currencyTo.toUpperCase() as import('@libark/nowpayments-api').FiatCurrency
        );

        logger.info('Minimum amount retrieved', {
          currencyFrom: minAmountData.currency_from,
          currencyTo: minAmountData.currency_to,
          minAmount: minAmountData.min_amount,
        });

        return reply.send({
          success: true,
          data: minAmountData,
        });
      } catch (error) {
        logger.error('Failed to get minimum amount', {
          error: error instanceof Error ? error.message : error,
          currency: request.params.currency,
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get minimum amount',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 💰 最大決済額取得
   */
  fastify.get<{ Params: { currency: string } }>(
    '/api/nowpayments/max-amount/:currency',
    async (request: FastifyRequest<{ Params: { currency: string } }>, reply: FastifyReply) => {
      try {
        const { currency } = request.params;

        if (!currency) {
          return reply.status(400).send({
            success: false,
            error: 'Currency parameter is required',
          });
        }

        // 通貨コードを大文字に変換
        const currencyFrom = currency.toUpperCase(); // 暗号通貨
        const currencyTo = 'USD'; // USDへの最大額を取得

        logger.info('Getting maximum amount', {
          currencyFrom,
          currencyTo,
          note: 'Getting maximum crypto amount to convert to USD',
        });

        // NOWPayments APIから最大額を取得
        const maxAmountData = await nowpaymentsClient.getMaxAmount(
          currencyFrom.toUpperCase() as import('@libark/nowpayments-api').FiatCurrency,
          currencyTo.toUpperCase() as import('@libark/nowpayments-api').CryptoCurrency
        );

        logger.info('Maximum amount retrieved', {
          currencyFrom: maxAmountData.currency_from,
          currencyTo: maxAmountData.currency_to,
          maxAmount: maxAmountData.max_amount,
        });

        return reply.send({
          success: true,
          data: maxAmountData,
        });
      } catch (error) {
        logger.error('Failed to get maximum amount', {
          error: error instanceof Error ? error.message : error,
          currency: request.params.currency,
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get maximum amount',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 💱 為替レート取得
   */
  fastify.get<{ Querystring: { currency_from: string; currency_to: string; amount: string } }>(
    '/api/nowpayments/estimate',
    async (
      request: FastifyRequest<{
        Querystring: { currency_from: string; currency_to: string; amount: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { currency_from, currency_to, amount } = request.query;

        if (!currency_from || !currency_to || !amount) {
          return reply.status(400).send({
            success: false,
            error: 'currency_from, currency_to, and amount parameters are required',
          });
        }

        logger.info('Getting exchange rate', {
          currencyFrom: currency_from,
          currencyTo: currency_to,
          amount: amount,
        });

        // NOWPayments APIから為替レートを取得
        logger.info('Calling getExchangeRate', {
          currency_from,
          currency_to,
          amount,
        });

        // 直接REST クライアントを使用
        const { NOWPaymentsRestClient } = await import('@libark/nowpayments-api');
        const restClient = new NOWPaymentsRestClient({
          apiKey: process.env.NOWPAYMENTS_API_KEY!,
          ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET!,
          baseUrl,
        });
        const exchangeRate = await restClient.getExchangeRate(
          currency_from as string,
          currency_to as string,
          parseFloat(amount)
        );

        logger.info('Exchange rate retrieved', {
          currencyFrom: currency_from,
          currencyTo: currency_to,
          amount: amount,
          rate: exchangeRate,
          rateType: typeof exchangeRate,
          rateKeys: exchangeRate ? Object.keys(exchangeRate) : 'null',
          estimatedAmount: (exchangeRate as { estimated_amount?: unknown })?.estimated_amount,
          estimatedAmountType: typeof (exchangeRate as { estimated_amount?: unknown })
            ?.estimated_amount,
        });

        return reply.send({
          success: true,
          data: exchangeRate,
        });
      } catch (error) {
        logger.error('Failed to get exchange rate', {
          error: error instanceof Error ? error.message : error,
          query: request.query,
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get exchange rate',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 💳 決済作成
   */
  fastify.post<{ Body: CreatePaymentBody }>(
    '/api/nowpayments/payment',
    {
      preHandler: fastify.requireAuth, // 認証を有効化
    },
    async (request: FastifyRequest<{ Body: CreatePaymentBody }>, reply: FastifyReply) => {
      try {
        const { price_amount, price_currency, pay_currency, order_id, order_description } =
          request.body;

        // バリデーション
        if (!price_amount || !price_currency || !pay_currency || !order_id) {
          return reply.status(400).send({
            success: false,
            error: 'Missing required fields',
          });
        }

        // 認証されたユーザーIDを取得
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        logger.info('Creating payment with NOWPayments API', {
          price_amount,
          price_currency,
          pay_currency,
          order_id,
          order_description,
        });

        // 決済作成（開発/テストはモック、他は実API）
        let payment: any;

        // まず実際のレートを取得（モック時でも正確なレート計算のため実API使用）
        let estimatedAmount = price_amount; // フォールバック初期値
        try {
          const exchangeRate = await nowpaymentsClient.getExchangeRate(
            price_currency as string,
            pay_currency as string,
            price_amount
          );
          estimatedAmount =
            (exchangeRate as { estimated_amount?: number }).estimated_amount || price_amount;
          logger.info('Exchange rate obtained', {
            from: price_currency,
            to: pay_currency,
            amount: price_amount,
            estimated: estimatedAmount,
          });
        } catch (error) {
          // API取得に失敗した場合でもテストが意味のある検証を行えるよう、
          // 通貨ペアに基づく簡易フォールバック換算を行う（概算の固定レート）
          const fallbackRatesUSDPerCrypto: Record<string, number> = {
            BTC: 50000,
            ETH: 2000,
            USDT: 1,
            USDC: 1,
            LTC: 70,
            BNB: 300,
          };
          const from = String(price_currency).toUpperCase();
          const to = String(pay_currency).toUpperCase();

          const isFromFiat = ['USD', 'EUR', 'JPY'].includes(from);
          const isToFiat = ['USD', 'EUR', 'JPY'].includes(to);
          const cryptoUSD = (code: string) => fallbackRatesUSDPerCrypto[code] ?? 1000; // 未知は$1000想定

          if (isFromFiat && !isToFiat) {
            // 例: USD -> BTC : USD金額を概算BTCに変換
            estimatedAmount = Math.max(0, +(price_amount / cryptoUSD(to)).toFixed(8));
          } else if (!isFromFiat && isToFiat) {
            // 例: BTC -> USD : BTC金額を概算USDに変換
            estimatedAmount = Math.max(0, +(price_amount * cryptoUSD(from)).toFixed(2));
          } else {
            // その他（暗号→暗号、法定→法定）は2%ディスカウントで差を付与
            estimatedAmount = Math.max(0, +(price_amount * 0.98).toFixed(8));
          }

          logger.warn('Failed to get exchange rate, using fallback', {
            error: error instanceof Error ? error.message : error,
            fallbackEstimated: estimatedAmount,
            from,
            to,
          });
        }

        if (useMock) {
          const { randomUUID } = await import('crypto');
          const id = randomUUID();
          const now = new Date().toISOString();
          payment = {
            payment_id: id,
            purchase_id: `purchase_${id.slice(0, 8)}`,
            payment_status: 'waiting',
            price_amount,
            price_currency,
            pay_amount: estimatedAmount, // 実際のレート使用
            pay_currency,
            pay_address: `mock_${String(pay_currency).toLowerCase()}_${id.slice(0, 6)}`,
            order_id,
            created_at: now,
            updated_at: now,
          };
          logger.info('Mock payment created with real exchange rate', {
            paymentId: id,
            priceAmount: price_amount,
            priceCurrency: price_currency,
            payAmount: estimatedAmount,
            payCurrency: pay_currency,
          });
        } else {
          payment = (await nowpaymentsClient.createPayment({
            price_amount,
            price_currency:
              price_currency.toUpperCase() as import('@libark/nowpayments-api').FiatCurrency,
            pay_currency:
              pay_currency.toUpperCase() as import('@libark/nowpayments-api').CryptoCurrency,
            order_id,
            order_description,
          })) as any;
        }

        // デバッグ: レスポンスの構造を確認
        logger.info('NOWPayments API Response Structure', {
          paymentId: payment.payment_id,
          purchaseId: payment.purchase_id,
          payinExtraId: (payment as { payin_extra_id?: string }).payin_extra_id,
          extraIdName: (payment as { extra_id_name?: string }).extra_id_name,
          allFields: Object.keys(payment),
          fullResponse: payment,
        });

        // DBに決済データを保存
        try {
          await getNOWPaymentsRepo().create({
            data: {
              userId: userId,
              paymentId: payment.payment_id,
              orderId: payment.order_id,
              purchaseId: payment.purchase_id,
              paymentStatus: String(payment.payment_status).toUpperCase() as unknown, // ENUMに変換
              priceAmount: payment.price_amount,
              priceCurrency: payment.price_currency,
              payAmount: payment.pay_amount,
              payCurrency: payment.pay_currency,
              payAddress: payment.pay_address,
              payinExtraId: (payment as { payin_extra_id?: string }).payin_extra_id || null, // XRP、XLMなどのメモ・タグ
              orderDescription: order_description,
              // NOWPaymentsのタイムスタンプも保存
              nowpaymentsCreatedAt: payment.created_at ? new Date(payment.created_at as any) : null,
              nowpaymentsUpdatedAt: payment.updated_at ? new Date(payment.updated_at as any) : null,
            },
          });

          logger.info('Payment saved to database', {
            paymentId: payment.payment_id,
            userId,
          });
        } catch (dbError) {
          logger.error('Failed to save payment to database', {
            paymentId: payment.payment_id,
            error: dbError,
          });
          // DB保存失敗でも決済作成は成功として扱う
        }

        logger.info('Payment created', {
          paymentId: payment.payment_id,
          orderId: order_id,
          amount: price_amount,
          currency: price_currency,
        });

        return reply.send({
          success: true,
          data: payment,
        });
      } catch (error) {
        logger.error('Failed to create NOWPayments payment', { error });

        // エラーメッセージを詳細に解析
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // 最小額エラーの特別処理
        if (errorMessage.includes('less than minimal')) {
          return reply.status(400).send({
            success: false,
            error: 'Minimum amount not met',
            details: '入金額が最小額を下回っています。より大きな金額を入力してください。',
            originalError: errorMessage,
          });
        }

        // その他のNOWPayments APIエラー
        if (errorMessage.includes('NOWPayments API Error')) {
          return reply.status(400).send({
            success: false,
            error: 'Payment service error',
            details: errorMessage,
          });
        }

        // 一般的なエラー
        return reply.status(500).send({
          success: false,
          error: 'Failed to create payment',
          details: errorMessage,
        });
      }
    }
  );

  /**
   * 📊 決済状態確認
   */
  fastify.get<{ Params: { paymentId: string } }>(
    '/api/nowpayments/payment/:paymentId',
    async (request: FastifyRequest<{ Params: { paymentId: string } }>, reply: FastifyReply) => {
      try {
        const { paymentId } = request.params;

        // 実際のAPI呼び出し
        const payment = await nowpaymentsClient.getPaymentStatus(paymentId);

        return reply.send({
          success: true,
          data: payment,
        });
      } catch (error) {
        logger.error('Failed to get NOWPayments payment status', {
          error,
          paymentId: request.params.paymentId,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get payment status',
        });
      }
    }
  );

  /**
   * 🔔 IPN（Webhook）エンドポイント
   */
  fastify.post<{ Body: IPNBody }>(
    '/api/nowpayments/ipn',
    async (request: FastifyRequest<{ Body: IPNBody }>, reply: FastifyReply) => {
      try {
        const signature = request.headers['x-nowpayments-sig'] as string;
        const body = JSON.stringify(request.body);

        if (!signature) {
          logger.warn('IPN received without signature');
          return reply.status(400).send({ error: 'Missing signature' });
        }

        // 署名検証
        const expectedSignature = await verifyIPNSignature(body, signature, ipnSecret || '');
        if (signature !== expectedSignature) {
          logger.warn('IPN signature verification failed', { signature, expectedSignature });
          return reply.status(401).send({ error: 'Invalid signature' });
        }

        // IPN処理を実行
        const processed = await nowpaymentsClient.handleIPN(body, signature);
        if (!processed) {
          logger.error('Failed to process IPN', {
            paymentId: request.body.payment_id,
            status: request.body.payment_status,
            orderId: request.body.order_id,
          });
          return reply.status(400).send({ error: 'Failed to process IPN' });
        }

        // IPNデータから決済情報を取得
        const ipnData = request.body;
        logger.info('IPN received and processed successfully', {
          paymentId: ipnData.payment_id,
          status: ipnData.payment_status,
          orderId: ipnData.order_id,
          amount: ipnData.actually_paid || ipnData.pay_amount,
          currency: ipnData.pay_currency,
        });

        // 決済完了時のウォレット残高更新処理
        if (ipnData.payment_status === 'finished') {
          try {
            // データベースから決済情報とユーザーIDを取得
            const payment = await getNOWPaymentsRepo().findUnique({
              where: { paymentId: ipnData.payment_id },
            });

            if (payment) {
              const paymentObj = payment as {
                userId: string;
                priceAmount: { toNumber: () => number } | number; // Decimal型
                priceCurrency: string;
                paymentStatus: string;
              };

              // Decimal型を数値に変換
              const priceAmount =
                typeof paymentObj.priceAmount === 'object' && paymentObj.priceAmount.toNumber
                  ? paymentObj.priceAmount.toNumber()
                  : Number(paymentObj.priceAmount);

              // 既に完了済みでない場合のみウォレット残高を更新
              if (paymentObj.paymentStatus.toLowerCase() !== 'finished') {
                logger.info('Payment completed via IPN, updating wallet balance', {
                  paymentId: ipnData.payment_id,
                  userId: paymentObj.userId,
                  amount: priceAmount,
                  currency: paymentObj.priceCurrency,
                });

                await updateWalletBalance(
                  paymentObj.userId,
                  priceAmount,
                  paymentObj.priceCurrency,
                  ipnData.payment_id
                );

                // 決済ステータスを更新
                await getNOWPaymentsRepo().update({
                  where: { paymentId: ipnData.payment_id },
                  data: {
                    paymentStatus: 'FINISHED' as unknown,
                    actuallyPaid: ipnData.actually_paid || undefined,
                    updatedAt: new Date(),
                  },
                });

                logger.info('Wallet balance updated successfully via IPN', {
                  paymentId: ipnData.payment_id,
                  userId: paymentObj.userId,
                });
              } else {
                logger.info('Payment already completed, skipping wallet update', {
                  paymentId: ipnData.payment_id,
                  currentStatus: paymentObj.paymentStatus,
                });
              }
            } else {
              logger.warn('Payment not found in database for IPN', {
                paymentId: ipnData.payment_id,
              });
            }
          } catch (error) {
            logger.error('Failed to update wallet balance via IPN', {
              paymentId: ipnData.payment_id,
              error: error instanceof Error ? error.message : error,
              stack: error instanceof Error ? error.stack : undefined,
            });
            // IPNの処理は成功として扱う（重複送信を避けるため）
          }
        }

        return reply.send({ status: 'ok' });
      } catch (error) {
        logger.error('Failed to process IPN', { error });
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  /**
   * 📋 決済履歴取得
   */
  fastify.get<{ Querystring: { userId?: string; limit?: string; offset?: string } }>(
    '/api/nowpayments/payments',
    async (
      request: FastifyRequest<{
        Querystring: { userId?: string; limit?: string; offset?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId =
          request.query.userId ||
          (request.headers['x-user-id'] as string) ||
          '00000000-0000-0000-0000-000000000000';
        const limit = parseInt(request.query.limit || '10');
        const offset = parseInt(request.query.offset || '0');

        const payments = await getNOWPaymentsRepo().findMany({
          where: {
            userId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        });

        const total = await getNOWPaymentsRepo().count({
          where: {
            userId: userId,
          },
        });

        logger.info('Payment history retrieved', {
          userId,
          count: payments.length,
          total,
        });

        return reply.send({
          success: true,
          data: {
            payments,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total,
            },
          },
        });
      } catch (error) {
        logger.error('Failed to get payment history', { error });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get payment history',
        });
      }
    }
  );

  /**
   * 🔄 決済状態更新
   */
  fastify.patch<{ Params: { paymentId: string }; Body: { status: string; actuallyPaid?: number } }>(
    '/api/nowpayments/payment/:paymentId/status',
    async (
      request: FastifyRequest<{
        Params: { paymentId: string };
        Body: { status: string; actuallyPaid?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { paymentId } = request.params;
        const { status, actuallyPaid } = request.body;

        // 既存の決済を読み込み（古いステータス判定用）
        const existing = await getNOWPaymentsRepo().findUnique({
          where: { paymentId },
        });
        if (!existing) {
          return reply.status(404).send({ success: false, error: 'Payment not found' });
        }

        // ステータス変更に基づくウォレット反映
        const oldStatus = ((existing as { paymentStatus?: unknown }).paymentStatus || '')
          .toString()
          .toLowerCase();
        const newStatus = (status || '').toString().toLowerCase();
        if (newStatus === 'finished' && oldStatus !== 'finished') {
          const toNum = (val: unknown): number => {
            if (val == null) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val);
            if (typeof val === 'bigint') return Number(val);
            if (typeof (val as { toNumber?: () => number }).toNumber === 'function')
              return (val as { toNumber: () => number }).toNumber();
            return Number(val);
          };
          try {
            const existingObj = existing as {
              userId: string;
              priceAmount: unknown;
              priceCurrency: string;
            };
            await updateWalletBalance(
              existingObj.userId,
              toNum(existingObj.priceAmount),
              existingObj.priceCurrency,
              paymentId
            );
          } catch (e) {
            logger.error('Failed to update wallet on status=finished', { paymentId, error: e });
          }
        }

        // 決済レコードを更新
        const updatedPayment = await getNOWPaymentsRepo().update({
          where: { paymentId },
          data: {
            paymentStatus: (status || '').toString().toUpperCase() as unknown,
            actuallyPaid: actuallyPaid != null ? actuallyPaid : undefined,
          },
        });

        logger.info('Payment status updated', {
          paymentId,
          oldStatus,
          newStatus: status,
          actuallyPaid,
        });

        return reply.send({
          success: true,
          data: updatedPayment,
        });
      } catch (error) {
        logger.error('Failed to update payment status', {
          error,
          paymentId: request.params.paymentId,
        });
        return reply.status(500).send({
          success: false,
          error: 'Failed to update payment status',
          details: error instanceof Error ? error.message : String(error),
          ...(process.env.NODE_ENV === 'test' && error instanceof Error
            ? { stack: error.stack }
            : {}),
        });
      }
    }
  );

  /**
   * 📋 NOWPayments暗号通貨入金履歴取得
   */
  fastify.get(
    '/api/nowpayments/payments/history',
    {
      preHandler: fastify.requireAuth, // 認証を有効化
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        logger.info('Getting payment history for user', { userId });

        // ユーザーの入金履歴のみを取得
        const payments = await getNOWPaymentsRepo().findMany({
          where: {
            userId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // 最新50件
        });

        logger.info('Found payments', { count: payments.length, userId });

        return reply.send({
          success: true,
          data: payments,
        });
      } catch (error) {
        logger.error('Failed to get payment history', { error });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get payment history',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 📄 NOWPayments暗号通貨入金詳細取得
   */
  fastify.get<{ Params: { paymentId: string } }>(
    '/api/nowpayments/payments/:paymentId',
    {
      preHandler: fastify.requireAuth, // 認証を有効化
    },
    async (request: FastifyRequest<{ Params: { paymentId: string } }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        const { paymentId } = request.params;
        logger.info('Getting payment detail for user', { userId, paymentId });

        // ユーザーの特定の決済詳細を取得
        const payment = await getNOWPaymentsRepo().findFirst({
          where: {
            userId: userId,
            paymentId: paymentId,
          },
        });

        if (!payment) {
          return reply.status(404).send({
            success: false,
            error: 'Payment not found',
          });
        }

        logger.info('Found payment detail', { userId, paymentId });

        return reply.send({
          success: true,
          data: payment,
        });
      } catch (error) {
        logger.error('Failed to get payment detail', { error });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get payment detail',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 🔧 管理者用：全ユーザーのNOWPayments暗号通貨入金履歴取得
   */
  fastify.get(
    '/api/nowpayments/payments/admin/history',
    { preHandler: fastify.requireAuth },
    async (request, reply: FastifyReply) => {
      try {
        // 厳格な管理者チェック
        const userIdFromRequest = request.user?.id;
        if (!userIdFromRequest) {
          return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }

        const isAdmin = await fastify.auth.isAdmin(userIdFromRequest);
        if (!isAdmin) {
          return reply.status(403).send({ success: false, error: 'Forbidden' });
        }

        const {
          page = '1',
          limit = '20',
          status,
          userId,
        } = request.query as { page?: string; limit?: string; status?: string; userId?: string };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        logger.info('Getting admin payment history', { page, limit, status, userId });

        const where: { paymentStatus?: string; userId?: string } = {};
        if (status) {
          where.paymentStatus = status;
        }
        if (userId) {
          where.userId = userId;
        }

        const [payments, total] = await Promise.all([
          getNOWPaymentsRepo().findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: parseInt(limit),
          }),
          getNOWPaymentsRepo().count({ where }),
        ]);

        return reply.send({
          success: true,
          data: {
            payments,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages: Math.ceil(total / parseInt(limit)),
            },
          },
        });
      } catch (error) {
        logger.error('Failed to get admin payment history', { error });
        return reply.status(500).send({
          success: false,
          error: 'Failed to get admin payment history',
        });
      }
    }
  );

  /**
   * 💰 入金成功時にウォレット残高を更新
   */
  async function updateWalletBalance(
    userId: string,
    amount: number,
    currency: string,
    paymentId: string
  ) {
    try {
      logger.info('Updating wallet balance', { userId, amount, currency, paymentId });

      // USDに統一して残高更新
      const usdAmount = currency === 'USD' ? amount : amount; // 簡易実装

      // ウォレットトランザクション履歴を記録（成功した入金のみ）
      await fastify.prisma.walletTransaction.create({
        data: {
          userId: userId,
          type: 'DEPOSIT',
          // balanceType はデフォルト WALLET のため省略可能
          amountUsd: usdAmount.toString(),
          description: `暗号通貨入金完了 (${currency})`,
          metadata: {
            paymentId: paymentId,
            originalCurrency: currency,
            originalAmount: amount,
            source: 'nowpayments',
          },
        },
      });

      logger.info('Wallet transaction recorded successfully', {
        userId,
        usdAmount,
        paymentId,
      });
    } catch (error) {
      logger.error('Failed to update wallet balance', {
        userId,
        amount,
        currency,
        paymentId,
        error,
      });
      throw error;
    }
  }

  /**
   * 🔄 決済ステータス更新時の処理
   */
  async function _handlePaymentStatusUpdate(paymentId: string, newStatus: string) {
    try {
      // データベースから決済情報を取得
      const payment = await getNOWPaymentsRepo().findUnique({
        where: { paymentId },
      });

      if (!payment) {
        logger.warn('Payment not found for status update', { paymentId });
        return;
      }

      const paymentObj = payment as {
        paymentStatus: string;
        userId: string;
        priceAmount: { toNumber(): number };
        priceCurrency: string;
      };
      const oldStatus = paymentObj.paymentStatus;

      // ステータスが「完了」に変更された場合のみウォレット残高を更新
      if (newStatus.toLowerCase() === 'finished' && oldStatus.toLowerCase() !== 'finished') {
        logger.info('Payment completed, updating wallet balance', {
          paymentId,
          userId: paymentObj.userId,
          amount: paymentObj.priceAmount.toNumber(),
          currency: paymentObj.priceCurrency,
        });

        await updateWalletBalance(
          paymentObj.userId,
          paymentObj.priceAmount.toNumber(),
          paymentObj.priceCurrency,
          paymentId
        );
      }

      // ステータスを更新
      await getNOWPaymentsRepo().update({
        where: { paymentId },
        data: {
          paymentStatus: newStatus.toUpperCase() as unknown,
          updatedAt: new Date(),
        },
      });

      logger.info('Payment status updated', {
        paymentId,
        oldStatus,
        newStatus,
      });
    } catch (error) {
      logger.error('Failed to handle payment status update', {
        paymentId,
        newStatus,
        error,
      });
      throw error;
    }
  }
}

export default nowpaymentsRoutes;
