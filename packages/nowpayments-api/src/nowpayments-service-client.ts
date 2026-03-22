/**
 * 🎯 NOWPayments サービスクライアント（統合クライアント）
 */

import { EventEmitter } from 'events';

import { logger } from '@libark/core-shared';

import { NOWPaymentsRestClient } from './rest-client.js';
import { NOWPaymentsIPNHandler } from './ipn-handler.js';
import type {
  NOWPaymentsConfig,
  CreatePaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  CurrencyInfo,
  IPNData,
  PaymentEvent,
  CryptoCurrency,
  FiatCurrency,
} from './types.js';

export class NOWPaymentsServiceClient extends EventEmitter {
  private static instance: NOWPaymentsServiceClient | null = null;
  private restClient: NOWPaymentsRestClient;
  private ipnHandler: NOWPaymentsIPNHandler;
  private exchangeRateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5分

  private constructor(config: NOWPaymentsConfig) {
    super();
    this.restClient = new NOWPaymentsRestClient(config);
    this.ipnHandler = new NOWPaymentsIPNHandler(config.ipnSecret);

    this.setupIPNEventHandlers();

    logger.info('NOWPayments Service Client initialized');
  }

  /**
   * 🏭 シングルトンインスタンスを取得
   */
  static getInstance(config?: NOWPaymentsConfig): NOWPaymentsServiceClient {
    if (!NOWPaymentsServiceClient.instance) {
      if (!config) {
        throw new Error('NOWPayments configuration is required for first initialization');
      }
      NOWPaymentsServiceClient.instance = new NOWPaymentsServiceClient(config);
    }
    return NOWPaymentsServiceClient.instance;
  }

  /**
   * 🔗 IPNイベントハンドラーを設定
   */
  private setupIPNEventHandlers(): void {
    this.ipnHandler.onPaymentEvent((event: PaymentEvent) => {
      logger.info('Payment event received', {
        type: event.type,
        paymentId: event.payment.payment_id,
        status: event.payment.payment_status,
      });

      // イベントを上位に転送
      this.emit('payment_event', event);
      this.emit(event.type, event.payment);
    });

    this.ipnHandler.onPaymentSuccess((ipnData: IPNData) => {
      logger.info('Payment completed successfully', {
        paymentId: ipnData.payment_id,
        orderId: ipnData.order_id,
        amount: ipnData.actually_paid || ipnData.pay_amount,
        currency: ipnData.pay_currency,
      });
    });

    this.ipnHandler.onPaymentFailure((ipnData: IPNData) => {
      logger.warn('Payment failed', {
        paymentId: ipnData.payment_id,
        orderId: ipnData.order_id,
        status: ipnData.payment_status,
      });
    });
  }

  // ==================== REST API メソッド ====================

  /**
   * 🏥 API状態を確認
   */
  async getAPIStatus() {
    return this.restClient.getAPIStatus();
  }

  /**
   * 💰 利用可能な通貨リストを取得
   */
  async getAvailableCurrencies(): Promise<CurrencyInfo[]> {
    return this.restClient.getAvailableCurrencies();
  }

  /**
   * 🏪 マーチャント対応通貨リストを取得
   */
  async getMerchantCoins(): Promise<string[]> {
    return this.restClient.getMerchantCoins();
  }

  /**
   * 📋 詳細な通貨情報を取得
   */
  async getFullCurrencies() {
    return this.restClient.getFullCurrencies();
  }

  /**
   * 💵 最小決済額を取得
   */
  async getMinAmount(currencyFrom: CryptoCurrency, currencyTo: FiatCurrency) {
    return this.restClient.getMinAmount(currencyFrom, currencyTo);
  }

  /**
   * 💰 最大決済額を取得
   */
  async getMaxAmount(currencyFrom: FiatCurrency, currencyTo: CryptoCurrency) {
    return this.restClient.getMaxAmount(currencyFrom, currencyTo);
  }

  /**
   * 💳 決済を作成
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    const payment = await this.restClient.createPayment(request);

    logger.info('Payment created', {
      paymentId: payment.payment_id,
      orderId: payment.order_id,
      amount: payment.price_amount,
      currency: payment.price_currency,
      payAddress: payment.pay_address,
    });

    return payment;
  }

  /**
   * 📊 決済状態を取得
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return this.restClient.getPaymentStatus(paymentId);
  }

  /**
   * 📋 決済リストを取得
   */
  async getPayments(limit?: number, page?: number) {
    return this.restClient.getPayments(limit, page);
  }

  /**
   * 💱 為替レートを取得
   */
  async getExchangeRate(currencyFrom: string, currencyTo: string, amount?: number) {
    logger.info('🔥 ServiceClient getExchangeRate ACTUALLY CALLED', {
      currencyFrom,
      currencyTo,
      amount,
    });
    const result = await this.restClient.getExchangeRate(currencyFrom, currencyTo, amount);
    logger.info('🔥 ServiceClient getExchangeRate RESULT', { result });
    return result;
  }

  // ==================== IPN メソッド ====================

  /**
   * 🔐 IPN署名を生成
   */
  async generateIPNSignature(payload: string): Promise<string> {
    return await this.ipnHandler.generateIPNSignature(payload);
  }

  /**
   * ✅ IPN署名を検証
   */
  async verifyIPNSignature(payload: string, signature: string): Promise<boolean> {
    return await this.ipnHandler.verifyIPNSignature(payload, signature);
  }

  /**
   * 📨 IPNを処理
   */
  async handleIPN(payload: string, signature: string): Promise<boolean> {
    return this.ipnHandler.handleIPN(payload, signature);
  }

  // ==================== イベントリスナー ====================

  /**
   * 🎧 決済イベントリスナーを追加
   */
  onPaymentEvent(callback: (event: PaymentEvent) => void): void {
    this.on('payment_event', callback);
  }

  /**
   * 🎧 決済作成イベントリスナーを追加
   */
  onPaymentCreated(callback: (payment: PaymentResponse) => void): void {
    this.on('payment_created', callback);
  }

  /**
   * 🎧 決済完了イベントリスナーを追加
   */
  onPaymentFinished(callback: (payment: PaymentStatusResponse) => void): void {
    this.on('payment_finished', callback);
  }

  /**
   * 🎧 決済失敗イベントリスナーを追加
   */
  onPaymentFailed(callback: (payment: PaymentStatusResponse) => void): void {
    this.on('payment_failed', callback);
  }

  // ==================== ユーティリティ ====================

  /**
   * 🧹 為替レートキャッシュをクリア
   */
  clearExchangeRateCache(): void {
    this.exchangeRateCache.clear();
    logger.debug('Exchange rate cache cleared');
  }

  /**
   * 🧹 リソースをクリーンアップ
   */
  async cleanup(): Promise<void> {
    this.ipnHandler.cleanup();
    this.clearExchangeRateCache();
    this.removeAllListeners();

    NOWPaymentsServiceClient.instance = null;
    logger.info('NOWPayments Service Client cleaned up');
  }
}
