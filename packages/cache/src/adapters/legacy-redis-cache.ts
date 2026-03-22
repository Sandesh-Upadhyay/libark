/**
 * 🔄 レガシーRedisDistributedCache互換アダプター
 *
 * 既存のRedisDistributedCacheインターフェースを統一キャッシュシステムで実装
 */

import { UnifiedCacheManager } from '../cache-manager.js';
import { getDefaultCacheManager } from '../singleton.js';
import type { CacheManagerOptions } from '../cache-manager.js';

/**
 * レガシーキャッシュオプション
 */
export interface LegacyCacheOptions {
  ttl?: number;
  compress?: boolean;
  version?: string;
}

/**
 * レガシーキャッシュエントリ
 */
export interface LegacyCacheEntry<T = unknown> {
  data: T;
  createdAt: number;
  expiresAt: number;
  version?: string;
  compressed?: boolean;
}

/**
 * レガシーキャッシュ統計
 */
export interface LegacyCacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  totalKeys: number;
  hitRate: number;
}

/**
 * レガシーキャッシュカテゴリ
 */
type LegacyCacheCategory = 'user' | 'post' | 'feed' | 'media' | 'search';

/**
 * キャッシュ可能なデータ型（レガシー互換）
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
 * RedisDistributedCache互換アダプター
 */
export class LegacyRedisCacheAdapter {
  private static instance: LegacyRedisCacheAdapter;
  private cacheManager: UnifiedCacheManager;

  // デフォルトTTL設定（レガシー互換）
  private static readonly DEFAULT_TTLS = {
    user: 60 * 60, // 1時間
    post: 30 * 60, // 30分
    feed: 15 * 60, // 15分
    media: 24 * 60 * 60, // 24時間
    search: 5 * 60, // 5分
  };

  private constructor(options?: CacheManagerOptions) {
    this.cacheManager = options ? new UnifiedCacheManager(options) : getDefaultCacheManager();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): LegacyRedisCacheAdapter {
    if (!LegacyRedisCacheAdapter.instance) {
      LegacyRedisCacheAdapter.instance = new LegacyRedisCacheAdapter();
    }
    return LegacyRedisCacheAdapter.instance;
  }

  /**
   * キャッシュに値を設定
   */
  public async set<T>(
    category: LegacyCacheCategory,
    key: string,
    value: T,
    options: LegacyCacheOptions = {}
  ): Promise<void> {
    const ttl = options.ttl || LegacyRedisCacheAdapter.DEFAULT_TTLS[category];

    await this.cacheManager.set(category, key, value, {
      ttl,
      compress: options.compress,
      version: options.version,
    });
  }

  /**
   * キャッシュから値を取得
   */
  public async get<T>(
    category: LegacyCacheCategory,
    key: string,
    expectedVersion?: string
  ): Promise<T | null> {
    return await this.cacheManager.get<T>(category, key, { version: expectedVersion });
  }

  /**
   * キャッシュから値を削除
   */
  public async delete(category: LegacyCacheCategory, key: string): Promise<void> {
    await this.cacheManager.delete(category, key);
  }

  // ==================== 特化キャッシュ操作 ====================

  /**
   * ユーザープロフィールキャッシュ
   */
  public async setUserProfile(
    userId: string,
    profile: CacheableUserProfile,
    ttl?: number
  ): Promise<void> {
    await this.set('user', `profile:${userId}`, profile, { ttl });
  }

  public async getUserProfile(userId: string): Promise<CacheableUserProfile | null> {
    return this.get('user', `profile:${userId}`);
  }

  public async deleteUserProfile(userId: string): Promise<void> {
    await this.delete('user', `profile:${userId}`);
  }

  /**
   * 投稿キャッシュ
   */
  public async setPost(postId: string, post: CacheablePost, ttl?: number): Promise<void> {
    await this.set('post', postId, post, { ttl });
  }

  public async getPost(postId: string): Promise<CacheablePost | null> {
    return this.get('post', postId);
  }

  public async deletePost(postId: string): Promise<void> {
    await this.delete('post', postId);
  }

  /**
   * フィードキャッシュ
   */
  public async setFeed(
    userId: string,
    feed: CacheableFeed,
    feedType: string = 'timeline',
    ttl?: number
  ): Promise<void> {
    await this.set('feed', `${userId}:${feedType}`, feed, { ttl });
  }

  public async getFeed(
    userId: string,
    feedType: string = 'timeline'
  ): Promise<CacheableFeed | null> {
    return this.get('feed', `${userId}:${feedType}`);
  }

  public async deleteFeed(userId: string, feedType?: string): Promise<void> {
    if (feedType) {
      await this.delete('feed', `${userId}:${feedType}`);
    } else {
      // 全フィードタイプを削除（簡略化）
      await this.cacheManager.clearCategory('feed');
    }
  }

  /**
   * 検索結果キャッシュ
   */
  public async setSearchResult(
    query: string,
    results: CacheableSearchResult,
    ttl?: number
  ): Promise<void> {
    await this.set('search', query, results, { ttl });
  }

  public async getSearchResult(query: string): Promise<CacheableSearchResult | null> {
    return this.get('search', query);
  }

  /**
   * 統計情報の取得
   */
  public getStats(): LegacyCacheStats {
    const stats = this.cacheManager.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      sets: stats.sets,
      deletes: stats.deletes,
      totalKeys: stats.totalKeys,
      hitRate: stats.hitRate,
    };
  }

  /**
   * 全キャッシュクリア
   */
  public async clearAll(): Promise<void> {
    await this.cacheManager.clear();
  }
}

/**
 * レガシー互換インスタンスをエクスポート
 */
export const legacyDistributedCache = LegacyRedisCacheAdapter.getInstance();
