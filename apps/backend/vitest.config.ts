/**
 * 🧪 Backend テスト設定
 * 統一テスト設定を継承・拡張
 */

import path from 'path';

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // Backend固有の設定
    setupFiles: ['./src/__tests__/setup.ts'],
    globalSetup: ['./src/__tests__/global-setup-teardown.ts'],

    // src配下のすべてのテストを実行（*.test.ts）
    include: ['src/**/*.test.ts'],
    
    // 除外パターン（ベース設定を上書き）
    exclude: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**'],

    // Backend固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'src/routes/**', // ルートファイルを除外
        'src/plugins/**', // プラグインファイルを除外
      ],
    },

    // Backend固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      DATABASE_URL: 'postgresql://libark_db_admin:LibarkDB2024@postgres:5432/libark_db',
      REDIS_HOST: 'redis',
      REDIS_PORT: '6379',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Monorepo内のパッケージをソースコードに直接解決
      '@libark/core-server': path.resolve(__dirname, '../../packages/core-server/src'),
      '@libark/core-shared': path.resolve(__dirname, '../../packages/core-shared/src'),
      '@libark/redis-client': path.resolve(__dirname, '../../packages/redis-client/src'),
    },
  },
});
