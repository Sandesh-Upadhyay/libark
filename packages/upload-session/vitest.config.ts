/**
 * 🧪 UploadSession Package テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // UploadSession Package固有の設定
    include: ['src/**/*.test.ts'],
    setupFiles: ['../../test-setup.ts'],

    // UploadSession Package固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      SERVICE_NAME: 'upload-session',
      JWT_SECRET: 'test-secret-key-for-testing',
    },
  },
});
