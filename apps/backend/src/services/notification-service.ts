/**
 * 🔔 通知サービス - リファクタリング版
 *
 * 責任:
 * - 通知の作成と配信の統合
 * - リアルタイム配信の管理
 * - 通知カウント更新の統合
 */

import type { FastifyBaseLogger } from 'fastify';
import pino from 'pino';
import type { NotificationType as PrismaNotificationType } from '@libark/db';
import { prisma } from '@libark/db';
import { RedisPubSubManager } from '@libark/redis-client';
import { envUtils } from '@libark/core-shared';
import {
  NotificationFactory,
  type IProcessingNotificationInput,
  type ICreateNotificationData,
  NotificationType,
} from '@libark/core-shared';

import { NotificationRepository } from '../repositories/notification-repository.js';

export interface LegacyNotificationData {
  type: string;
  userId: string;
  content?: string;
  error?: string;
  mediaId?: string;
  postId?: string;
  referenceId?: string;
  timestamp?: string;
}

interface DBNotification {
  id: string;
  userId: string;
  type: string;
  content: string | null;
  referenceId: string | null;
  createdAt: Date;
  isRead: boolean;
}

/**
 * 統一通知サービス
 */
export class NotificationService {
  private static instance: NotificationService;
  private redisPubSub: RedisPubSubManager;
  private repository: NotificationRepository;
  private logger: FastifyBaseLogger | null = null;

  private constructor() {
    this.redisPubSub = RedisPubSubManager.getInstance();
    this.repository = new NotificationRepository(prisma);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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
    name: 'notification-service',
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

  /**
   * 処理完了/失敗通知を作成・配信
   */
  public async createProcessingNotification(input: IProcessingNotificationInput): Promise<void> {
    const notificationData = NotificationFactory.createProcessingNotification(input);
    if (!notificationData) {
      return;
    }

    await this.createAndPublish(notificationData);
  }

  /**
   * ソーシャル通知を作成・配信
   */
  public async createSocialNotification(
    type: 'like' | 'comment' | 'follow',
    userId: string,
    actorId: string,
    referenceId?: string
  ): Promise<void> {
    // 重複チェック
    const notificationType = this.mapSocialTypeToNotificationType(type);
    if (NotificationFactory.needsDuplicateCheck(notificationType)) {
      const windowMinutes = NotificationFactory.getDuplicateCheckWindow(notificationType);
      const isDuplicate = await this.repository.checkDuplicate(
        userId,
        notificationType,
        actorId,
        referenceId || '',
        windowMinutes
      );

      if (isDuplicate) {
        return;
      }
    }

    const notificationData = NotificationFactory.createSocialNotification(
      type,
      userId,
      actorId,
      referenceId
    );

    await this.createAndPublish(notificationData);
  }

  /**
   * レガシーAPI（後方互換性）
   */
  public async processNotification(data: LegacyNotificationData): Promise<void> {
    if (this.isProcessingNotification(data)) {
      await this.createProcessingNotification({
        type: data.type as IProcessingNotificationInput['type'],
        userId: data.userId,
        error: data.error,
        mediaId: data.mediaId,
        postId: data.postId,
      });
    }
  }

  /**
   * 通知作成と配信の統合処理
   */
  private async createAndPublish(data: ICreateNotificationData): Promise<void> {
    // DB通知作成
    const notification = await this.repository.create(data);

    // リアルタイム配信
    await this.publishNotification(notification.userId, {
      ...notification,
      referenceId: notification.referenceId || null,
    });

    // 通知カウント更新
    await this.notifyUnreadCountUpdate(notification.userId);
  }

  /**
   * ソーシャル通知タイプをNotificationTypeにマップ
   */
  private mapSocialTypeToNotificationType(
    type: 'like' | 'comment' | 'follow'
  ): (typeof NotificationType)[keyof typeof NotificationType] {
    switch (type) {
      case 'like':
        return NotificationType.LIKE;
      case 'comment':
        return NotificationType.COMMENT;
      case 'follow':
        return NotificationType.FOLLOW;
      default:
        throw new Error(`Unknown social type: ${type}`);
    }
  }

  /**
   * 処理通知かどうかを判定
   */
  private isProcessingNotification(data: LegacyNotificationData): boolean {
    return ['avatar_completed', 'avatar_error', 'post_completed', 'post_error'].includes(data.type);
  }

  /**
   * レガシー：DB通知作成（必要な場合のみ）
   */
  private async createDBNotificationIfNeeded(
    data: LegacyNotificationData
  ): Promise<DBNotification | null> {
    let notificationType: string | null = null;
    let content: string | null = null;

    // 通知タイプに応じてDB通知を作成
    switch (data.type) {
      case 'avatar_completed':
        notificationType = 'AVATAR_PROCESSING_COMPLETED';
        content = 'プロフィール画像が更新されました';
        break;
      // post_completed通知は削除済み
      // 理由: Postは即座に処理されるため、処理完了通知は不要
      case 'avatar_error':
        notificationType = 'AVATAR_PROCESSING_FAILED';
        content = `プロフィール画像の処理に失敗しました: ${data.error || '不明なエラー'}`;
        break;
      case 'post_error':
        notificationType = 'POST_PROCESSING_FAILED';
        content = `投稿の処理に失敗しました: ${data.error || '不明なエラー'}`;
        break;
      case 'notification':
        // いいね、コメント等の一般通知は既にDBに保存済みなので、GraphQL配信のみ
        this.log.info(`📨 [NotificationService] 一般通知処理: 既にDB保存済み - GraphQL配信のみ`);
        return null; // DB通知作成はスキップ
      default:
        // その他の通知タイプはDB保存しない
        return null;
    }

    if (!notificationType || !content) {
      return null;
    }

    try {
      // referenceIdを適切に設定
      let referenceId: string | null = null;
      switch (data.type) {
        case 'avatar_completed':
        case 'avatar_error':
          // アバター処理の場合はmediaIdを使用（設定ページへの遷移用）
          referenceId = data.mediaId || null;
          break;
        case 'post_error':
          // 投稿処理の場合はpostIdを使用（投稿ページへの遷移用）
          referenceId = data.postId || null;
          break;
        default:
          referenceId = data.referenceId || data.postId || data.mediaId || null;
      }

      // 新しい通知を作成
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: notificationType as PrismaNotificationType,
          referenceId: referenceId || null,
          content,
          isRead: false,
        },
      });

      this.log.info(`📝 [NotificationService] DB通知作成: ${notificationType} -> ${data.userId}`);
      return notification;
    } catch (error) {
      this.log.error({ err: error }, '❌ [NotificationService] DB通知作成エラー:');
      return null;
    }
  }

  /**
   * 通知をリアルタイム配信
   */
  private async publishNotification(userId: string, notification: DBNotification): Promise<void> {
    try {
      await this.redisPubSub.publishGraphQLNotification(userId, {
        type: 'notification_added',
        notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.log.error({ err: error }, '❌ [NotificationService] 配信エラー:');
    }
  }

  /**
   * 通知カウント更新を配信
   */
  public async notifyUnreadCountUpdate(userId: string): Promise<void> {
    try {
      const unreadCount = await this.repository.getUnreadCount(userId);

      const countChannel = `notification_count:${userId}`;
      await this.redisPubSub.publish(countChannel, {
        type: 'notification_count_updated',
        userId,
        unreadCount,
        timestamp: new Date().toISOString(),
      });

      this.log.info(
        `📊 [NotificationService] 通知カウント更新配信: ${countChannel} -> ${unreadCount}`
      );
    } catch (error) {
      this.log.error({ err: error }, '❌ [NotificationService] 通知カウント更新エラー:');
    }
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const notificationService = NotificationService.getInstance();
