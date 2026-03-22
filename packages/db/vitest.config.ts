/**
 * 🧪 DB Package テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // DB Package固有の設定
    include: ['src/**/*.test.ts'],
    setupFiles: ['../../test-setup.ts'],

    // DB Package固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'prisma/', // Prismaスキーマファイルを除外
        'src/migrations/**', // マイグレーションファイルを除外
      ],
    },

    // DB Package固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      TEST_DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    },
  },
});
