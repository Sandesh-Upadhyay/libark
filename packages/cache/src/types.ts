/**
 * 🗄️ 統一キャッシュシステム型定義
 */

/**
 * キャッシュキー型
 */
export type CacheKey = string;

/**
 * キャッシュ値型（任意のシリアライズ可能な値）
 */
export type CacheValue = unknown;

/**
 * TTL（秒）
 */
export type CacheTTL = number;

/**
 * キャッシュカテゴリ
 */
export type CacheCategory =
  | 'user' // ユーザープロフィール
  | 'post' // 投稿データ
  | 'feed' // フィードデータ
  | 'media' // メディアファイル
  | 'search' // 検索結果
  | 'session' // セッションデータ
  | 'graphql' // GraphQLレスポンス
  | 'api' // API レスポンス
  | 'config' // 設定データ
  | 'temp'; // 一時データ

/**
 * キャッシュオプション
 */
export interface CacheOptions {
  /** TTL（秒）- 未指定の場合はカテゴリのデフォルト値を使用 */
  ttl?: CacheTTL;

  /** 圧縮を有効にするか */
  compress?: boolean;

  /** キャッシュバージョン（無効化用） */
  version?: string;

  /** タグ（グループ無効化用） */
  tags?: string[];

  /** メモリキャッシュをスキップするか */
  skipMemory?: boolean;

  /** Redisキャッシュをスキップするか */
  skipRedis?: boolean;
}

/**
 * キャッシュエントリ
 */
export interface CacheEntry<T = CacheValue> {
  /** データ */
  data: T;

  /** 作成日時 */
  createdAt: number;

  /** 有効期限 */
  expiresAt: number;

  /** バージョン */
  version?: string;

  /** 圧縮フラグ */
  compressed?: boolean;

  /** タグ */
  tags?: string[];

  /** データサイズ（バイト） */
  size?: number;
}

/**
 * キャッシュ統計情報
 */
export interface CacheStats {
  /** ヒット数 */
  hits: number;

  /** ミス数 */
  misses: number;

  /** 設定数 */
  sets: number;

  /** 削除数 */
  deletes: number;

  /** 総キー数 */
  totalKeys: number;

  /** ヒット率（%） */
  hitRate: number;

  /** メモリ使用量（バイト） */
  memoryUsage?: number;

  /** Redis使用量（バイト） */
  redisUsage?: number;
}

/**
 * キャッシュメトリクス
 */
export interface CacheMetrics {
  /** レイヤー別統計 */
  layers: {
    memory: CacheStats;
    redis: CacheStats;
  };

  /** 全体統計 */
  total: CacheStats;

  /** カテゴリ別統計 */
  categories: Record<CacheCategory, CacheStats>;

  /** 最終更新時刻 */
  lastUpdated: number;
}

/**
 * キャッシュイベント種別
 */
export type CacheEventType =
  | 'hit' // キャッシュヒット
  | 'miss' // キャッシュミス
  | 'set' // データ設定
  | 'delete' // データ削除
  | 'clear' // クリア
  | 'expire' // 期限切れ
  | 'error' // エラー
  | 'connect' // 接続
  | 'disconnect'; // 切断

/**
 * キャッシュイベント
 */
export interface CacheEvent {
  /** イベント種別 */
  type: CacheEventType;

  /** カテゴリ */
  category?: CacheCategory;

  /** キー */
  key?: CacheKey;

  /** レイヤー */
  layer?: 'memory' | 'redis';

  /** データサイズ */
  size?: number;

  /** TTL */
  ttl?: CacheTTL;

  /** エラー情報 */
  error?: Error;

  /** タイムスタンプ */
  timestamp: number;

  /** 追加メタデータ */
  metadata?: Record<string, unknown> & {
    duration?: number;
  };
}
