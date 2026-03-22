/**
 * NOWPayments API Package Tests
 */

import { describe, it, expect } from 'vitest';

import {
  NOWPaymentsServiceClient,
  NOWPaymentsRestClient,
  NOWPaymentsIPNHandler,
} from '../index.js';

describe('NOWPayments API Package', () => {
  describe('Exports', () => {
    it('NOWPaymentsServiceClientがエクスポートされている', () => {
      expect(NOWPaymentsServiceClient).toBeDefined();
      expect(typeof NOWPaymentsServiceClient).toBe('function');
    });

    it('NOWPaymentsRestClientがエクスポートされている', () => {
      expect(NOWPaymentsRestClient).toBeDefined();
      expect(typeof NOWPaymentsRestClient).toBe('function');
    });

    it('NOWPaymentsIPNHandlerがエクスポートされている', () => {
      expect(NOWPaymentsIPNHandler).toBeDefined();
      expect(typeof NOWPaymentsIPNHandler).toBe('function');
    });
  });

  describe('Class Instantiation', () => {
    it('NOWPaymentsServiceClientを正しくインスタンス化できる', () => {
      const config = {
        apiKey: 'test-api-key',
        sandbox: true,
        baseURL: 'https://api-sandbox.nowpayments.io',
      };

      expect(() => {
        new NOWPaymentsServiceClient(config);
      }).not.toThrow();
    });

    it('NOWPaymentsRestClientを正しくインスタンス化できる', () => {
      const config = {
        apiKey: 'test-api-key',
        sandbox: true,
        baseURL: 'https://api-sandbox.nowpayments.io',
      };

      expect(() => {
        new NOWPaymentsRestClient(config);
      }).not.toThrow();
    });

    it('NOWPaymentsIPNHandlerを正しくインスタンス化できる', () => {
      const config = {
        ipnSecret: 'test-ipn-secret',
        sandbox: true,
      };

      expect(() => {
        new NOWPaymentsIPNHandler(config);
      }).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('無効な設定でもインスタンス化できる（バリデーションは実行時）', () => {
      expect(() => {
        new NOWPaymentsServiceClient({} as unknown);
      }).not.toThrow();
    });

    it('APIキーが空でもインスタンス化できる（バリデーションは実行時）', () => {
      expect(() => {
        new NOWPaymentsServiceClient({
          apiKey: '',
          sandbox: true,
        });
      }).not.toThrow();
    });
  });
});
