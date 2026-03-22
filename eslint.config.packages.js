/**
 * 🎯 共通パッケージ専用ESLint設定
 *
 * 厳格なルールを適用し、パッケージ品質を保証
 */

export const packagesConfig = [
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'import/no-relative-parent-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
