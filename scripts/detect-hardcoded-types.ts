#!/usr/bin/env tsx

/**
 * 🔍 型ハードコード検出スクリプト
 *
 * 目的:
 * - any型の使用箇所を検出
 * - 型アサーション（as any等）の検出
 * - @ts-ignore コメントの検出
 * - インライン型定義の検出
 */

import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

interface DetectionResult {
  file: string;
  line: number;
  column: number;
  type: 'any-type' | 'type-assertion' | 'ts-ignore' | 'inline-type';
  content: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
}

class TypeHardcodeDetector {
  private results: DetectionResult[] = [];
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * フロントエンド全体をスキャン
   */
  async scanFrontend(): Promise<DetectionResult[]> {
    const pattern = path.join(this.projectRoot, 'apps/frontend/src/**/*.{ts,tsx}');
    const files = glob.globSync(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    });

    console.log(`🔍 スキャン対象ファイル数: ${files.length}`);

    for (const file of files) {
      await this.scanFile(file);
    }

    return this.results;
  }

  /**
   * 個別ファイルをスキャン
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relativePath = path.relative(this.projectRoot, filePath);

      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // any型の検出
        this.detectAnyType(relativePath, lineNumber, line);

        // 型アサーションの検出
        this.detectTypeAssertion(relativePath, lineNumber, line);

        // @ts-ignoreの検出
        this.detectTsIgnore(relativePath, lineNumber, line);

        // インライン型定義の検出
        this.detectInlineType(relativePath, lineNumber, line);
      });
    } catch (error) {
      console.warn(`⚠️ ファイル読み込みエラー: ${filePath}`, error);
    }
  }

  /**
   * any型の使用を検出
   */
  private detectAnyType(file: string, line: number, content: string): void {
    const anyPatterns = [
      /:\s*any\b/g, // : any
      /<any>/g, // <unknown>
      /\(.*any.*\)/g, // (any)
      /Array<unknown>/g, // Array<unknown>
      /Promise<unknown>/g, // Promise<unknown>
      /Record<.*,\s*any>/g, // Record<string, unknown>
    ];

    anyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        this.results.push({
          file,
          line,
          column: match.index,
          type: 'any-type',
          content: content.trim(),
          severity: this.getAnyTypeSeverity(content),
          suggestion: this.getAnyTypeSuggestion(content),
        });
      }
    });
  }

  /**
   * 型アサーションを検出
   */
  private detectTypeAssertion(file: string, line: number, content: string): void {
    const assertionPatterns = [
      /as\s+any\b/g, // as unknown
      /as\s+unknown/g, // as unknown
      /<unknown>/g, // <unknown>
      /!\s*as\s+/g, // ! as (non-null assertion with type assertion)
    ];

    assertionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        this.results.push({
          file,
          line,
          column: match.index,
          type: 'type-assertion',
          content: content.trim(),
          severity: 'high',
          suggestion: '具体的な型を定義してください',
        });
      }
    });
  }

  /**
   * @ts-ignoreコメントを検出
   */
  private detectTsIgnore(file: string, line: number, content: string): void {
    const ignorePatterns = [/@ts-ignore/g, /@ts-expect-error/g, /@ts-nocheck/g];

    ignorePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        this.results.push({
          file,
          line,
          column: match.index,
          type: 'ts-ignore',
          content: content.trim(),
          severity: 'medium',
          suggestion: '型エラーの根本原因を解決してください',
        });
      }
    });
  }

  /**
   * インライン型定義を検出
   */
  private detectInlineType(file: string, line: number, content: string): void {
    // 複雑なインライン型定義のパターン
    const inlinePatterns = [
      /:\s*\{[^}]{50,}\}/g, // 長いオブジェクト型
      /:\s*\([^)]{30,}\)\s*=>/g, // 長い関数型
      /\|\s*\{[^}]+\}\s*\|/g, // Union型内のオブジェクト型
    ];

    inlinePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // 型定義ファイル内は除外
        if (!file.includes('/types/')) {
          this.results.push({
            file,
            line,
            column: match.index,
            type: 'inline-type',
            content: content.trim(),
            severity: 'low',
            suggestion: '型定義ファイルに移動してください',
          });
        }
      }
    });
  }

  /**
   * any型の重要度を判定
   */
  private getAnyTypeSeverity(content: string): 'high' | 'medium' | 'low' {
    if (content.includes('password') || content.includes('token') || content.includes('auth')) {
      return 'high';
    }
    if (content.includes('api') || content.includes('response') || content.includes('request')) {
      return 'high';
    }
    if (content.includes('form') || content.includes('input') || content.includes('data')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * any型の修正提案を生成
   */
  private getAnyTypeSuggestion(content: string): string {
    if (content.includes('event')) {
      return 'React.MouseEvent, React.ChangeEvent等の具体的なイベント型を使用';
    }
    if (content.includes('props')) {
      return 'インターフェースでprops型を定義';
    }
    if (content.includes('response') || content.includes('data')) {
      return '@libark/graphql-clientの型を使用';
    }
    if (content.includes('form')) {
      return 'React Hook Formの型を使用';
    }
    return '具体的な型を定義してください';
  }

  /**
   * 結果をレポート形式で出力
   */
  generateReport(): string {
    const summary = this.generateSummary();
    const details = this.generateDetails();

    return `# 🔍 型ハードコード検出レポート

${summary}

${details}

---
*検出日時: ${new Date().toLocaleString('ja-JP')}*
`;
  }

  /**
   * サマリーを生成
   */
  private generateSummary(): string {
    const total = this.results.length;
    const byType = this.groupBy(this.results, 'type');
    const bySeverity = this.groupBy(this.results, 'severity');

    return `## 📊 検出サマリー

**総検出数**: ${total}件

### 種類別
- any型使用: ${byType['any-type']?.length || 0}件
- 型アサーション: ${byType['type-assertion']?.length || 0}件
- @ts-ignore: ${byType['ts-ignore']?.length || 0}件
- インライン型定義: ${byType['inline-type']?.length || 0}件

### 重要度別
- 高: ${bySeverity['high']?.length || 0}件
- 中: ${bySeverity['medium']?.length || 0}件
- 低: ${bySeverity['low']?.length || 0}件`;
  }

  /**
   * 詳細を生成
   */
  private generateDetails(): string {
    const byFile = this.groupBy(this.results, 'file');

    let details = '## 📋 詳細結果\n\n';

    Object.entries(byFile).forEach(([file, results]) => {
      details += `### ${file}\n`;
      results.forEach(result => {
        const icon = this.getTypeIcon(result.type);
        const severityBadge = this.getSeverityBadge(result.severity);
        details += `- ${icon} **L${result.line}**: ${result.content.substring(0, 80)}... ${severityBadge}\n`;
        if (result.suggestion) {
          details += `  💡 *${result.suggestion}*\n`;
        }
      });
      details += '\n';
    });

    return details;
  }

  private getTypeIcon(type: string): string {
    const icons = {
      'any-type': '🔴',
      'type-assertion': '🟡',
      'ts-ignore': '🟠',
      'inline-type': '🔵',
    };
    return icons[type] || '⚪';
  }

  private getSeverityBadge(severity: string): string {
    const badges = {
      high: '🚨',
      medium: '⚠️',
      low: 'ℹ️',
    };
    return badges[severity] || '';
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }
}

// メイン実行
async function main() {
  const projectRoot = process.cwd();
  const detector = new TypeHardcodeDetector(projectRoot);

  console.log('🚀 型ハードコード検出を開始...');

  const results = await detector.scanFrontend();
  const report = detector.generateReport();

  // レポートをファイルに保存
  const reportPath = path.join(projectRoot, 'apps/frontend/type-hardcode-detection-report.md');
  fs.writeFileSync(reportPath, report, 'utf8');

  console.log(`✅ 検出完了: ${results.length}件の問題を発見`);
  console.log(`📄 レポート保存: ${reportPath}`);
}

// ESM環境での実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TypeHardcodeDetector };
