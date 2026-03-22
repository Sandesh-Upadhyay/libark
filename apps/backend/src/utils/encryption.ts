import { encrypt, decrypt } from '@libark/core-server/security/server-crypto';

/**
 * 暗号化設定
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-cbc',
  keyLength: 32, // 256ビット
  ivLength: 16, // 128ビット
};

/**
 * 暗号化鍵を取得（環境変数から）
 */
function getEncryptionKey(): Uint8Array {
  const key = process.env.P2P_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('P2P_ENCRYPTION_KEY environment variable is not set');
  }

  // Base64デコード
  const keyBytes = Buffer.from(key, 'base64');

  if (keyBytes.length !== ENCRYPTION_CONFIG.keyLength) {
    throw new Error(
      `Invalid encryption key length: expected ${ENCRYPTION_CONFIG.keyLength}, got ${keyBytes.length}`
    );
  }

  return new Uint8Array(keyBytes);
}

/**
 * P2P取引の支払い情報を暗号化する
 * @param data 暗号化するデータ
 * @returns 暗号化されたデータ（Base64エンコード）
 */
export function encryptPaymentDetails(data: string): string {
  const key = getEncryptionKey();
  return encrypt(data, key, ENCRYPTION_CONFIG.algorithm);
}

/**
 * P2P取引の支払い情報を復号化する
 * @param encryptedData 暗号化されたデータ（Base64エンコード）
 * @returns 復号化されたデータ
 */
export function decryptPaymentDetails(encryptedData: string): string {
  const key = getEncryptionKey();
  return decrypt(encryptedData, key, ENCRYPTION_CONFIG.algorithm);
}

/**
 * 支払い詳細情報オブジェクトを暗号化して保存
 * @param details 支払い詳細情報
 * @returns 暗号化されたJSON文字列
 */
export function encryptPaymentDetailsObject<T extends Record<string, any>>(details: T): string {
  return encryptPaymentDetails(JSON.stringify(details));
}

/**
 * 支払い詳細情報オブジェクトを復号化
 * @param encryptedData 暗号化されたJSON文字列
 * @returns 復号化された支払い詳細情報
 */
export function decryptPaymentDetailsObject<T extends Record<string, any>>(
  encryptedData: string
): T {
  const decrypted = decryptPaymentDetails(encryptedData);
  return JSON.parse(decrypted) as T;
}
