/**
 * 🧪 Core Client Package テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // Core Client Package固有の設定
    include: ['src/**/*.test.ts'],
    setupFiles: ['../../test-setup.ts'],

    // Core Client Package固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      SERVICE_NAME: 'core-client',
    },
  },
});
