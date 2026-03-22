/**
 * 🎯 特殊ファイル用ESLint設定
 * 
 * 設定ファイル、テストファイル、ストーリーファイルなど
 * 特殊な用途のファイル用の設定
 */

export const specialConfig = [
  // 設定ファイル
  {
    files: ['**/*.config.{js,ts}', '**/vite.config.ts', '**/tailwind.config.js'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-default-export': 'off',
    },
  },
  
  // テストファイル
  {
    files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', '**/test/**/*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  
  // Storybookファイル
  {
    files: ['**/*.stories.{js,ts,tsx}', '**/stories/**/*'],
    rules: {
      'no-console': 'off',
      'import/no-default-export': 'off',
    },
  },
  
  // ESLintルールファイル
  {
    files: ['**/eslint-rules/**/*.js'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
