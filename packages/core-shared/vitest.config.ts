/**
 * 🧪 Core Shared Package テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // Core Shared Package固有の設定
    include: ['src/**/*.test.ts'],
    setupFiles: ['../../test-setup.ts'],

    // Core Shared Package固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'src/types/**', // 型定義ファイルを除外
        'src/constants/**', // 定数ファイルを除外
      ],
    },

    // Core Shared Package固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      SERVICE_NAME: 'core-shared',
    },
  },
});
