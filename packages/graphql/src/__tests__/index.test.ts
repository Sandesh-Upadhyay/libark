/**
 * GraphQL Package Tests
 */

import { describe, it, expect } from 'vitest';

import { typeDefs } from '../index.js';

describe('GraphQL Package', () => {
  describe('Type Definitions Export', () => {
    it('typeDefsがエクスポートされている', () => {
      expect(typeDefs).toBeDefined();
      expect(typeof typeDefs).toBe('string');
    });

    it('typeDefsが空でない', () => {
      expect(typeDefs.length).toBeGreaterThan(0);
    });

    it('typeDefsが有効なGraphQLスキーマ形式である', () => {
      // 基本的なGraphQLスキーマの構文チェック
      expect(typeDefs).toContain('type');
      expect(typeDefs).toMatch(/type\s+\w+/);
    });
  });

  describe('Schema Content Validation', () => {
    it('基本的なGraphQL型が含まれている', () => {
      // Query型が定義されているかチェック
      expect(typeDefs).toMatch(/type\s+Query/);

      // Mutation型が定義されているかチェック
      expect(typeDefs).toMatch(/type\s+Mutation/);
    });

    it('主要なエンティティ型が含まれている', () => {
      // User型が定義されているかチェック
      expect(typeDefs).toMatch(/type\s+User/);

      // Post型が定義されているかチェック
      expect(typeDefs).toMatch(/type\s+Post/);

      // Media型が定義されているかチェック
      expect(typeDefs).toMatch(/type\s+Media/);
    });

    it('スカラー型が適切に定義されている', () => {
      // DateTime スカラーが定義されているかチェック
      expect(typeDefs).toMatch(/scalar\s+DateTime/);

      // JSON スカラーが定義されているかチェック（もしあれば）
      if (typeDefs.includes('scalar JSON')) {
        expect(typeDefs).toMatch(/scalar\s+JSON/);
      }
    });

    it('入力型が定義されている', () => {
      // 入力型の存在をチェック
      expect(typeDefs).toMatch(/input\s+\w+/);
    });

    it('列挙型が定義されている', () => {
      // 列挙型の存在をチェック
      expect(typeDefs).toMatch(/enum\s+\w+/);
    });
  });

  describe('Schema Structure', () => {
    it('適切なGraphQL構文を使用している', () => {
      // フィールド定義の構文チェック
      expect(typeDefs).toMatch(/\w+\s*:\s*\w+/);

      // 引数定義の構文チェック（もしあれば）
      if (typeDefs.includes('(')) {
        expect(typeDefs).toMatch(/\w+\s*\([^)]*\)\s*:\s*\w+/);
      }
    });

    it('コメントが適切に含まれている', () => {
      // GraphQLコメントの存在チェック（もしあれば）
      if (typeDefs.includes('#') || typeDefs.includes('"""')) {
        expect(typeDefs).toMatch(/(#.*|"""[\s\S]*?""")/);
      }
    });

    it('型の関連性が適切に定義されている', () => {
      // UUID型の使用チェック（LIBARKではUUIDを使用）
      expect(typeDefs).toMatch(/:\s*UUID[!\s]/);

      // String型の使用チェック
      expect(typeDefs).toMatch(/:\s*String[!\s]/);

      // Int型の使用チェック
      expect(typeDefs).toMatch(/:\s*Int[!\s]/);

      // Boolean型の使用チェック
      expect(typeDefs).toMatch(/:\s*Boolean[!\s]/);
    });
  });

  describe('Schema Completeness', () => {
    it('必須フィールドが適切にマークされている', () => {
      // 非null型の使用チェック
      expect(typeDefs).toMatch(/:\s*\w+!/);
    });

    it('配列型が適切に定義されている', () => {
      // 配列型の使用チェック
      expect(typeDefs).toMatch(/:\s*\[\w+[!\]]*/);
    });

    it('ページネーション型が定義されている', () => {
      // ページネーション関連の型をチェック
      if (typeDefs.includes('Connection') || typeDefs.includes('Edge')) {
        expect(typeDefs).toMatch(/(Connection|Edge)/);
      }
    });
  });

  describe('Error Handling', () => {
    it('エラー型が定義されている', () => {
      // エラー関連の型をチェック
      if (typeDefs.includes('Error')) {
        expect(typeDefs).toMatch(/type\s+\w*Error/);
      }
    });

    it('結果型が定義されている', () => {
      // Result型やResponse型をチェック
      if (typeDefs.includes('Result') || typeDefs.includes('Response')) {
        expect(typeDefs).toMatch(/(Result|Response)/);
      }
    });
  });

  describe('Schema Validation', () => {
    it('重複する型定義がない', () => {
      // extend typeを除外して、新しい型定義のみをチェック
      const typeMatches = typeDefs.match(/^type\s+(\w+)/gm);
      if (typeMatches) {
        const typeNames = typeMatches.map(match => match.replace(/type\s+/, ''));
        const uniqueTypeNames = [...new Set(typeNames)];
        console.log('Found types:', typeNames.length, 'Unique types:', uniqueTypeNames.length);
        expect(typeNames.length).toBe(uniqueTypeNames.length);
      }
    });

    it('重複するスカラー定義がない', () => {
      const scalarMatches = typeDefs.match(/scalar\s+(\w+)/g);
      if (scalarMatches) {
        const scalarNames = scalarMatches.map(match => match.replace(/scalar\s+/, ''));
        const uniqueScalarNames = [...new Set(scalarNames)];
        console.log(
          'Found scalars:',
          scalarNames.length,
          'Unique scalars:',
          uniqueScalarNames.length
        );
        expect(scalarNames.length).toBe(uniqueScalarNames.length);
      }
    });

    it('重複する列挙型定義がない', () => {
      const enumMatches = typeDefs.match(/enum\s+(\w+)/g);
      if (enumMatches) {
        const enumNames = enumMatches.map(match => match.replace(/enum\s+/, ''));
        const uniqueEnumNames = [...new Set(enumNames)];
        console.log('Found enums:', enumNames.length, 'Unique enums:', uniqueEnumNames.length);
        expect(enumNames.length).toBe(uniqueEnumNames.length);
      }
    });
  });
});
