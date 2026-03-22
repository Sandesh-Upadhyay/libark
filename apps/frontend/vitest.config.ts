/**
 * 🧪 Frontend テスト設定
 * 統一テスト設定を継承・拡張（ブラウザ環境）
 */

import { resolve } from 'path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

import { browserTestConfig } from '../../vitest.config.base';

export default defineConfig({
  ...browserTestConfig,
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    }),
    tsconfigPaths(),
  ],

  // エイリアス設定
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/types'),
      '@/i18n': resolve(__dirname, './src/i18n'),
      '@/messages': resolve(__dirname, './src/messages'),
      '@/src': resolve(__dirname, './src'),
      // モノレポパッケージのソースファイルを直接参照
      '@libark/core-shared': resolve(__dirname, '../../packages/core-shared/src'),
      '@libark/core-client': resolve(__dirname, '../../packages/core-client/src'),
      '@libark/db': resolve(__dirname, '../../packages/db/src'),
      '@libark/graphql-client': resolve(__dirname, '../../packages/graphql-client/src'),
      '@libark/media': resolve(__dirname, '../../packages/media/src'),
      '@libark/image-core': '@libark/image-core/browser',
      // Node.jsモジュールのブラウザ互換実装
      crypto: 'crypto-browserify',
      buffer: 'buffer',
    },
  },

  // 依存関係の最適化設定
  optimizeDeps: {
    include: ['crypto-browserify', 'buffer'],
    exclude: [
      'crypto',
      'fs',
      'path',
      'os',
      'node:crypto',
      'node:fs',
      'node:path',
      'node:os',
      'node:buffer',
    ],
  },

  // 環境変数設定
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    global: 'globalThis',
  },

  // 外部モジュールとして扱う（バンドルしない）
  build: {
    rollupOptions: {
      external: [
        'crypto',
        'fs',
        'path',
        'os',
        'buffer',
        'node:crypto',
        'node:fs',
        'node:path',
        'node:os',
        'node:buffer',
      ],
    },
  },

  // Frontend固有のテスト設定
  test: {
    ...browserTestConfig.test,
    // Frontend固有の設定
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [...browserTestConfig.test.exclude, '.idea', '.cache'],

    // Frontend固有のカバレッジ設定
    coverage: {
      ...browserTestConfig.test.coverage,
      reportsDirectory: './coverage/unit',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [...browserTestConfig.test.coverage.exclude, 'src/__tests__/**', 'src/mocks/**'],
    },

    // テスト環境でのモジュール解決設定
    server: {
      deps: {
        external: ['crypto', 'buffer', 'fs', 'path', 'os'],
      },
    },
  },
});
