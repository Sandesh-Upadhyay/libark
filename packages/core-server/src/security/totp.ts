/**
 * 🔐 TOTP (Time-based One-Time Password) utilities
 * - Generate TOTP secrets
 * - Verify TOTP codes
 * - Generate QR code URLs for authenticator apps
 */

import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';

import { randomBytesU8, randomBytesHex } from './server-crypto.js';

export interface TOTPConfig {
  /** サービス名（QRコードに表示） */
  issuer: string;
  /** アルゴリズム（デフォルト: SHA1） */
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  /** 桁数（デフォルト: 6） */
  digits?: number;
  /** 有効期間（秒、デフォルト: 30） */
  period?: number;
  /** 時間窓の許容範囲（デフォルト: 1） */
  window?: number;
}

export interface TOTPSetupData {
  /** Base32エンコードされたシークレット */
  secret: string;
  /** QRコード画像のData URL */
  qrCodeUrl: string;
  /** バックアップ用の手動入力シークレット */
  manualEntryKey: string;
}

const DEFAULT_CONFIG: Required<Omit<TOTPConfig, 'issuer'>> = {
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  window: 1,
};

/**
 * 新しいTOTPシークレットを生成
 */
export async function generateTOTPSecret(): Promise<string> {
  // 20バイト（160ビット）のランダムシークレットを生成
  const buffer = await randomBytesU8(20);
  return new Secret({ buffer: buffer.buffer }).base32;
}

/**
 * TOTP設定データを生成（QRコード画像含む）
 */
export async function generateTOTPSetup(
  secret: string,
  userIdentifier: string,
  config: TOTPConfig
): Promise<TOTPSetupData> {
  const totp = new TOTP({
    issuer: config.issuer,
    label: userIdentifier,
    algorithm: config.algorithm || DEFAULT_CONFIG.algorithm,
    digits: config.digits || DEFAULT_CONFIG.digits,
    period: config.period || DEFAULT_CONFIG.period,
    secret: Secret.fromBase32(secret),
  });

  // QRコード画像を生成（Data URL形式）
  const qrCodeDataUrl = await QRCode.toDataURL(totp.toString(), {
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 256,
  });

  return {
    secret,
    qrCodeUrl: qrCodeDataUrl,
    manualEntryKey: secret.replace(/(.{4})/g, '$1 ').trim(), // 4文字ごとにスペース
  };
}

/**
 * TOTPコードを検証
 */
export function verifyTOTPCode(
  secret: string,
  token: string,
  config: Partial<TOTPConfig> = {}
): boolean {
  try {
    const totp = new TOTP({
      algorithm: config.algorithm || DEFAULT_CONFIG.algorithm,
      digits: config.digits || DEFAULT_CONFIG.digits,
      period: config.period || DEFAULT_CONFIG.period,
      secret: Secret.fromBase32(secret),
    });

    // 時間窓を考慮した検証（前後の時間窓も許可）
    const window = config.window || DEFAULT_CONFIG.window;
    const currentTime = Date.now();

    for (let i = -window; i <= window; i++) {
      const timeStep = Math.floor(currentTime / 1000 / totp.period) + i;
      const expectedToken = totp.generate({ timestamp: timeStep * totp.period * 1000 });

      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * 現在のTOTPコードを生成（テスト用）
 */
export function generateTOTPCode(secret: string, config: Partial<TOTPConfig> = {}): string {
  const totp = new TOTP({
    algorithm: config.algorithm || DEFAULT_CONFIG.algorithm,
    digits: config.digits || DEFAULT_CONFIG.digits,
    period: config.period || DEFAULT_CONFIG.period,
    secret: Secret.fromBase32(secret),
  });

  return totp.generate();
}

/**
 * バックアップコードを生成
 */
export async function generateBackupCodes(count: number = 10): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // 8桁のランダムな英数字コード
    const code = (await randomBytesHex(4)).toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * バックアップコードをハッシュ化（保存用）
 */
export async function hashBackupCode(code: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(code, 10);
}

/**
 * バックアップコードを検証
 */
export async function verifyBackupCode(code: string, hashedCode: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcrypt');
    return await bcrypt.compare(code, hashedCode);
  } catch (error) {
    console.error('Backup code verification error:', error);
    return false;
  }
}

export const totpUtils = {
  generateTOTPSecret,
  generateTOTPSetup,
  verifyTOTPCode,
  generateTOTPCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
};
