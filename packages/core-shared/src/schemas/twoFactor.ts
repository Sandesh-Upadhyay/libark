/**
 * 🔐 2FA (Two-Factor Authentication) スキーマ定義
 */

import { z } from 'zod';

/**
 * TOTP設定リクエスト
 */
export const TwoFactorSetupSchema = z.object({
  /** パスワード確認（セキュリティ強化） */
  password: z.string().min(1, 'パスワードが必要です'),
});

/**
 * TOTP有効化リクエスト
 */
export const TwoFactorEnableSchema = z.object({
  /** TOTPコード（6桁） */
  totpCode: z
    .string()
    .length(6, 'TOTPコードは6桁である必要があります')
    .regex(/^\d{6}$/, 'TOTPコードは数字のみである必要があります'),
  /** パスワード確認 */
  password: z.string().min(1, 'パスワードが必要です'),
});

/**
 * TOTP無効化リクエスト
 */
export const TwoFactorDisableSchema = z.object({
  /** パスワード確認 */
  password: z.string().min(1, 'パスワードが必要です'),
  /** TOTPコードまたはバックアップコード */
  code: z.string().min(1, 'TOTPコードまたはバックアップコードが必要です'),
});

/**
 * TOTP検証リクエスト
 */
export const TwoFactorVerifySchema = z.object({
  /** TOTPコード（6桁）またはバックアップコード（8桁） */
  code: z
    .string()
    .min(6, 'コードは6桁以上である必要があります')
    .max(8, 'コードは8桁以下である必要があります')
    .regex(/^[A-Z0-9]+$/, 'コードは英数字のみである必要があります'),
});

/**
 * バックアップコード再生成リクエスト
 */
export const TwoFactorRegenerateBackupCodesSchema = z.object({
  /** パスワード確認 */
  password: z.string().min(1, 'パスワードが必要です'),
  /** TOTPコード */
  totpCode: z
    .string()
    .length(6, 'TOTPコードは6桁である必要があります')
    .regex(/^\d{6}$/, 'TOTPコードは数字のみである必要があります'),
});

/**
 * 2FA設定データ（レスポンス）
 */
export const TwoFactorSetupDataSchema = z.object({
  /** Base32エンコードされたシークレット */
  secret: z.string(),
  /** QRコード用のotpauth:// URL */
  qrCodeUrl: z.string().url(),
  /** バックアップ用の手動入力シークレット */
  manualEntryKey: z.string(),
});

/**
 * バックアップコード（レスポンス）
 */
export const BackupCodesSchema = z.object({
  /** バックアップコードリスト */
  codes: z.array(z.string()),
  /** 生成日時 */
  generatedAt: z.date(),
});

/**
 * 2FA状態（レスポンス）
 */
export const TwoFactorStatusSchema = z.object({
  /** 2FAが有効かどうか */
  enabled: z.boolean(),
  /** 有効化日時 */
  enabledAt: z.date().nullable(),
  /** 残りのバックアップコード数 */
  backupCodesCount: z.number().int().min(0),
});

// 型定義のエクスポート
export type TwoFactorSetup = z.infer<typeof TwoFactorSetupSchema>;
export type TwoFactorEnable = z.infer<typeof TwoFactorEnableSchema>;
export type TwoFactorDisable = z.infer<typeof TwoFactorDisableSchema>;
export type TwoFactorVerify = z.infer<typeof TwoFactorVerifySchema>;
export type TwoFactorRegenerateBackupCodes = z.infer<typeof TwoFactorRegenerateBackupCodesSchema>;
export type TwoFactorSetupData = z.infer<typeof TwoFactorSetupDataSchema>;
export type BackupCodes = z.infer<typeof BackupCodesSchema>;
export type TwoFactorStatus = z.infer<typeof TwoFactorStatusSchema>;
