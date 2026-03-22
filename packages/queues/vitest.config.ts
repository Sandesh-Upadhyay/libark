/**
 * 🧪 @libark/queues テスト設定
 *
 * BullMQジョブキューのテスト設定
 * - ジョブキューマネージャーのテスト
 * - ワーカーのテスト
 * - ジョブ処理のテスト
 */

import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // TypeScript設定
  resolve: {
    alias: {
      '@libark/core-shared': path.resolve(__dirname, '../core-shared/src'),
      '@libark/redis-client': path.resolve(__dirname, '../redis-client/src'),
    },
  },

  test: {
    // Node.js環境
    environment: 'node',

    // グローバル設定
    globals: true,

    // タイムアウト設定
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,

    // 除外パターン
    exclude: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '**/*.config.*', '**/.*'],

    // カバレッジ設定
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/test/**',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },

    // レポーター設定
    reporters: ['default', 'verbose'],

    // 並列実行設定
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // テスト間の干渉を防ぐ
      },
    },

    // 環境変数設定
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      LOG_CATEGORIES: 'SYSTEM',
    },

    // Redisモック設定
    setupFiles: [],
  },
});
