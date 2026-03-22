/**
 * 🔐 Encryption Service
 *
 * Provides SSE-C (Server-Side Encryption with Customer-Provided Keys) support
 * for transparent encryption/decryption of S3 objects
 */

import {
  randomBytesU8,
  md5,
  base64Decode as base64ToUint8Array,
  base64Encode as uint8ArrayToBase64,
} from '@libark/core-server/security/server-crypto';

import { getConfig } from '../config/index.js';

export interface EncryptionHeaders {
  'x-amz-server-side-encryption-customer-algorithm'?: string;
  'x-amz-server-side-encryption-customer-key'?: string;
  'x-amz-server-side-encryption-customer-key-md5'?: string;
}

export interface EncryptionService {
  isEnabled(): boolean;
  generateEncryptionHeaders(): Promise<EncryptionHeaders>;
  generateSSECParams(): Promise<
    { SSECustomerAlgorithm: string; SSECustomerKey: string; SSECustomerKeyMD5: string } | {}
  >;
  generateEncryptionKey(): Promise<string>;
  getKeyMD5(key: string): Promise<string>;
  validateEncryptionKey(key: string): boolean;
  getKeyInfo(): { algorithm: string; keyLength: number; enabled: boolean };
}

/**
 * SSE-C Encryption Service Implementation
 */
export class SSECEncryptionService implements EncryptionService {
  private config = getConfig().encryption;

  private async decodeKeyBytes(key: string): Promise<Uint8Array | null> {
    try {
      const keyBytes = await base64ToUint8Array(key);
      // Normalize to ensure canonical base64 representation and reject malformed keys.
      const normalizedKey = await uint8ArrayToBase64(keyBytes);
      if (normalizedKey !== key || keyBytes.length !== 32) {
        return null;
      }
      return keyBytes;
    } catch {
      return null;
    }
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.key;
  }

  async generateEncryptionHeaders(): Promise<EncryptionHeaders> {
    if (!this.isEnabled()) {
      return {};
    }

    const key = this.config.key!;
    const keyMD5 = await this.getKeyMD5(key);

    return {
      'x-amz-server-side-encryption-customer-algorithm': this.config.algorithm,
      'x-amz-server-side-encryption-customer-key': key,
      'x-amz-server-side-encryption-customer-key-md5': keyMD5,
    };
  }

  async generateSSECParams(): Promise<
    { SSECustomerAlgorithm: string; SSECustomerKey: string; SSECustomerKeyMD5: string } | {}
  > {
    if (!this.isEnabled()) {
      return {};
    }

    const key = this.config.key!;
    const keyMD5 = await this.getKeyMD5(key);

    return {
      SSECustomerAlgorithm: this.config.algorithm,
      SSECustomerKey: key,
      SSECustomerKeyMD5: keyMD5,
    };
  }

  async generateEncryptionKey(): Promise<string> {
    // Generate a 256-bit (32 bytes) random key for AES-256
    const keyBytes = randomBytesU8(32);
    return uint8ArrayToBase64(keyBytes);
  }

  async getKeyMD5(key: string): Promise<string> {
    // Convert base64 key to buffer and calculate MD5
    const keyBytes = await this.decodeKeyBytes(key);
    if (!keyBytes) {
      throw new Error('Invalid SSE-C key: expected base64-encoded 32-byte key');
    }

    const hash = await md5(keyBytes);
    return await uint8ArrayToBase64(hash);
  }

  validateEncryptionKey(key: string): boolean {
    if (!key) {
      return false;
    }

    // Fast fail in sync API. Full decode validation is done in getKeyMD5.
    return isValidEncryptionKey(key);
  }

  getKeyInfo(): { algorithm: string; keyLength: number; enabled: boolean } {
    const keyLength = getEncryptionKeyInfo(this.config.key ?? '').length;

    return {
      algorithm: this.config.algorithm,
      keyLength,
      enabled: this.isEnabled(),
    };
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

/**
 * Get singleton encryption service instance
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new SSECEncryptionService();
  }
  return encryptionService;
}

/**
 * Reset encryption service (useful for testing or config changes)
 */
export function resetEncryptionService(): void {
  encryptionService = null;
}

/**
 * Utility function to merge encryption headers with existing headers
 */
export function mergeEncryptionHeaders(
  existingHeaders: Record<string, string> = {},
  encryptionHeaders: EncryptionHeaders = {}
): Record<string, string> {
  return {
    ...existingHeaders,
    ...encryptionHeaders,
  };
}

/**
 * Generate a secure 256-bit encryption key for AES-256
 */
export async function generateSecureEncryptionKey(): Promise<string> {
  const keyBytes = randomBytesU8(32);
  return uint8ArrayToBase64(keyBytes);
}

/**
 * Validate if a string is a valid AES-256 encryption key
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    const keyBytes = Buffer.from(key, 'base64');
    if (keyBytes.length !== 32) {
      return false;
    }

    // Ensure key was valid/canonical base64 and not silently accepted garbage.
    return keyBytes.toString('base64') === key;
  } catch {
    return false;
  }
}

/**
 * Get encryption key information
 */
export function getEncryptionKeyInfo(key: string): {
  valid: boolean;
  length: number;
  algorithm: string;
} {
  const valid = isValidEncryptionKey(key);
  const length = valid ? Buffer.from(key, 'base64').length : 0;

  return {
    valid,
    length,
    algorithm: valid ? 'AES-256' : 'Invalid',
  };
}
