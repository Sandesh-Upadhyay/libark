/**
 * 🎯 統一ログシステム
 *
 * 責任:
 * - アプリケーション全体のログ管理
 * - 重複ログの防止
 * - カテゴリ別ログ制御
 * - React Strict Mode対応
 * - 環境別設定管理
 */

// ログレベル定義
export enum UnifiedLogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

// ログカテゴリ定義
export enum LogCategory {
  INIT = 'INIT', // 初期化関連
  AUTH = 'AUTH', // 認証関連
  SECURITY = 'SECURITY', // セキュリティ関連
  APOLLO = 'APOLLO', // Apollo Client関連
  COMPONENT = 'COMPONENT', // コンポーネント関連
  MEDIA = 'MEDIA', // メディア関連
  SUBSCRIPTION = 'SUB', // サブスクリプション関連
  MEMORY = 'MEMORY', // メモリ最適化関連
  SYSTEM = 'SYSTEM', // システム関連
}

// ログオプション
export interface LogOptions {
  /** 一度だけ出力するためのキー */
  once?: string;
  /** 重複防止を無効化 */
  skipThrottle?: boolean;
  /** 追加のコンテキスト情報 */
  context?: string;
  /** React Strict Mode検出を無効化 */
  skipStrictModeDetection?: boolean;
}

// ログ設定
export interface UnifiedLoggerConfig {
  /** 全体のログレベル */
  level: UnifiedLogLevel;
  /** カテゴリ別有効/無効 */
  categories: Record<LogCategory, boolean>;
  /** 重複防止の時間間隔（ミリ秒） */
  throttleMs: number;
  /** キャッシュエントリの最大数 */
  maxCacheEntries: number;
  /** React Strict Mode重複検出を有効化 */
  enableStrictModeDetection: boolean;
  /** コンソール出力を有効化 */
  enableConsoleOutput: boolean;
  /** 開発環境でのみ有効化 */
  developmentOnly: boolean;
}

// ログキャッシュエントリ
interface LogCacheEntry {
  count: number;
  lastTime: number;
  firstTime: number;
}

// デフォルト設定
const DEFAULT_CONFIG: UnifiedLoggerConfig = {
  level: UnifiedLogLevel.INFO,
  categories: {
    [LogCategory.INIT]: true,
    [LogCategory.AUTH]: true,
    [LogCategory.SECURITY]: true, // セキュリティ関連は常に有効
    [LogCategory.APOLLO]: false, // Apollo関連は通常無効（頻繁すぎるため）
    [LogCategory.COMPONENT]: true,
    [LogCategory.MEDIA]: true,
    [LogCategory.SUBSCRIPTION]: true,
    [LogCategory.MEMORY]: false, // メモリ関連は通常無効
    [LogCategory.SYSTEM]: true,
  },
  throttleMs: 5000, // 5秒間隔
  maxCacheEntries: 100,
  enableStrictModeDetection: true,
  enableConsoleOutput: true,
  developmentOnly: true,
};

/**
 * 統一ログシステムクラス
 */
export class UnifiedLogger {
  private config: UnifiedLoggerConfig;
  private logCache = new Map<string, LogCacheEntry>();
  private onceFlags = new Set<string>();
  private strictModeCache = new Map<string, number>();

  constructor(config: Partial<UnifiedLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 環境変数による設定上書き
    this.loadEnvironmentConfig();
  }

  /**
   * 環境変数から設定を読み込み
   */
  private loadEnvironmentConfig(): void {
    if (typeof process !== 'undefined' && process.env) {
      // ログレベル
      const envLevel = process.env.LOG_LEVEL;
      if (envLevel && envLevel in UnifiedLogLevel) {
        this.config.level = UnifiedLogLevel[envLevel as keyof typeof UnifiedLogLevel];
      }

      // カテゴリ設定
      const envCategories = process.env.LOG_CATEGORIES;
      if (envCategories) {
        const enabledCategories = envCategories.split(',').map(c => c.trim());
        // 全カテゴリを無効化してから、指定されたもののみ有効化
        Object.keys(this.config.categories).forEach(category => {
          this.config.categories[category as LogCategory] = false;
        });
        enabledCategories.forEach(category => {
          if (category in LogCategory) {
            this.config.categories[category as LogCategory] = true;
          }
        });
      }

      // その他の設定
      if (process.env.LOG_THROTTLE_MS) {
        this.config.throttleMs = parseInt(process.env.LOG_THROTTLE_MS, 10);
      }
    }
  }

  /**
   * ログ出力の可否を判定
   */
  private shouldLog(level: UnifiedLogLevel, category: LogCategory): boolean {
    // 開発環境のみの制限
    if (
      this.config.developmentOnly &&
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'production'
    ) {
      return false;
    }

    // コンソール出力が無効
    if (!this.config.enableConsoleOutput) {
      return false;
    }

    // ログレベルチェック
    if (level > this.config.level) {
      return false;
    }

    // カテゴリチェック
    if (!this.config.categories[category]) {
      return false;
    }

    return true;
  }

  /**
   * React Strict Mode重複検出
   */
  private isStrictModeDuplicate(key: string): boolean {
    if (!this.config.enableStrictModeDetection) {
      return false;
    }

    const now = Date.now();
    const lastTime = this.strictModeCache.get(key);

    if (lastTime && now - lastTime < 100) {
      // 100ms以内は重複とみなす
      return true;
    }

    this.strictModeCache.set(key, now);
    return false;
  }

  /**
   * 重複ログの制限
   */
  private shouldThrottle(key: string, options?: LogOptions): boolean {
    if (options?.skipThrottle) {
      return false;
    }

    const now = Date.now();
    const cached = this.logCache.get(key);

    if (!cached) {
      this.logCache.set(key, { count: 1, lastTime: now, firstTime: now });
      return false;
    }

    // 時間間隔チェック
    if (now - cached.lastTime < this.config.throttleMs) {
      cached.count++;
      return true; // 制限する
    } else {
      // 時間が経過した場合はリセット
      cached.count = 1;
      cached.lastTime = now;
      return false;
    }
  }

  /**
   * ログキャッシュのクリーンアップ
   */
  private cleanupCache(): void {
    if (this.logCache.size > this.config.maxCacheEntries) {
      const now = Date.now();
      const oldEntries: string[] = [];

      for (const [key, entry] of this.logCache.entries()) {
        if (now - entry.lastTime > 60000) {
          // 1分以上古いエントリ
          oldEntries.push(key);
        }
      }

      oldEntries.forEach(key => this.logCache.delete(key));
    }

    // Strict Modeキャッシュもクリーンアップ
    if (this.strictModeCache.size > 50) {
      const now = Date.now();
      const oldEntries: string[] = [];

      for (const [key, time] of this.strictModeCache.entries()) {
        if (now - time > 5000) {
          // 5秒以上古いエントリ
          oldEntries.push(key);
        }
      }

      oldEntries.forEach(key => this.strictModeCache.delete(key));
    }
  }

  /**
   * ログ出力の共通処理
   */
  private log(
    level: UnifiedLogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    options?: LogOptions
  ): void {
    if (!this.shouldLog(level, category)) {
      return;
    }

    // 一度だけ出力のチェック
    if (options?.once) {
      if (this.onceFlags.has(options.once)) {
        return;
      }
      this.onceFlags.add(options.once);
    }

    // キー生成
    const cacheKey = `${category}:${message}:${JSON.stringify(data)}`;

    // React Strict Mode重複チェック
    if (this.isStrictModeDuplicate(cacheKey)) {
      return;
    }

    // 重複制限チェック
    if (this.shouldThrottle(cacheKey, options)) {
      return;
    }

    // ログ出力
    this.outputToConsole(level, category, message, data, options);

    // 定期的なクリーンアップ
    if (Math.random() < 0.01) {
      // 1%の確率でクリーンアップ
      this.cleanupCache();
    }
  }

  /**
   * コンソールへの出力
   */
  private outputToConsole(
    level: UnifiedLogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    options?: LogOptions
  ): void {
    const emoji = this.getLevelEmoji(level);
    const categoryLabel = `[${category}]`;
    const contextLabel = options?.context ? `{${options.context}}` : '';
    const fullMessage = `${emoji} ${categoryLabel}${contextLabel} ${message}`;

    switch (level) {
      case UnifiedLogLevel.DEBUG:
        console.debug(fullMessage, data || '');
        break;
      case UnifiedLogLevel.INFO:
        console.info(fullMessage, data || '');
        break;
      case UnifiedLogLevel.WARN:
        console.warn(fullMessage, data || '');
        break;
      case UnifiedLogLevel.ERROR:
        console.error(fullMessage, data || '');
        break;
    }
  }

  /**
   * ログレベル別絵文字
   */
  private getLevelEmoji(level: UnifiedLogLevel): string {
    switch (level) {
      case UnifiedLogLevel.DEBUG:
        return '🔍';
      case UnifiedLogLevel.INFO:
        return '🎯';
      case UnifiedLogLevel.WARN:
        return '⚠️';
      case UnifiedLogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  // パブリックメソッド
  debug(category: LogCategory, message: string, data?: unknown, options?: LogOptions): void {
    this.log(UnifiedLogLevel.DEBUG, category, message, data, options);
  }

  info(category: LogCategory, message: string, data?: unknown, options?: LogOptions): void {
    this.log(UnifiedLogLevel.INFO, category, message, data, options);
  }

  warn(category: LogCategory, message: string, data?: unknown, options?: LogOptions): void {
    this.log(UnifiedLogLevel.WARN, category, message, data, options);
  }

  error(category: LogCategory, message: string, data?: unknown, options?: LogOptions): void {
    this.log(UnifiedLogLevel.ERROR, category, message, data, options);
  }

  /**
   * 一度だけ出力
   */
  once(
    category: LogCategory,
    key: string,
    level: UnifiedLogLevel,
    message: string,
    data?: unknown,
    options?: LogOptions
  ): void {
    this.log(level, category, message, data, { ...options, once: key });
  }

  /**
   * 初期化ログ（一度だけ出力）
   */
  init(category: LogCategory, component: string, data?: unknown, options?: LogOptions): void {
    this.once(
      category,
      `init-${component}`,
      UnifiedLogLevel.INFO,
      `${component} 初期化完了`,
      data,
      options
    );
  }

  /**
   * 設定更新
   */
  updateConfig(config: Partial<UnifiedLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * カテゴリの有効/無効切り替え
   */
  toggleCategory(category: LogCategory, enabled: boolean): void {
    this.config.categories[category] = enabled;
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.logCache.clear();
    this.onceFlags.clear();
    this.strictModeCache.clear();
  }
}

// グローバルインスタンス
export const unifiedLogger = new UnifiedLogger();

// 便利な関数エクスポート
export const unifiedLoggerHelpers = {
  debug: (category: LogCategory, message: string, data?: unknown, options?: LogOptions) =>
    unifiedLogger.debug(category, message, data, options),
  info: (category: LogCategory, message: string, data?: unknown, options?: LogOptions) =>
    unifiedLogger.info(category, message, data, options),
  warn: (category: LogCategory, message: string, data?: unknown, options?: LogOptions) =>
    unifiedLogger.warn(category, message, data, options),
  error: (category: LogCategory, message: string, data?: unknown, options?: LogOptions) =>
    unifiedLogger.error(category, message, data, options),
  once: (
    category: LogCategory,
    key: string,
    level: UnifiedLogLevel,
    message: string,
    data?: unknown,
    options?: LogOptions
  ) => unifiedLogger.once(category, key, level, message, data, options),
  init: (category: LogCategory, component: string, data?: unknown, options?: LogOptions) =>
    unifiedLogger.init(category, component, data, options),
};
