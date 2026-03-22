/**
 * 🔄 Redis通知ハンドラー - GraphQLサブスクリプション専用
 *
 * 責任:
 * - GraphQLサブスクリプション専用の通知管理
 * - 統一通知サービスとの連携
 * - レガシーWebSocketシステムは完全廃止済み
 *
 * 注意: WebSocketからGraphQLサブスクリプションへの移行完了
 */

import type { FastifyBaseLogger } from 'fastify';
import pino from 'pino';
import { RedisPubSubManager } from '@libark/redis-client';
import { envUtils } from '@libark/core-shared';

import { notificationService, type LegacyNotificationData } from './notification-service.js';

/**
 * Redis通知ハンドラー
 */
export class RedisNotificationHandler {
  private static instance: RedisNotificationHandler;
  private redisPubSub: RedisPubSubManager;
  private isInitialized = false;
  private logger: FastifyBaseLogger | null = null;

  private constructor() {
    this.redisPubSub = RedisPubSubManager.getInstance();
  }

  /**
   * Fastifyロガーを設定
   */
  public setLogger(logger: FastifyBaseLogger): void {
    this.logger = logger;
  }

  /**
   * フォールバックロガー（Pino）
   */
  private fallbackLogger = pino({
    name: 'redis-notification-handler',
    level: envUtils.isDevelopment() ? 'info' : 'warn',
    transport: envUtils.isDevelopment()
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });

  /**
   * ログ出力（Fastifyロガーまたはフォールバック）
   */
  private get log(): FastifyBaseLogger {
    return this.logger || (this.fallbackLogger as unknown as FastifyBaseLogger);
  }

  public static getInstance(): RedisNotificationHandler {
    if (!RedisNotificationHandler.instance) {
      RedisNotificationHandler.instance = new RedisNotificationHandler();
    }
    return RedisNotificationHandler.instance;
  }

  /**
   * 初期化 - GraphQLサブスクリプション専用
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log.info('⚠️ [RedisNotificationHandler] 既に初期化済み');
      return;
    }

    try {
      // GraphQLサブスクリプション専用の初期化
      // レガシーWebSocketシステムは完全廃止

      this.isInitialized = true;
      this.log.info('✅ [RedisNotificationHandler] GraphQLサブスクリプション専用初期化完了');
    } catch (error) {
      this.log.error({ err: error }, '❌ [RedisNotificationHandler] 初期化エラー:');
      throw error;
    }
  }

  /**
   * 新しい通知の直接処理
   */
  public async processNotification(data: LegacyNotificationData): Promise<void> {
    try {
      await notificationService.processNotification(data);
    } catch (error) {
      this.log.error({ err: error }, '❌ [RedisNotificationHandler] 通知処理エラー:');
      throw error;
    }
  }

  /**
   * 通知カウント更新
   */
  public async updateUnreadCount(userId: string): Promise<void> {
    try {
      await notificationService.notifyUnreadCountUpdate(userId);
    } catch (error) {
      this.log.error({ err: error }, '❌ [RedisNotificationHandler] 通知カウント更新エラー:');
      throw error;
    }
  }

  /**
   * 終了処理
   */
  public async shutdown(): Promise<void> {
    try {
      await this.redisPubSub.unsubscribeAll();
      this.isInitialized = false;
      this.log.info('✅ [RedisNotificationHandler] 終了処理完了');
    } catch (error) {
      this.log.error({ err: error }, '❌ [RedisNotificationHandler] 終了処理エラー:');
    }
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const redisNotificationHandler = RedisNotificationHandler.getInstance();
