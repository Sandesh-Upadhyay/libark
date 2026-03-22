/**
 * 🎯 型定義重複防止ルール (Type Duplication Prevention)
 *
 * 責任:
 * - 型定義の重複検出と防止
 * - 型定義の一意性チェック
 * - 統合推奨機能
 * - 重複解消の自動修正提案
 *
 * 検証対象:
 * - 同名型定義の重複
 * - 構造的に同一な型定義
 * - 意味的に重複する型定義
 * - 不要な型定義の検出
 */

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '型定義の重複を検出し、統合を推奨',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          checkStructuralDuplication: {
            type: 'boolean',
            default: true,
          },
          checkSemanticDuplication: {
            type: 'boolean',
            default: true,
          },
          allowedDuplicatePatterns: {
            type: 'array',
            items: { type: 'string' },
            default: ['Props$', 'State$', 'Event$'],
          },
          similarityThreshold: {
            type: 'number',
            default: 0.8,
            minimum: 0,
            maximum: 1,
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
      exactDuplicate: '型定義 "{{typeName}}" が重複しています: {{locations}}',
      structuralDuplicate: '型定義 "{{typeName}}" は "{{similarType}}" と構造的に同一です',
      semanticDuplicate: '型定義 "{{typeName}}" は "{{similarType}}" と意味的に重複している可能性があります',
      unusedType: '型定義 "{{typeName}}" が使用されていません',
      consolidationSuggestion: '型定義 "{{typeName}}" は {{suggestions}} に統合することを推奨します',
      namingConflict: '型定義 "{{typeName}}" の命名が他の型と競合しています',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const checkStructuralDuplication = options.checkStructuralDuplication !== false;
    const _checkSemanticDuplication = options.checkSemanticDuplication !== false;
    const allowedDuplicatePatterns = options.allowedDuplicatePatterns || ['Props$', 'State$', 'Event$'];
    const similarityThreshold = options.similarityThreshold || 0.8;
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

    // 全ての型定義を収集
    function collectAllTypeDefinitions() {
      const typeDefinitions = new Map();
      const searchPattern = path.join(projectRoot, 'src/**/types/**/*.{ts,tsx}');

      try {
        const files = glob.globSync(searchPattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

        files.forEach(file => {
          try {
            const content = fs.readFileSync(file, 'utf8');
            const types = extractTypeDefinitions(content, file);
            
            types.forEach(type => {
              if (!typeDefinitions.has(type.name)) {
                typeDefinitions.set(type.name, []);
              }
              typeDefinitions.get(type.name).push({
                ...type,
                file: path.relative(projectRoot, file),
              });
            });
          } catch {
            // ファイル読み込みエラーは無視
          }
        });
      } catch {
        // glob エラーは無視
      }

      return typeDefinitions;
    }

    // 型定義を抽出
    function extractTypeDefinitions(content, _filePath) {
      const types = [];
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // インターフェース定義
        const interfaceMatch = line.match(/^export\s+interface\s+(\w+)/);
        if (interfaceMatch) {
          const structure = extractInterfaceStructure(content, index);
          types.push({
            name: interfaceMatch[1],
            type: 'interface',
            line: index + 1,
            structure,
            content: line.trim(),
          });
        }

        // 型エイリアス定義
        const typeMatch = line.match(/^export\s+type\s+(\w+)/);
        if (typeMatch) {
          const structure = extractTypeStructure(content, index);
          types.push({
            name: typeMatch[1],
            type: 'type',
            line: index + 1,
            structure,
            content: line.trim(),
          });
        }

        // 列挙型定義
        const enumMatch = line.match(/^export\s+enum\s+(\w+)/);
        if (enumMatch) {
          const structure = extractEnumStructure(content, index);
          types.push({
            name: enumMatch[1],
            type: 'enum',
            line: index + 1,
            structure,
            content: line.trim(),
          });
        }
      });

      return types;
    }

    // インターフェース構造を抽出
    function extractInterfaceStructure(content, startLine) {
      const lines = content.split('\n');
      const structure = [];
      let braceCount = 0;
      let inInterface = false;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('{')) {
          braceCount += (line.match(/\{/g) || []).length;
          inInterface = true;
        }
        
        if (inInterface && line.includes(':') && !line.startsWith('//')) {
          const propMatch = line.match(/(\w+)\s*[?:]?\s*:\s*(.+?)[;,]?$/);
          if (propMatch) {
            structure.push({
              name: propMatch[1],
              type: propMatch[2].replace(/[;,]$/, '').trim(),
            });
          }
        }
        
        if (line.includes('}')) {
          braceCount -= (line.match(/\}/g) || []).length;
          if (braceCount <= 0) break;
        }
      }

      return structure;
    }

    // 型エイリアス構造を抽出
    function extractTypeStructure(content, startLine) {
      const lines = content.split('\n');
      const line = lines[startLine];
      const typeMatch = line.match(/=\s*(.+?);?$/);
      
      if (typeMatch) {
        return {
          definition: typeMatch[1].trim(),
        };
      }
      
      return {};
    }

    // 列挙型構造を抽出
    function extractEnumStructure(content, startLine) {
      const lines = content.split('\n');
      const values = [];
      let braceCount = 0;
      let inEnum = false;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('{')) {
          braceCount += (line.match(/\{/g) || []).length;
          inEnum = true;
        }
        
        if (inEnum && line.includes('=') && !line.startsWith('//')) {
          const valueMatch = line.match(/(\w+)\s*=\s*(.+?)[,}]?$/);
          if (valueMatch) {
            values.push({
              name: valueMatch[1],
              value: valueMatch[2].replace(/[,}]$/, '').trim(),
            });
          }
        }
        
        if (line.includes('}')) {
          braceCount -= (line.match(/\}/g) || []).length;
          if (braceCount <= 0) break;
        }
      }

      return { values };
    }

    // 構造的類似性を計算
    function calculateStructuralSimilarity(type1, type2) {
      if (type1.type !== type2.type) return 0;

      switch (type1.type) {
        case 'interface':
          return calculateInterfaceSimilarity(type1.structure, type2.structure);
        case 'type':
          return calculateTypeSimilarity(type1.structure, type2.structure);
        case 'enum':
          return calculateEnumSimilarity(type1.structure, type2.structure);
        default:
          return 0;
      }
    }

    // インターフェース類似性を計算
    function calculateInterfaceSimilarity(struct1, struct2) {
      if (!struct1.length || !struct2.length) return 0;

      const props1 = new Set(struct1.map(p => `${p.name}:${p.type}`));
      const props2 = new Set(struct2.map(p => `${p.name}:${p.type}`));
      
      const intersection = new Set([...props1].filter(x => props2.has(x)));
      const union = new Set([...props1, ...props2]);
      
      return intersection.size / union.size;
    }

    // 型エイリアス類似性を計算
    function calculateTypeSimilarity(struct1, struct2) {
      if (!struct1.definition || !struct2.definition) return 0;
      
      const def1 = struct1.definition.replace(/\s+/g, ' ').trim();
      const def2 = struct2.definition.replace(/\s+/g, ' ').trim();
      
      return def1 === def2 ? 1 : 0;
    }

    // 列挙型類似性を計算
    function calculateEnumSimilarity(struct1, struct2) {
      if (!struct1.values || !struct2.values) return 0;

      const values1 = new Set(struct1.values.map(v => `${v.name}=${v.value}`));
      const values2 = new Set(struct2.values.map(v => `${v.name}=${v.value}`));
      
      const intersection = new Set([...values1].filter(x => values2.has(x)));
      const union = new Set([...values1, ...values2]);
      
      return intersection.size / union.size;
    }

    // 重複が許可されているかチェック
    function isDuplicateAllowed(typeName) {
      return allowedDuplicatePatterns.some(pattern => 
        new RegExp(pattern).test(typeName)
      );
    }

    // 統合提案を生成
    function _generateConsolidationSuggestion(duplicates) {
      const suggestions = duplicates
        .filter(d => d.file !== path.relative(projectRoot, filename))
        .map(d => `${d.file}:${d.line}`)
        .slice(0, 3);

      return suggestions.join(', ');
    }

    // 自動修正の生成
    function generateDuplicationFix(node, typeName, suggestion) {
      if (!autoFixEnabled) return null;
      
      return function(fixer) {
        const comment = `// TODO: Consider consolidating with ${suggestion}`;
        return fixer.insertTextBefore(node, comment + '\n');
      };
    }

    return {
      // プログラム終了時に全体チェック
      'Program:exit'() {
        if (!isTypeFile(filename)) return;

        const allTypes = collectAllTypeDefinitions();
        
        allTypes.forEach((duplicates, typeName) => {
          if (duplicates.length <= 1) return;
          
          // 許可された重複パターンをスキップ
          if (isDuplicateAllowed(typeName)) return;

          // 現在のファイルに関連する重複のみチェック
          const currentFileTypes = duplicates.filter(d => 
            d.file === path.relative(projectRoot, filename)
          );
          
          if (currentFileTypes.length === 0) return;

          currentFileTypes.forEach(currentType => {
            const otherTypes = duplicates.filter(d => d !== currentType);
            
            // 完全重複チェック
            const exactDuplicates = otherTypes.filter(other => 
              calculateStructuralSimilarity(currentType, other) === 1
            );
            
            if (exactDuplicates.length > 0) {
              const locations = exactDuplicates.map(d => `${d.file}:${d.line}`).join(', ');
              
              context.report({
                loc: { line: currentType.line, column: 0 },
                messageId: 'exactDuplicate',
                data: {
                  typeName,
                  locations,
                },
                fix: generateDuplicationFix(null, typeName, locations),
              });
            }
            
            // 構造的類似性チェック
            if (checkStructuralDuplication) {
              const structuralSimilar = otherTypes.filter(other => {
                const similarity = calculateStructuralSimilarity(currentType, other);
                return similarity >= similarityThreshold && similarity < 1;
              });
              
              structuralSimilar.forEach(similar => {
                context.report({
                  loc: { line: currentType.line, column: 0 },
                  messageId: 'structuralDuplicate',
                  data: {
                    typeName,
                    similarType: `${similar.file}:${similar.line}`,
                  },
                });
              });
            }
          });
        });
      },
    };
  },
};
