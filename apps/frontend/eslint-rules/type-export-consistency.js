/**
 * 🎯 型定義エクスポート統一ルール (Type Export Consistency)
 *
 * 責任:
 * - 型定義の統一エクスポートの強制
 * - index.tsファイルでの適切なエクスポート
 * - 型専用インポートの使用強制
 * - エクスポート漏れの検出
 *
 * 検証対象:
 * - 型定義ファイルでのexport type使用
 * - index.tsでの統一エクスポート
 * - 型インポート時のtype修飾子
 * - エクスポートされていない型の検出
 */

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '型定義の統一エクスポートと一貫性を強制',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          enforceTypeExports: {
            type: 'boolean',
            default: true,
          },
          enforceIndexExports: {
            type: 'boolean',
            default: true,
          },
          enforceTypeImports: {
            type: 'boolean',
            default: true,
          },
          allowDirectImports: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
          autoFixEnabled: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTypeExport: '型定義 "{{typeName}}" は export type を使用してエクスポートしてください',
      missingIndexExport: '型定義 "{{typeName}}" が index.ts でエクスポートされていません',
      missingTypeImport: '型 "{{typeName}}" のインポートには type 修飾子を使用してください',
      directTypeImport: '型 "{{typeName}}" は統一パス "{{unifiedPath}}" からインポートしてください',
      inconsistentExport: 'エクスポート方法が一貫していません。export type を使用してください',
      unusedTypeDefinition: '型定義 "{{typeName}}" が使用されていません',
      duplicateExport: '型定義 "{{typeName}}" が複数回エクスポートされています',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const enforceTypeExports = options.enforceTypeExports !== false;
    const enforceIndexExports = options.enforceIndexExports !== false;
    const enforceTypeImports = options.enforceTypeImports !== false;
    const allowDirectImports = options.allowDirectImports || [];
    const autoFixEnabled = options.autoFixEnabled !== false;

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

    // index.tsファイルかどうかをチェック
    function isIndexFile(filePath) {
      return path.basename(filePath) === 'index.ts';
    }

    // 統一エクスポートパスを取得
    function getUnifiedExportPath(typeName, currentFile) {
      const relativePath = path.relative(projectRoot, currentFile);

      if (relativePath.includes('types/common')) {
        return '@/types';
      } else if (relativePath.includes('types/components')) {
        return '@/types';
      } else if (relativePath.includes('features/')) {
        const featureMatch = relativePath.match(/features\/([^\/]+)/);
        if (featureMatch) {
          return `@/features/${featureMatch[1]}/types`;
        }
      }

      return '@/types';
    }

    // インポートパスの解決
    function resolveImportPath(importPath, currentFile) {
      const currentDir = path.dirname(currentFile);

      if (importPath.startsWith('@/')) {
        // エイリアスパスの解決
        const srcPath = path.join(projectRoot, 'src');
        const resolvedPath = path.resolve(srcPath, importPath.replace('@/', ''));
        // .ts拡張子を追加して確認
        if (fs.existsSync(resolvedPath + '.ts')) {
          return resolvedPath + '.ts';
        }
        if (fs.existsSync(resolvedPath + '/index.ts')) {
          return resolvedPath + '/index.ts';
        }
        return resolvedPath;
      } else if (importPath.startsWith('.')) {
        // 相対パスの解決
        const resolvedPath = path.resolve(currentDir, importPath);
        // .ts拡張子を追加して確認
        if (fs.existsSync(resolvedPath + '.ts')) {
          return resolvedPath + '.ts';
        }
        if (fs.existsSync(resolvedPath + '/index.ts')) {
          return resolvedPath + '/index.ts';
        }
        return resolvedPath;
      }

      return null;
    }

    // index.tsでエクスポートされているかチェック
    function isExportedInIndex(typeName, typeFile) {
      const relativePath = path.relative(projectRoot, typeFile);

      // チェックすべきindex.tsファイルのパスを決定
      const indexPaths = [];

      if (relativePath.includes('types/common/')) {
        // common配下の場合、common/index.tsとtypes/index.tsをチェック
        indexPaths.push(
          path.join(projectRoot, 'src/types/common/index.ts'),
          path.join(projectRoot, 'src/types/index.ts')
        );
      } else if (relativePath.includes('types/components/')) {
        // components配下の場合、components/index.tsとtypes/index.tsをチェック
        indexPaths.push(
          path.join(projectRoot, 'src/types/components/index.ts'),
          path.join(projectRoot, 'src/types/index.ts')
        );
      } else if (relativePath.includes('types/admin/')) {
        // admin配下の場合、admin/index.tsとtypes/index.tsをチェック
        indexPaths.push(
          path.join(projectRoot, 'src/types/admin/index.ts'),
          path.join(projectRoot, 'src/types/index.ts')
        );
      } else if (relativePath.includes('types/settings/')) {
        // settings配下の場合、settings/index.tsとtypes/index.tsをチェック
        indexPaths.push(
          path.join(projectRoot, 'src/types/settings/index.ts'),
          path.join(projectRoot, 'src/types/index.ts')
        );
      } else {
        // その他の場合、同じディレクトリのindex.tsをチェック
        const dir = path.dirname(typeFile);
        indexPaths.push(path.join(dir, 'index.ts'));
      }

      // いずれかのindex.tsでエクスポートされているかチェック
      for (const indexPath of indexPaths) {
        if (fs.existsSync(indexPath)) {
          try {
            const content = fs.readFileSync(indexPath, 'utf8');

            // より柔軟な正規表現パターンでチェック
            const exportPatterns = [
              // export type { TypeName } from './file';
              new RegExp(`export\\s+type\\s*{[^}]*\\b${typeName}\\b[^}]*}\\s*from`, 'g'),
              // export type { TypeName, ... } from './file';
              new RegExp(`export\\s+type\\s*{[^}]*\\b${typeName}\\b[^}]*}`, 'g'),
              // export { TypeName } from './file';
              new RegExp(`export\\s*{[^}]*\\b${typeName}\\b[^}]*}\\s*from`, 'g'),
              // export { TypeName, ... } from './file';
              new RegExp(`export\\s*{[^}]*\\b${typeName}\\b[^}]*}`, 'g'),
            ];

            // 明示的なエクスポートをチェック
            const isExplicitlyExported = exportPatterns.some(pattern => pattern.test(content));
            if (isExplicitlyExported) {
              return true;
            }

            // export * from './file' の場合、そのファイルに型が定義されているかチェック
            const reExportPattern = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
            let reExportMatch;
            while ((reExportMatch = reExportPattern.exec(content)) !== null) {
              const importPath = reExportMatch[1];
              const resolvedPath = resolveImportPath(importPath, indexPath);

              if (resolvedPath && fs.existsSync(resolvedPath)) {
                try {
                  const reExportedContent = fs.readFileSync(resolvedPath, 'utf8');
                  const typeDefPattern = new RegExp(`export\\s+(interface|type|enum)\\s+${typeName}\\b`, 'g');
                  if (typeDefPattern.test(reExportedContent)) {
                    return true;
                  }
                } catch {
                  // ファイル読み込みエラーは無視
                }
              }
            }
          } catch {
            // ファイル読み込みエラーは無視して次のファイルをチェック
            continue;
          }
        }
      }

      return false;
    }

    // 型の使用箇所を検索
    function findTypeUsages(typeName) {
      const usages = [];
      const searchPattern = path.join(projectRoot, 'src/**/*.{ts,tsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          if (file === filename) return;

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

    // 自動修正の生成
    function generateExportTypeFix(node) {
      if (!autoFixEnabled) return null;

      return function(fixer) {
        if (node.type === 'ExportNamedDeclaration' && !node.exportKind) {
          return fixer.insertTextBefore(node.declaration, 'type ');
        }
        return null;
      };
    }

    function generateTypeImportFix(node) {
      if (!autoFixEnabled) return null;

      return function(fixer) {
        if (node.type === 'ImportDeclaration' && !node.importKind) {
          return fixer.insertTextAfter(node.source.range[0] - 1, 'type ');
        }
        return null;
      };
    }

    return {
      // エクスポート文のチェック
      ExportNamedDeclaration(node) {
        if (!isTypeFile(filename)) return;

        // 型定義のエクスポートでtype修飾子が使用されているかチェック
        if (enforceTypeExports && node.declaration) {
          const isTypeDeclaration =
            node.declaration.type === 'TSInterfaceDeclaration' ||
            node.declaration.type === 'TSTypeAliasDeclaration' ||
            node.declaration.type === 'TSEnumDeclaration';

          if (isTypeDeclaration && node.exportKind !== 'type') {
            const typeName = node.declaration.id.name;

            context.report({
              node,
              messageId: 'missingTypeExport',
              data: { typeName },
              fix: generateExportTypeFix(node),
            });
          }
        }

        // re-exportの場合のチェック
        if (node.source && node.specifiers) {
          node.specifiers.forEach(specifier => {
            if (specifier.type === 'ExportSpecifier' && node.exportKind !== 'type') {
              context.report({
                node: specifier,
                messageId: 'inconsistentExport',
                fix: autoFixEnabled ? function(fixer) {
                  return fixer.insertTextBefore(node, 'export type ');
                } : null,
              });
            }
          });
        }
      },

      // インポート文のチェック
      ImportDeclaration(node) {
        if (!enforceTypeImports) return;

        // 型専用インポートのチェック
        if (node.specifiers && node.specifiers.length > 0) {
          const hasTypeSpecifiers = node.specifiers.some(spec =>
            spec.type === 'ImportSpecifier' && spec.importKind === 'type'
          );

          if (hasTypeSpecifiers && node.importKind !== 'type') {
            context.report({
              node,
              messageId: 'missingTypeImport',
              data: {
                typeName: node.specifiers.map(s => s.imported?.name || s.local.name).join(', ')
              },
              fix: generateTypeImportFix(node),
            });
          }
        }

        // 直接インポートのチェック
        const importPath = node.source.value;
        if (importPath.includes('/types/') && !importPath.startsWith('@/types')) {
          const allowedPaths = allowDirectImports.some(allowed =>
            importPath.includes(allowed)
          );

          if (!allowedPaths) {
            const unifiedPath = getUnifiedExportPath('', filename);

            context.report({
              node,
              messageId: 'directTypeImport',
              data: {
                typeName: node.specifiers.map(s => s.imported?.name || s.local.name).join(', '),
                unifiedPath,
              },
              fix: autoFixEnabled ? function(fixer) {
                return fixer.replaceText(node.source, `'${unifiedPath}'`);
              } : null,
            });
          }
        }
      },

      // 型定義宣言のチェック
      TSInterfaceDeclaration(node) {
        if (!isTypeFile(filename) || isIndexFile(filename)) return;

        const typeName = node.id.name;

        // index.tsでのエクスポートチェック
        if (enforceIndexExports && !isExportedInIndex(typeName, filename)) {
          context.report({
            node: node.id,
            messageId: 'missingIndexExport',
            data: { typeName },
          });
        }

        // 使用されていない型定義のチェック
        const usages = findTypeUsages(typeName);
        if (usages.length === 0) {
          context.report({
            node: node.id,
            messageId: 'unusedTypeDefinition',
            data: { typeName },
          });
        }
      },

      // 型エイリアス宣言のチェック
      TSTypeAliasDeclaration(node) {
        if (!isTypeFile(filename) || isIndexFile(filename)) return;

        const typeName = node.id.name;

        // index.tsでのエクスポートチェック
        if (enforceIndexExports && !isExportedInIndex(typeName, filename)) {
          context.report({
            node: node.id,
            messageId: 'missingIndexExport',
            data: { typeName },
          });
        }

        // 使用されていない型定義のチェック
        const usages = findTypeUsages(typeName);
        if (usages.length === 0) {
          context.report({
            node: node.id,
            messageId: 'unusedTypeDefinition',
            data: { typeName },
          });
        }
      },

      // 列挙型宣言のチェック
      TSEnumDeclaration(node) {
        if (!isTypeFile(filename) || isIndexFile(filename)) return;

        const typeName = node.id.name;

        // index.tsでのエクスポートチェック
        if (enforceIndexExports && !isExportedInIndex(typeName, filename)) {
          context.report({
            node: node.id,
            messageId: 'missingIndexExport',
            data: { typeName },
          });
        }

        // 使用されていない型定義のチェック
        const usages = findTypeUsages(typeName);
        if (usages.length === 0) {
          context.report({
            node: node.id,
            messageId: 'unusedTypeDefinition',
            data: { typeName },
          });
        }
      },
    };
  },
};
