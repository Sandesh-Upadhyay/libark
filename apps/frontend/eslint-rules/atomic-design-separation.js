/**
 * ESLint Custom Rule: Atomic Design責任分離の強制
 *
 * 目的:
 * - AtomsでのスタイリングコードをWarningで検出
 * - OrganismsでのスタイルレスコードをWarningで検出
 * - 責任分離の一貫性を保証
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Atomic Design responsibility separation',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      // Atoms
      atomsNoStyling: 'Atoms should not contain styling. Move styles to Organisms. Found: {{code}}',
      atomsNoClassNames: 'Atoms should not use className props with styling. Use pure structure only.',
      atomsNoCva: 'Atoms should not define CVA variants. Move to Organisms.',
      atomsTailwindClasses: 'Atoms should not contain Tailwind classes. Found: {{classes}}',

      // Molecules
      moleculesMinimalStyling: 'Molecules should only contain minimal layout. Complex styling belongs in Organisms. Found: {{classes}}',
      moleculesNoComplexVariants: 'Molecules should not define complex variants. Move to Organisms.',

      // Templates
      templatesNoStyling: 'Templates should only define page structure. No styling allowed. Found: {{classes}}',
      templatesNoVariants: 'Templates should not define style variants. Move to Organisms.',

      // Import/Export
      wrongImportLevel: 'Invalid import: {{from}} cannot import from {{to}}. Check Atomic Design hierarchy.',
      circularDependency: 'Circular dependency detected between {{file1}} and {{file2}}.',

      // File naming
      wrongFileName: 'File name {{fileName}} does not follow Atomic Design conventions for {{level}}.',

      // Organisms
      organismsNeedStyling: 'Organisms should manage styling. Consider adding unified style definitions.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    const isAtom = filename.includes('/atoms/') && !filename.includes('index.ts');
    const isMolecule = filename.includes('/molecules/') && !filename.includes('index.ts');
    const isOrganism = filename.includes('/organisms/') && !filename.includes('index.ts');
    const isTemplate = filename.includes('/templates/') && !filename.includes('index.ts');

    // Tailwindクラスの検出パターン
    const basicTailwindPattern = /\b(bg-|text-|p-|m-|w-|h-|flex|grid|border|rounded|shadow|hover:|focus:|transition|duration|ease|opacity|transform|scale|rotate|translate)/;

    // 複雑なスタイリングパターン（Moleculesで禁止）
    const complexStylingPattern = /\b(bg-gradient|shadow-lg|shadow-xl|transform|scale|rotate|skew|backdrop|filter|blur|brightness|contrast|saturate|sepia|hue-rotate)/;

    // ファイル名規則チェック
    const checkFileName = (level) => {
      const baseName = filename.split('/').pop().replace(/\.(ts|tsx)$/, '');
      const conventions = {
        atoms: /^[A-Z][a-zA-Z]*$/, // PascalCase
        molecules: /^[A-Z][a-zA-Z]*$/, // PascalCase
        organisms: /^[A-Z][a-zA-Z]*$/, // PascalCase
        templates: /^[A-Z][a-zA-Z]*Template$/, // PascalCase + Template suffix
      };

      if (conventions[level] && !conventions[level].test(baseName)) {
        return baseName;
      }
      return null;
    };

    return {
      // ファイル名規則チェック
      Program(node) {
        if (isAtom) {
          const wrongName = checkFileName('atoms');
          if (wrongName) {
            context.report({
              node,
              messageId: 'wrongFileName',
              data: { fileName: wrongName, level: 'Atoms' },
            });
          }
        }

        if (isTemplate) {
          const wrongName = checkFileName('templates');
          if (wrongName) {
            context.report({
              node,
              messageId: 'wrongFileName',
              data: { fileName: wrongName, level: 'Templates' },
            });
          }
        }
      },

      // CVA使用の検出
      ImportDeclaration(node) {
        if ((isAtom || isTemplate) && node.source.value === 'class-variance-authority') {
          context.report({
            node,
            messageId: isAtom ? 'atomsNoCva' : 'templatesNoVariants',
          });
        }

        // Import階層チェック
        const importPath = node.source.value;
        if (importPath.startsWith('@/components/')) {
          const importLevel = importPath.split('/')[2]; // atoms, molecules, organisms, templates
          const currentLevel = isAtom ? 'atoms' : isMolecule ? 'molecules' : isOrganism ? 'organisms' : 'templates';

          // 階層ルール: atoms < molecules < organisms < templates
          const hierarchy = ['atoms', 'molecules', 'organisms', 'templates'];
          const currentIndex = hierarchy.indexOf(currentLevel);
          const importIndex = hierarchy.indexOf(importLevel);

          if (importIndex > currentIndex) {
            context.report({
              node,
              messageId: 'wrongImportLevel',
              data: { from: currentLevel, to: importLevel },
            });
          }
        }
      },

      // cn()関数の使用検出
      CallExpression(node) {
        if (isAtom && node.callee.name === 'cn') {
          // 引数をチェックしてTailwindクラスがあるか確認
          const args = node.arguments;
          args.forEach(arg => {
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              if (basicTailwindPattern.test(arg.value)) {
                context.report({
                  node,
                  messageId: 'atomsTailwindClasses',
                  data: { classes: arg.value },
                });
              }
            }
          });
        }

        // Molecules: 複雑なスタイリングをチェック
        if (isMolecule && node.callee.name === 'cn') {
          const args = node.arguments;
          args.forEach(arg => {
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              if (complexStylingPattern.test(arg.value)) {
                context.report({
                  node,
                  messageId: 'moleculesMinimalStyling',
                  data: { classes: arg.value },
                });
              }
            }
          });
        }

        // Templates: 全てのスタイリングを禁止
        if (isTemplate && node.callee.name === 'cn') {
          const args = node.arguments;
          args.forEach(arg => {
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              if (basicTailwindPattern.test(arg.value)) {
                context.report({
                  node,
                  messageId: 'templatesNoStyling',
                  data: { classes: arg.value },
                });
              }
            }
          });
        }
      },

      // 文字列リテラルでのTailwindクラス検出
      Literal(node) {
        if (typeof node.value === 'string') {
          const parent = node.parent;
          if (parent && parent.type === 'JSXExpressionContainer') {
            const jsxParent = parent.parent;
            if (jsxParent && jsxParent.type === 'JSXAttribute' && jsxParent.name.name === 'className') {

              // Atoms: 全てのTailwindクラスを禁止
              if (isAtom && basicTailwindPattern.test(node.value)) {
                context.report({
                  node,
                  messageId: 'atomsTailwindClasses',
                  data: { classes: node.value },
                });
              }

              // Molecules: 複雑なスタイリングを禁止
              if (isMolecule && complexStylingPattern.test(node.value)) {
                context.report({
                  node,
                  messageId: 'moleculesMinimalStyling',
                  data: { classes: node.value },
                });
              }

              // Templates: 全てのスタイリングを禁止
              if (isTemplate && basicTailwindPattern.test(node.value)) {
                context.report({
                  node,
                  messageId: 'templatesNoStyling',
                  data: { classes: node.value },
                });
              }
            }
          }
        }
      },

      // テンプレートリテラルでのTailwindクラス検出
      TemplateLiteral(node) {
        if (isAtom) {
          const templateValue = node.quasis.map(q => q.value.raw).join('');
          if (basicTailwindPattern.test(templateValue)) {
            context.report({
              node,
              messageId: 'atomsTailwindClasses',
              data: { classes: templateValue },
            });
          }
        }
      },

      // CVA関数呼び出しの検出
      VariableDeclarator(node) {
        if (isAtom && node.init && node.init.type === 'CallExpression') {
          if (node.init.callee.name === 'cva') {
            context.report({
              node,
              messageId: 'atomsNoCva',
            });
          }
        }
      },

      // プロパティでのclassName使用検出
      Property(node) {
        if (isAtom && node.key.name === 'className' && node.value.type === 'Literal') {
          if (typeof node.value.value === 'string' && basicTailwindPattern.test(node.value.value)) {
            context.report({
              node,
              messageId: 'atomsNoClassNames',
            });
          }
        }
      },

      // JSX属性でのclassName使用検出
      JSXAttribute(node) {
        if (isAtom && node.name.name === 'className') {
          if (node.value && node.value.type === 'Literal') {
            if (basicTailwindPattern.test(node.value.value)) {
              context.report({
                node,
                messageId: 'atomsNoClassNames',
              });
            }
          }
        }
      },
    };
  },
};
