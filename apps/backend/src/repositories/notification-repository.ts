/**
 * 🗄️ 通知リポジトリ（バックエンド専用）
 *
 * 責任:
 * - データベース操作の抽象化
 * - クエリの最適化
 * - データ変換の統一
 */

import { type PrismaClient, type NotificationType as PrismaNotificationType } from '@libark/db';
import {
  type INotificationData,
  type ICreateNotificationData,
  type INotificationFilter,
  type NotificationTypeValue,
} from '@libark/core-shared';

// 🎯 通知システム定数
const DEFAULT_LIMIT = 20; // デフォルト取得件数
const DUPLICATE_CHECK_WINDOW_MS = 60 * 1000; // 重複チェック時間（ミリ秒）

export class NotificationRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 通知を作成
   */
  async create(data: ICreateNotificationData): Promise<INotificationData> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as PrismaNotificationType,
        content: data.content,
        actorId: data.actorId || null,
        referenceId: data.referenceId || null,
        isRead: false,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
      },
    });

    return this.mapToNotificationData(notification);
  }

  /**
   * 通知一覧を取得
   */
  async findMany(userId: string, filter: INotificationFilter = {}): Promise<INotificationData[]> {
    const { isRead, type, limit = DEFAULT_LIMIT, after } = filter;

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(isRead !== undefined && { isRead }),
        ...(type && { type: type as PrismaNotificationType }),
        ...(after && {
          createdAt: {
            lt: new Date(after),
          },
        }),
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return notifications.map(this.mapToNotificationData);
  }

  /**
   * 未読通知数を取得
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 通知を既読にマーク
   */
  async markAsRead(ids: string[]): Promise<INotificationData[]> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // 更新された通知を取得
    const notifications = await this.prisma.notification.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageId: true,
          },
        },
      },
    });

    return notifications.map(this.mapToNotificationData);
  }

  /**
   * 全ての通知を既読にマーク
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 重複通知をチェック
   */
  async checkDuplicate(
    userId: string,
    type: NotificationTypeValue,
    actorId: string,
    referenceId: string,
    windowMinutes: number
  ): Promise<boolean> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: type as PrismaNotificationType,
        actorId,
        referenceId,
        createdAt: {
          gte: new Date(Date.now() - windowMinutes * DUPLICATE_CHECK_WINDOW_MS),
        },
      },
    });

    return !!existing;
  }

  /**
   * Prismaの通知データを内部形式に変換
   */
  private mapToNotificationData(notification: {
    id: string;
    userId: string;
    type: string;
    content: string | Record<string, unknown> | null;
    isRead: boolean;
    createdAt: Date;
    readAt: Date | null;
    actorId: string | null;
    referenceId: string | null;
    actor?: {
      id: string;
      username: string;
      displayName: string | null;
      profileImageId: string | null;
    } | null;
  }): INotificationData {
    const normalizedContent =
      notification.content && typeof notification.content === 'object'
        ? JSON.stringify(notification.content)
        : (notification.content ?? '');
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationTypeValue,
      content: normalizedContent,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      actorId: notification.actorId,
      referenceId: notification.referenceId,
      actor: notification.actor
        ? {
            id: notification.actor.id,
            username: notification.actor.username,
            displayName: notification.actor.displayName ?? '',
            profileImageId: notification.actor.profileImageId,
          }
        : null,
    };
  }
}
