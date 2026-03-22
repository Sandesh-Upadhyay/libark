/**
 * 🔐 Password utilities (centralized)
 * - Hash / Verify using bcrypt
 * - Single place to change policy (salt rounds, algorithm)
 */

import bcrypt from 'bcrypt';
import { authConfig } from '@libark/core-shared';

export interface PasswordHashOptions {
  saltRounds?: number;
}

/**
 * ハッシュ生成
 */
export async function hashPassword(
  plain: string,
  options: PasswordHashOptions = {}
): Promise<string> {
  const rounds = options.saltRounds ?? authConfig.saltRounds ?? 12;
  return bcrypt.hash(plain, rounds);
}

/**
 * パスワード検証
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const passwordUtils = {
  hashPassword,
  verifyPassword,
};
