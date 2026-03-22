/**
 * 🎯 ログ設定管理
 *
 * 責任:
 * - 環境別ログ設定の管理
 * - 開発効率の最適化
 * - ログ量の制御
 */

import { UnifiedLogLevel, LogCategory } from '@libark/core-shared';
import type { UnifiedLoggerConfig } from '@libark/core-shared';

// 環境変数からログ設定を読み取り
function getLogLevelFromEnv(): (typeof UnifiedLogLevel)[keyof typeof UnifiedLogLevel] {
  const level = import.meta.env.VITE_LOG_LEVEL || 'WARN';
  switch (level.toUpperCase()) {
    case 'SILENT':
      return UnifiedLogLevel.SILENT;
    case 'ERROR':
      return UnifiedLogLevel.ERROR;
    case 'WARN':
      return UnifiedLogLevel.WARN;
    case 'INFO':
      return UnifiedLogLevel.INFO;
    case 'DEBUG':
      return UnifiedLogLevel.DEBUG;
    default:
      return UnifiedLogLevel.WARN;
  }
}

function getCategoriesFromEnv(): Record<(typeof LogCategory)[keyof typeof LogCategory], boolean> {
  const categories = import.meta.env.VITE_LOG_CATEGORIES || 'INIT,MEDIA,SYSTEM';
  const enabledCategories = categories.split(',').map((c: string) => c.trim().toUpperCase());

  return {
    [LogCategory.INIT]: enabledCategories.includes('INIT'),
    [LogCategory.AUTH]: enabledCategories.includes('AUTH'),
    [LogCategory.APOLLO]: enabledCategories.includes('APOLLO'),
    [LogCategory.COMPONENT]: enabledCategories.includes('COMPONENT'),
    [LogCategory.MEDIA]: enabledCategories.includes('MEDIA'),
    [LogCategory.SUBSCRIPTION]: enabledCategories.includes('SUB'),
    [LogCategory.MEMORY]: enabledCategories.includes('MEMORY'),
    [LogCategory.SYSTEM]: enabledCategories.includes('SYSTEM'),
    [LogCategory.SECURITY]: enabledCategories.includes('SECURITY'),
  };
}

// 開発環境用最適化設定
export const DEVELOPMENT_LOG_CONFIG: Partial<UnifiedLoggerConfig> = {
  level: getLogLevelFromEnv(),
  categories: getCategoriesFromEnv(),
  throttleMs: parseInt(import.meta.env.VITE_LOG_THROTTLE_MS || '5000'),
  enableStrictModeDetection: import.meta.env.VITE_LOG_ENABLE_STRICT_MODE_DETECTION !== 'false',
  developmentOnly: true,
  maxCacheEntries: 50, // キャッシュサイズを削減
  enableConsoleOutput: true,
};

// 本番環境用設定
export const PRODUCTION_LOG_CONFIG: Partial<UnifiedLoggerConfig> = {
  level: UnifiedLogLevel.ERROR,
  categories: {
    [LogCategory.INIT]: false,
    [LogCategory.AUTH]: false,
    [LogCategory.APOLLO]: false,
    [LogCategory.COMPONENT]: false,
    [LogCategory.MEDIA]: false,
    [LogCategory.SUBSCRIPTION]: false,
    [LogCategory.MEMORY]: false,
    [LogCategory.SYSTEM]: true, // システムエラーのみ
    [LogCategory.SECURITY]: false,
  },
  throttleMs: 10000,
  enableStrictModeDetection: false,
  developmentOnly: false,
  maxCacheEntries: 10,
  enableConsoleOutput: false,
};

// 現在の環境に応じた設定を取得
export function getCurrentLogConfig(): Partial<UnifiedLoggerConfig> {
  return import.meta.env.DEV ? DEVELOPMENT_LOG_CONFIG : PRODUCTION_LOG_CONFIG;
}

// デバッグ用設定（詳細ログが必要な場合）
export const DEBUG_LOG_CONFIG: Partial<UnifiedLoggerConfig> = {
  level: UnifiedLogLevel.DEBUG,
  categories: {
    [LogCategory.INIT]: true,
    [LogCategory.AUTH]: true,
    [LogCategory.APOLLO]: true,
    [LogCategory.COMPONENT]: true,
    [LogCategory.MEDIA]: true,
    [LogCategory.SUBSCRIPTION]: true,
    [LogCategory.MEMORY]: true,
    [LogCategory.SYSTEM]: true,
    [LogCategory.SECURITY]: true,
  },
  throttleMs: 1000,
  enableStrictModeDetection: true,
  developmentOnly: true,
  maxCacheEntries: 200,
  enableConsoleOutput: true,
};

// パフォーマンス監視設定
export const PERFORMANCE_CONFIG = {
  enabled: import.meta.env.VITE_PERFORMANCE_MONITOR_ENABLED !== 'false',
  memoryThreshold: parseInt(import.meta.env.VITE_PERFORMANCE_MEMORY_THRESHOLD || '100'),
  clsThreshold: parseFloat(import.meta.env.VITE_PERFORMANCE_CLS_THRESHOLD || '0.1'),
};

// ログ設定のデバッグ情報を表示
export function showLogConfig(): void {
  if (import.meta.env.DEV) {
    const config = getCurrentLogConfig();
    console.group('🔧 ログ設定');
    console.log('レベル:', UnifiedLogLevel[config.level || UnifiedLogLevel.WARN]);
    console.log('カテゴリ:', config.categories);
    console.log('重複防止間隔:', config.throttleMs + 'ms');
    console.log('Strict Mode検出:', config.enableStrictModeDetection);
    console.log('パフォーマンス監視:', PERFORMANCE_CONFIG);
    console.groupEnd();
  }
}
