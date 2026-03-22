/**
 * 🌐 ブラウザ専用暗号化ユーティリティ
 * Web Crypto APIのみを使用したブラウザ専用の暗号化機能
 */

/**
 * 指定された長さのランダムバイト配列を生成（ブラウザ専用）
 */
export function randomBytesU8(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * 指定された長さのランダムバイトを16進文字列として生成（ブラウザ専用）
 */
export function randomBytesHex(length: number): string {
  const bytes = randomBytesU8(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Base64エンコード（ブラウザ専用）
 */
export function base64Encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

/**
 * Base64デコード（ブラウザ専用）
 */
export function base64Decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
  return new Uint8Array(hashBuffer);
}

/**
 * SHA-256ハッシュを16進文字列として計算（ブラウザ専用）
 */
export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await sha256(dataBytes);
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * HMAC-SHA256を計算（ブラウザ専用）
 */
export async function hmacSha256(keyBytes: Uint8Array, dataBytes: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes as any);
  return new Uint8Array(signature);
}

/**
 * HMAC-SHA256を16進文字列として計算（ブラウザ専用）
 */
export async function hmacSha256Hex(keyBytes: Uint8Array, dataBytes: Uint8Array): Promise<string> {
  const hmac = await hmacSha256(keyBytes, dataBytes);
  return Array.from(hmac)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 定数時間での文字列比較（ブラウザ専用）
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
 * AES-GCM暗号化（ブラウザ専用）
 */
export async function aesGcmEncrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv?: Uint8Array
): Promise<{ encrypted: Uint8Array; iv: Uint8Array }> {
  const actualIv = iv || randomBytesU8(12); // GCMでは12バイトのIVが推奨

  const cryptoKey = await crypto.subtle.importKey('raw', key as any, { name: 'AES-GCM' }, false, [
    'encrypt',
  ]);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: actualIv as any }, cryptoKey, data as any);

  return {
    encrypted: new Uint8Array(encrypted),
    iv: actualIv,
  };
}

/**
 * AES-GCM復号化（ブラウザ専用）
 */
export async function aesGcmDecrypt(
  encryptedData: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key as any, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as any }, cryptoKey, encryptedData as any);

  return new Uint8Array(decrypted);
}

/**
 * PBKDF2でキーを導出（ブラウザ専用）
 */
export async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
  keyLength: number = 32
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);

  const baseKey = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, [
    'deriveBits',
  ]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    keyLength * 8
  );

  return new Uint8Array(derivedBits);
}

// ブラウザ専用暗号化ユーティリティのエクスポート
export const browserCrypto = {
  randomBytesU8,
  randomBytesHex,
  base64Encode,
  base64Decode,
  sha256,
  sha256Hex,
  hmacSha256,
  hmacSha256Hex,
  timingSafeEqual,
  aesGcmEncrypt,
  aesGcmDecrypt,
  pbkdf2,
};
