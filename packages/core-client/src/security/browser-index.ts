/**
 * 🌐 ブラウザ専用セキュリティモジュール
 * フロントエンドで安全に使用できるセキュリティ機能のみをエクスポート
 */

// ブラウザ専用暗号化機能
export * from './browser-crypto.js';

// ブラウザで使用可能なセキュリティユーティリティ
export { browserCrypto } from './browser-crypto.js';

// CSRF機能はサーバー専用のため、core-serverパッケージに移動済み

/**
 * ブラウザ環境チェック
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * セキュアなランダム文字列生成（ブラウザ専用）
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}

/**
 * セキュアなUUID生成（ブラウザ専用）
 */
export function generateSecureUUID(): string {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // フォールバック実装
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // UUIDv4フォーマット
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * パスワード強度チェック（ブラウザ専用）
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // 長さチェック
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('8文字以上にしてください');
  }

  // 大文字チェック
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('大文字を含めてください');
  }

  // 小文字チェック
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('小文字を含めてください');
  }

  // 数字チェック
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('数字を含めてください');
  }

  // 特殊文字チェック
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('特殊文字を含めてください');
  }

  // 長いパスワードにボーナス
  if (password.length >= 12) {
    score = Math.min(score + 1, 4);
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isStrong: score >= 3,
  };
}

/**
 * 入力値のサニタイゼーション（ブラウザ専用）
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTMLタグを除去
    .replace(/['"]/g, '') // クォートを除去
    .trim();
}

/**
 * XSS対策のためのHTMLエスケープ（ブラウザ専用）
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * CSRFトークンをCookieから取得（ブラウザ専用）
 */
export function getCSRFTokenFromCookie(cookieName: string = 'csrf-token'): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

// ブラウザ専用セキュリティユーティリティ
export const browserSecurity = {
  isBrowser,
  generateSecureToken,
  generateSecureUUID,
  checkPasswordStrength,
  sanitizeInput,
  escapeHtml,
  getCSRFTokenFromCookie,
};
