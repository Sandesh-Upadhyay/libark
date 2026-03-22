import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  encryptPaymentDetails,
  decryptPaymentDetails,
  encryptPaymentDetailsObject,
  decryptPaymentDetailsObject,
} from '../encryption';

describe('Encryption Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // テスト用の暗号化キーを設定（32バイト = 256ビット）
    const testKey = Buffer.alloc(32, 'test-encryption-key-32-bytes-long!!', 'utf8').toString(
      'base64'
    );
    process.env.P2P_ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    // 環境変数を元に戻す
    process.env = originalEnv;
  });

  describe('encryptPaymentDetails / decryptPaymentDetails', () => {
    it('should encrypt and decrypt payment details', () => {
      const plainText = 'bank_name:TestBank,account:1234567';

      const encrypted = encryptPaymentDetails(plainText);
      const decrypted = decryptPaymentDetails(encrypted);

      expect(decrypted).toBe(plainText);
      expect(encrypted).not.toBe(plainText);
    });

    it('should encrypt and decrypt empty string', () => {
      const plainText = '';

      const encrypted = encryptPaymentDetails(plainText);
      const decrypted = decryptPaymentDetails(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should encrypt and decrypt special characters', () => {
      const plainText = 'bank_name:テスト銀行,account:123-456-789';

      const encrypted = encryptPaymentDetails(plainText);
      const decrypted = decryptPaymentDetails(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error with wrong key', () => {
      const plainText = 'bank_name:TestBank,account:1234567';

      const encrypted = encryptPaymentDetails(plainText);

      // 別のキーで暗号化
      const wrongKey = Buffer.from('wrong-key-32-bytes-long-!!!!!').toString('base64');
      process.env.P2P_ENCRYPTION_KEY = wrongKey;

      expect(() => {
        decryptPaymentDetails(encrypted);
      }).toThrow();
    });

    it('should throw error if P2P_ENCRYPTION_KEY is not set', () => {
      delete process.env.P2P_ENCRYPTION_KEY;

      expect(() => {
        encryptPaymentDetails('test');
      }).toThrow('P2P_ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error if P2P_ENCRYPTION_KEY has wrong length', () => {
      // 16バイト（128ビット）のキー - 長さが足りない
      const shortKey = Buffer.from('short-key-16-byt').toString('base64');
      process.env.P2P_ENCRYPTION_KEY = shortKey;

      expect(() => {
        encryptPaymentDetails('test');
      }).toThrow('Invalid encryption key length');
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plainText = 'bank_name:TestBank,account:1234567';

      const encrypted1 = encryptPaymentDetails(plainText);
      const encrypted2 = encryptPaymentDetails(plainText);

      // 同じ平文でも暗号化のたびに異なる暗号文になる（IVがランダム）
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should decrypt both ciphertexts correctly', () => {
      const plainText = 'bank_name:TestBank,account:1234567';

      const encrypted1 = encryptPaymentDetails(plainText);
      const encrypted2 = encryptPaymentDetails(plainText);

      const decrypted1 = decryptPaymentDetails(encrypted1);
      const decrypted2 = decryptPaymentDetails(encrypted2);

      expect(decrypted1).toBe(plainText);
      expect(decrypted2).toBe(plainText);
    });
  });

  describe('encryptPaymentDetailsObject / decryptPaymentDetailsObject', () => {
    it('should encrypt and decrypt payment details object', () => {
      const paymentDetails = {
        bankName: 'Test Bank',
        accountNumber: '1234567',
        accountHolder: 'Test User',
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
      expect(encrypted).not.toEqual(paymentDetails);
    });

    it('should handle nested objects', () => {
      const paymentDetails = {
        bank: {
          name: 'Test Bank',
          branch: 'Test Branch',
        },
        account: {
          number: '1234567',
          holder: 'Test User',
        },
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
    });

    it('should handle array values', () => {
      const paymentDetails = {
        bankName: 'Test Bank',
        allowedCurrencies: ['USD', 'EUR', 'JPY'],
        accountNumbers: ['1234567', '7654321'],
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
    });

    it('should handle empty object', () => {
      const paymentDetails = {};

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
    });

    it('should handle null and undefined values', () => {
      const paymentDetails = {
        bankName: 'Test Bank',
        accountNumber: null,
        branch: undefined,
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted.bankName).toBe('Test Bank');
      expect(decrypted.accountNumber).toBeNull();
      expect(decrypted.branch).toBeUndefined();
    });

    it('should handle numeric values', () => {
      const paymentDetails = {
        bankName: 'Test Bank',
        accountNumber: '1234567',
        routingNumber: 123456789,
        amount: 100.5,
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
    });

    it('should handle boolean values', () => {
      const paymentDetails = {
        bankName: 'Test Bank',
        isVerified: true,
        isActive: false,
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
    });

    it('should throw error with wrong key', () => {
      const paymentDetails = {
        bankName: 'Test Bank',
        accountNumber: '1234567',
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);

      // 別のキーで暗号化
      const wrongKey = Buffer.from('wrong-key-32-bytes-long-!!!!!').toString('base64');
      process.env.P2P_ENCRYPTION_KEY = wrongKey;

      expect(() => {
        decryptPaymentDetailsObject(encrypted);
      }).toThrow();
    });

    it('should handle complex nested structure', () => {
      const paymentDetails = {
        bank: {
          name: 'Test Bank',
          address: {
            street: '123 Test St',
            city: 'Test City',
            country: 'Test Country',
          },
          contacts: [
            { type: 'phone', value: '+1234567890' },
            { type: 'email', value: 'test@test.com' },
          ],
        },
        account: {
          number: '1234567',
          holder: {
            name: 'Test User',
            id: 'ID123456',
          },
        },
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(paymentDetails);
    });

    it('should preserve type information', () => {
      const paymentDetails = {
        string: 'test',
        number: 123,
        float: 123.45,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: {
          value: 'nested',
        },
      };

      const encrypted = encryptPaymentDetailsObject(paymentDetails);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(typeof decrypted.string).toBe('string');
      expect(typeof decrypted.number).toBe('number');
      expect(typeof decrypted.float).toBe('number');
      expect(typeof decrypted.boolean).toBe('boolean');
      expect(decrypted.null).toBeNull();
      expect(Array.isArray(decrypted.array)).toBe(true);
      expect(typeof decrypted.nested).toBe('object');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);

      const encrypted = encryptPaymentDetails(longString);
      const decrypted = decryptPaymentDetails(encrypted);

      expect(decrypted).toBe(longString);
    });

    it('should handle unicode characters', () => {
      const unicodeText = '🏦 銀行 🇯🇵 日本 🇺🇸 USA 🇪🇺 Europe';

      const encrypted = encryptPaymentDetails(unicodeText);
      const decrypted = decryptPaymentDetails(encrypted);

      expect(decrypted).toBe(unicodeText);
    });

    it('should handle very large objects', () => {
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }

      const encrypted = encryptPaymentDetailsObject(largeObject);
      const decrypted = decryptPaymentDetailsObject(encrypted);

      expect(decrypted).toEqual(largeObject);
    });
  });
});
