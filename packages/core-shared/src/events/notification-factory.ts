/**
 * 🏭 通知ファクトリー
 *
 * 責任:
 * - 通知タイプ別のコンテンツ生成
 * - 通知データの正規化
 * - ビジネスルールの適用
 */

import {
  NotificationType,
  type NotificationTypeValue,
  type ICreateNotificationData,
} from './notification-types.js';

// 🎯 通知重複チェック時間定数（分）
const DUPLICATE_CHECK_WINDOW = {
  DEFAULT: 60, // 1時間
  LIKE: 60, // 1時間
  FOLLOW: 1440, // 24時間
} as const;

export interface IProcessingNotificationInput {
  type: 'avatar_completed' | 'avatar_error' | 'post_error';
  userId: string;
  error?: string;
  mediaId?: string;
  postId?: string;
}

export class NotificationFactory {
  /**
   * 処理完了/失敗通知を作成
   */
  static createProcessingNotification(
    input: IProcessingNotificationInput
  ): ICreateNotificationData | null {
    const { type, userId, error, mediaId, postId } = input;

    switch (type) {
      case 'avatar_completed':
        return {
          userId,
          type: NotificationType.AVATAR_PROCESSING_COMPLETED,
          content: 'プロフィール画像が更新されました',
          referenceId: mediaId,
        };

      case 'avatar_error':
        return {
          userId,
          type: NotificationType.AVATAR_PROCESSING_FAILED,
          content: `プロフィール画像の処理に失敗しました: ${error || '不明なエラー'}`,
          referenceId: mediaId,
        };

      // post_completed通知は削除済み
      // 理由: Postは即座に処理されるため、処理完了通知は不要

      case 'post_error':
        return {
          userId,
          type: NotificationType.POST_PROCESSING_FAILED,
          content: `投稿の処理に失敗しました: ${error || '不明なエラー'}`,
          referenceId: postId,
        };

      default:
        console.warn(`[NotificationFactory] 未対応の処理通知タイプ: ${type}`);
        return null;
    }
  }

  /**
   * ソーシャル通知を作成
   */
  static createSocialNotification(
    type: 'like' | 'comment' | 'follow',
    userId: string,
    actorId: string,
    referenceId?: string
  ): ICreateNotificationData {
    switch (type) {
      case 'like':
        return {
          userId,
          type: NotificationType.LIKE,
          content: 'あなたの投稿にいいねしました',
          actorId,
          referenceId,
        };

      case 'comment':
        return {
          userId,
          type: NotificationType.COMMENT,
          content: 'あなたの投稿にコメントしました',
          actorId,
          referenceId,
        };

      case 'follow':
        return {
          userId,
          type: NotificationType.FOLLOW,
          content: 'あなたをフォローしました',
          actorId,
        };

      default:
        throw new Error(`未対応のソーシャル通知タイプ: ${type}`);
    }
  }

  /**
   * 通知の重複チェックが必要かどうかを判定
   */
  static needsDuplicateCheck(type: NotificationTypeValue): boolean {
    switch (type) {
      case NotificationType.LIKE:
      case NotificationType.FOLLOW:
        return true; // いいねとフォローは重複チェック必要
      default:
        return false;
    }
  }

  /**
   * 通知の有効期限（分）を取得
   */
  static getDuplicateCheckWindow(type: NotificationTypeValue): number {
    switch (type) {
      case NotificationType.LIKE:
        return DUPLICATE_CHECK_WINDOW.LIKE;
      case NotificationType.FOLLOW:
        return DUPLICATE_CHECK_WINDOW.FOLLOW;
      default:
        return DUPLICATE_CHECK_WINDOW.DEFAULT;
    }
  }
}
