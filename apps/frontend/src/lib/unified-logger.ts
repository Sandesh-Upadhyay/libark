/**
 * 🎯 フロントエンド統一ログシステム
 *
 * 責任:
 * - ブラウザ環境での統一ログ管理
 * - React Strict Mode対応
 * - 開発環境専用機能
 * - コンポーネント専用ヘルパー
 */

// Window拡張型定義
import { UnifiedLogger, UnifiedLogLevel, LogCategory } from '@libark/core-shared';
import type { LogOptions } from '@libark/core-shared';

import { getCurrentLogConfig, showLogConfig } from './log-config';

declare global {
  interface Window {
    loggerDebug?: {
      showConfig: () => void;
      toggleCategory: (
        category: (typeof LogCategory)[keyof typeof LogCategory],
        enabled?: boolean
      ) => void;
      setLevel: (level: (typeof UnifiedLogLevel)[keyof typeof UnifiedLogLevel]) => void;
      clearCache: () => void;
    };
  }
}

// フロントエンド専用ロガーインスタンス（環境変数対応）
export const frontendLogger = new UnifiedLogger(getCurrentLogConfig());

/**
 * React コンポーネント専用ログヘルパー
 */
export class ComponentLogger {
  constructor(
    private componentName: string,
    private category: (typeof LogCategory)[keyof typeof LogCategory] = LogCategory.COMPONENT
  ) {}

  /**
   * コンポーネント初期化ログ
   */
  init(data?: unknown, options?: LogOptions): void {
    frontendLogger.init(this.category, this.componentName, data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * コンポーネントマウントログ
   */
  mount(data?: unknown, options?: LogOptions): void {
    frontendLogger.debug(this.category, 'マウント', data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * コンポーネントアンマウントログ
   */
  unmount(data?: unknown, options?: LogOptions): void {
    frontendLogger.debug(this.category, 'アンマウント', data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * 状態変更ログ
   */
  stateChange(action: string, data?: unknown, options?: LogOptions): void {
    frontendLogger.debug(this.category, `状態変更: ${action}`, data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * エラーログ
   */
  error(action: string, error: Error | string, data?: unknown, options?: LogOptions): void {
    frontendLogger.error(
      this.category,
      `エラー: ${action}`,
      {
        ...(data && typeof data === 'object' ? data : {}),
        error: error instanceof Error ? error.message : error,
      },
      {
        ...options,
        context: this.componentName,
      }
    );
  }

  /**
   * 警告ログ
   */
  warn(action: string, data?: unknown, options?: LogOptions): void {
    frontendLogger.warn(this.category, action, data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * 情報ログ
   */
  info(action: string, data?: unknown, options?: LogOptions): void {
    frontendLogger.info(this.category, action, data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * デバッグログ
   */
  debug(action: string, data?: unknown, options?: LogOptions): void {
    frontendLogger.debug(this.category, action, data, {
      ...options,
      context: this.componentName,
    });
  }

  /**
   * 一度だけ出力
   */
  once(
    key: string,
    level: (typeof UnifiedLogLevel)[keyof typeof UnifiedLogLevel],
    message: string,
    data?: unknown,
    options?: LogOptions
  ): void {
    frontendLogger.once(this.category, `${this.componentName}-${key}`, level, message, data, {
      ...options,
      context: this.componentName,
    });
  }
}

/**
 * コンポーネントロガーファクトリー
 */
export function createComponentLogger(
  componentName: string,
  category?: (typeof LogCategory)[keyof typeof LogCategory]
): ComponentLogger {
  return new ComponentLogger(componentName, category);
}

/**
 * 認証専用ログヘルパー
 */
export const authLogger = {
  init: (component: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.init(LogCategory.AUTH, component, data, options),

  debug: (message: string, data?: unknown, component = 'Auth', options?: LogOptions) =>
    frontendLogger.debug(LogCategory.AUTH, message, data, {
      ...options,
      context: component,
    }),

  info: (message: string, data?: unknown, component = 'Auth', options?: LogOptions) =>
    frontendLogger.info(LogCategory.AUTH, message, data, {
      ...options,
      context: component,
    }),

  warn: (message: string, data?: unknown, component = 'Auth', options?: LogOptions) =>
    frontendLogger.warn(LogCategory.AUTH, message, data, {
      ...options,
      context: component,
    }),

  stateChange: (
    from: boolean,
    to: boolean,
    username?: string,
    component = 'Auth',
    options?: LogOptions
  ) =>
    frontendLogger.info(
      LogCategory.AUTH,
      `認証状態変更: ${from} → ${to}`,
      { username },
      {
        ...options,
        context: component,
      }
    ),

  check: (username: string, component = 'Auth', options?: LogOptions) =>
    frontendLogger.debug(LogCategory.AUTH, `認証状態確認: ${username}`, undefined, {
      ...options,
      context: component,
    }),

  error: (action: string, error: Error | string, component = 'Auth', options?: LogOptions) =>
    frontendLogger.error(
      LogCategory.AUTH,
      `認証エラー: ${action}`,
      {
        error: error instanceof Error ? error.message : error,
      },
      {
        ...options,
        context: component,
      }
    ),
};

/**
 * Apollo Client専用ログヘルパー
 */
export const apolloLogger = {
  cache: (action: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.debug(LogCategory.APOLLO, `キャッシュ: ${action}`, data, options),

  query: (queryName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.debug(LogCategory.APOLLO, `クエリ: ${queryName}`, data, options),

  mutation: (mutationName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.debug(LogCategory.APOLLO, `ミューテーション: ${mutationName}`, data, options),

  subscription: (subscriptionName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.debug(
      LogCategory.SUBSCRIPTION,
      `サブスクリプション: ${subscriptionName}`,
      data,
      options
    ),

  error: (action: string, error: Error | string, options?: LogOptions) =>
    frontendLogger.error(
      LogCategory.APOLLO,
      `Apollo エラー: ${action}`,
      {
        error: error instanceof Error ? error.message : error,
      },
      options
    ),
};

/**
 * メディア処理専用ログヘルパー
 */
export const mediaLogger = {
  upload: (action: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.info(LogCategory.MEDIA, `アップロード: ${action}`, data, options),

  processing: (action: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.info(LogCategory.MEDIA, `処理: ${action}`, data, options),

  validation: (result: 'success' | 'error', data?: unknown, options?: LogOptions) =>
    frontendLogger.debug(
      LogCategory.MEDIA,
      `バリデーション${result === 'success' ? '成功' : '失敗'}`,
      data,
      options
    ),

  error: (action: string, error: Error | string, options?: LogOptions) =>
    frontendLogger.error(
      LogCategory.MEDIA,
      `メディアエラー: ${action}`,
      {
        error: error instanceof Error ? error.message : error,
      },
      options
    ),
};

/**
 * 初期化専用ログヘルパー
 */
export const initLogger = {
  provider: (providerName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.init(LogCategory.INIT, providerName, data, options),

  client: (clientName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.init(LogCategory.INIT, clientName, data, options),

  service: (serviceName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.init(LogCategory.INIT, serviceName, data, options),

  complete: (systemName: string, data?: unknown, options?: LogOptions) =>
    frontendLogger.info(LogCategory.INIT, `${systemName} 初期化完了`, data, options),
};

/**
 * デバッグ用ユーティリティ
 */
export const debugUtils = {
  /**
   * 現在のログ設定を表示
   */
  showConfig: () => {
    showLogConfig();
  },

  /**
   * カテゴリの有効/無効切り替え
   */
  toggleCategory: (category: (typeof LogCategory)[keyof typeof LogCategory], enabled?: boolean) => {
    const currentState = frontendLogger['config'].categories[category];
    const newState = enabled !== undefined ? enabled : !currentState;
    frontendLogger.toggleCategory(category, newState);
    console.log(`📝 ${category} ログ: ${newState ? '有効' : '無効'}`);
  },

  /**
   * ログレベル変更
   */
  setLevel: (level: (typeof UnifiedLogLevel)[keyof typeof UnifiedLogLevel]) => {
    frontendLogger.updateConfig({ level });
    console.log(`📊 ログレベル: ${UnifiedLogLevel[level]}`);
  },

  /**
   * キャッシュクリア
   */
  clearCache: () => {
    frontendLogger.clearCache();
    console.log('🧹 ログキャッシュをクリアしました');
  },
};

// デフォルトエクスポート（後方互換性のため）
export default frontendLogger;

// 便利な関数エクスポート
export const logger = {
  debug: (
    category: (typeof LogCategory)[keyof typeof LogCategory],
    message: string,
    data?: unknown,
    options?: LogOptions
  ) => frontendLogger.debug(category, message, data, options),
  info: (
    category: (typeof LogCategory)[keyof typeof LogCategory],
    message: string,
    data?: unknown,
    options?: LogOptions
  ) => frontendLogger.info(category, message, data, options),
  warn: (
    category: (typeof LogCategory)[keyof typeof LogCategory],
    message: string,
    data?: unknown,
    options?: LogOptions
  ) => frontendLogger.warn(category, message, data, options),
  error: (
    category: (typeof LogCategory)[keyof typeof LogCategory],
    message: string,
    data?: unknown,
    options?: LogOptions
  ) => frontendLogger.error(category, message, data, options),
  once: (
    category: (typeof LogCategory)[keyof typeof LogCategory],
    key: string,
    level: (typeof UnifiedLogLevel)[keyof typeof UnifiedLogLevel],
    message: string,
    data?: unknown,
    options?: LogOptions
  ) => frontendLogger.once(category, key, level, message, data, options),
  init: (
    category: (typeof LogCategory)[keyof typeof LogCategory],
    component: string,
    data?: unknown,
    options?: LogOptions
  ) => frontendLogger.init(category, component, data, options),
};

// グローバルオブジェクトにデバッグユーティリティを追加（開発環境のみ）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.loggerDebug = debugUtils;
}
