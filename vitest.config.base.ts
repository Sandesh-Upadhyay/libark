/**
 * 🧪 Unified test config (base)
 *
 * Defines shared Vitest settings across packages
 * Each package extends this base config
 */

import path from 'path';

import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vitest/config';

// Base unified test config
export const baseTestConfig = {
  resolve: {
    alias: {
      '@libark/core-shared': path.resolve(__dirname, './packages/core-shared/src'),
      '@libark/cache': path.resolve(__dirname, './packages/cache/src'),
      '@libark/db': path.resolve(__dirname, './packages/db/src'),
      '@libark/media': path.resolve(__dirname, './packages/media/src'),
    },
  },
  test: {
    // Global settings
    globals: true,

    // Timeout settings (standardized)
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,

    // Exclude patterns (standardized)
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '**/*.config.*',
      '**/.*',
    ],

    // Coverage settings (standardized)
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/test/**',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },

    // Reporter settings (standardized)
    reporters: ['default', 'verbose'],

    // Parallel execution settings
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Prevent cross-test interference
      },
    },

    // Environment variable settings
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent', // Suppress logs during tests
      LOG_CATEGORIES: 'SYSTEM', // System errors only
    },
  },
} satisfies UserConfig;

// Node.js environment settings
export const nodeTestConfig = {
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    environment: 'node',
    setupFiles: ['./test-setup.ts'], // Unified setup file
  },
} satisfies UserConfig;

// Browser environment settings
export const browserTestConfig = {
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    environment: 'jsdom',
    setupFiles: ['./test-setup.browser.ts'], // Browser setup file

    // Browser-specific exclude patterns
    exclude: [
      ...baseTestConfig.test.exclude,
      'src/server/**', // Exclude server-side code
      'src/api/**', // Exclude API code
    ],
  },
} satisfies UserConfig;

// Default export (Node.js environment)
export default defineConfig(nodeTestConfig);
