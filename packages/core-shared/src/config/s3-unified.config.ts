/**
 * 🌐 統一S3設定管理システム
 *
 * 全サービス（DB・ワーカー・フロントエンド・S3 Gateway）で
 * 一貫したS3設定を提供し、設定の重複と不整合を防止
 */

import { z } from 'zod';

import { envUtils } from './environment-strategy.js';

/**
 * 🔧 統一S3設定インターフェース
 */
export interface UnifiedS3Config {
  // 基本認証情報（全サービス共通）
  credentials: {
    accessKey: string;
    secretKey: string;
  };

  // ストレージ設定（全サービス共通）
  storage: {
    bucket: string;
    region: string;
    endpoint: string;
  };

  // S3 Gateway設定
  gateway: {
    enabled: boolean;
    internalUrl: string; // サーバーサイド用（Docker内部ネットワーク）
    externalUrl: string; // クライアントサイド用（ブラウザアクセス）
    timeout: number;
  };

  // バックエンド設定（S3 Gateway経由でR2アクセス）
  backend: {
    type: 'r2' | 'aws' | 'gcs' | 'do_spaces';
    endpoint: string;
    region: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };

  // 暗号化設定
  encryption: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };

  // プリサインURL設定
  presigned: {
    expiresIn: number; // seconds
  };

  // CDN・公開URL設定
  urls: {
    public: string;
    cdn: string;
    avatars: string;
    covers: string;
  };

  // キャッシュ設定
  cache: {
    maxAge: number;
    publicPaths: string[];
  };
}

/**
 * 🔍 統一S3設定バリデーションスキーマ
 */
export const UnifiedS3ConfigSchema = z.object({
  // 基本認証情報
  S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY is required'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY is required'),
  S3_BUCKET: z.string().default('media'),
  S3_REGION: z.string().default('auto'),
  S3_ENDPOINT: z.string().url().optional(),

  // S3 Gateway設定
  S3_GATEWAY_URL: z.string().url().default('http://s3-gateway:8080'),
  NEXT_PUBLIC_S3_GATEWAY_URL: z.string().url().default('http://localhost'),
  S3_GATEWAY_TIMEOUT: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('30000'),

  // S3 Gateway Backend設定（R2直接アクセス用）
  S3_BACKEND_TYPE: z.enum(['r2', 'aws', 'gcs', 'do_spaces']).default('r2'),
  S3_BACKEND_ENDPOINT: z
    .string()
    .url()
    .default('https://f25991cce89a4c211ef744fa4de7acdd.r2.cloudflarestorage.com'),
  S3_BACKEND_REGION: z.string().default('auto'),
  S3_BACKEND_ACCESS_KEY: z.string().min(1, 'S3_BACKEND_ACCESS_KEY is required'),
  S3_BACKEND_SECRET_KEY: z.string().min(1, 'S3_BACKEND_SECRET_KEY is required'),
  S3_BACKEND_BUCKET: z.string().default('media'),

  // 暗号化設定
  S3_GATEWAY_ENCRYPTION_ENABLED: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  S3_GATEWAY_ENCRYPTION_ALGORITHM: z.string().default('AES256'),
  S3_GATEWAY_ENCRYPTION_KEY: z.string().optional(),

  // プリサインURL設定
  S3_PRESIGNED_EXPIRES_IN: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('3600'),

  // 公開URL設定
  S3_PUBLIC_URL: z.string().url().default('http://localhost/files/media'),
  S3_CDN_DOMAIN: z.string().url().default('http://localhost/files'),
  S3_AVATAR_CDN_URL: z.string().url().default('http://localhost/files/media/avatars'),
  S3_COVER_CDN_URL: z.string().url().default('http://localhost/files/media/covers'),

  // キャッシュ設定
  S3_GATEWAY_CACHE_MAX_AGE: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('86400'),
  S3_GATEWAY_PUBLIC_PATHS: z.string().default('/ogp/,/avatars/'),
});

/**
 * 🎯 統一S3設定管理クラス
 */
export class S3ConfigManager {
  private static instance: S3ConfigManager | null = null;
  private config: UnifiedS3Config | null = null;

  private constructor() {}

  /**
   * シングルトンインスタンスの取得
   */
  static getInstance(): S3ConfigManager {
    if (!S3ConfigManager.instance) {
      S3ConfigManager.instance = new S3ConfigManager();
    }
    return S3ConfigManager.instance;
  }

  /**
   * 統一S3設定の取得
   */
  getConfig(): UnifiedS3Config {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * 設定の再読み込み（テスト用）
   */
  reloadConfig(): UnifiedS3Config {
    this.config = null;
    return this.getConfig();
  }

  /**
   * サービス別設定の取得
   */
  getServiceConfig(
    service: 'frontend' | 'backend' | 'worker' | 's3-gateway'
  ): Partial<UnifiedS3Config> {
    const config = this.getConfig();

    switch (service) {
      case 'frontend':
        return {
          gateway: config.gateway,
          urls: config.urls,
          cache: config.cache,
        };

      case 'backend':
      case 'worker':
        return {
          credentials: config.credentials,
          storage: config.storage,
          gateway: config.gateway,
          urls: config.urls,
          presigned: config.presigned,
        };

      case 's3-gateway':
        return {
          backend: config.backend,
          encryption: config.encryption,
          presigned: config.presigned,
          cache: config.cache,
        };

      default:
        return config;
    }
  }

  /**
   * 環境変数から設定を読み込み
   */
  private loadConfig(): UnifiedS3Config {
    // 環境変数を収集
    const envVars = this.collectEnvironmentVariables();

    // バリデーション実行
    const result = UnifiedS3ConfigSchema.safeParse(envVars);

    if (!result.success) {
      console.error('❌ 統一S3設定のバリデーションに失敗しました:');
      result.error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('S3 configuration validation failed');
    }

    const validated = result.data;

    // 統一設定オブジェクトを構築
    return {
      credentials: {
        accessKey: validated.S3_ACCESS_KEY,
        secretKey: validated.S3_SECRET_KEY,
      },

      storage: {
        bucket: validated.S3_BUCKET,
        region: validated.S3_REGION,
        endpoint: validated.S3_ENDPOINT || validated.S3_GATEWAY_URL,
      },

      gateway: {
        enabled: true,
        internalUrl: validated.S3_GATEWAY_URL,
        externalUrl: validated.NEXT_PUBLIC_S3_GATEWAY_URL,
        timeout: validated.S3_GATEWAY_TIMEOUT,
      },

      backend: {
        type: validated.S3_BACKEND_TYPE,
        endpoint: validated.S3_BACKEND_ENDPOINT,
        region: validated.S3_BACKEND_REGION,
        accessKey: validated.S3_BACKEND_ACCESS_KEY,
        secretKey: validated.S3_BACKEND_SECRET_KEY,
        bucket: validated.S3_BACKEND_BUCKET,
      },

      encryption: {
        enabled: validated.S3_GATEWAY_ENCRYPTION_ENABLED,
        algorithm: validated.S3_GATEWAY_ENCRYPTION_ALGORITHM,
        key: validated.S3_GATEWAY_ENCRYPTION_KEY,
      },

      presigned: {
        expiresIn: validated.S3_PRESIGNED_EXPIRES_IN,
      },

      urls: {
        public: validated.S3_PUBLIC_URL,
        cdn: validated.S3_CDN_DOMAIN,
        avatars: validated.S3_AVATAR_CDN_URL,
        covers: validated.S3_COVER_CDN_URL,
      },

      cache: {
        maxAge: validated.S3_GATEWAY_CACHE_MAX_AGE,
        publicPaths: validated.S3_GATEWAY_PUBLIC_PATHS.split(','),
      },
    };
  }

  /**
   * 環境変数を安全に収集
   */
  private collectEnvironmentVariables(): Record<string, string | undefined> {
    const requiredVars = Object.keys(UnifiedS3ConfigSchema.shape);
    const envVars: Record<string, string | undefined> = {};

    for (const varName of requiredVars) {
      envVars[varName] = envUtils.getEnvVar(varName);
    }

    // Gateway-first compatibility fallback:
    // allow environments to define only S3_BACKEND_* plus gateway URL.
    envVars.S3_ACCESS_KEY = envVars.S3_ACCESS_KEY || envVars.S3_BACKEND_ACCESS_KEY;
    envVars.S3_SECRET_KEY = envVars.S3_SECRET_KEY || envVars.S3_BACKEND_SECRET_KEY;
    envVars.S3_BUCKET = envVars.S3_BUCKET || envVars.S3_BACKEND_BUCKET;
    envVars.S3_REGION = envVars.S3_REGION || envVars.S3_BACKEND_REGION;
    envVars.S3_ENDPOINT = envVars.S3_ENDPOINT || envVars.S3_GATEWAY_URL;

    return envVars;
  }

  /**
   * 設定の一貫性チェック
   */
  validateConsistency(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const config = this.getConfig();

      // 暗号化設定チェック
      if (config.encryption.enabled && !config.encryption.key) {
        errors.push('Encryption is enabled but S3_GATEWAY_ENCRYPTION_KEY is not set');
      }
    } catch (error) {
      errors.push(
        `Configuration load error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 🎯 統一S3設定の取得（便利関数）
 */
export function getUnifiedS3Config(): UnifiedS3Config {
  return S3ConfigManager.getInstance().getConfig();
}

/**
 * 🎯 サービス別S3設定の取得（便利関数）
 */
export function getS3ConfigForService(
  service: 'frontend' | 'backend' | 'worker' | 's3-gateway'
): Partial<UnifiedS3Config> {
  return S3ConfigManager.getInstance().getServiceConfig(service);
}

/**
 * 🔍 S3設定の一貫性チェック（便利関数）
 */
export function validateS3ConfigConsistency(): { isValid: boolean; errors: string[] } {
  return S3ConfigManager.getInstance().validateConsistency();
}
