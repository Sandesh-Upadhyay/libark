/**
 * 🔍 環境変数バリデーション
 *
 * アプリケーション起動時に環境変数を検証し、
 * 型安全な設定オブジェクトを提供
 */

import { EnvSchema, type EnvConfig } from './schema.js';
import { envUtils } from './environment-strategy.js';

// バリデーション関連の定数
const JWT_SECRET_PREVIEW_LENGTH = 20;
const JWT_SECRET_LOG_LENGTH = 10;

function normalizeEnvironment(rawEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const normalized: NodeJS.ProcessEnv = { ...rawEnv };

  // S3 Gateway-first normalization:
  // If base S3_* is omitted, derive it from backend/gateway vars for compatibility.
  if (!normalized.S3_ACCESS_KEY && normalized.S3_BACKEND_ACCESS_KEY) {
    normalized.S3_ACCESS_KEY = normalized.S3_BACKEND_ACCESS_KEY;
  }
  if (!normalized.S3_SECRET_KEY && normalized.S3_BACKEND_SECRET_KEY) {
    normalized.S3_SECRET_KEY = normalized.S3_BACKEND_SECRET_KEY;
  }
  if (!normalized.S3_BUCKET && normalized.S3_BACKEND_BUCKET) {
    normalized.S3_BUCKET = normalized.S3_BACKEND_BUCKET;
  }
  if (!normalized.S3_REGION && normalized.S3_BACKEND_REGION) {
    normalized.S3_REGION = normalized.S3_BACKEND_REGION;
  }
  if (!normalized.S3_ENDPOINT && normalized.S3_GATEWAY_URL) {
    normalized.S3_ENDPOINT = normalized.S3_GATEWAY_URL;
  }

  return normalized;
}

/**
 * 🔧 環境変数の読み込みと検証
 */
export function validateEnvironment(): EnvConfig {
  // .envファイルを読み込み（ブラウザ環境では不要）
  if (typeof window === 'undefined' && typeof require !== 'undefined') {
    try {
      // Node.js環境でのみdotenvを使用
      const dotenv = require('dotenv');
      dotenv.config({ override: false });
    } catch (error) {
      // dotenvが利用できない場合はスキップ
      console.warn('dotenv not available, skipping .env file loading');
    }
  }

  // 開発環境でのみ詳細ログを出力
  if (envUtils.isDevelopment() && process.env.DEBUG_CONFIG === 'true') {
    console.log('🔍 環境変数の検証を開始...');

    // JWT秘密鍵の一貫性チェック
    const jwtSecret = envUtils.getEnvVar('JWT_SECRET');
    if (jwtSecret) {
      console.log(`🔑 JWT_SECRET検出: ${jwtSecret.substring(0, JWT_SECRET_PREVIEW_LENGTH)}...`);
    }
  }

  // 環境変数をスキーマで検証
  // process.envを直接使用（validation.tsは例外的に許可）
  const normalizedEnv = normalizeEnvironment(process.env);
  const result = EnvSchema.safeParse(normalizedEnv);

  if (!result.success) {
    console.error('❌ 環境変数の検証に失敗しました:');
    console.error(result.error.format());

    // 詳細なエラーメッセージを表示
    result.error.issues.forEach((issue: { path: (string | number)[]; message: string }) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });

    console.error('\n💡 .envファイルを確認し、必要な環境変数を設定してください。');
    console.error('📖 .env.template を参考にしてください。');

    // 本番環境では例外を投げ、テスト環境も例外を投げる
    if (envUtils.isProduction() || envUtils.getNodeEnv() === 'test') {
      throw new Error('Environment validation failed');
    }

    process.exit(1);
  }

  // 開発環境でのみ完了ログを出力
  if (envUtils.isDevelopment() && process.env.DEBUG_CONFIG === 'true') {
    console.log('✅ 環境変数の検証が完了しました');

    // 詳細設定値をログ出力
    console.log('🔧 設定値:');
    console.log(`  - NODE_ENV: ${result.data.NODE_ENV}`);
    console.log(`  - PORT: ${result.data.PORT}`);
    console.log(`  - JWT_SECRET: ${result.data.JWT_SECRET.substring(0, JWT_SECRET_LOG_LENGTH)}...`);
    console.log(`  - S3_BUCKET: ${result.data.S3_BUCKET}`);
  }

  return result.data;
}

/**
 * 🎯 設定値の取得（遅延初期化）
 */
let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}

/**
 * 🔄 設定の再読み込み（テスト用）
 */
export function reloadConfig(): EnvConfig {
  cachedConfig = null;
  return getConfig();
}

/**
 * 🧪 設定値の検証のみ（エラーを投げない）
 */
export function validateConfigSafe(): { success: boolean; error?: string } {
  try {
    // 環境変数を安全に取得
    const envVars = normalizeEnvironment(
      Object.fromEntries(Object.keys(EnvSchema.shape).map(key => [key, envUtils.getEnvVar(key)]))
    );

    const result = EnvSchema.safeParse(envVars);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues
          .map(
            (issue: { path: (string | number)[]; message: string }) =>
              `${issue.path.join('.')}: ${issue.message}`
          )
          .join(', '),
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
