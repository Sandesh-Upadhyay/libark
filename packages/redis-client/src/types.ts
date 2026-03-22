/**
 * Redis接続関連の型定義
 */

import type { Redis } from 'ioredis';

/**
 * BullMQのクライアントタイプ
 */
export type RedisClientType = 'client' | 'subscriber' | 'bclient';

/**
 * Redis接続設定
 */
export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  retryStrategy?: (times: number) => number;
}

/**
 * Redis型エクスポート
 */
export type { Redis };

/**
 * PubSub通知データ
 */
export interface PubSubNotificationData {
  type: string;
  userId?: string;
  mediaId?: string;
  postId?: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * キャッシュ可能なデータ型
 */
export interface CacheableUserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  profileImageId?: string | null;
  bio?: string | null;
  isVerified: boolean;
  role: string;
}

export interface CacheablePost {
  id: string;
  content: string;
  authorId: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  mediaIds?: string[];
  likesCount: number;
  commentsCount: number;
}

export interface CacheableFeed {
  posts: CacheablePost[];
  hasNextPage: boolean;
  endCursor?: string;
  totalCount: number;
}

export interface CacheableSearchResult {
  posts?: CacheablePost[];
  users?: CacheableUserProfile[];
  totalCount: number;
  query: string;
  timestamp: string;
}

/**
 * PubSubメッセージハンドラー型
 */
export type PubSubMessageHandler = (data: PubSubNotificationData) => void;
