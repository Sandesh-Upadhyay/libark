/**
 * 🌐 LIBARK統一定数
 *
 * システム全体で使用される定数を統一管理
 */

import { envUtils } from './environment-strategy.js';

/**
 * ☁️ S3/Object Storage関連定数
 * S3 Gateway経由でCloudflare R2に対応（開発・本番共通）
 */
export const S3_CONSTANTS = {
  // フロントエンド: 常にlocalhost（固定）
  FRONTEND_ENDPOINT: 'http://localhost',
  FRONTEND_DOMAIN: 'localhost/files/media',

  // バックエンド: Docker内部ネットワーク（固定）
  BACKEND_ENDPOINT: 'http://s3-gateway:8080',
  BACKEND_DOMAIN: 's3-gateway:8080/files/media',

  // 共通設定
  REGION: 'auto',

  // 共通設定
  DEFAULT_BUCKET: 'media',

  // 環境別デフォルト値（統一環境変数システム使用）
  get DEFAULT_REGION() {
    return envUtils.isProduction() ? 'auto' : 'sgp1';
  },
  get DEFAULT_ENDPOINT() {
    return envUtils.isProduction()
      ? 'https://f25991cce89a4c211ef744fa4de7acdd.r2.cloudflarestorage.com'
      : 'https://sgp1.digitaloceanspaces.com';
  },
  get DEFAULT_DOMAIN() {
    return envUtils.isProduction()
      ? 'f25991cce89a4c211ef744fa4de7acdd.r2.cloudflarestorage.com'
      : 'libark.sgp1.digitaloceanspaces.com';
  },
  get DEFAULT_CDN_DOMAIN() {
    return envUtils.isProduction() ? 'media.libark.io' : 'libark.sgp1.cdn.digitaloceanspaces.com';
  },

  // パスパターン
  MEDIA_PATH_PREFIX: 'media',
  AVATARS_PATH_PREFIX: 'avatars',
  COVERS_PATH_PREFIX: 'covers',

  // ドメインパターン（パス正規化用）
  DOMAIN_PATTERNS: [
    // 開発環境
    'libark.sgp1.digitaloceanspaces.com',
    '.digitaloceanspaces.com',
    'digitaloceanspaces.com',
    // 本番環境
    'f25991cce89a4c211ef744fa4de7acdd.r2.cloudflarestorage.com',
    'media.libark.io',
    '.r2.cloudflarestorage.com',
    'r2.cloudflarestorage.com',
  ] as const,

  // サポートするファイル形式
  SUPPORTED_FORMATS: ['webp', 'jpg', 'jpeg', 'png'] as const,
  DEFAULT_FORMAT: 'webp' as const,

  // バリアント名
  VARIANTS: {
    THUMB: 'thumb',
    MAIN: 'main',
    HIGH: 'high',
    ORIGINAL: 'orig',
  } as const,
} as const;

/**
 * 🎯 メディア関連定数
 */

// 基本的な数値定数
const THUMB_WIDTH = 320;
const MAIN_WIDTH = 800;
const HIGH_WIDTH = 1920;
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 90;
const BYTES_PER_KB = 1024;
const KB_PER_MB = 1024;
const MAX_FILE_MB = 10;
const MAX_UPLOAD_MB = 50;

/**
 * 📷 サポートされる画像形式定義（統一管理）
 *
 * セキュリティ上重要な設定のため、コードベースで一元管理。
 * SVGは除外（XSS攻撃リスクのため）
 */
export const SUPPORTED_IMAGE_FORMATS = {
  // 入力として受け入れる形式（MIMEタイプ）
  INPUT_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/tiff',
  ] as const,

  // ファイル拡張子マッピング
  MIME_TO_EXTENSIONS: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/avif': ['.avif'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
  } as const,

  // S3保存形式（常にWebP）
  OUTPUT_FORMAT: 'webp' as const,
  OUTPUT_MIME_TYPE: 'image/webp' as const,
} as const;

export const MEDIA_CONSTANTS = {
  // デフォルトサイズ
  DEFAULT_THUMB_WIDTH: THUMB_WIDTH,
  DEFAULT_MAIN_WIDTH: MAIN_WIDTH,
  DEFAULT_HIGH_WIDTH: HIGH_WIDTH,

  // 品質設定
  DEFAULT_WEBP_QUALITY: WEBP_QUALITY,
  DEFAULT_JPEG_QUALITY: JPEG_QUALITY,

  // ファイルサイズ制限
  MAX_FILE_SIZE: MAX_FILE_MB * KB_PER_MB * BYTES_PER_KB, // 10MB
  MAX_UPLOAD_SIZE: MAX_UPLOAD_MB * KB_PER_MB * BYTES_PER_KB, // 50MB
} as const;

/**
 * 🔐 セキュリティ関連定数
 */

// セキュリティ関連の基本数値
const IV_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 32;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_5_MINUTES = 300;

export const SECURITY_CONSTANTS = {
  // 暗号化設定
  DEFAULT_ALGORITHM: 'aes-256-cbc',
  IV_LENGTH: IV_LENGTH_BYTES,
  KEY_LENGTH: KEY_LENGTH_BYTES,

  // アクセス制御
  DEFAULT_CACHE_MAX_AGE: SECONDS_PER_HOUR, // 1時間
  PRIVATE_CACHE_MAX_AGE: SECONDS_PER_5_MINUTES, // 5分
} as const;

/**
 * 🔐 認証関連定数
 */

// 認証関連の基本数値
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;

export const AUTH_CONSTANTS = {
  // Cookie設定
  COOKIE_MAX_AGE_SECONDS: HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE, // 24時間
  COOKIE_MAX_AGE_HOURS: HOURS_PER_DAY, // 24時間
  COOKIE_MAX_AGE_MINUTES: MINUTES_PER_HOUR, // 60分

  // セッション設定
  SESSION_TIMEOUT_HOURS: HOURS_PER_DAY, // 24時間
  REFRESH_TOKEN_DAYS: 7, // 7日間

  // Cookie名
  ACCESS_TOKEN_COOKIE: 'accessToken',
  REFRESH_TOKEN_COOKIE: 'refreshToken',
} as const;

/**
 * ⚡ パフォーマンス関連定数
 */

// パフォーマンス関連の基本数値
const MINUTES_5 = 5;
const MINUTES_30 = 30;
const MILLISECONDS_PER_SECOND = 1000;
const MAX_UPLOADS = 3;
const MAX_DOWNLOADS = 5;
const MAX_RETRIES = 3;

export const PERFORMANCE_CONSTANTS = {
  // キャッシュ設定
  DEFAULT_STALE_TIME: MINUTES_5 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND, // 5分
  DEFAULT_GC_TIME: MINUTES_30 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND, // 30分

  // 並列処理
  MAX_CONCURRENT_UPLOADS: MAX_UPLOADS,
  MAX_CONCURRENT_DOWNLOADS: MAX_DOWNLOADS,

  // リトライ設定
  MAX_RETRY_ATTEMPTS: MAX_RETRIES,
  RETRY_DELAY_BASE: MILLISECONDS_PER_SECOND, // 1秒
} as const;

/**
 * 🌐 URL関連定数
 */
export const URL_CONSTANTS = {
  // プロトコル
  DEFAULT_PROTOCOL: 'https',

  // パス区切り文字
  PATH_SEPARATOR: '/',

  // クエリパラメータ
  VARIANT_PARAM: 'variant',
  CACHE_PARAM: 'cache',
} as const;

/**
 * 📱 UI関連定数
 */
export const UI_CONSTANTS = {
  // 画面サイズ閾値
  SCREEN_SIZE: {
    MOBILE: 480,
    TABLET: 1200,
    DESKTOP: 1920,
  },

  // レスポンシブブレークポイント
  BREAKPOINTS: {
    XS: 320,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536,
  },
} as const;

/**
 * 🌐 HTTP関連定数
 */
export const HTTP_CONSTANTS = {
  // 成功ステータス
  STATUS_OK: 200,
  STATUS_CREATED: 201,
  STATUS_NO_CONTENT: 204,

  // クライアントエラー
  STATUS_BAD_REQUEST: 400,
  STATUS_UNAUTHORIZED: 401,
  STATUS_FORBIDDEN: 403,
  STATUS_NOT_FOUND: 404,
  STATUS_METHOD_NOT_ALLOWED: 405,
  STATUS_CONFLICT: 409,
  STATUS_PAYLOAD_TOO_LARGE: 413,
  STATUS_UNSUPPORTED_MEDIA_TYPE: 415,
  STATUS_UNPROCESSABLE_ENTITY: 422,
  STATUS_TOO_MANY_REQUESTS: 429,

  // サーバーエラー
  STATUS_INTERNAL_SERVER_ERROR: 500,
  STATUS_NOT_IMPLEMENTED: 501,
  STATUS_BAD_GATEWAY: 502,
  STATUS_SERVICE_UNAVAILABLE: 503,
  STATUS_GATEWAY_TIMEOUT: 504,

  // GraphQLエラーコード
  GRAPHQL_BAD_USER_INPUT: 4000,
  GRAPHQL_UNAUTHENTICATED: 4001,
  GRAPHQL_FORBIDDEN: 4002,
  GRAPHQL_PERSISTED_QUERY_NOT_FOUND: 4003,
} as const;

/**
 * ⚙️ ワーカー関連定数
 */
export const WORKER_CONSTANTS = {
  // 並行処理設定
  DEFAULT_CONCURRENCY: 5,
  MAX_CONCURRENCY: 20,

  // レート制限
  RATE_LIMIT_MAX: 10,
  RATE_LIMIT_DURATION: 1000, // 1秒

  // タイムアウト設定
  STALLED_INTERVAL: 30000, // 30秒
  MAX_STALLED_COUNT: 3,

  // リトライ設定
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY: 2000, // 2秒

  // キュー設定
  REMOVE_ON_COMPLETE: false,
  REMOVE_ON_FAIL: false,

  // タイムアウト値（ミリ秒）
  TIMEOUT_SHORT: 5000, // 5秒
  TIMEOUT_MEDIUM: 30000, // 30秒
  TIMEOUT_LONG: 60000, // 1分
  TIMEOUT_VERY_LONG: 300000, // 5分

  // チェック間隔
  CHECK_INTERVAL_FAST: 1000, // 1秒
  CHECK_INTERVAL_NORMAL: 2000, // 2秒
  CHECK_INTERVAL_SLOW: 5000, // 5秒
} as const;

/**
 * 🌐 ネットワーク・サーバー関連定数
 */
export const NETWORK_CONSTANTS = {
  // ポート番号
  DEFAULT_PORT: 3000,
  BACKEND_PORT: 8000,
  REDIS_DEFAULT_PORT: 6379,
  POSTGRES_DEFAULT_PORT: 5432,

  // タイムアウト値
  CONNECTION_TIMEOUT: 10000, // 10秒
  REQUEST_TIMEOUT: 30000, // 30秒
  SOCKET_TIMEOUT: 60000, // 1分

  // リトライ設定
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1秒

  // 接続プール
  MAX_CONNECTIONS: 100,
  MIN_CONNECTIONS: 5,
} as const;

/**
 * 🔢 バリデーション関連定数
 */
export const VALIDATION_CONSTANTS = {
  // 年齢制限
  MIN_AGE: 18,
  MAX_AGE: 120,
  SENIOR_AGE: 65,

  // 文字列長制限
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 255,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MIN_EMAIL_LENGTH: 6,
  MAX_EMAIL_LENGTH: 255,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,

  // 数値制限
  MIN_PORT: 1,
  MAX_PORT: 65535,
  MAX_UPLOAD_SIZE_MB: 100,
  MAX_UPLOAD_FILES: 20,

  // 基数
  RADIX_DECIMAL: 10,
  RADIX_HEX: 16,
} as const;

/**
 * 🎨 メディア処理関連定数
 */
export const MEDIA_PROCESSING_CONSTANTS = {
  // 画像サイズ
  THUMBNAIL_SIZE: 300,
  SMALL_SIZE: 480,
  MEDIUM_SIZE: 720,
  LARGE_SIZE: 1080,
  EXTRA_LARGE_SIZE: 1920,

  // 圧縮品質
  HIGH_QUALITY: 95,
  MEDIUM_QUALITY: 80,
  LOW_QUALITY: 70,
  THUMBNAIL_QUALITY: 60,

  // WebP設定
  WEBP_EFFORT: 6,
  WEBP_EFFORT_HIGH: 4,

  // ファイルサイズ（バイト）
  BYTES_PER_KB: 1024,
  KB_PER_MB: 1024,
  MB_PER_GB: 1024,

  // 暗号化関連
  CRYPTO_IV_LENGTH: 16,
  CRYPTO_KEY_LENGTH: 32,

  // ファイル形式マジックナンバー（16進）
  JPEG_MAGIC: 0xff,
  PNG_MAGIC_1: 0x89,
  PNG_MAGIC_2: 0x50,
  PNG_MAGIC_3: 0x4e,
  PNG_MAGIC_4: 0x47,
  GIF_MAGIC_1: 0x47,
  GIF_MAGIC_2: 0x49,
  WEBP_MAGIC_1: 0x57,
  WEBP_MAGIC_2: 0x45,
  WEBP_MAGIC_3: 0x42,
  WEBP_MAGIC_4: 0x50,
} as const;

/**
 * 🕒 時間関連定数
 */
export const TIME_CONSTANTS = {
  // ミリ秒単位
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,

  // 複合計算用
  MILLISECONDS_PER_MINUTE: 60 * 1000,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MILLISECONDS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,
  MILLISECONDS_PER_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 📤 ファイルアップロード関連定数（統一管理）
 *
 * 🎯 すべてのファイルサイズ制限はここで統一管理
 * - Cloudflare無料プラン: 100MB制限
 * - フロントエンド・バックエンド・nginx・S3すべて統一
 */
export const UPLOAD_CONSTANTS = {
  // ファイルサイズ制限（Cloudflare無料プラン100MB制限に対応）
  MAX_FILE_SIZE_MB: 100,
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB in bytes
  MAX_FILES_COUNT: 10,
  MAX_FIELD_NAME_SIZE: 100,
  MAX_FIELD_SIZE_MB: 1,

  // バイト変換
  BYTES_PER_KB: 1024,
  BYTES_PER_MB: 1024 * 1024,
  KB_PER_MB: 1024,

  // 表示用テキスト
  DISPLAY_TEXT: {
    MAX_SIZE: '最大100MB',
    SUPPORTED_FORMATS: 'JPG, PNG, WebP, GIF',
  },
} as const;

/**
 * 📊 ページネーション関連定数
 */
export const PAGINATION_CONSTANTS = {
  // デフォルトページサイズ
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  // 管理者用
  ADMIN_PAGE_SIZE: 2,

  // コメント用
  COMMENT_PAGE_SIZE: 50,
  COMMENT_MAX_LENGTH: 300,

  // 通知用
  NOTIFICATION_PAGE_SIZE: 20,

  // ユーザー用
  USER_PAGE_SIZE: 20,
} as const;

/**
 * 🔐 暗号化・セキュリティ関連定数
 */
export const CRYPTO_CONSTANTS = {
  // パスワード関連
  BCRYPT_SALT_ROUNDS: 8,

  // ランダム文字列生成
  RANDOM_STRING_LENGTH: 36,
  RANDOM_STRING_RADIX: 36,
  RANDOM_STRING_SLICE_START: 7,
} as const;

// 型エクスポート
export type S3Variant = (typeof S3_CONSTANTS.VARIANTS)[keyof typeof S3_CONSTANTS.VARIANTS];
export type S3Format = (typeof S3_CONSTANTS.SUPPORTED_FORMATS)[number];
export type S3DomainPattern = (typeof S3_CONSTANTS.DOMAIN_PATTERNS)[number];

export type ScreenSize = keyof typeof UI_CONSTANTS.SCREEN_SIZE;
export type Breakpoint = keyof typeof UI_CONSTANTS.BREAKPOINTS;
export type HttpStatus = (typeof HTTP_CONSTANTS)[keyof typeof HTTP_CONSTANTS];

// 新しい型定義
export type PaginationSize = (typeof PAGINATION_CONSTANTS)[keyof typeof PAGINATION_CONSTANTS];
export type CryptoConstant = (typeof CRYPTO_CONSTANTS)[keyof typeof CRYPTO_CONSTANTS];
