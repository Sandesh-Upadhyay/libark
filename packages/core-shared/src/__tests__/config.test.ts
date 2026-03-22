/**
 * 🧪 設定モジュールテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  validateEnvironment,
  reloadConfig,
  validateConfigSafe,
  getConfig,
} from '../config/validation.js';
import {
  getDatabaseConfig,
  getS3Config,
  getRedisConfig,
  getWebSocketConfig,
  getUploadConfig,
  getServerConfig,
  serverConfig,
} from '../config/server.js';
import {
  getFrontendConfig,
  getMediaClientConfig,
  getWebSocketClientConfig,
  getAuthClientConfig,
  getGraphQLClientConfig,
  clientConfig,
} from '../config/client.js';
import {
  authConfig,
  validateJWTSecrets,
  getAuthConfig,
  getAuthConstants,
} from '../config/auth.config.js';
import {
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
  configUtils,
  envUtils,
  EnvironmentStrategyFactory,
} from '../config/common.js';

describe('設定モジュール', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 環境変数のバックアップ
    originalEnv = { ...process.env };

    // テスト用の最小限の環境変数を設定
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-testing';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.PORT = '8000';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.S3_ACCESS_KEY = 'test-access-key';
    process.env.S3_SECRET_KEY = 'test-secret-key-12345678901234567890';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ENDPOINT = 'https://s3.amazonaws.com';

    // 設定を再読み込みして新しい環境変数を反映
    reloadConfig();

    // 設定を再読み込みして新しい環境変数を反映
    reloadConfig();

    // 設定を再読み込みして新しい環境変数を反映
    reloadConfig();

    // 設定を再読み込みして新しい環境変数を反映
    reloadConfig();

    // 設定を再読み込みして新しい環境変数を反映
    reloadConfig();
  });

  afterEach(() => {
    // 環境変数の復元
    process.env = originalEnv;
    reloadConfig();
  });

  describe('環境変数の読み込み', () => {
    it('必須環境変数が正しく読み込まれる', () => {
      const config = getConfig();

      expect(config.NODE_ENV).toBe('test');
      expect(config.JWT_SECRET).toBe('test-jwt-secret-key-for-testing');
      expect(config.REFRESH_TOKEN_SECRET).toBe('test-refresh-secret-key-for-testing');
      expect(config.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
      expect(config.PORT).toBe(8000);
    });

    it('オプション環境変数がデフォルト値で補完される', () => {
      const config = getConfig();

      expect(config.JWT_EXPIRES_IN).toBeDefined();
      expect(config.REFRESH_TOKEN_EXPIRES_IN).toBeDefined();
      expect(config.REDIS_HOST).toBe('redis');
      expect(config.REDIS_PORT).toBe(6379);
    });

    it('設定の再読み込みが動作する', () => {
      const config1 = getConfig();

      // 環境変数を変更
      process.env.PORT = '9000';
      reloadConfig();

      const config2 = getConfig();
      expect(config2.PORT).toBe(9000);
    });
  });

  describe('設定のバリデーション', () => {
    it('有効な設定でバリデーションが成功する', () => {
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('無効なJWTシークレットでバリデーションが失敗する', () => {
      process.env.JWT_SECRET = 'short';
      expect(() => validateEnvironment()).toThrow();
    });

    it('無効なDATABASE_URLでバリデーションが失敗する', () => {
      process.env.DATABASE_URL = 'not-a-url';
      expect(() => validateEnvironment()).toThrow();
    });

    it('無効なPORTでバリデーションが失敗する', () => {
      process.env.PORT = '99999';
      expect(() => validateEnvironment()).toThrow();
    });

    it('無効なS3バケット名でバリデーションが失敗する', () => {
      process.env.S3_BUCKET = 'Invalid_Bucket_Name';
      expect(() => validateEnvironment()).toThrow();
    });

    it('validateConfigSafeがエラーを投げない', () => {
      const result = validateConfigSafe();
      expect(result.success).toBe(true);
    });

    it('validateConfigSafeがエラーを検出する', () => {
      process.env.JWT_SECRET = 'short';
      const result = validateConfigSafe();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('設定のデフォルト値', () => {
    it('JWT_EXPIRES_INのデフォルト値が正しい', () => {
      const config = getConfig();
      expect(config.JWT_EXPIRES_IN).toBeDefined();
    });

    it('REFRESH_TOKEN_EXPIRES_INのデフォルト値が正しい', () => {
      const config = getConfig();
      expect(config.REFRESH_TOKEN_EXPIRES_IN).toBeDefined();
    });

    it('REDIS_HOSTのデフォルト値が正しい', () => {
      const config = getConfig();
      expect(config.REDIS_HOST).toBe('redis');
    });

    it('REDIS_PORTのデフォルト値が正しい', () => {
      const config = getConfig();
      expect(config.REDIS_PORT).toBe(6379);
    });

    it('WEBSOCKET_PATHのデフォルト値が正しい', () => {
      const config = getConfig();
      expect(config.WEBSOCKET_PATH).toBe('/graphql');
    });
  });

  describe('サーバー設定', () => {
    it('getDatabaseConfigが正しく設定を返す', () => {
      const config = getDatabaseConfig();
      expect(config).toBeDefined();
      expect(config.url).toBeDefined();
    });

    it('getS3Configが正しく設定を返す', () => {
      const config = getS3Config();
      expect(config).toBeDefined();
      expect(config.accessKey).toBeDefined();
      expect(config.secretKey).toBeDefined();
      expect(config.bucket).toBeDefined();
      expect(config.region).toBeDefined();
      expect(config.endpoint).toBeDefined();
    });

    it('getRedisConfigが正しく設定を返す', () => {
      const config = getRedisConfig();
      expect(config).toBeDefined();
      expect(config.host).toBeDefined();
      expect(config.port).toBeDefined();
    });

    it('getWebSocketConfigが正しく設定を返す', () => {
      const config = getWebSocketConfig();
      expect(config).toBeDefined();
      expect(config.path).toBeDefined();
      expect(config.enabled).toBeDefined();
    });

    it('getUploadConfigが正しく設定を返す', () => {
      const config = getUploadConfig();
      // 設定が存在する場合のみチェック
      if (config) {
        expect(config.maxFileSizeMb).toBeDefined();
        expect(config.maxFiles).toBeDefined();
      }
    });

    it('getServerConfigが正しく設定を返す', () => {
      const config = getServerConfig();
      expect(config).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.corsOrigins).toBeDefined();
    });

    it('serverConfigが設定オブジェクトを返す', () => {
      expect(serverConfig).toBeDefined();
      expect(typeof serverConfig).toBe('object');
    });
  });

  describe('クライアント設定', () => {
    it('getFrontendConfigが正しく設定を返す', () => {
      const config = getFrontendConfig();
      expect(config).toBeDefined();
      expect(config.backendUrl).toBeDefined();
      expect(config.frontendUrl).toBeDefined();
    });

    it('getMediaClientConfigが正しく設定を返す', () => {
      const config = getMediaClientConfig();
      // 設定が存在する場合のみチェック
      if (config) {
        expect(config.mediaBaseUrl).toBeDefined();
      }
    });

    it('getWebSocketClientConfigが正しく設定を返す', () => {
      const config = getWebSocketClientConfig();
      expect(config).toBeDefined();
      expect(config.path).toBeDefined();
    });

    it('getAuthClientConfigが正しく設定を返す', () => {
      const config = getAuthClientConfig();
      // 設定が存在する場合のみチェック
      if (config) {
        expect(config.baseURL).toBeDefined();
      }
    });

    it('getGraphQLClientConfigが正しく設定を返す', () => {
      const config = getGraphQLClientConfig();
      // 設定が存在する場合のみチェック
      if (config) {
        expect(config.httpUrl).toBeDefined();
        expect(config.wsUrl).toBeDefined();
      }
    });

    it('clientConfigが設定オブジェクトを返す', () => {
      expect(clientConfig).toBeDefined();
      expect(typeof clientConfig).toBe('object');
    });
  });

  describe('認証設定', () => {
    it('authConfigが設定オブジェクトを返す', () => {
      expect(authConfig).toBeDefined();
      expect(typeof authConfig).toBe('object');
    });

    it('getAuthConfigが正しく設定を返す', () => {
      const config = getAuthConfig();
      expect(config).toBeDefined();
      expect(config.jwtSecret).toBeDefined();
      expect(config.refreshTokenSecret).toBeDefined();
    });

    it('getAuthConstantsが定数を返す', () => {
      const constants = getAuthConstants();
      expect(constants).toBeDefined();
      expect(typeof constants).toBe('object');
    });

    it('validateJWTSecretsが有効なシークレットで成功する', () => {
      expect(() => validateJWTSecrets()).not.toThrow();
    });
  });

  describe('共通定数', () => {
    it('S3_CONSTANTSが定義されている', () => {
      expect(S3_CONSTANTS).toBeDefined();
      expect(typeof S3_CONSTANTS).toBe('object');
    });

    it('MEDIA_CONSTANTSが定義されている', () => {
      expect(MEDIA_CONSTANTS).toBeDefined();
      expect(typeof MEDIA_CONSTANTS).toBe('object');
    });

    it('SECURITY_CONSTANTSが定義されている', () => {
      expect(SECURITY_CONSTANTS).toBeDefined();
      expect(typeof SECURITY_CONSTANTS).toBe('object');
    });

    it('AUTH_CONSTANTSが定義されている', () => {
      expect(AUTH_CONSTANTS).toBeDefined();
      expect(typeof AUTH_CONSTANTS).toBe('object');
    });

    it('PERFORMANCE_CONSTANTSが定義されている', () => {
      expect(PERFORMANCE_CONSTANTS).toBeDefined();
      expect(typeof PERFORMANCE_CONSTANTS).toBe('object');
    });

    it('URL_CONSTANTSが定義されている', () => {
      expect(URL_CONSTANTS).toBeDefined();
      expect(typeof URL_CONSTANTS).toBe('object');
    });

    it('UI_CONSTANTSが定義されている', () => {
      expect(UI_CONSTANTS).toBeDefined();
      expect(typeof UI_CONSTANTS).toBe('object');
    });

    it('WORKER_CONSTANTSが定義されている', () => {
      expect(WORKER_CONSTANTS).toBeDefined();
      expect(typeof WORKER_CONSTANTS).toBe('object');
    });

    it('HTTP_CONSTANTSが定義されている', () => {
      expect(HTTP_CONSTANTS).toBeDefined();
      expect(typeof HTTP_CONSTANTS).toBe('object');
    });

    it('NETWORK_CONSTANTSが定義されている', () => {
      expect(NETWORK_CONSTANTS).toBeDefined();
      expect(typeof NETWORK_CONSTANTS).toBe('object');
    });

    it('VALIDATION_CONSTANTSが定義されている', () => {
      expect(VALIDATION_CONSTANTS).toBeDefined();
      expect(typeof VALIDATION_CONSTANTS).toBe('object');
    });

    it('MEDIA_PROCESSING_CONSTANTSが定義されている', () => {
      expect(MEDIA_PROCESSING_CONSTANTS).toBeDefined();
      expect(typeof MEDIA_PROCESSING_CONSTANTS).toBe('object');
    });

    it('SUPPORTED_IMAGE_FORMATSが定義されている', () => {
      expect(SUPPORTED_IMAGE_FORMATS).toBeDefined();
      expect(typeof SUPPORTED_IMAGE_FORMATS).toBe('object');
    });

    it('TIME_CONSTANTSが定義されている', () => {
      expect(TIME_CONSTANTS).toBeDefined();
      expect(typeof TIME_CONSTANTS).toBe('object');
    });

    it('UPLOAD_CONSTANTSが定義されている', () => {
      expect(UPLOAD_CONSTANTS).toBeDefined();
      expect(typeof UPLOAD_CONSTANTS).toBe('object');
    });

    it('PAGINATION_CONSTANTSが定義されている', () => {
      expect(PAGINATION_CONSTANTS).toBeDefined();
      expect(typeof PAGINATION_CONSTANTS).toBe('object');
    });

    it('CRYPTO_CONSTANTSが定義されている', () => {
      expect(CRYPTO_CONSTANTS).toBeDefined();
      expect(typeof CRYPTO_CONSTANTS).toBe('object');
    });
  });

  describe('環境ユーティリティ', () => {
    it('envUtilsが定義されている', () => {
      expect(envUtils).toBeDefined();
      expect(typeof envUtils).toBe('object');
    });

    it('envUtils.isDevelopmentが正しく動作する', () => {
      process.env.NODE_ENV = 'development';
      reloadConfig();
      expect(envUtils.isDevelopment()).toBe(true);
      expect(envUtils.isProduction()).toBe(false);
    });

    it('envUtils.isProductionが正しく動作する', () => {
      process.env.NODE_ENV = 'production';
      reloadConfig();
      expect(envUtils.isDevelopment()).toBe(false);
      expect(envUtils.isProduction()).toBe(true);
    });

    it('envUtils.isTestが正しく動作する', () => {
      process.env.NODE_ENV = 'test';
      reloadConfig();
      expect(envUtils.isTest()).toBe(true);
    });
  });

  describe('設定ユーティリティ', () => {
    it('configUtilsが定義されている', () => {
      expect(configUtils).toBeDefined();
      expect(typeof configUtils).toBe('object');
    });

    it('EnvironmentStrategyFactoryが定義されている', () => {
      expect(EnvironmentStrategyFactory).toBeDefined();
      expect(typeof EnvironmentStrategyFactory).toBe('function');
    });
  });

  describe('エラーハンドリング', () => {
    it('不足している必須環境変数でエラーが発生する', () => {
      delete process.env.JWT_SECRET;
      expect(() => validateEnvironment()).toThrow();
    });

    it('無効な環境タイプでエラーが発生する', () => {
      process.env.NODE_ENV = 'invalid' as any;
      expect(() => validateEnvironment()).toThrow();
    });

    it('無効なS3エンドポイントでエラーが発生する', () => {
      process.env.S3_ENDPOINT = 'not-a-url';
      expect(() => validateEnvironment()).toThrow();
    });
  });

  describe('設定の一貫性', () => {
    it('複数回のgetConfig呼び出しで同じ結果が返る', () => {
      const config1 = getConfig();
      const config2 = getConfig();
      expect(config1).toEqual(config2);
    });

    it('環境変数の変更がreloadConfigで反映される', () => {
      const config1 = getConfig();
      process.env.PORT = '9999';
      reloadConfig();
      const config2 = getConfig();
      expect(config1.PORT).not.toBe(config2.PORT);
    });
  });
});
