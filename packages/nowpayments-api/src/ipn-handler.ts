/**
 * 🔔 NOWPayments IPN (Instant Payment Notification) ハンドラー
 */

import { EventEmitter } from 'events';

import { logger } from '@libark/core-shared';
import { hmacSha512Hex, timingSafeEqual } from '@libark/core-server/security/server-crypto';

import type { IPNData, PaymentEvent, PaymentStatus } from './types.js';

export class NOWPaymentsIPNHandler extends EventEmitter {
  private readonly ipnSecret: string;
  private readonly processedIPNs: Set<string> = new Set();
  private readonly ipnExpiry = 5 * 60 * 1000; // 5分

  constructor(ipnSecret: string) {
    super();
    this.ipnSecret = ipnSecret;

    logger.info('NOWPayments IPN Handler initialized');
  }

  /**
   * 🔐 IPN署名を生成
   */
  async generateIPNSignature(payload: string): Promise<string> {
    return await hmacSha512Hex(this.ipnSecret, payload);
  }

  /**
   * ✅ IPN署名を検証
   */
  async verifyIPNSignature(payload: string, signature: string): Promise<boolean> {
    const expectedSignature = await this.generateIPNSignature(payload);

    // タイミング攻撃を防ぐため、timingSafeEqualを使用
    return timingSafeEqual(signature, expectedSignature);
  }

  /**
   * 🔄 重複IPN処理を防止
   */
  private isDuplicateIPN(paymentId: string, status: PaymentStatus, timestamp: string): boolean {
    const ipnKey = `${paymentId}-${status}-${timestamp}`;

    if (this.processedIPNs.has(ipnKey)) {
      logger.warn('Duplicate IPN detected', { paymentId, status, timestamp });
      return true;
    }

    // IPNを処理済みとしてマーク
    this.processedIPNs.add(ipnKey);

    // 古いIPNキーを定期的にクリーンアップ
    setTimeout(() => {
      this.processedIPNs.delete(ipnKey);
    }, this.ipnExpiry);

    return false;
  }

  /**
   * 📨 IPNデータを処理
   */
  async handleIPN(payload: string, signature: string): Promise<boolean> {
    try {
      // 署名検証
      if (!(await this.verifyIPNSignature(payload, signature))) {
        logger.error('Invalid IPN signature', { signature });
        return false;
      }

      // JSONパース
      const ipnData: IPNData = JSON.parse(payload);

      // 重複チェック
      if (this.isDuplicateIPN(ipnData.payment_id, ipnData.payment_status, ipnData.updated_at)) {
        return true; // 重複だが正常な処理として扱う
      }

      logger.info('Processing IPN', {
        paymentId: ipnData.payment_id,
        status: ipnData.payment_status,
        orderId: ipnData.order_id,
        amount: ipnData.actually_paid || ipnData.pay_amount,
        currency: ipnData.pay_currency,
      });

      // イベントタイプを決定
      const eventType = this.getEventType(ipnData.payment_status);

      // イベントを発行
      const event: PaymentEvent = {
        type: eventType,
        payment: ipnData,
        timestamp: new Date(),
      };

      this.emit('payment_event', event);
      this.emit(eventType, ipnData);

      // 特定の状態に対する個別イベント
      switch (ipnData.payment_status) {
        case 'finished':
          this.emit('payment_success', ipnData);
          break;
        case 'failed':
        case 'expired':
          this.emit('payment_failure', ipnData);
          break;
        case 'partially_paid':
          this.emit('payment_partial', ipnData);
          break;
        case 'confirming':
          this.emit('payment_confirming', ipnData);
          break;
      }

      logger.info('IPN processed successfully', {
        paymentId: ipnData.payment_id,
        eventType,
      });

      return true;
    } catch (error) {
      logger.error('Failed to process IPN', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload: payload.substring(0, 100) + '...', // ログに一部のみ記録
      });
      return false;
    }
  }

  /**
   * 🎯 決済状態からイベントタイプを決定
   */
  private getEventType(status: PaymentStatus): PaymentEvent['type'] {
    switch (status) {
      case 'waiting':
      case 'confirming':
        return 'payment_created';
      case 'confirmed':
      case 'sending':
      case 'partially_paid':
        return 'payment_updated';
      case 'finished':
        return 'payment_finished';
      case 'failed':
      case 'expired':
      case 'refunded':
        return 'payment_failed';
      default:
        return 'payment_updated';
    }
  }

  /**
   * 🎧 決済成功イベントリスナーを追加
   */
  onPaymentSuccess(callback: (ipnData: IPNData) => void): void {
    this.on('payment_success', callback);
  }

  /**
   * 🎧 決済失敗イベントリスナーを追加
   */
  onPaymentFailure(callback: (ipnData: IPNData) => void): void {
    this.on('payment_failure', callback);
  }

  /**
   * 🎧 一部支払いイベントリスナーを追加
   */
  onPaymentPartial(callback: (ipnData: IPNData) => void): void {
    this.on('payment_partial', callback);
  }

  /**
   * 🎧 確認中イベントリスナーを追加
   */
  onPaymentConfirming(callback: (ipnData: IPNData) => void): void {
    this.on('payment_confirming', callback);
  }

  /**
   * 🎧 全イベントリスナーを追加
   */
  onPaymentEvent(callback: (event: PaymentEvent) => void): void {
    this.on('payment_event', callback);
  }

  /**
   * 🧹 リソースをクリーンアップ
   */
  cleanup(): void {
    this.processedIPNs.clear();
    this.removeAllListeners();
    logger.info('NOWPayments IPN Handler cleaned up');
  }
}
