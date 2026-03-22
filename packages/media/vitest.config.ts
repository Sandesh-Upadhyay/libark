/**
 * 🧪 Media Package テスト設定
 * 統一テスト設定を継承・拡張
 */

import { defineConfig } from 'vitest/config';

import { nodeTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...nodeTestConfig,
  test: {
    ...nodeTestConfig.test,
    // Media Package固有の設定
    include: ['src/**/*.test.ts'],

    // Media Package固有の除外パターン
    coverage: {
      ...nodeTestConfig.test.coverage,
      exclude: [
        ...nodeTestConfig.test.coverage.exclude,
        'src/clients/**', // クライアントファイルを除外
      ],
    },

    // Media Package固有の環境変数
    env: {
      ...nodeTestConfig.test.env,
      S3_GATEWAY_URL: 'http://localhost:8080',
      MEDIA_UPLOAD_MAX_SIZE: '52428800', // 50MB
    },
  },
});
