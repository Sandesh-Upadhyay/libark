/**
 * 🎯 強化型定義責任分離ルール (Enhanced Type Definition Separation)
 *
 * 責任:
 * - ハイブリッド型定義アーキテクチャの強制
 * - 使用頻度に基づく適切な配置の検証
 * - 型定義重複の防止
 * - インライン型定義の禁止
 * - 自動修正機能の提供
 *
 * 新機能:
 * - 使用頻度閾値の調整（3箇所以上で共通型）
 * - より精密な重複検出
 * - 自動修正提案
 * - 詳細なエラーメッセージ
 */

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'ハイブリッド型定義アーキテクチャの強制と適切な配置の検証',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
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
            default: 3, // 3箇所以上で共通型
          },
          minUsageForComponent: {
            type: 'number',
            default: 2, // 2箇所以上でコンポーネント型
          },
          allowInlineTypes: {
            type: 'boolean',
            default: false, // インライン型定義を禁止
          },
          autoFixEnabled: {
            type: 'boolean',
            default: true, // 自動修正を有効化
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      // 既存メッセージ
      duplicateType: '型定義 "{{typeName}}" が重複しています。{{locations}} で定義されています',
      featureTypeInCommon: '型定義 "{{typeName}}" は{{usageCount}}箇所でのみ使用されているため、{{suggestedPath}} に移動してください',
      commonTypeInFeature: '型定義 "{{typeName}}" は{{usageCount}}箇所で使用されているため、共通フォルダに移動してください',
      inlineTypeDefinition: 'インライン型定義は禁止されています。型定義ファイルに移動してください',

      // 新規メッセージ
      componentTypeInFeature: '型定義 "{{typeName}}" は{{usageCount}}箇所で使用されているため、types/components に移動してください',
      improperTypeLocation: '型定義 "{{typeName}}" の配置が不適切です。使用パターン: {{usagePattern}}',
      missingTypeExport: '型定義 "{{typeName}}" が統一エクスポートファイルに含まれていません',
      circularTypeDependency: '型定義の循環依存が検出されました: {{cycle}}',
      inconsistentNaming: '型定義 "{{typeName}}" の命名が規則に従っていません。{{suggestion}} を推奨します',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const commonTypeFolders = options.commonTypeFolders || ['types/common', 'types/components'];
    const featureTypeFolders = options.featureTypeFolders || ['types/admin', 'types/settings', 'features/*/types'];
    const _minUsageForCommon = options.minUsageForCommon || 3;
    const _minUsageForComponent = options.minUsageForComponent || 2;
    const allowInlineTypes = options.allowInlineTypes || false;
    const autoFixEnabled = options.autoFixEnabled || true;

    const filename = context.getFilename();
    const projectRoot = findProjectRoot(filename);

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

    // 型定義ファイルかどうかをチェック
    function isTypeFile(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return /types.*\.(ts|tsx)$/.test(relativePath) && !/\.(test|spec)\.(ts|tsx)$/.test(filePath);
    }

    // 共通型フォルダかどうかをチェック
    function _isInCommonTypeFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return commonTypeFolders.some(folder => relativePath.includes(folder));
    }

    // コンポーネント型フォルダかどうかをチェック
    function _isInComponentTypeFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return relativePath.includes('types/components');
    }

    // 機能別型フォルダかどうかをチェック
    function _isInFeatureTypeFolder(filePath) {
      const relativePath = path.relative(projectRoot, filePath);
      return featureTypeFolders.some(folder => {
        const pattern = folder.replace('*', '.*');
        return new RegExp(pattern).test(relativePath);
      });
    }

    // 型の使用箇所を詳細に検索
    function findDetailedTypeUsages(typeName) {
      const usages = [];
      const searchPattern = path.join(projectRoot, 'src/**/*.{ts,tsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          if (file === filename) return;

          try {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
              const importRegex = new RegExp(`import.*\\b${typeName}\\b.*from`, 'g');
              const usageRegex = new RegExp(`\\b${typeName}\\b`, 'g');

              if (importRegex.test(line) || usageRegex.test(line)) {
                usages.push({
                  file: path.relative(projectRoot, file),
                  line: index + 1,
                  content: line.trim(),
                  type: importRegex.test(line) ? 'import' : 'usage'
                });
              }
            });
          } catch {
            // ファイル読み込みエラーは無視
          }
        });
      } catch {
        // glob エラーは無視
      }

      return usages;
    }

    // 型定義の重複を詳細に検出
    function findDetailedDuplicateTypes(typeName) {
      const locations = [];
      const searchPattern = path.join(projectRoot, 'src/**/types/**/*.{ts,tsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          try {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
              const typeDefRegex = new RegExp(`(export\\s+)?(interface|type|enum)\\s+${typeName}\\b`, 'g');

              if (typeDefRegex.test(line)) {
                locations.push({
                  file: path.relative(projectRoot, file),
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
          } catch {
            // ファイル読み込みエラーは無視
          }
        });
      } catch {
        // glob エラーは無視
      }

      return locations;
    }

    // 使用パターンの分析
    function analyzeUsagePattern(usages) {
      const featureUsages = usages.filter(usage =>
        usage.file.includes('/features/') ||
        usage.file.includes('/pages/')
      );

      const componentUsages = usages.filter(usage =>
        usage.file.includes('/components/')
      );

      const commonUsages = usages.filter(usage =>
        !usage.file.includes('/features/') &&
        !usage.file.includes('/pages/') &&
        !usage.file.includes('/components/')
      );

      return {
        total: usages.length,
        features: featureUsages.length,
        components: componentUsages.length,
        common: commonUsages.length,
        pattern: determinePattern(featureUsages.length, componentUsages.length, commonUsages.length)
      };
    }

    // パターン判定
    function determinePattern(features, components, common) {
      if (features >= 2 && components === 0 && common === 0) return 'feature-specific';
      if (components >= 2 && features <= 1) return 'component-shared';
      if (common >= 1 || (features + components + common) >= 3) return 'common-shared';
      return 'single-use';
    }

    // 推奨配置の決定
    function getSuggestedLocation(typeName, usagePattern) {
      switch (usagePattern.pattern) {
        case 'common-shared':
          return 'types/common';
        case 'component-shared':
          return 'types/components';
        case 'feature-specific':
          return 'features/[feature]/types';
        default:
          return 'features/[feature]/types';
      }
    }

    // 循環依存の検出
    function detectCircularDependencies(typeName, currentFile) {
      const visited = new Set();
      const recursionStack = new Set();

      function dfs(file, stack) {
        if (recursionStack.has(file)) {
          return stack.slice(stack.indexOf(file));
        }

        if (visited.has(file)) {
          return null;
        }

        visited.add(file);
        recursionStack.add(file);
        stack.push(file);

        try {
          const content = fs.readFileSync(file, 'utf8');
          const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
          let match;

          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath.startsWith('.') || importPath.startsWith('@/')) {
              // 相対パスまたはエイリアスパスの解決
              const resolvedPath = resolveImportPath(importPath, file);
              if (resolvedPath && fs.existsSync(resolvedPath)) {
                const cycle = dfs(resolvedPath, [...stack]);
                if (cycle) {
                  return cycle;
                }
              }
            }
          }
        } catch {
          // ファイル読み込みエラーは無視
        }

        recursionStack.delete(file);
        stack.pop();
        return null;
      }

      return dfs(currentFile, []);
    }

    // インポートパスの解決
    function resolveImportPath(importPath, currentFile) {
      const currentDir = path.dirname(currentFile);

      if (importPath.startsWith('@/')) {
        // エイリアスパスの解決
        const srcPath = path.join(projectRoot, 'src');
        return path.resolve(srcPath, importPath.replace('@/', ''));
      } else if (importPath.startsWith('.')) {
        // 相対パスの解決
        return path.resolve(currentDir, importPath);
      }

      return null;
    }

    // 型定義の品質チェック
    function checkTypeQuality(node, typeName) {
      const issues = [];

      // 命名規則チェック
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(typeName)) {
        issues.push('命名規則違反: PascalCaseを使用してください');
      }

      // 型の複雑さチェック
      if (node.type === 'TSInterfaceDeclaration' && node.body.body.length > 20) {
        issues.push('型が複雑すぎます: プロパティ数を20以下に抑えてください');
      }

      // ジェネリック型の適切性チェック
      if (node.typeParameters && node.typeParameters.params.length > 3) {
        issues.push('ジェネリック型パラメータが多すぎます: 3個以下に抑えてください');
      }

      return issues;
    }

    // 自動修正の生成
    function generateAutoFix(node, typeName, suggestedPath) {
      if (!autoFixEnabled) return null;

      return function(fixer) {
        // 型定義の移動は複雑なため、コメントでの提案のみ
        const comment = `// TODO: Move ${typeName} to ${suggestedPath}`;
        return fixer.insertTextBefore(node, comment + '\n');
      };
    }

    // 詳細なエラーメッセージの生成
    function generateDetailedMessage(typeName, usagePattern, suggestedLocation) {
      const details = [
        `型定義: ${typeName}`,
        `使用箇所: ${usagePattern.total}箇所`,
        `パターン: ${usagePattern.pattern}`,
        `推奨配置: ${suggestedLocation}`,
      ];

      if (usagePattern.features > 0) {
        details.push(`機能別使用: ${usagePattern.features}箇所`);
      }
      if (usagePattern.components > 0) {
        details.push(`コンポーネント使用: ${usagePattern.components}箇所`);
      }
      if (usagePattern.common > 0) {
        details.push(`共通使用: ${usagePattern.common}箇所`);
      }

      return details.join(' | ');
    }

    return {
      // 型エイリアス定義のチェック
      TSTypeAliasDeclaration(node) {
        if (!isTypeFile(filename)) return;

        const typeName = node.id.name;
        const usages = findDetailedTypeUsages(typeName);
        const duplicates = findDetailedDuplicateTypes(typeName);
        const usagePattern = analyzeUsagePattern(usages);

        // 重複チェック
        if (duplicates.length > 1) {
          context.report({
            node,
            messageId: 'duplicateType',
            data: {
              typeName,
              locations: duplicates.map(d => `${d.file}:${d.line}`).join(', '),
            },
          });
        }

        // 配置適正性チェック
        const suggestedLocation = getSuggestedLocation(typeName, usagePattern);
        const currentLocation = path.relative(projectRoot, filename);

        if (!currentLocation.includes(suggestedLocation.replace('[feature]', ''))) {
          const messageId = usagePattern.pattern === 'component-shared' ? 'componentTypeInFeature' :
                           usagePattern.pattern === 'common-shared' ? 'commonTypeInFeature' :
                           'featureTypeInCommon';

          // 循環依存チェック
          const circularDeps = detectCircularDependencies(typeName, filename);
          if (circularDeps && circularDeps.length > 0) {
            context.report({
              node,
              messageId: 'circularTypeDependency',
              data: {
                cycle: circularDeps.map(f => path.relative(projectRoot, f)).join(' → '),
              },
            });
            return;
          }

          // 型品質チェック
          const qualityIssues = checkTypeQuality(node, typeName);
          if (qualityIssues.length > 0) {
            context.report({
              node,
              messageId: 'inconsistentNaming',
              data: {
                typeName,
                suggestion: qualityIssues.join(', '),
              },
            });
          }

          const detailedMessage = generateDetailedMessage(typeName, usagePattern, suggestedLocation);

          context.report({
            node,
            messageId,
            data: {
              typeName,
              usageCount: usagePattern.total,
              suggestedPath: suggestedLocation,
              usagePattern: detailedMessage,
            },
            fix: generateAutoFix(node, typeName, suggestedLocation),
          });
        }
      },

      // インターフェース定義のチェック
      TSInterfaceDeclaration(node) {
        // TSTypeAliasDeclarationと同様の処理
        if (!isTypeFile(filename)) return;

        const typeName = node.id.name;
        const usages = findDetailedTypeUsages(typeName);
        const duplicates = findDetailedDuplicateTypes(typeName);
        const usagePattern = analyzeUsagePattern(usages);

        // 重複チェック
        if (duplicates.length > 1) {
          context.report({
            node,
            messageId: 'duplicateType',
            data: {
              typeName,
              locations: duplicates.map(d => `${d.file}:${d.line}`).join(', '),
            },
          });
        }

        // 配置適正性チェック
        const suggestedLocation = getSuggestedLocation(typeName, usagePattern);
        const currentLocation = path.relative(projectRoot, filename);

        if (!currentLocation.includes(suggestedLocation.replace('[feature]', ''))) {
          const messageId = usagePattern.pattern === 'component-shared' ? 'componentTypeInFeature' :
                           usagePattern.pattern === 'common-shared' ? 'commonTypeInFeature' :
                           'featureTypeInCommon';

          context.report({
            node,
            messageId,
            data: {
              typeName,
              usageCount: usagePattern.total,
              suggestedPath: suggestedLocation,
              usagePattern: usagePattern.pattern,
            },
            fix: generateAutoFix(node, typeName, suggestedLocation),
          });
        }
      },

      // インライン型定義のチェック
      TSTypeLiteral(node) {
        if (!allowInlineTypes) {
          context.report({
            node,
            messageId: 'inlineTypeDefinition',
            fix: autoFixEnabled ? function(fixer) {
              // インライン型の自動修正は複雑なため、コメントでの提案
              return fixer.insertTextBefore(node, '/* TODO: Extract to type definition file */ ');
            } : null,
          });
        }
      },
    };
  },
};
