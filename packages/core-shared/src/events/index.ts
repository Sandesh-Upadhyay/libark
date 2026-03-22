/**
 * 📡 統合イベント定義モジュール
 *
 * 旧 @libark/events の機能を統合
 * 責任:
 * - 全システム共通のイベント名定義
 * - イベントデータ型定義
 * - 通知タイプ定義
 * - 循環依存の回避
 *
 * 注意: 基盤パッケージとして他のLibarkパッケージに依存しません
 */

// 通知システム（型定義とファクトリーのみ）
export * from './notification-types.js';
export * from './notification-factory.js';

/**
 * 🎯 統一イベント名（冗長性を排除）
 */
export const UNIFIED_EVENTS = {
  // 接続管理
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATED: 'authenticated',
  AUTHENTICATION_FAILED: 'authentication_failed',

  // メディア処理（統一命名）
  MEDIA_STARTED: 'media.started',
  MEDIA_PROGRESS: 'media.progress',
  MEDIA_COMPLETED: 'media.completed',
  MEDIA_FAILED: 'media.failed',

  // 特定メディア処理
  AVATAR_COMPLETED: 'avatar.completed',
  AVATAR_FAILED: 'avatar.failed',

  // 投稿処理
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_COMPLETED: 'post.completed',
  POST_FAILED: 'post.failed',

  // メッセージング
  MESSAGE_SEND: 'message.send',
  MESSAGE_RECEIVE: 'message.receive',
  CONVERSATION_JOIN: 'conversation.join',
  CONVERSATION_LEAVE: 'conversation.leave',

  // 通知
  NOTIFICATION: 'notification',

  // 購読管理
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIPTION_SUCCESS: 'subscription.success',
  SUBSCRIPTION_FAILED: 'subscription.failed',
} as const;

export type UnifiedEventName = (typeof UNIFIED_EVENTS)[keyof typeof UNIFIED_EVENTS];

/**
 * 🎯 基本イベントデータ
 */
export interface IBaseEventData {
  eventId: string;
  timestamp: string;
  userId?: string;
}

/**
 * 🎯 メディア処理イベント
 */
export interface IMediaProcessingEvent extends IBaseEventData {
  mediaId: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  progress?: number;
  result?: {
    url: string;
    width: number;
    height: number;
    size: number;
    format: string;
    variants?: {
      original?: IMediaVariantResult;
      compressed?: IMediaVariantResult;
      thumbnail?: IMediaVariantResult;
    };
  };
  error?: string;
}

export interface IMediaVariantResult {
  url: string;
  width: number;
  height: number;
  size: number;
  encrypted: boolean;
}

/**
 * 🎯 投稿イベント
 */
export interface IPostEvent extends IBaseEventData {
  postId: string;
  action: 'created' | 'updated' | 'completed' | 'failed';
  data?: unknown;
  error?: string;
}

/**
 * 🎯 通知イベント（統合版）
 */
export interface INotificationEvent extends IBaseEventData {
  type: string;
  title: string;
  message: string;
  data?: unknown;
  // 通知システム統合により、NotificationDataとの互換性を保持
  notificationData?: {
    id: string;
    userId: string;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    actorId?: string | null;
    referenceId?: string | null;
  };
}

/**
 * 🎯 購読設定
 */
export interface ISubscriptionConfig {
  type: 'media' | 'post' | 'user';
  id: string;
  events?: UnifiedEventName[];
  once?: boolean;
}

/**
 * 🎯 エラー定数
 */
export const EVENT_ERRORS = {
  INVALID_EVENT: 'INVALID_EVENT',
  SUBSCRIPTION_FAILED: 'SUBSCRIPTION_FAILED',
  TIMEOUT: 'TIMEOUT',
} as const;

export type EventErrorType = (typeof EVENT_ERRORS)[keyof typeof EVENT_ERRORS];
