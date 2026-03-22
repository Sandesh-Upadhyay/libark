/**
 * 🧪 Worker テスト設定
 * 統一テスト設定を継承・拡張
 */

import path from 'path';

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // Worker固有の設定
    setupFiles: ['../../test-setup.ts'], // 統一セットアップファイル
    include: ['src/**/*.test.ts'],

    // Worker固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'src/jobs/**', // ジョブファイルを除外
        'src/queues/**', // キューファイルを除外
      ],
    },

    // Worker固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      WORKER_CONCURRENCY: '1',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
