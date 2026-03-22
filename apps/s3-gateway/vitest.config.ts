/**
 * 🧪 S3 Gateway テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // S3 Gateway固有の設定
    setupFiles: ['../../test-setup.ts'], // 統一セットアップファイル
    include: ['src/**/*.test.ts'],

    // S3 Gateway固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'src/tests/', // testsディレクトリを除外
        'src/middleware/**', // ミドルウェアを除外
      ],
    },

    // S3 Gateway固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      S3_ACCESS_KEY: 'test-access-key',
      S3_SECRET_KEY: 'test-secret-key',
      S3_BUCKET: 'test-bucket',
      ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',
    },
  },
});
