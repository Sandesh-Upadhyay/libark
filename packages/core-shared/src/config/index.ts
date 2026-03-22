/**
 * 🔧 統合設定管理モジュール
 *
 * 旧 @libark/config の機能を統合
 * 責任分離による設定管理:
 * - server.ts: サーバー専用設定（機密情報含む）
 * - client.ts: ブラウザ専用設定（公開情報のみ）
 * - common.ts: 共通型定義・定数
 * - validation.ts: 環境変数バリデーション
 */

// 内部インポート
import { getConfig } from './validation.js';

// 🔧 環境変数バリデーション
export { validateEnvironment, reloadConfig, validateConfigSafe } from './validation.js';

// 🎯 サーバー専用設定
export {
  getDatabaseConfig,
  getS3Config,
  getRedisConfig,
  getWebSocketConfig,
  getUploadConfig,
  getServerConfig,
  serverConfig,
} from './server.js';

// 🎯 認証設定
export { authConfig, validateJWTSecrets, getAuthConfig, getAuthConstants } from './auth.config.js';

// 🗄️ キャッシュ設定（一時的にコメントアウト）
// export {
//   getCacheConfigFromUnified,
//   validateCacheConfig,
//   initializeCacheConfig,
//   type UnifiedCacheConfig,
// } from './cache.config.js';

// 🎯 統一設定システム（validation.tsベース）
// 古い設定システム（config.js、unified.config.js）は削除済み

// 🎯 クライアント専用設定
export {
  getFrontendConfig,
  getMediaClientConfig,
  getWebSocketClientConfig,
  getAuthClientConfig,
  getGraphQLClientConfig,
  clientConfig,
} from './client.js';

// 🎯 共通型定義・定数
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
  configUtils,
  envUtils,
  EnvironmentStrategyFactory,
  type NodeEnv,
  type LibarkConfig,
  type EnvConfig,
  type AuthConfig,
  type DatabaseConfig,
  type ServerConfig,
  type S3Config,
  // 🚫 ImageEncryptionConfig は削除されました（プリサインドS3システムに移行済み）
  type PublicConfig,
  type UploadConfig,
  type RedisConfig,
  type WebSocketConfig,
  type S3Variant,
  type S3Format,
  type S3DomainPattern,
  type ScreenSize,
  type Breakpoint,
  type HttpStatus,
  type PaginationSize,
  type CryptoConstant,
} from './common.js';

// 🎯 メディアタイプ定数
export {
  MEDIA_TYPES,
  WORKER_METADATA_TYPES,
  MEDIA_TYPE_TO_WORKER_METADATA,
  isAvatarType,
  isPostType,
  getMediaFolderPath,
  getMediaProcessingPriority,
  createWorkerMetadata,
  type MediaTypeConstant,
  type WorkerMetadataType,
} from '../constants/media-types.js';

// 型定義は common.ts から統一エクスポート済み

// 🎯 統一設定オブジェクト（レガシー互換性のため）
export const config = {
  // 基本設定
  get nodeEnv() {
    return getConfig().NODE_ENV;
  },

  get port() {
    return getConfig().PORT;
  },

  get corsOrigins() {
    return getConfig().CORS_ORIGINS;
  },

  // 認証設定
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

  // データベース設定
  get databaseUrl() {
    return getConfig().DATABASE_URL;
  },

  // S3設定
  s3: {
    get accessKey() {
      return getConfig().S3_ACCESS_KEY;
    },

    get secretKey() {
      return getConfig().S3_SECRET_KEY;
    },

    get bucket() {
      return getConfig().S3_BUCKET;
    },

    get region() {
      return getConfig().S3_REGION;
    },

    get endpoint() {
      return getConfig().S3_ENDPOINT;
    },

    get publicUrl() {
      return getConfig().S3_PUBLIC_URL;
    },

    get cdnDomain() {
      return getConfig().S3_CDN_DOMAIN;
    },
  },

  // 🚫 画像暗号化設定は削除されました（プリサインドS3システムに移行済み）
  // Zenkoが透明暗号化を処理するため、アプリケーション層での暗号化設定は不要です

  // Redis設定
  redis: {
    get host() {
      return getConfig().REDIS_HOST;
    },

    get port() {
      return getConfig().REDIS_PORT;
    },

    get password() {
      return getConfig().REDIS_PASSWORD;
    },

    get url() {
      const config = getConfig();
      return config.REDIS_URL || `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`;
    },
  },

  // WebSocket設定
  websocket: {
    get path() {
      return getConfig().WEBSOCKET_PATH;
    },

    get enabled() {
      return getConfig().WEBSOCKET_ENABLED;
    },

    get corsOrigins() {
      return getConfig().WEBSOCKET_CORS_ORIGINS;
    },

    get maxConnections() {
      return getConfig().WEBSOCKET_MAX_CONNECTIONS;
    },

    get debug() {
      const config = getConfig();
      return config.WEBSOCKET_DEBUG ?? config.NODE_ENV === 'development';
    },
  },

  // デバッグ設定
  get debugImages() {
    return getConfig().DEBUG_IMAGES;
  },

  // 環境判定
  get isDevelopment() {
    return getConfig().NODE_ENV === 'development';
  },

  get isProduction() {
    return getConfig().NODE_ENV === 'production';
  },

  get isTest() {
    return getConfig().NODE_ENV === 'test';
  },
} as const;

// 🖼️ メディア設定（削除済み - variantConfig.tsに移行）

// ☁️ 統一S3設定システム
export {
  getUnifiedS3Config,
  getS3ConfigForService,
  validateS3ConfigConsistency,
  S3ConfigManager,
  type UnifiedS3Config,
} from './s3-unified.config.js';

// 🌐 フロントエンド専用S3設定システム（削除済み - 固定設定に移行）
