/**
 * 🎯 フロントエンド専用ESLint設定
 *
 * React/TypeScript用の設定とカスタムルール
 */

import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

import atomicDesignSeparation from './apps/frontend/eslint-rules/atomic-design-separation.js';
import componentUsageLocation from './apps/frontend/eslint-rules/component-usage-location.js';
import typeDefinitionSeparation from './apps/frontend/eslint-rules/type-definition-separation.js';
import enhancedTypeDefinitionSeparation from './apps/frontend/eslint-rules/enhanced-type-definition-separation.js';
import typeNamingConventions from './apps/frontend/eslint-rules/type-naming-conventions.js';
import typeExportConsistency from './apps/frontend/eslint-rules/type-export-consistency.js';
import typeDuplicationPrevention from './apps/frontend/eslint-rules/type-duplication-prevention.js';
import importPathValidation from './apps/frontend/eslint-rules/import-path-validation.js';

export const frontendConfig = [
  {
    files: ['apps/frontend/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'atomic-design': { rules: { 'atomic-design-separation': atomicDesignSeparation } },
      'responsibility-separation': {
        rules: {
          'component-usage-location': componentUsageLocation,
          'type-definition-separation': typeDefinitionSeparation,
          'enhanced-type-definition-separation': enhancedTypeDefinitionSeparation,
          'type-naming-conventions': typeNamingConventions,
          'type-export-consistency': typeExportConsistency,
          'type-duplication-prevention': typeDuplicationPrevention,
          'import-path-validation': importPathValidation,
        }
      },
    },
    rules: {
      // React基本ルール
      'react/jsx-uses-react': 'off', // React 17+ JSX Transform
      'react/react-in-jsx-scope': 'off', // React 17+ JSX Transform
      'react/jsx-uses-vars': 'warn',
      'react/prop-types': 'off', // TypeScriptを使用するため
      'react/display-name': 'warn',

      // React Hooks
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // GraphQL/Apollo固有の誤検知対策
      // NOTE: baseConfigのunused-imports設定を上書き
      // フロントエンド固有のGraphQL/Apollo変数パターン（messageAdded, refetch等）を追加で許可
      // 詳細: docs/eslint-best-practices.md 参照
      'unused-imports/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^(messageAdded|conversationUpdated|refetch|mock|create|update|delete).*|(Data|Error|Loading)$',
          destructuredArrayIgnorePattern: '^_'
        }
      ],

      // アクセシビリティ（基本的なもののみ）
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // 統一定数使用の推奨（基本的なパターンのみ）
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value='#ffffff']",
          message: '⚠️ ハードコードされた色値 #ffffff が検出されました。DESIGN_COLORS.special.qrBackground を使用してください。',
        },
        {
          selector: "Literal[value='#000000']",
          message: '⚠️ ハードコードされた色値 #000000 が検出されました。DESIGN_COLORS.special.qrForeground を使用してください。',
        },
        {
          selector: "Literal[value='#F7931A']",
          message: '⚠️ ハードコードされた色値 #F7931A が検出されました。DESIGN_COLORS.currency.BTC を使用してください。',
        },
        {
          selector: "Literal[value='#627EEA']",
          message: '⚠️ ハードコードされた色値 #627EEA が検出されました。DESIGN_COLORS.currency.ETH を使用してください。',
        },
        {
          selector: "Literal[value=200]",
          message: '⚠️ ハードコードされたサイズ値 200 が検出されました。DESIGN_SIZES.components.qrCode.medium を使用してください。',
        },
        {
          selector: "Literal[value=500]",
          message: '⚠️ ハードコードされた制限値 500 が検出されました。VALIDATION_LIMITS.text.longMax を使用してください。',
        },
      ],

      // カスタムルール（警告レベル）
      'atomic-design/atomic-design-separation': 'warn',

      // 🎯 責任分離ルール
      'responsibility-separation/component-usage-location': ['warn', {
        commonFolders: ['components/atoms', 'components/molecules', 'components/organisms', 'components/templates'],
        featureFolders: ['features', 'pages'],
        minUsageForCommon: 2,
      }],
      'responsibility-separation/type-definition-separation': ['warn', {
        commonTypeFolders: ['types/common', 'types/components'],
        featureTypeFolders: ['types/admin', 'types/settings', 'features/*/types'],
        minUsageForCommon: 2,  // 2箇所以上で共通フォルダ、1箇所なら機能別
      }],
      'responsibility-separation/type-naming-conventions': ['warn', {
        interfacePattern: '^[A-Z][a-zA-Z0-9]*$',
        typePattern: '^[A-Z][a-zA-Z0-9]*$',
        enumPattern: '^[A-Z][a-zA-Z0-9]*$',
        propsPattern: '^[A-Z][a-zA-Z0-9]*Props$',
        statePattern: '^[A-Z][a-zA-Z0-9]*State$',
        eventPattern: '^[A-Z][a-zA-Z0-9]*Event$',
        variantPattern: '^[A-Z][a-zA-Z0-9]*Variant$',
        autoFixEnabled: true,
      }],
      'responsibility-separation/type-export-consistency': ['warn', {
        enforceTypeExports: true,
        enforceIndexExports: true,
        enforceTypeImports: true,
        allowDirectImports: ['@libark/graphql-client'],
        autoFixEnabled: true,
      }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
