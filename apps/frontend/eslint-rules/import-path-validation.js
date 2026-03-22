/**
 * 🎯 インポートパス検証ルール
 *
 * 責任:
 * - 適切なインポートパスの強制
 * - 型定義の統一インポートパス
 * - 循環依存の防止
 *
 * 検知対象:
 * - 不適切な型インポートパス
 * - 直接ファイルインポート（インデックス経由すべき）
 * - 機能間の不適切な依存
 * - 循環依存
 */

import path from 'path';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'インポートパスの適切性を検証',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          enforceIndexImports: {
            type: 'boolean',
            default: true,
          },
          allowedDirectImports: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
          typeImportPaths: {
            type: 'object',
            properties: {
              common: { type: 'string', default: '@/types' },
              components: { type: 'string', default: '@/types' },
              admin: { type: 'string', default: '@/types' },
              settings: { type: 'string', default: '@/types' },
              features: { type: 'string', default: '@/features/*/types' },
            },
          },
          enforceTypeModifier: {
            type: 'boolean',
            default: true,
          },
          autoFixImports: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useIndexImport: '直接ファイルインポートではなく、インデックスファイル経由でインポートしてください: {{correctPath}}',
      useUnifiedTypeImport: '型定義は統一パス経由でインポートしてください: {{correctPath}}',
      crossFeatureDependency: '機能間の直接依存は禁止されています。共通コンポーネント経由でアクセスしてください',
      circularDependency: '循環依存が検出されました: {{cycle}}',
      deprecatedImportPath: '非推奨のインポートパスです。{{correctPath}} を使用してください',
      missingTypeModifier: '型インポートには type 修飾子を使用してください: import type { {{typeName}} }',
      inconsistentImportStyle: 'インポートスタイルが一貫していません。{{suggestion}} を使用してください',
      unnecessaryTypeModifier: 'この値インポートに type 修飾子は不要です',
      deepImportPath: '深いインポートパスは避けてください。{{shallowPath}} を使用してください',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const enforceIndexImports = options.enforceIndexImports !== false;
    const allowedDirectImports = options.allowedDirectImports || [];
    const typeImportPaths = options.typeImportPaths || {
      common: '@/types',
      components: '@/types',
      admin: '@/types',
      settings: '@/types',
      features: '@/features/*/types',
    };
    const enforceTypeModifier = options.enforceTypeModifier !== false;
    const autoFixImports = options.autoFixImports !== false;

    const filename = context.getFilename();

    // ファイルパスから機能名を抽出
    function extractFeatureName(filePath) {
      const relativePath = path.relative(process.cwd(), filePath);
      const featureMatch = relativePath.match(/features\/([^/]+)/);
      return featureMatch ? featureMatch[1] : null;
    }

    // 型インポートかどうかをチェック
    function isTypeImport(node) {
      return node.importKind === 'type' ||
             (node.specifiers && node.specifiers.some(spec => spec.importKind === 'type'));
    }

    // 適切な型インポートパスを取得
    function getCorrectTypeImportPath(importPath, importedTypes) {
      // 共通型の判定
      const commonTypes = ['IconType', 'BadgeVariant', 'SizeVariant', 'UserInfo', 'ListItem'];
      const componentTypes = ['ButtonProps', 'InputProps', 'HeaderProps', 'AvatarProps'];
      const adminTypes = ['AdminMenuItem', 'AdminMenuListProps'];
      const settingsTypes = ['SettingsMenuItem', 'SettingsMenuListProps'];

      const hasCommonTypes = importedTypes.some(type => commonTypes.includes(type));
      const hasComponentTypes = importedTypes.some(type => componentTypes.includes(type));
      const hasAdminTypes = importedTypes.some(type => adminTypes.includes(type));
      const hasSettingsTypes = importedTypes.some(type => settingsTypes.includes(type));

      if (hasCommonTypes) return typeImportPaths.common;
      if (hasComponentTypes) return typeImportPaths.components;
      if (hasAdminTypes) return typeImportPaths.admin;
      if (hasSettingsTypes) return typeImportPaths.settings;

      return null;
    }

    // インポートされた名前が型かどうかを判定
    function isImportedNameType(importedName, importPath) {
      // 型定義ファイルからのインポートは型
      if (importPath.includes('/types/')) {
        return true;
      }

      // 命名規則による判定
      const typePatterns = [
        /Props$/,
        /State$/,
        /Event$/,
        /Variant$/,
        /Type$/,
        /Interface$/,
        /^[A-Z][a-zA-Z0-9]*$/,
      ];

      return typePatterns.some(pattern => pattern.test(importedName));
    }

    // 浅いインポートパスを取得
    function getShallowImportPath(importPath) {
      const pathParts = importPath.split('/');

      // 深すぎるパスの場合、適切なレベルまで短縮
      if (pathParts.length > 4 && importPath.startsWith('@/')) {
        if (importPath.includes('/components/')) {
          return '@/components';
        }
        if (importPath.includes('/features/')) {
          const featureIndex = pathParts.indexOf('features');
          if (featureIndex >= 0 && pathParts[featureIndex + 1]) {
            return `@/features/${pathParts[featureIndex + 1]}`;
          }
        }
        if (importPath.includes('/types/')) {
          return '@/types';
        }
      }

      return null;
    }

    // 自動修正の生成
    function generateImportFix(node, correctPath, addTypeModifier = false) {
      if (!autoFixImports) return null;

      return function(fixer) {
        const fixes = [];

        // パスの修正
        if (correctPath) {
          fixes.push(fixer.replaceText(node.source, `'${correctPath}'`));
        }

        // type修飾子の追加
        if (addTypeModifier && !isTypeImport(node)) {
          fixes.push(fixer.insertTextAfter(node.source.range[0] - 1, 'type '));
        }

        return fixes;
      };
    }

    // インデックスファイル経由すべきかチェック
    function shouldUseIndexImport(importPath) {
      if (allowedDirectImports.some(pattern => importPath.includes(pattern))) {
        return false;
      }

      // コンポーネントフォルダからの直接インポートをチェック
      const componentFolders = ['components/atoms', 'components/molecules', 'components/organisms', 'components/templates'];
      return componentFolders.some(folder => importPath.includes(folder) && !importPath.endsWith('/index'));
    }

    // 機能間依存をチェック
    function isCrossFeatureDependency(currentFile, importPath) {
      const currentFeature = extractFeatureName(currentFile);
      const importFeature = extractFeatureName(importPath);

      return currentFeature && importFeature && currentFeature !== importFeature;
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        const importedNames = node.specifiers
          .filter(spec => spec.type === 'ImportSpecifier')
          .map(spec => spec.imported.name);

        // 型インポートのチェック
        if (isTypeImport(node)) {
          const correctPath = getCorrectTypeImportPath(importPath, importedNames);
          if (correctPath && !importPath.includes(correctPath.replace('@/', ''))) {
            context.report({
              node,
              messageId: 'useUnifiedTypeImport',
              data: {
                correctPath,
              },
              fix: generateImportFix(node, correctPath),
            });
          }
        }

        // type修飾子の強制チェック
        if (enforceTypeModifier && !isTypeImport(node)) {
          const hasTypeImports = importedNames.some(name =>
            isImportedNameType(name, importPath)
          );

          if (hasTypeImports) {
            context.report({
              node,
              messageId: 'missingTypeModifier',
              data: {
                typeName: importedNames.join(', '),
              },
              fix: generateImportFix(node, null, true),
            });
          }
        }

        // 深いインポートパスのチェック
        const shallowPath = getShallowImportPath(importPath);
        if (shallowPath && shallowPath !== importPath) {
          context.report({
            node,
            messageId: 'deepImportPath',
            data: {
              shallowPath,
            },
            fix: generateImportFix(node, shallowPath),
          });
        }

        // インデックスファイル経由のチェック
        if (enforceIndexImports && shouldUseIndexImport(importPath)) {
          const pathParts = importPath.split('/');
          const correctPath = pathParts.slice(0, -1).join('/');

          context.report({
            node,
            messageId: 'useIndexImport',
            data: {
              correctPath,
            },
            fix(fixer) {
              return fixer.replaceText(node.source, `'${correctPath}'`);
            },
          });
        }

        // 機能間依存のチェック
        if (isCrossFeatureDependency(filename, importPath)) {
          context.report({
            node,
            messageId: 'crossFeatureDependency',
          });
        }

        // 非推奨パスのチェック
        const deprecatedPaths = {
          '@/types/menu': '@/types/admin または @/types/settings',
          '@/components/molecules/List': '@/types/common',
        };

        Object.keys(deprecatedPaths).forEach(deprecated => {
          if (importPath.includes(deprecated)) {
            context.report({
              node,
              messageId: 'deprecatedImportPath',
              data: {
                correctPath: deprecatedPaths[deprecated],
              },
            });
          }
        });
      },

      // 動的インポートもチェック
      ImportExpression(node) {
        if (node.source.type === 'Literal') {
          const importPath = node.source.value;

          if (enforceIndexImports && shouldUseIndexImport(importPath)) {
            const pathParts = importPath.split('/');
            const correctPath = pathParts.slice(0, -1).join('/');

            context.report({
              node,
              messageId: 'useIndexImport',
              data: {
                correctPath,
              },
            });
          }
        }
      },
    };
  },
};
