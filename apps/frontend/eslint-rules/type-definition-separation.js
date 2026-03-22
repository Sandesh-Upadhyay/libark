/**
 * 🎯 型定義責任分離チェックルール
 *
 * 責任:
 * - 型定義の適切な配置を強制
 * - 共通型 vs 機能固有型の分離
 * - 型定義の重複を防止
 *
 * 検知対象:
 * - 機能固有型が共通フォルダにある
 * - 共通型が機能別フォルダにある
 * - 型定義の重複
 * - 不適切な型インポート
 */

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '型定義の責任分離と適切な配置を強制',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          commonTypeFolders: {
            type: 'array',
            items: { type: 'string' },
            default: ['types/common', 'types/components'],
          },
          featureTypeFolders: {
            type: 'array',
            items: { type: 'string' },
            default: ['types/admin', 'types/settings', 'features/*/types'],
          },
          minUsageForCommon: {
            type: 'number',
            default: 2,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      featureTypeInCommon: '型定義 "{{typeName}}" は機能固有のため、機能別フォルダ ({{suggestedPath}}) に移動してください',
      commonTypeInFeature: '型定義 "{{typeName}}" は{{usageCount}}箇所で使用されているため、共通フォルダに移動してください',
      duplicateType: '型定義 "{{typeName}}" が重複しています。{{locations}} で定義されています',
      wrongImportPath: '型 "{{typeName}}" のインポートパスが不適切です。{{correctPath}} を使用してください',
      inlineTypeDefinition: 'インライン型定義は禁止されています。型定義ファイルに移動してください',
      legacyRuleWarning: '⚠️ このルールは非推奨です。enhanced-type-definition-separation ルールの使用を推奨します',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const commonTypeFolders = options.commonTypeFolders || ['types/common', 'types/components'];
    const featureTypeFolders = options.featureTypeFolders || ['types/admin', 'types/settings', 'features/*/types'];
    const minUsageForCommon = options.minUsageForCommon || 2;

    const filename = context.getFilename();
    const projectRoot = findProjectRoot(filename);

    // 型定義ファイルかどうかをチェック
    function isTypeFile(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return /types.*\.(ts|tsx)$/.test(relativePath) && !/\.(test|spec)\.(ts|tsx)$/.test(filePath);
    }

    // プロジェクトルートを見つける
    function findProjectRoot(filePath) {
      let dir = path.dirname(filePath);
      while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
          return dir;
        }
        dir = path.dirname(dir);
      }
      return process.cwd();
    }

    // 型の使用箇所を検索
    function findTypeUsages(typeName) {
      const usages = [];
      const searchPattern = path.join(projectRoot, 'src/**/*.{ts,tsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          if (file === filename) return; // 自分自身は除外

          try {
            const content = fs.readFileSync(file, 'utf8');
            const importRegex = new RegExp(`import.*\\b${typeName}\\b.*from`, 'g');
            const usageRegex = new RegExp(`\\b${typeName}\\b`, 'g');

            if (importRegex.test(content) || usageRegex.test(content)) {
              usages.push(file);
            }
          } catch {
            // ファイル読み込みエラーは無視
          }
        });
      } catch {
        // glob エラーは無視
      }

      return usages;
    }

    // 型定義の重複をチェック
    function findDuplicateTypes(typeName) {
      const locations = [];
      const searchPattern = path.join(projectRoot, 'src/**/types/**/*.{ts,tsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          try {
            const content = fs.readFileSync(file, 'utf8');
            const typeDefRegex = new RegExp(`(export\\s+)?(interface|type)\\s+${typeName}\\b`, 'g');

            if (typeDefRegex.test(content)) {
              locations.push(path.relative(projectRoot, file));
            }
          } catch {
            // ファイル読み込みエラーは無視
          }
        });
      } catch {
        // glob エラーは無視
      }

      return locations;
    }

    // 共通型フォルダかどうかをチェック
    function isInCommonTypeFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return commonTypeFolders.some(folder => relativePath.includes(folder));
    }

    // 機能別型フォルダかどうかをチェック
    function isInFeatureTypeFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return featureTypeFolders.some(folder => {
        if (folder.includes('*')) {
          const pattern = folder.replace('*', '[^/]+');
          return new RegExp(pattern).test(relativePath);
        }
        return relativePath.includes(folder);
      });
    }

    // 機能名を抽出
    function extractFeatureName(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      const featureMatch = relativePath.match(/features\/([^/]+)/);
      if (featureMatch) return featureMatch[1];

      const typeMatch = relativePath.match(/types\/([^/]+)/);
      if (typeMatch && !commonTypeFolders.some(folder => folder.includes(typeMatch[1]))) {
        return typeMatch[1];
      }

      return null;
    }

    return {
      // 型定義の宣言をチェック
      TSTypeAliasDeclaration(node) {
        if (!isTypeFile(filename)) return;

        const typeName = node.id.name;
        const usages = findTypeUsages(typeName);
        const usageCount = usages.length;
        const duplicates = findDuplicateTypes(typeName);

        // 重複チェック
        if (duplicates.length > 1) {
          context.report({
            node,
            messageId: 'duplicateType',
            data: {
              typeName,
              locations: duplicates.join(', '),
            },
          });
        }

        // 機能固有型が共通フォルダにある場合
        if (usageCount < minUsageForCommon && isInCommonTypeFolder(filename)) {
          const featureName = extractFeatureName(usages[0] || '');
          const suggestedPath = featureName ? `types/${featureName}` : 'features/[feature-name]/types';

          context.report({
            node,
            messageId: 'featureTypeInCommon',
            data: {
              typeName,
              suggestedPath,
            },
          });
        }

        // 共通型が機能別フォルダにある場合
        if (usageCount >= minUsageForCommon && isInFeatureTypeFolder(filename)) {
          context.report({
            node,
            messageId: 'commonTypeInFeature',
            data: {
              typeName,
              usageCount,
            },
          });
        }
      },

      // インターフェース定義をチェック
      TSInterfaceDeclaration(node) {
        if (!isTypeFile(filename)) return;

        const typeName = node.id.name;
        const usages = findTypeUsages(typeName);
        const usageCount = usages.length;
        const duplicates = findDuplicateTypes(typeName);

        // 重複チェック
        if (duplicates.length > 1) {
          context.report({
            node,
            messageId: 'duplicateType',
            data: {
              typeName,
              locations: duplicates.join(', '),
            },
          });
        }

        // 機能固有型が共通フォルダにある場合
        if (usageCount < minUsageForCommon && isInCommonTypeFolder(filename)) {
          const featureName = extractFeatureName(usages[0] || '');
          const suggestedPath = featureName ? `types/${featureName}` : 'features/[feature-name]/types';

          context.report({
            node,
            messageId: 'featureTypeInCommon',
            data: {
              typeName,
              suggestedPath,
            },
          });
        }

        // 共通型が機能別フォルダにある場合
        if (usageCount >= minUsageForCommon && isInFeatureTypeFolder(filename)) {
          context.report({
            node,
            messageId: 'commonTypeInFeature',
            data: {
              typeName,
              usageCount,
            },
          });
        }
      },

      // インライン型定義をチェック
      TSTypeLiteral(node) {
        // コンポーネントファイル内でのインライン型定義を検知
        if (!isTypeFile(filename) && /\.(tsx|jsx)$/.test(filename)) {
          const parent = node.parent;
          if (parent && (parent.type === 'TSTypeAnnotation' || parent.type === 'TSAsExpression')) {
            context.report({
              node,
              messageId: 'inlineTypeDefinition',
            });
          }
        }
      },
    };
  },
};
