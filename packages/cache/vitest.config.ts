/**
 * 🧪 Cache Package テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // Cache Package固有の設定
    include: ['src/**/*.test.ts'],
    setupFiles: ['../../test-setup.ts'],

    // Cache Package固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'src/adapters/**', // アダプターファイルを除外
      ],
    },

    // Cache Package固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      CACHE_TTL: '3600',
    },
  },
});
