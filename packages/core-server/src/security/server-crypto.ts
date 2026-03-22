/**
 * 🖥️ サーバー専用暗号化ユーティリティ
 * Node.js cryptoモジュールを使用したサーバー専用の暗号化機能
 */

import {
  randomBytes,
  createHmac,
  createHash,
  createCipheriv,
  createDecipheriv,
  pbkdf2 as nodePbkdf2,
} from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(nodePbkdf2);

/**
 * 指定された長さのランダムバイト配列を生成（サーバー専用）
 */
export function randomBytesU8(length: number): Uint8Array {
  return new Uint8Array(randomBytes(length));
}

/**
 * 指定された長さのランダムバイトを16進文字列として生成（サーバー専用）
 */
export function randomBytesHex(length: number): string {
  return randomBytes(length).toString('hex');
}

/**
 * Base64エンコード（サーバー専用）
 */
export function base64Encode(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Base64デコード（サーバー専用）
 */
export function base64Decode(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * SHA-256ハッシュを計算（サーバー専用）
 */
export function sha256(data: Uint8Array): Uint8Array {
  const hash = createHash('sha256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

/**
 * SHA-256ハッシュを16進文字列として計算（サーバー専用）
 */
export function sha256Hex(data: string | Uint8Array): string {
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const hash = createHash('sha256');
  hash.update(dataBytes);
  return hash.digest('hex');
}

/**
 * HMAC-SHA256を計算（サーバー専用）
 */
export function hmacSha256(keyBytes: Uint8Array, dataBytes: Uint8Array): Uint8Array {
  const hmac = createHmac('sha256', keyBytes);
  hmac.update(dataBytes);
  return new Uint8Array(hmac.digest());
}

/**
 * HMAC-SHA256を16進文字列として計算（サーバー専用）
 */
export function hmacSha256Hex(keyBytes: Uint8Array, dataBytes: Uint8Array): string {
  const hmac = createHmac('sha256', keyBytes);
  hmac.update(dataBytes);
  return hmac.digest('hex');
}

/**
 * HMAC-SHA512を計算（サーバー専用）
 */
export function hmacSha512(keyBytes: Uint8Array, dataBytes: Uint8Array): Uint8Array {
  const hmac = createHmac('sha512', keyBytes);
  hmac.update(dataBytes);
  return new Uint8Array(hmac.digest());
}

/**
 * HMAC-SHA512を16進文字列として計算（サーバー専用）
 */
export function hmacSha512Hex(key: string | Uint8Array, data: string | Uint8Array): string {
  const keyBytes = typeof key === 'string' ? Buffer.from(key, 'utf8') : Buffer.from(key);
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const hmac = createHmac('sha512', keyBytes);
  hmac.update(dataBytes);
  return hmac.digest('hex');
}

/**
 * MD5ハッシュを計算（サーバー専用）
 */
export function md5(data: Uint8Array): Uint8Array {
  const hash = createHash('md5');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

/**
 * MD5ハッシュを16進文字列として計算（サーバー専用）
 */
export function md5Hex(data: string | Uint8Array): string {
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const hash = createHash('md5');
  hash.update(dataBytes);
  return hash.digest('hex');
}

/**
 * 定数時間での文字列比較（サーバー専用）
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * AES暗号化（サーバー専用）
 */
export function aesEncrypt(
  data: Uint8Array,
  key: Uint8Array,
  algorithm: string = 'aes-256-cbc'
): { encrypted: Uint8Array; iv: Uint8Array } {
  const iv = randomBytesU8(16); // CBCでは16バイトのIVが必要
  const cipher = createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(Buffer.from(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    encrypted: new Uint8Array(encrypted),
    iv,
  };
}

/**
 * AES復号化（サーバー専用）
 */
export function aesDecrypt(
  encryptedData: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  algorithm: string = 'aes-256-cbc'
): Uint8Array {
  const decipher = createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(Buffer.from(encryptedData));
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return new Uint8Array(decrypted);
}

/**
 * PBKDF2でキーを導出（サーバー専用）
 */
export async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
  keyLength: number = 32
): Promise<Uint8Array> {
  const derivedKey = await pbkdf2Async(
    password,
    Buffer.from(salt),
    iterations,
    keyLength,
    'sha256'
  );
  return new Uint8Array(derivedKey);
}

/**
 * 文字列を暗号化してBase64エンコードされた文字列を返す（サーバー専用）
 * @param data 暗号化する文字列
 * @param key 暗号化キー（32バイト）
 * @param algorithm 暗号化アルゴリズム（デフォルト: aes-256-cbc）
 * @returns Base64エンコードされた暗号化データ
 */
export function encrypt(data: string, key: Uint8Array, algorithm: string = 'aes-256-cbc'): string {
  const dataBytes = new TextEncoder().encode(data);
  const { encrypted, iv } = aesEncrypt(dataBytes, key, algorithm);

  // IV + 暗号化データを結合してBase64エンコード
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, iv.length);

  return Buffer.from(combined).toString('base64');
}

/**
 * Base64エンコードされた暗号化データを復号化（サーバー専用）
 * @param encryptedData Base64エンコードされた暗号化データ
 * @param key 暗号化キー（32バイト）
 * @param algorithm 暗号化アルゴリズム（デフォルト: aes-256-cbc）
 * @returns 復号化された文字列
 */
export function decrypt(
  encryptedData: string,
  key: Uint8Array,
  algorithm: string = 'aes-256-cbc'
): string {
  const combined = Buffer.from(encryptedData, 'base64');

  // IVと暗号化データを分離（IVは16バイト）
  const iv = combined.slice(0, 16);
  const encrypted = combined.slice(16);

  const decrypted = aesDecrypt(new Uint8Array(encrypted), key, new Uint8Array(iv), algorithm);

  return new TextDecoder().decode(decrypted);
}

// サーバー専用暗号化ユーティリティのエクスポート
export const serverCrypto = {
  randomBytesU8,
  randomBytesHex,
  base64Encode,
  base64Decode,
  sha256,
  sha256Hex,
  hmacSha256,
  hmacSha256Hex,
  hmacSha512,
  hmacSha512Hex,
  md5,
  md5Hex,
  timingSafeEqual,
  aesEncrypt,
  aesDecrypt,
  encrypt,
  decrypt,
  pbkdf2,
};
