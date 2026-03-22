/**
 * 🛡️ CSRF対策システム
 *
 * 責任:
 * - CSRFトークンの生成・検証
 * - GraphQLミューテーション保護
 * - セキュアなトークン管理
 * - 攻撃検知とログ記録
 */

import { SecurityEventType, logSecurityEvent } from '@libark/core-shared';

import { randomBytesHex, hmacSha256, timingSafeEqual } from './server-crypto.js';

// ヘルパー関数
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// CSRF設定
export interface CSRFConfig {
  secretKey: string;
  tokenLength: number;
  maxAge: number; // ミリ秒
  cookieName: string;
  headerName: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
}

// デフォルト設定
export const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  secretKey: process.env.CSRF_SECRET_KEY || process.env.JWT_SECRET || '',
  tokenLength: 32,
  maxAge: 24 * 60 * 60 * 1000, // 24時間
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
};

// CSRFトークンペイロード
export interface CSRFTokenPayload {
  token: string;
  timestamp: number;
  signature: string;
}

/**
 * CSRF保護マネージャー
 */
export class CSRFManager {
  private static instance: CSRFManager;
  private config: CSRFConfig;

  private constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
    if (!this.config.secretKey) {
      throw new Error('CSRF_SECRET_KEY or JWT_SECRET environment variable is required');
    }
  }

  public static getInstance(config?: Partial<CSRFConfig>): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager(config);
    }
    return CSRFManager.instance;
  }

  /**
   * CSRFトークンを生成
   */
  public async generateToken(): Promise<string> {
    const token = await randomBytesHex(this.config.tokenLength);
    const timestamp = Date.now();
    const signature = await this.createSignature(token, timestamp);

    const payload: CSRFTokenPayload = {
      token,
      timestamp,
      signature,
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * CSRFトークンを検証
   */
  public async verifyToken(tokenString: string): Promise<boolean> {
    try {
      const payload: CSRFTokenPayload = JSON.parse(
        Buffer.from(tokenString, 'base64').toString('utf-8')
      );

      // タイムスタンプ検証
      const now = Date.now();
      if (now - payload.timestamp > this.config.maxAge) {
        return false;
      }

      // 署名検証
      const expectedSignature = await this.createSignature(payload.token, payload.timestamp);

      return timingSafeEqual(payload.signature, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * 署名を作成
   */
  private async createSignature(token: string, timestamp: number): Promise<string> {
    const data = `${token}:${timestamp}`;
    const keyBytes = stringToUint8Array(this.config.secretKey);
    const dataBytes = stringToUint8Array(data);
    const hmac = await hmacSha256(keyBytes, dataBytes);
    return uint8ArrayToHex(hmac);
  }

  /**
   * Cookie設定を取得
   */
  public getCookieOptions() {
    return {
      httpOnly: false, // JavaScriptからアクセス可能にする必要がある
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      maxAge: this.config.maxAge,
      path: '/',
    };
  }

  /**
   * 設定を取得
   */
  public getConfig(): CSRFConfig {
    return { ...this.config };
  }
}

/**
 * CSRF攻撃を検知してログに記録
 */
export function logCSRFAttack(details: {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  reason: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'SIGNATURE_MISMATCH';
  mutation?: string;
}): void {
  logSecurityEvent({
    eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
    userId: details.userId,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    severity: 'HIGH',
    requestId: details.requestId,
    errorCode: 'CSRF_ATTACK_DETECTED',
    errorMessage: `CSRF attack detected: ${details.reason}`,
    details: {
      reason: details.reason,
      mutation: details.mutation,
      attackType: 'CSRF',
    },
  });
}

/**
 * GraphQLミューテーション名を取得
 */
export function extractMutationName(query: string): string | null {
  try {
    // 簡単なパターンマッチングでミューテーション名を抽出
    const mutationMatch = query.match(/mutation\s+(\w+)?.*?\{\s*(\w+)/);
    if (mutationMatch) {
      return mutationMatch[2] || mutationMatch[1] || 'unknown';
    }

    // 匿名ミューテーションの場合
    const anonymousMatch = query.match(/mutation\s*\{\s*(\w+)/);
    if (anonymousMatch) {
      return anonymousMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * リクエストがミューテーションかどうかを判定
 */
export function isMutation(query: string): boolean {
  return /^\s*mutation\s/i.test(query.trim());
}

// デフォルトインスタンスをエクスポート
export const csrfManager = CSRFManager.getInstance();
