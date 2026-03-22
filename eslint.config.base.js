/**
 * 🎯 ESLint基本設定
 *
 * 全パッケージ・アプリケーション共通の基本ルール
 */

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export const baseConfig = [
  // 基本設定
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.vitest,
        // TypeScript/Web API globals
        RequestInit: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // TypeScript基本ルール
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^(data|error|loading)$|Data$|Error$|Loading$',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      // インポート管理
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
          'newlines-between': 'always',
        },
      ],
      'import/no-cycle': 'warn',
      'import/first': 'warn',

      // 基本品質ルール
      'no-unused-vars': 'off',
      'no-console':
        process.env.NODE_ENV === 'production' ? ['warn', { allow: ['warn', 'error'] }] : 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-catch': 'warn',
      'no-control-regex': 'warn',
      'no-undef': 'warn',

      // ESM準拠
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='require']",
          message: '⚠️ 可能な限りESMのimport文を使用してください',
        },
      ],
    },
    settings: {
      'import/resolver': {
        'eslint-import-resolver-typescript': {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        },
      },
    },
  },
];

export const ignorePatterns = [
  '**/dist/**',
  '**/build/**',
  '**/node_modules/**',
  '**/*.d.ts',
  '**/coverage/**',
  '**/.next/**',
  '**/generated/**',
];
