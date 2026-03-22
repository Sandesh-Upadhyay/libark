/**
 * 🎯 LIBARK unified ESLint config (modular, simplified)
 *
 * Combines split ESLint configuration files
 * Improves maintainability and readability
 */

import { baseConfig, ignorePatterns } from './eslint.config.base.js';
import { frontendConfig } from './eslint.config.frontend.js';
import { packagesConfig } from './eslint.config.packages.js';
import { specialConfig } from './eslint.config.special.js';

export default [
  // Global ignore settings
  {
    ignores: ignorePatterns,
  },

  // Base settings
  ...baseConfig,

  // Shared package settings
  ...packagesConfig,

  // Frontend-specific settings
  ...frontendConfig,

  // Special-file settings
  ...specialConfig,

  // CommonJS file settings
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
