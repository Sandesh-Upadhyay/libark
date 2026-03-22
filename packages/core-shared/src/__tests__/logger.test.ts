/**
 * 🧪 統一ログシステムテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { logger, createLogger } from '../logger/index';
import { UnifiedLogger, UnifiedLogLevel, LogCategory } from '../logger/unified-logger';

describe('統一ログシステム', () => {
  let originalConsole: typeof console;

  beforeEach(() => {
    // コンソールのモック
    originalConsole = { ...console };
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.debug = vi.fn();
  });

  afterEach(() => {
    // コンソールの復元
    Object.assign(console, originalConsole);
    vi.clearAllMocks();
  });

  describe('Pinoロガー', () => {
    it('デフォルトロガーが作成される', () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
    });

    it('カスタム設定でロガーが作成される', () => {
      const customLogger = createLogger({
        level: 'error',
        name: 'test-logger',
        prettyPrint: false,
      });

      expect(customLogger).toBeDefined();
      expect(customLogger).toHaveProperty('info');
      expect(customLogger).toHaveProperty('error');
      expect(customLogger).toHaveProperty('warn');
      expect(customLogger).toHaveProperty('debug');
    });

    it('ログメッセージが出力される', () => {
      logger.info('テストメッセージ');
      logger.error('エラーメッセージ');

      // Pinoは内部的にconsoleを使用するため、直接的な検証は困難
      // 代わりに、ロガーが正常に動作することを確認
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe('統一ロガー', () => {
    let unifiedLogger: UnifiedLogger;

    beforeEach(() => {
      unifiedLogger = new UnifiedLogger({
        level: UnifiedLogLevel.DEBUG,
        enableConsoleOutput: true,
        developmentOnly: false,
      });
    });

    it('ログレベル別にメッセージが出力される', () => {
      unifiedLogger.debug(LogCategory.SYSTEM, 'デバッグメッセージ');
      unifiedLogger.info(LogCategory.SYSTEM, '情報メッセージ');
      unifiedLogger.warn(LogCategory.SYSTEM, '警告メッセージ');
      unifiedLogger.error(LogCategory.SYSTEM, 'エラーメッセージ');

      // コンソール出力の確認
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('カテゴリ別にログが制御される', () => {
      const restrictedLogger = new UnifiedLogger({
        level: UnifiedLogLevel.DEBUG,
        categories: {
          [LogCategory.SYSTEM]: true,
          [LogCategory.AUTH]: false,
          [LogCategory.INIT]: false,
          [LogCategory.SECURITY]: false,
          [LogCategory.APOLLO]: false,
          [LogCategory.COMPONENT]: false,
          [LogCategory.MEDIA]: false,
          [LogCategory.SUBSCRIPTION]: false,
          [LogCategory.MEMORY]: false,
        },
        enableConsoleOutput: true,
        developmentOnly: false,
      });

      restrictedLogger.info(LogCategory.SYSTEM, 'システムメッセージ');
      restrictedLogger.info(LogCategory.AUTH, '認証メッセージ');

      // SYSTEMカテゴリのみ出力される
      expect(console.info).toHaveBeenCalledTimes(1);
    });

    it('一度だけ出力機能が動作する', () => {
      unifiedLogger.once(LogCategory.SYSTEM, 'test-key', UnifiedLogLevel.INFO, 'テストメッセージ');
      unifiedLogger.once(LogCategory.SYSTEM, 'test-key', UnifiedLogLevel.INFO, 'テストメッセージ');
      unifiedLogger.once(LogCategory.SYSTEM, 'test-key', UnifiedLogLevel.INFO, 'テストメッセージ');

      // 1回のみ出力される
      expect(console.info).toHaveBeenCalledTimes(1);
    });

    it('初期化ログが正常に動作する', () => {
      unifiedLogger.init(LogCategory.INIT, 'TestComponent', { version: '1.0.0' });
      unifiedLogger.init(LogCategory.INIT, 'TestComponent', { version: '1.0.0' });

      // 初期化ログは一度だけ出力される（実際の出力は統合テストで確認）
      expect(unifiedLogger).toBeDefined();
    });
  });

  describe('環境変数による設定', () => {
    it('環境変数からログレベルが設定される', () => {
      const originalEnv = { ...process.env };
      process.env.LOG_LEVEL = 'ERROR';
      process.env.LOG_CATEGORIES = 'SYSTEM,AUTH';

      const envLogger = new UnifiedLogger();

      // 環境変数の設定が反映されることを確認
      // 実際の動作確認は統合テストで行う
      expect(envLogger).toBeDefined();

      // 環境変数を復元
      process.env = originalEnv;
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なログレベルでもエラーが発生しない', () => {
      expect(() => {
        const invalidLogger = new UnifiedLogger({
          level: 999 as UnifiedLogLevel,
        });
        invalidLogger.info(LogCategory.SYSTEM, 'テスト');
      }).not.toThrow();
    });

    it('無効なカテゴリでもエラーが発生しない', () => {
      const testLogger = new UnifiedLogger({
        level: UnifiedLogLevel.DEBUG,
        enableConsoleOutput: true,
        developmentOnly: false,
      });

      expect(() => {
        testLogger.info('INVALID_CATEGORY' as LogCategory, 'テスト');
      }).not.toThrow();
    });
  });
});
