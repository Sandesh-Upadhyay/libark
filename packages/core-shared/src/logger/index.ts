/**
 * 📝 統一ログシステム
 * Pinoベースの統一ログライブラリ
 */

import pino from 'pino';

// ログレベル定義
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ログ設定
export interface LoggerConfig {
  level?: LogLevel;
  name?: string;
  prettyPrint?: boolean;
  destination?: string;
}

// デフォルト設定
const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  name: process.env.SERVICE_NAME || 'libark',
  prettyPrint: process.env.NODE_ENV === 'development',
};

// Pinoロガーインスタンス
const pinoLogger = pino({
  level: defaultConfig.level,
  name: defaultConfig.name,
  ...(defaultConfig.prettyPrint && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// 統一ログインターフェース
export interface Logger {
  trace(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  fatal(message: string, ...args: unknown[]): void;
  child(options: Record<string, unknown>): Logger;
}

// Pinoラッパークラス
class PinoLogger implements Logger {
  constructor(private pino: pino.Logger) {}

  trace(message: string, ...args: unknown[]): void {
    this.pino.trace({ args }, message);
  }

  debug(message: string, ...args: unknown[]): void {
    this.pino.debug({ args }, message);
  }

  info(message: string, ...args: unknown[]): void {
    this.pino.info({ args }, message);
  }

  warn(message: string, ...args: unknown[]): void {
    this.pino.warn({ args }, message);
  }

  error(message: string, ...args: unknown[]): void {
    this.pino.error({ args }, message);
  }

  fatal(message: string, ...args: unknown[]): void {
    this.pino.fatal({ args }, message);
  }

  child(options: Record<string, unknown>): Logger {
    return new PinoLogger(this.pino.child(options));
  }
}

// デフォルトロガーインスタンス
export const logger = new PinoLogger(pinoLogger);

// ロガーファクトリー
export const createLogger = (config: LoggerConfig = {}): Logger => {
  const mergedConfig = { ...defaultConfig, ...config };

  const pinoInstance = pino({
    level: mergedConfig.level,
    name: mergedConfig.name,
    ...(mergedConfig.prettyPrint && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
  });

  return new PinoLogger(pinoInstance);
};

// 子ロガー作成ヘルパー
export const createChildLogger = (name: string, meta?: Record<string, unknown>): Logger => {
  return logger.child({ service: name, ...meta });
};

export default logger;
