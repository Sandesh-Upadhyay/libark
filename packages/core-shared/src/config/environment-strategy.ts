/**
 * 🌍 環境戦略パターン
 *
 * 環境判定の分散を防ぎ、統一的な環境アクセスを提供
 */

/**
 * 🎯 環境戦略インターフェース
 */
export interface EnvironmentStrategy {
  isServer(): boolean;
  isBrowser(): boolean;
  getEnvVar(key: string, defaultValue?: string): string | undefined;
  getNodeEnv(): string;
}

/**
 * 🖥️ サーバー環境戦略
 */
class ServerEnvironmentStrategy implements EnvironmentStrategy {
  isServer(): boolean {
    return true;
  }

  isBrowser(): boolean {
    return false;
  }

  getEnvVar(key: string, defaultValue?: string): string | undefined {
    // サーバーサイドでは process.env から直接取得
    return process.env[key] || defaultValue;
  }

  getNodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }
}

/**
 * 🌐 ブラウザ環境戦略
 */
class BrowserEnvironmentStrategy implements EnvironmentStrategy {
  isServer(): boolean {
    return false;
  }

  isBrowser(): boolean {
    return true;
  }

  getEnvVar(key: string, defaultValue?: string): string | undefined {
    // ブラウザでは Vite の import.meta.env または Next.js のランタイム設定から取得
    const windowObj = (globalThis as typeof globalThis & { window?: Window }).window as {
      __NEXT_DATA__?: { runtimeConfig?: Record<string, string> };
    };

    // Vite環境変数の取得を試行（ブラウザ環境のみ）
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore - import.metaはブラウザ環境でのみ利用可能
        const importMeta = (globalThis as typeof globalThis & { import?: { meta?: { env?: Record<string, string> } } }).import?.meta;
        if (importMeta && importMeta.env) {
          const viteEnvValue = (importMeta.env as Record<string, string>)[key];
          if (viteEnvValue !== undefined) {
            return viteEnvValue;
          }
        }
      } catch {
        // import.metaが利用できない環境では無視
      }
    }

    // Next.jsランタイム設定から取得を試行
    const nextRuntimeValue = windowObj?.__NEXT_DATA__?.runtimeConfig?.[key];
    if (nextRuntimeValue !== undefined) {
      return nextRuntimeValue;
    }

    // process.envが存在する場合のみアクセス（サーバーサイドレンダリング時など）
    if (typeof process !== 'undefined' && process.env) {
      const processEnvValue = process.env[key];
      if (processEnvValue !== undefined) {
        return processEnvValue;
      }
    }

    return defaultValue;
  }

  getNodeEnv(): string {
    // Vite環境変数の取得を試行（ブラウザ環境のみ）
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore - import.metaはブラウザ環境でのみ利用可能
        const importMeta = (globalThis as typeof globalThis & { import?: { meta?: { env?: Record<string, string> } } }).import?.meta;
        if (importMeta && importMeta.env) {
          const viteNodeEnv = (importMeta.env as Record<string, string>).NODE_ENV;
          if (viteNodeEnv) {
            return viteNodeEnv;
          }
        }
      } catch {
        // import.metaが利用できない環境では無視
      }
    }

    // process.envが存在する場合のみアクセス
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }

    return 'development';
  }
}

/**
 * 🏭 環境戦略ファクトリー
 */
export class EnvironmentStrategyFactory {
  private static instance: EnvironmentStrategy | null = null;

  /**
   * 現在の環境に適した戦略を作成
   */
  static create(): EnvironmentStrategy {
    if (this.instance) {
      return this.instance;
    }

    // 環境判定は一箇所に集約
    const _isServerEnv =
      typeof (globalThis as typeof globalThis & { window?: Window }).window === 'undefined';

    this.instance = _isServerEnv
      ? new ServerEnvironmentStrategy()
      : new BrowserEnvironmentStrategy();

    return this.instance;
  }

  /**
   * 現在の環境戦略を取得
   */
  static current(): EnvironmentStrategy {
    return this.create();
  }

  /**
   * テスト用：戦略をリセット
   */
  static reset(): void {
    this.instance = null;
  }
}

/**
 * 🎯 便利な環境ヘルパー
 */
export const envUtils = {
  /**
   * サーバー環境かどうか
   */
  isServer(): boolean {
    return EnvironmentStrategyFactory.current().isServer();
  },

  /**
   * ブラウザ環境かどうか
   */
  isBrowser(): boolean {
    return EnvironmentStrategyFactory.current().isBrowser();
  },

  /**
   * 環境変数を取得
   */
  getEnvVar(key: string, defaultValue?: string): string | undefined {
    return EnvironmentStrategyFactory.current().getEnvVar(key, defaultValue);
  },

  /**
   * NODE_ENV を取得
   */
  getNodeEnv(): string {
    return EnvironmentStrategyFactory.current().getNodeEnv();
  },

  /**
   * 開発環境かどうか
   */
  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  },

  /**
   * 本番環境かどうか
   */
  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  },

  /**
   * テスト環境かどうか
   */
  isTest(): boolean {
    return this.getNodeEnv() === 'test';
  },
} as const;
