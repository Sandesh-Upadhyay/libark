/**
 * 🎯 型定義命名規則ルール (Type Naming Conventions)
 *
 * 責任:
 * - 型定義の命名規則の強制
 * - 一貫性のある命名パターンの確保
 * - 自動修正による命名の統一
 *
 * 検証対象:
 * - インターフェース命名（PascalCase）
 * - 型エイリアス命名（PascalCase）
 * - Props型の命名（ComponentNameProps）
 * - State型の命名（ComponentNameState）
 * - Event型の命名（ComponentNameEvent）
 * - Enum命名（PascalCase）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '型定義の命名規則を強制し、一貫性を確保',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          interfacePattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*$',
          },
          typePattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*$',
          },
          enumPattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*$',
          },
          propsPattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*Props$',
          },
          statePattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*State$',
          },
          eventPattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*Event$',
          },
          variantPattern: {
            type: 'string',
            default: '^[A-Z][a-zA-Z0-9]*Variant$',
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
      invalidInterfaceName: 'インターフェース "{{name}}" の命名が規則に従っていません。PascalCaseを使用してください',
      invalidTypeName: '型エイリアス "{{name}}" の命名が規則に従っていません。PascalCaseを使用してください',
      invalidEnumName: '列挙型 "{{name}}" の命名が規則に従っていません。PascalCaseを使用してください',
      invalidPropsName: 'Props型 "{{name}}" は "{{suggestion}}" という命名を推奨します',
      invalidStateName: 'State型 "{{name}}" は "{{suggestion}}" という命名を推奨します',
      invalidEventName: 'Event型 "{{name}}" は "{{suggestion}}" という命名を推奨します',
      invalidVariantName: 'Variant型 "{{name}}" は "{{suggestion}}" という命名を推奨します',
      inconsistentNaming: '型定義 "{{name}}" の命名が一貫していません。{{suggestion}} を推奨します',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const interfacePattern = new RegExp(options.interfacePattern || '^[A-Z][a-zA-Z0-9]*$');
    const typePattern = new RegExp(options.typePattern || '^[A-Z][a-zA-Z0-9]*$');
    const enumPattern = new RegExp(options.enumPattern || '^[A-Z][a-zA-Z0-9]*$');
    const propsPattern = new RegExp(options.propsPattern || '^[A-Z][a-zA-Z0-9]*Props$');
    const statePattern = new RegExp(options.statePattern || '^[A-Z][a-zA-Z0-9]*State$');
    const eventPattern = new RegExp(options.eventPattern || '^[A-Z][a-zA-Z0-9]*Event$');
    const variantPattern = new RegExp(options.variantPattern || '^[A-Z][a-zA-Z0-9]*Variant$');
    const autoFixEnabled = options.autoFixEnabled !== false;

    // PascalCaseに変換
    function toPascalCase(str) {
      return str.replace(/(?:^|[-_])(\w)/g, (_, char) => char.toUpperCase());
    }

    // 型の種類を判定
    function getTypeCategory(name, node) {
      if (name.endsWith('Props')) return 'props';
      if (name.endsWith('State')) return 'state';
      if (name.endsWith('Event')) return 'event';
      if (name.endsWith('Variant')) return 'variant';
      if (name.includes('Handler') || name.includes('Callback')) return 'event';
      
      // ファイルパスから推測
      const filename = context.getFilename();
      if (filename.includes('components') && node.type === 'TSInterfaceDeclaration') {
        // コンポーネント関連のインターフェースはProps型の可能性
        if (name.includes('Props') || filename.includes(name.replace('Props', ''))) {
          return 'props';
        }
      }
      
      return 'general';
    }

    // 推奨名を生成
    function generateSuggestion(name, category) {
      const baseName = name.replace(/(Props|State|Event|Variant)$/, '');
      const pascalBaseName = toPascalCase(baseName);
      
      switch (category) {
        case 'props':
          return `${pascalBaseName}Props`;
        case 'state':
          return `${pascalBaseName}State`;
        case 'event':
          return `${pascalBaseName}Event`;
        case 'variant':
          return `${pascalBaseName}Variant`;
        default:
          return toPascalCase(name);
      }
    }

    // 自動修正の生成
    function generateFix(node, suggestion) {
      if (!autoFixEnabled) return null;
      
      return function(fixer) {
        return fixer.replaceText(node.id, suggestion);
      };
    }

    return {
      // インターフェース定義のチェック
      TSInterfaceDeclaration(node) {
        const name = node.id.name;
        const category = getTypeCategory(name, node);
        
        let isValid = false;
        let messageId = 'invalidInterfaceName';
        const suggestion = generateSuggestion(name, category);

        switch (category) {
          case 'props':
            isValid = propsPattern.test(name);
            messageId = 'invalidPropsName';
            break;
          case 'state':
            isValid = statePattern.test(name);
            messageId = 'invalidStateName';
            break;
          case 'event':
            isValid = eventPattern.test(name);
            messageId = 'invalidEventName';
            break;
          case 'variant':
            isValid = variantPattern.test(name);
            messageId = 'invalidVariantName';
            break;
          default:
            isValid = interfacePattern.test(name);
            messageId = 'invalidInterfaceName';
        }

        if (!isValid) {
          context.report({
            node: node.id,
            messageId,
            data: {
              name,
              suggestion,
            },
            fix: generateFix(node, suggestion),
          });
        }
      },

      // 型エイリアス定義のチェック
      TSTypeAliasDeclaration(node) {
        const name = node.id.name;
        const category = getTypeCategory(name, node);
        
        let isValid = false;
        let messageId = 'invalidTypeName';
        const suggestion = generateSuggestion(name, category);

        switch (category) {
          case 'variant':
            isValid = variantPattern.test(name);
            messageId = 'invalidVariantName';
            break;
          case 'event':
            isValid = eventPattern.test(name);
            messageId = 'invalidEventName';
            break;
          default:
            isValid = typePattern.test(name);
            messageId = 'invalidTypeName';
        }

        if (!isValid) {
          context.report({
            node: node.id,
            messageId,
            data: {
              name,
              suggestion,
            },
            fix: generateFix(node, suggestion),
          });
        }
      },

      // 列挙型定義のチェック
      TSEnumDeclaration(node) {
        const name = node.id.name;
        
        if (!enumPattern.test(name)) {
          const suggestion = toPascalCase(name);
          
          context.report({
            node: node.id,
            messageId: 'invalidEnumName',
            data: {
              name,
              suggestion,
            },
            fix: generateFix(node, suggestion),
          });
        }
      },

      // 列挙型メンバーのチェック
      TSEnumMember(node) {
        if (node.id.type === 'Identifier') {
          const name = node.id.name;
          
          // 列挙型メンバーはUPPER_SNAKE_CASEを推奨
          const upperSnakePattern = /^[A-Z][A-Z0-9_]*$/;
          
          if (!upperSnakePattern.test(name)) {
            const suggestion = name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
            
            context.report({
              node: node.id,
              messageId: 'inconsistentNaming',
              data: {
                name,
                suggestion,
              },
              fix: autoFixEnabled ? function(fixer) {
                return fixer.replaceText(node.id, suggestion);
              } : null,
            });
          }
        }
      },
    };
  },
};
