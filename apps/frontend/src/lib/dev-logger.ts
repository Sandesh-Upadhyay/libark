/**
 * 🔧 開発環境専用ログシステム
 *
 * React Strict Mode対応の統一ログフォーマット
 * 責任分離とログレベル管理を実現
 */

/**
 * ログレベル定義
 */
import { envUtils } from '@libark/core-shared';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * コンポーネントタイプ定義
 */
export enum ComponentType {
  ORGANISM = 'Organism',
  MOLECULE = 'Molecule',
  ATOM = 'Atom',
  HOOK = 'Hook',
  SERVICE = 'Service',
  PROVIDER = 'Provider',
}

/**
 * ログエントリ型定義
 */
interface LogEntry {
  component: string;
  type: ComponentType;
  action: string;
  data?: Record<string, unknown>;
  level: LogLevel;
}

/**
 * 開発環境ログ設定
 */
interface DevLoggerConfig {
  enabled: boolean;
  level: LogLevel;
  suppressStrictMode: boolean;
  components: {
    [key: string]: boolean;
  };
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: DevLoggerConfig = {
  enabled: envUtils.isDevelopment(),
  level: LogLevel.INFO,
  suppressStrictMode: true,
  components: {
    PostCard: true,
    PostImageDisplay: true,
    MediaImage: true,
    Navigation: true,
    AuthProvider: true,
    // ImageProcessingServiceは削除されました（プリサインURL実装に移行済み）
    UnifiedNotificationService: true,
  },
};

/**
 * Strict Mode重複検出用キャッシュ
 */
const strictModeCache = new Map<string, number>();
const STRICT_MODE_WINDOW = 100; // 100ms以内の同じログは重複とみなす

/**
 * 開発環境専用ロガークラス
 */
class DevLogger {
  private config: DevLoggerConfig;

  constructor(config: Partial<DevLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Strict Mode重複チェック
   */
  private isStrictModeDuplicate(key: string): boolean {
    if (!this.config.suppressStrictMode) return false;

    const now = Date.now();
    const lastTime = strictModeCache.get(key);

    if (lastTime && now - lastTime < STRICT_MODE_WINDOW) {
      return true;
    }

    strictModeCache.set(key, now);
    return false;
  }

  /**
   * ログ出力の共通処理
   */
  private log(entry: LogEntry): void {
    if (!this.config.enabled || entry.level < this.config.level) {
      return;
    }

    // コンポーネント別の有効/無効チェック
    if (!this.config.components[entry.component]) {
      return;
    }

    // Strict Mode重複チェック
    const cacheKey = `${entry.component}:${entry.action}:${JSON.stringify(entry.data)}`;
    if (this.isStrictModeDuplicate(cacheKey)) {
      return;
    }

    // ログレベル別のアイコン
    const icons = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: '🎯',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.NONE]: '📝',
    };

    const icon = icons[entry.level] || '📝';
    const typeLabel = `[${entry.type}]`;
    const message = `${icon} ${typeLabel} ${entry.component}: ${entry.action}`;

    // ログレベル別の出力
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.log(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * コンポーネント初期化ログ
   */
  componentInit(component: string, type: ComponentType, data?: Record<string, unknown>): void {
    this.log({
      component,
      type,
      action: '初期化',
      data,
      level: LogLevel.INFO,
    });
  }

  /**
   * コンポーネントマウントログ
   */
  componentMount(component: string, type: ComponentType, data?: Record<string, unknown>): void {
    this.log({
      component,
      type,
      action: 'マウント',
      data,
      level: LogLevel.DEBUG,
    });
  }

  /**
   * コンポーネントアンマウントログ
   */
  componentUnmount(component: string, type: ComponentType, data?: Record<string, unknown>): void {
    this.log({
      component,
      type,
      action: 'アンマウント',
      data,
      level: LogLevel.DEBUG,
    });
  }

  /**
   * 状態変更ログ
   */
  stateChange(
    component: string,
    type: ComponentType,
    action: string,
    data?: Record<string, unknown>
  ): void {
    this.log({
      component,
      type,
      action: `状態変更: ${action}`,
      data,
      level: LogLevel.DEBUG,
    });
  }

  /**
   * エラーログ
   */
  error(
    component: string,
    type: ComponentType,
    action: string,
    error: Error | string,
    data?: Record<string, unknown>
  ): void {
    this.log({
      component,
      type,
      action: `エラー: ${action}`,
      data: {
        ...data,
        error: error instanceof Error ? error.message : error,
      },
      level: LogLevel.ERROR,
    });
  }

  /**
   * 設定更新
   */
  updateConfig(config: Partial<DevLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * コンポーネント別ログ有効/無効切り替え
   */
  toggleComponent(component: string, enabled: boolean): void {
    this.config.components[component] = enabled;
  }
}

/**
 * グローバルロガーインスタンス
 */
export const devLogger = new DevLogger();

/**
 * コンポーネント専用ロガーファクトリー
 */
export function createComponentLogger(component: string, type: ComponentType) {
  return {
    init: (data?: Record<string, unknown>) => devLogger.componentInit(component, type, data),
    mount: (data?: Record<string, unknown>) => devLogger.componentMount(component, type, data),
    unmount: (data?: Record<string, unknown>) => devLogger.componentUnmount(component, type, data),
    stateChange: (action: string, data?: Record<string, unknown>) =>
      devLogger.stateChange(component, type, action, data),
    error: (action: string, error: Error | string, data?: Record<string, unknown>) =>
      devLogger.error(component, type, action, error, data),
    // warn: (action: string, data?: Record<string, unknown>) => devLogger.warn(component, type, action, data),
    // debug: (action: string, data?: Record<string, unknown>) => devLogger.debug(component, type, action, data),
  };
}

/**
 * React Hook用ロガー
 */
export function useComponentLogger(component: string, type: ComponentType) {
  return createComponentLogger(component, type);
}
