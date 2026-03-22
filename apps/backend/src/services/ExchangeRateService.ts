/**
 * 🏦 為替レートサービス
 *
 * リアルタイム為替レートの取得・キャッシュ管理
 */

import { prisma } from '@libark/db';
import { createLogger } from '@libark/core-shared';
import { getRedisClient } from '@libark/redis-client';

const logger = createLogger({ name: 'exchange-rate-service' });

const CACHE_TTL = 300; // 5分
const API_TIMEOUT = 5000; // 5秒

// フォールバックレート（API障害時）
const FALLBACK_RATES: Record<string, number> = {
  JPY: 150.0,
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.24,
  KRW: 1350.0,
};

export class ExchangeRateService {
  private static instance: ExchangeRateService;

  private constructor() {}

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * 為替レートを取得（キャッシュ優先）
   * @param currency 通貨コード（JPY, USD, EUR等）
   * @returns USDに対するレート
   */
  async getRate(currency: string): Promise<number> {
    const normalizedCurrency = currency.toUpperCase();
    const cacheKey = `exchange_rate:${normalizedCurrency}`;

    try {
      const redis = getRedisClient();

      // キャッシュから取得
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Exchange rate cache hit', { currency: normalizedCurrency });
        return parseFloat(cached);
      }

      // 外部APIから取得
      const rate = await this.fetchFromAPI(normalizedCurrency);

      // キャッシュに保存
      await redis.setex(cacheKey, CACHE_TTL, rate.toString());

      // DBにも保存（履歴用）
      await this.saveToDatabase(normalizedCurrency, rate);

      logger.info('Exchange rate fetched from API', {
        currency: normalizedCurrency,
        rate,
      });

      return rate;
    } catch (error) {
      logger.warn('Failed to fetch exchange rate, using fallback', {
        currency: normalizedCurrency,
        error: error instanceof Error ? error.message : String(error),
      });

      // フォールバックレートを返す
      return FALLBACK_RATES[normalizedCurrency] || 1.0;
    }
  }

  /**
   * 複数通貨のレートを一括取得
   */
  async getRates(currencies: string[]): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};

    await Promise.all(
      currencies.map(async currency => {
        rates[currency.toUpperCase()] = await this.getRate(currency);
      })
    );

    return rates;
  }

  /**
   * 外部APIからレートを取得
   */
  private async fetchFromAPI(currency: string): Promise<number> {
    // 複数のAPIソースを試行
    const sources = [
      () => this.fetchFromExchangeRateAPI(currency),
      () => this.fetchFromDatabase(currency),
    ];

    for (const source of sources) {
      try {
        const rate = await source();
        if (rate && rate > 0) {
          return rate;
        }
      } catch (error) {
        logger.debug('API source failed, trying next', { error });
      }
    }

    // 全てのソースが失敗した場合
    throw new Error(`Failed to fetch rate for ${currency}`);
  }

  /**
   * ExchangeRate-APIから取得
   */
  private async fetchFromExchangeRateAPI(currency: string): Promise<number> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rates?.[currency];

      if (!rate) {
        throw new Error(`Currency ${currency} not found in API response`);
      }

      return rate;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * データベースからレートを取得（フォールバック）
   */
  private async fetchFromDatabase(currency: string): Promise<number> {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        currency: currency.toUpperCase(),
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!exchangeRate) {
      throw new Error(`No rate found in database for ${currency}`);
    }

    return Number(exchangeRate.usdRate);
  }

  /**
   * レートをデータベースに保存
   */
  private async saveToDatabase(currency: string, rate: number): Promise<void> {
    try {
      await prisma.exchangeRate.upsert({
        where: {
          currency_source: {
            currency: currency.toUpperCase(),
            source: 'api',
          },
        },
        update: {
          usdRate: rate,
        },
        create: {
          currency: currency.toUpperCase(),
          usdRate: rate,
          source: 'api',
        },
      });
    } catch (error) {
      logger.error('Failed to save exchange rate to database', {
        currency,
        rate,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 金額を通貨間で換算
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return amount;
    }

    const fromRate = await this.getRate(fromCurrency);
    const toRate = await this.getRate(toCurrency);

    // USD基準で換算
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();
