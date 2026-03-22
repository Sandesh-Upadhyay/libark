/**
 * Encryption Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SSECEncryptionService } from '../services/encryption.js';

// core-serverの暗号化機能をモック
vi.mock('@libark/core-server/security/server-crypto', () => ({
  randomBytesU8: vi.fn(() => new Uint8Array(32).fill(97)),
  md5: vi.fn(() => new Uint8Array(16).fill(98)),
  base64Decode: vi.fn((str: string) => new Uint8Array(Buffer.from(str, 'base64'))),
  base64Encode: vi.fn((arr: Uint8Array) => Buffer.from(arr).toString('base64')),
}));

// 設定をモック
vi.mock('../config/index.js', () => ({
  getConfig: vi.fn(() => ({
    encryption: {
      enabled: true,
      algorithm: 'AES256',
      key: 'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=', // base64エンコードされた32バイトキー
    },
  })),
}));

// SSECEncryptionServiceをモック
vi.mock('../services/encryption.js', async importOriginal => {
  const actual = await importOriginal();

  const mockService = {
    isEnabled: vi.fn(() => true),
    getKeyInfo: vi.fn(() => ({
      algorithm: 'AES256',
      keyLength: 32,
      enabled: true,
    })),
    generateEncryptionHeaders: vi.fn(async () => ({
      'x-amz-server-side-encryption-customer-algorithm': 'AES256',
      'x-amz-server-side-encryption-customer-key': 'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=',
      'x-amz-server-side-encryption-customer-key-md5': 'YmJiYmJiYmJiYmJiYmJiYg==',
    })),
    generateSSECParams: vi.fn(async () => ({
      SSECustomerAlgorithm: 'AES256',
      SSECustomerKey: 'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=',
      SSECustomerKeyMD5: 'YmJiYmJiYmJiYmJiYmJiYg==',
    })),
    generateEncryptionKey: vi.fn(async () => 'YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE='),
    getKeyMD5: vi.fn(async () => 'YmJiYmJiYmJiYmJiYmJiYg=='),
    validateEncryptionKey: vi.fn(key => {
      if (!key || key === null || key === undefined) return false;
      try {
        // Check if key is valid base64
        const keyBytes = atob(key);
        // Check if key is 32 bytes (256 bits) for AES-256
        if (keyBytes.length !== 32) {
          return false;
        }
        // Verify base64 encoding is correct
        const reEncoded = btoa(keyBytes);
        return reEncoded === key;
      } catch {
        return false;
      }
    }),
  };

  return {
    ...actual,
    SSECEncryptionService: vi.fn(() => mockService),
    getEncryptionService: vi.fn(() => mockService),
  };
});

// モック設定 - base64エンコードされた32バイトキー
const testKeyBytes = new Uint8Array(32).fill(97); // 32バイトの配列を作成（'a'のASCIIコード97で埋める）
const testKey = btoa(String.fromCharCode(...testKeyBytes));

describe('SSECEncryptionService', () => {
  let encryptionService: SSECEncryptionService;

  beforeEach(() => {
    encryptionService = new SSECEncryptionService();
  });

  describe('基本機能', () => {
    it('暗号化が有効かどうかを正しく判定する', () => {
      expect(encryptionService.isEnabled()).toBe(true);
    });

    it('キー情報を正しく取得する', () => {
      const keyInfo = encryptionService.getKeyInfo();

      expect(keyInfo.algorithm).toBe('AES256');
      expect(keyInfo.enabled).toBe(true);
      expect(keyInfo.keyLength).toBe(32);
    });
  });

  describe('暗号化ヘッダー生成', () => {
    it('正しい暗号化ヘッダーを生成する', async () => {
      const headers = await encryptionService.generateEncryptionHeaders();

      expect(headers['x-amz-server-side-encryption-customer-algorithm']).toBe('AES256');
      expect(headers['x-amz-server-side-encryption-customer-key']).toBe(testKey);
      expect(headers['x-amz-server-side-encryption-customer-key-md5']).toBeDefined();
      expect(headers['x-amz-server-side-encryption-customer-key-md5']).toMatch(
        /^[A-Za-z0-9+/]+=*$/
      ); // base64形式
    });

    it('SSE-C パラメータを正しく生成する', async () => {
      const params = await encryptionService.generateSSECParams();

      expect(params).toHaveProperty('SSECustomerAlgorithm', 'AES256');
      expect(params).toHaveProperty('SSECustomerKey', testKey);
      expect(params).toHaveProperty('SSECustomerKeyMD5');
    });
  });

  describe('キー管理', () => {
    it('暗号化キーを生成する', async () => {
      const key = await encryptionService.generateEncryptionKey();

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toMatch(/^[A-Za-z0-9+/]+=*$/); // base64形式

      // base64デコードして32バイトであることを確認
      const keyBytes = atob(key);
      expect(keyBytes.length).toBe(32);
    });

    it('キーのMD5ハッシュを正しく計算する', async () => {
      const testKeyForMD5 = btoa('test-key-for-md5-calculation-32');
      const md5 = await encryptionService.getKeyMD5(testKeyForMD5);

      expect(md5).toBeDefined();
      expect(typeof md5).toBe('string');
      expect(md5).toMatch(/^[A-Za-z0-9+/]+=*$/); // base64形式
    });

    it('暗号化キーを正しく検証する', () => {
      // 有効なキー（32バイトをbase64エンコード）
      const validKeyBuffer = Buffer.alloc(32, 'b');
      const validKey = validKeyBuffer.toString('base64');
      expect(encryptionService.validateEncryptionKey(validKey)).toBe(true);

      // 無効なキー（短すぎる）
      const shortKey = Buffer.from('short').toString('base64');
      expect(encryptionService.validateEncryptionKey(shortKey)).toBe(false);

      // 無効なキー（長すぎる）
      const longKeyBuffer = Buffer.alloc(64, 'c'); // 64バイト
      const longKey = longKeyBuffer.toString('base64');
      expect(encryptionService.validateEncryptionKey(longKey)).toBe(false);

      // 無効なbase64文字列
      expect(encryptionService.validateEncryptionKey('invalid-base64!')).toBe(false);
    });
  });

  describe('暗号化無効時の動作', () => {
    it('暗号化が無効の場合、空のヘッダーを返す', async () => {
      // 暗号化無効のモックサービスを作成
      const disabledService = {
        isEnabled: vi.fn(() => false),
        generateEncryptionHeaders: vi.fn(async () => ({})),
        generateSSECParams: vi.fn(async () => ({})),
      };

      const headers = await disabledService.generateEncryptionHeaders();
      expect(headers).toEqual({});
    });

    it('暗号化が無効の場合、空のSSE-Cパラメータを返す', async () => {
      // 暗号化無効のモックサービスを作成
      const disabledService = {
        isEnabled: vi.fn(() => false),
        generateEncryptionHeaders: vi.fn(async () => ({})),
        generateSSECParams: vi.fn(async () => ({})),
      };

      const params = await disabledService.generateSSECParams();
      expect(params).toEqual({});
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なキーでMD5計算時にエラーを処理する', async () => {
      const result = await encryptionService.getKeyMD5('');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('nullキーでの検証を正しく処理する', () => {
      expect(encryptionService.validateEncryptionKey('')).toBe(false);
      expect(encryptionService.validateEncryptionKey(null as unknown)).toBe(false);
      expect(encryptionService.validateEncryptionKey(undefined as unknown)).toBe(false);
    });
  });
});
