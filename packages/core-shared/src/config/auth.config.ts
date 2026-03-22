/**
 * 🔑 JWT認証設定
 *
 * 全てのアプリケーション（バックエンド、tRPC、WebSocket、フロントエンド）で共通利用
 * JWT設定の一元管理により冗長性を排除
 */

import { getConfig } from './validation.js';
import { AUTH_CONSTANTS } from './constants.js';

// セキュリティ関連定数
const BCRYPT_SALT_ROUNDS = 12;
const MIN_SECRET_LENGTH = 32;

/**
 * 🔐 JWT設定オブジェクト（統一版）
 */
export const authConfig = {
  get jwtSecret() {
    return getConfig().JWT_SECRET;
  },

  get jwtExpiresIn() {
    return getConfig().JWT_EXPIRES_IN;
  },

  get refreshTokenSecret() {
    return getConfig().REFRESH_TOKEN_SECRET;
  },

  get refreshTokenExpiresIn() {
    return getConfig().REFRESH_TOKEN_EXPIRES_IN;
  },

  // JWT設定のみ提供（検証ロジックは各パッケージで実装）
  getJWTSecrets() {
    return {
      jwtSecret: this.jwtSecret,
      refreshTokenSecret: this.refreshTokenSecret,
    };
  },

  // bcrypt設定
  saltRounds: BCRYPT_SALT_ROUNDS,
} as const;

/**
 * 🔍 JWT設定の検証
 */
export function validateJWTSecrets(): boolean {
  const config = getConfig();

  // 秘密鍵の最小長チェック
  if (config.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    console.warn(`⚠️ JWT_SECRET is shorter than recommended (${MIN_SECRET_LENGTH}+ characters)`);
    return false;
  }

  if (config.REFRESH_TOKEN_SECRET.length < MIN_SECRET_LENGTH) {
    console.warn(
      `⚠️ REFRESH_TOKEN_SECRET is shorter than recommended (${MIN_SECRET_LENGTH}+ characters)`
    );
    return false;
  }

  // 秘密鍵の重複チェック
  if (config.JWT_SECRET === config.REFRESH_TOKEN_SECRET) {
    console.warn('⚠️ JWT_SECRET and REFRESH_TOKEN_SECRET should be different');
    return false;
  }

  return true;
}

/**
 * 🔑 認証設定取得関数
 */
export function getAuthConfig() {
  return authConfig;
}

/**
 * 🔑 認証定数取得関数
 */
export function getAuthConstants() {
  return AUTH_CONSTANTS;
}

export default authConfig;
