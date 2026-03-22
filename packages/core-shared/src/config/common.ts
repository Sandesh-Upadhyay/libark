/**
 * 🎯 共通型定義・定数
 *
 * サーバー・クライアント共通で使用される型定義と定数
 */

// 環境戦略をインポート
import { envUtils } from './environment-strategy.js';

// 既存のschema.tsから型定義をre-export
export type {
  EnvConfig,
  AuthConfig,
  DatabaseConfig,
  ServerConfig,
  S3Config,
  // 🚫 ImageEncryptionConfig は削除されました（プリサインドS3システムに移行済み）
  PublicConfig,
  UploadConfig,
  RedisConfig,
  WebSocketConfig,
} from './schema.js';

// 既存のconstants.tsから定数をre-export
export {
  S3_CONSTANTS,
  MEDIA_CONSTANTS,
  SECURITY_CONSTANTS,
  AUTH_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  URL_CONSTANTS,
  UI_CONSTANTS,
  WORKER_CONSTANTS,
  HTTP_CONSTANTS,
  NETWORK_CONSTANTS,
  VALIDATION_CONSTANTS,
  MEDIA_PROCESSING_CONSTANTS,
  SUPPORTED_IMAGE_FORMATS,
  TIME_CONSTANTS,
  UPLOAD_CONSTANTS,
  PAGINATION_CONSTANTS,
  CRYPTO_CONSTANTS,
  type S3Variant,
  type S3Format,
  type S3DomainPattern,
  type ScreenSize,
  type Breakpoint,
  type HttpStatus,
  type PaginationSize,
  type CryptoConstant,
} from './constants.js';

// 環境戦略をエクスポート
export { envUtils, EnvironmentStrategyFactory } from './environment-strategy.js';

/**
 * 🌍 環境タイプ
 */
export type NodeEnv = 'development' | 'production' | 'test';

/**
 * 🎯 統一設定インターフェース
 */
export interface LibarkConfig {
  nodeEnv: NodeEnv;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * 🔧 設定ユーティリティ
 */
export const configUtils = {
  /**
   * 環境判定
   */
  isEnvironment(env: NodeEnv): boolean {
    return envUtils.getNodeEnv() === env;
  },

  /**
   * 開発環境判定
   */
  isDevelopment(): boolean {
    return envUtils.isDevelopment();
  },

  /**
   * 本番環境判定
   */
  isProduction(): boolean {
    return envUtils.isProduction();
  },

  /**
   * テスト環境判定
   */
  isTest(): boolean {
    return envUtils.isTest();
  },

  /**
   * URL正規化
   */
  normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  },

  /**
   * パス結合
   */
  joinPath(base: string, path: string): string {
    const normalizedBase = this.normalizeUrl(base);
    const normalizedPath = path.replace(/^\/+/, '');
    return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;
  },
} as const;

export default configUtils;
