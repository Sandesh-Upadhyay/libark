/**
 * 🎯 コンポーネント使用箇所チェックルール
 *
 * 責任:
 * - 複数使用コンポーネントのみ共通化を強制
 * - 単一使用コンポーネントは機能別フォルダに配置を強制
 * - 適切な責任分離の維持
 *
 * 検知対象:
 * - 単一使用コンポーネントが共通フォルダにある
 * - 複数使用コンポーネントが機能別フォルダにある
 * - 不適切なコンポーネント配置
 */

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'コンポーネントの使用箇所に基づく適切な配置を強制',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          commonFolders: {
            type: 'array',
            items: { type: 'string' },
            default: ['components/atoms', 'components/molecules', 'components/organisms', 'components/templates'],
          },
          featureFolders: {
            type: 'array',
            items: { type: 'string' },
            default: ['features', 'pages'],
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
      singleUseInCommon: 'コンポーネント "{{componentName}}" は1箇所でしか使用されていないため、機能別フォルダ ({{suggestedPath}}) に移動してください',
      multiUseInFeature: 'コンポーネント "{{componentName}}" は{{usageCount}}箇所で使用されているため、共通フォルダに移動してください',
      unusedComponent: 'コンポーネント "{{componentName}}" は使用されていません。削除を検討してください',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const commonFolders = options.commonFolders || ['components/atoms', 'components/molecules', 'components/organisms', 'components/templates'];
    const featureFolders = options.featureFolders || ['features', 'pages'];
    const minUsageForCommon = options.minUsageForCommon || 2;

    const filename = context.getFilename();
    const projectRoot = findProjectRoot(filename);

    // コンポーネントファイルかどうかをチェック
    function isComponentFile(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      const isInComponentFolder = commonFolders.some(folder => relativePath.includes(folder)) ||
                                 featureFolders.some(folder => relativePath.includes(folder));
      const isReactComponent = /\.(tsx|jsx)$/.test(filePath) &&
                              !/\.(test|spec|stories)\.(tsx|jsx)$/.test(filePath);
      return isInComponentFolder && isReactComponent;
    }

    // コンポーネントの使用箇所を検索
    function findComponentUsages(componentName, componentPath) {
      const usages = [];
      const searchPattern = path.join(projectRoot, 'src/**/*.{ts,tsx,js,jsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          if (file === componentPath) return; // 自分自身は除外

          try {
            const content = fs.readFileSync(file, 'utf8');
            const importRegex = new RegExp(`import.*${componentName}.*from`, 'g');
            const usageRegex = new RegExp(`<${componentName}[\\s>]`, 'g');

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

    // 共通フォルダかどうかをチェック
    function isInCommonFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return commonFolders.some(folder => relativePath.includes(folder));
    }

    // 機能別フォルダかどうかをチェック
    function isInFeatureFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return featureFolders.some(folder => relativePath.includes(folder));
    }

    // 推奨パスを生成
    function getSuggestedPath(usages, _componentName) {
      if (usages.length === 0) return null;

      // 最も多く使用されている機能フォルダを特定
      const featureUsage = {};
      usages.forEach(usage => {
        const relativePath = path.relative(projectRoot, usage);
        const featureMatch = featureFolders.find(folder => relativePath.includes(folder));
        if (featureMatch) {
          const featureName = relativePath.split('/')[1]; // features/auth/... -> auth
          featureUsage[featureName] = (featureUsage[featureName] || 0) + 1;
        }
      });

      const mostUsedFeature = Object.keys(featureUsage).reduce((a, b) =>
        featureUsage[a] > featureUsage[b] ? a : b, Object.keys(featureUsage)[0]);

      return mostUsedFeature ? `features/${mostUsedFeature}/components` : 'features/shared/components';
    }

    return {
      Program(node) {
        if (!isComponentFile(filename)) return;

        const componentName = path.basename(filename, path.extname(filename));
        const usages = findComponentUsages(componentName, filename);
        const usageCount = usages.length;

        // 単一使用コンポーネントが共通フォルダにある場合
        if (usageCount < minUsageForCommon && isInCommonFolder(filename)) {
          const suggestedPath = getSuggestedPath(usages, componentName);
          context.report({
            node,
            messageId: 'singleUseInCommon',
            data: {
              componentName,
              suggestedPath: suggestedPath || 'features/[feature-name]/components',
            },
          });
        }

        // 複数使用コンポーネントが機能別フォルダにある場合
        if (usageCount >= minUsageForCommon && isInFeatureFolder(filename)) {
          context.report({
            node,
            messageId: 'multiUseInFeature',
            data: {
              componentName,
              usageCount,
            },
          });
        }

        // 未使用コンポーネント
        if (usageCount === 0) {
          context.report({
            node,
            messageId: 'unusedComponent',
            data: {
              componentName,
            },
          });
        }
      },
    };
  },
};
