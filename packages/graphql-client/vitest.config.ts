/**
 * 🧪 @libark/graphql-client テスト設定
 */

import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '**/*.d.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
  resolve: {
    alias: {
      '@libark/core-shared': path.resolve(__dirname, '../core-shared/src'),
      '@libark/core-client': path.resolve(__dirname, '../core-client/src'),
    },
  },
});
