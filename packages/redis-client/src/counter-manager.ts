/**
 * 📊 Redis カウンター・統計管理システム
 *
 * 責任:
 * - いいね数・ビュー数・コメント数のアトミック管理
 * - ユーザー統計（投稿数・フォロワー数等）
 * - グローバル統計
 * - 高性能カウンター操作
 */

import type { Redis } from 'ioredis';

import { getRedisClient } from './redis-manager.js';
import { REDIS_KEYS } from './constants.js';

export interface PostStats {
  likes: number;
  comments: number;
  views: number;
  shares: number;
}

export interface CommentStats {
  likes: number;
}

export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
  commentsReceived: number;
}

export interface GlobalStats {
  totalUsers: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  activeUsers24h: number;
}

/**
 * Redis カウンター管理クラス
 */
export class RedisCounterManager {
  private static instance: RedisCounterManager;
  private redis: Redis;

  private constructor() {
    this.redis = getRedisClient();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): RedisCounterManager {
    if (!RedisCounterManager.instance) {
      RedisCounterManager.instance = new RedisCounterManager();
    }
    return RedisCounterManager.instance;
  }

  // ==================== 投稿統計 ====================

  /**
   * 投稿統計を増加
   */
  public async incrementPostStat(
    postId: string,
    field: keyof PostStats,
    amount: number = 1
  ): Promise<number> {
    const key = `${REDIS_KEYS.POST_STATS}:${postId}`;
    const newValue = await this.redis.hincrby(key, field, amount);

    // TTLを設定（30日）
    await this.redis.expire(key, 30 * 24 * 60 * 60);

    console.log(`📈 [Counter] 投稿統計更新: ${postId}.${field} = ${newValue}`);
    return newValue;
  }

  /**
   * 投稿統計を減少
   */
  public async decrementPostStat(
    postId: string,
    field: keyof PostStats,
    amount: number = 1
  ): Promise<number> {
    return this.incrementPostStat(postId, field, -amount);
  }

  /**
   * 投稿統計を取得
   * 全てのフィールドが欠落している場合はnullを返す（再同期のトリガー用）
   */
  public async getPostStats(postId: string): Promise<PostStats | null> {
    const key = `${REDIS_KEYS.POST_STATS}:${postId}`;
    const stats = await this.redis.hmget(key, 'likes', 'comments', 'views', 'shares');

    // 全てのフィールドがnull（キーが存在しない）かチェック
    if (stats.every(val => val === null)) {
      return null;
    }

    return {
      likes: parseInt(stats[0] || '0', 10),
      comments: parseInt(stats[1] || '0', 10),
      views: parseInt(stats[2] || '0', 10),
      shares: parseInt(stats[3] || '0', 10),
    };
  }

  /**
   * 複数投稿の統計を一括取得
   */
  public async getBatchPostStats(postIds: string[]): Promise<Record<string, PostStats>> {
    if (postIds.length === 0) return {};

    const pipeline = this.redis.pipeline();

    postIds.forEach(postId => {
      const key = `${REDIS_KEYS.POST_STATS}:${postId}`;
      pipeline.hmget(key, 'likes', 'comments', 'views', 'shares');
    });

    const results = await pipeline.exec();
    const statsMap: Record<string, PostStats> = {};

    postIds.forEach((postId, index) => {
      const stats = (results?.[index]?.[1] as string[]) || ['0', '0', '0', '0'];
      statsMap[postId] = {
        likes: parseInt(stats[0] || '0'),
        comments: parseInt(stats[1] || '0'),
        views: parseInt(stats[2] || '0'),
        shares: parseInt(stats[3] || '0'),
      };
    });

    return statsMap;
  }

  // ==================== コメント統計 ====================

  /**
   * コメント統計を増加
   */
  public async incrementCommentStat(
    commentId: string,
    field: keyof CommentStats,
    amount: number = 1
  ): Promise<number> {
    const key = `${REDIS_KEYS.COMMENT_STATS}:${commentId}`;
    const newValue = await this.redis.hincrby(key, field, amount);

    // TTLを設定（30日）
    await this.redis.expire(key, 30 * 24 * 60 * 60);

    console.log(`📈 [Counter] コメント統計更新: ${commentId}.${field} = ${newValue}`);
    return newValue;
  }

  /**
   * コメント統計を減少
   */
  public async decrementCommentStat(
    commentId: string,
    field: keyof CommentStats,
    amount: number = 1
  ): Promise<number> {
    return this.incrementCommentStat(commentId, field, -amount);
  }

  /**
   * コメント統計を取得
   */
  public async getCommentStats(commentId: string): Promise<CommentStats> {
    const key = `${REDIS_KEYS.COMMENT_STATS}:${commentId}`;
    const stats = await this.redis.hgetall(key);

    return {
      likes: parseInt(stats.likes || '0', 10),
    };
  }

  /**
   * 複数コメントの統計を一括取得
   */
  public async getBatchCommentStats(commentIds: string[]): Promise<Record<string, CommentStats>> {
    if (commentIds.length === 0) return {};

    const pipeline = this.redis.pipeline();
    commentIds.forEach(commentId => {
      const key = `${REDIS_KEYS.COMMENT_STATS}:${commentId}`;
      pipeline.hgetall(key);
    });

    const results = await pipeline.exec();
    const statsMap: Record<string, CommentStats> = {};

    commentIds.forEach((commentId, index) => {
      const stats = (results?.[index]?.[1] as Record<string, string>) || {};
      statsMap[commentId] = {
        likes: parseInt(stats.likes || '0', 10),
      };
    });

    return statsMap;
  }

  // ==================== ユーザー統計 ====================

  /**
   * ユーザー統計を増加
   */
  public async incrementUserStat(
    userId: string,
    field: keyof UserStats,
    amount: number = 1
  ): Promise<number> {
    const key = `${REDIS_KEYS.USER_STATS}:${userId}`;
    const newValue = await this.redis.hincrby(key, field, amount);

    // TTLを設定（90日）
    await this.redis.expire(key, 90 * 24 * 60 * 60);

    console.log(`👤 [Counter] ユーザー統計更新: ${userId}.${field} = ${newValue}`);
    return newValue;
  }

  /**
   * ユーザー統計を減少
   */
  public async decrementUserStat(
    userId: string,
    field: keyof UserStats,
    amount: number = 1
  ): Promise<number> {
    return this.incrementUserStat(userId, field, -amount);
  }

  /**
   * ユーザー統計を取得
   */
  public async getUserStats(userId: string): Promise<UserStats> {
    const key = `${REDIS_KEYS.USER_STATS}:${userId}`;
    const stats = await this.redis.hmget(
      key,
      'postsCount',
      'followersCount',
      'followingCount',
      'likesReceived',
      'commentsReceived'
    );

    return {
      postsCount: parseInt(stats[0] || '0'),
      followersCount: parseInt(stats[1] || '0'),
      followingCount: parseInt(stats[2] || '0'),
      likesReceived: parseInt(stats[3] || '0'),
      commentsReceived: parseInt(stats[4] || '0'),
    };
  }

  // ==================== グローバル統計 ====================

  /**
   * グローバル統計を増加
   */
  public async incrementGlobalStat(field: keyof GlobalStats, amount: number = 1): Promise<number> {
    const key = REDIS_KEYS.GLOBAL_STATS;
    const newValue = await this.redis.hincrby(key, field, amount);

    console.log(`🌍 [Counter] グローバル統計更新: ${field} = ${newValue}`);
    return newValue;
  }

  /**
   * グローバル統計を減少
   */
  public async decrementGlobalStat(field: keyof GlobalStats, amount: number = 1): Promise<number> {
    return this.incrementGlobalStat(field, -amount);
  }

  /**
   * グローバル統計を取得
   */
  public async getGlobalStats(): Promise<GlobalStats> {
    const key = REDIS_KEYS.GLOBAL_STATS;
    const stats = await this.redis.hmget(
      key,
      'totalUsers',
      'totalPosts',
      'totalLikes',
      'totalComments',
      'activeUsers24h'
    );

    return {
      totalUsers: parseInt(stats[0] || '0'),
      totalPosts: parseInt(stats[1] || '0'),
      totalLikes: parseInt(stats[2] || '0'),
      totalComments: parseInt(stats[3] || '0'),
      activeUsers24h: parseInt(stats[4] || '0'),
    };
  }

  // ==================== アクティブユーザー追跡 ====================

  /**
   * アクティブユーザーを記録（24時間ウィンドウ）
   */
  public async recordActiveUser(userId: string): Promise<void> {
    const now = Date.now();
    const key = `${REDIS_KEYS.GLOBAL_STATS}:active_users_24h`;

    // ユーザーIDをスコア付きセットに追加（スコアは現在時刻）
    await this.redis.zadd(key, now, userId);

    // 24時間より古いエントリを削除
    const cutoff = now - 24 * 60 * 60 * 1000;
    await this.redis.zremrangebyscore(key, 0, cutoff);

    // TTLを設定（25時間で安全マージン）
    await this.redis.expire(key, 25 * 60 * 60);

    // グローバル統計のactiveUsers24hを更新
    const activeCount = await this.redis.zcard(key);
    await this.redis.hset(REDIS_KEYS.GLOBAL_STATS, 'activeUsers24h', activeCount);
  }

  // ==================== 統計同期 ====================

  /**
   * データベースからRedis統計を初期化/同期
   */
  public async syncStatsFromDatabase(dbStats: {
    postStats?: Array<{ postId: string; stats: PostStats }>;
    userStats?: Array<{ userId: string; stats: UserStats }>;
    globalStats?: GlobalStats;
  }): Promise<void> {
    const pipeline = this.redis.pipeline();

    // 投稿統計の同期
    if (dbStats.postStats) {
      for (const { postId, stats } of dbStats.postStats) {
        const key = `${REDIS_KEYS.POST_STATS}:${postId}`;
        pipeline.hmset(key, stats as unknown as Record<string, string | number>);
        pipeline.expire(key, 30 * 24 * 60 * 60);
      }
    }

    // ユーザー統計の同期
    if (dbStats.userStats) {
      for (const { userId, stats } of dbStats.userStats) {
        const key = `${REDIS_KEYS.USER_STATS}:${userId}`;
        pipeline.hmset(key, stats as unknown as Record<string, string | number>);
        pipeline.expire(key, 90 * 24 * 60 * 60);
      }
    }

    // グローバル統計の同期
    if (dbStats.globalStats) {
      pipeline.hmset(
        REDIS_KEYS.GLOBAL_STATS,
        dbStats.globalStats as unknown as Record<string, string | number>
      );
    }

    await pipeline.exec();
    console.log('🔄 [Counter] データベースからの統計同期完了');
  }

  /**
   * 統計をデータベースにフラッシュ
   */
  public async flushStatsToDatabase(): Promise<{
    postStats: Array<{ postId: string; stats: PostStats }>;
    userStats: Array<{ userId: string; stats: UserStats }>;
    globalStats: GlobalStats;
  }> {
    // 投稿統計を取得
    const postStatsPattern = `${REDIS_KEYS.POST_STATS}:*`;
    const postKeys = await this.redis.keys(postStatsPattern);
    // 投稿統計を並列取得
    const postStatsResults = await Promise.all(
      postKeys.map(async key => {
        const postId = key.replace(`${REDIS_KEYS.POST_STATS}:`, '');
        const stats = await this.getPostStats(postId);
        return stats ? { postId, stats } : null;
      })
    );

    // 欠落しているデータを除外
    const postStats = postStatsResults.filter(
      (item): item is { postId: string; stats: PostStats } => item !== null
    );

    // ユーザー統計を取得
    const userStatsPattern = `${REDIS_KEYS.USER_STATS}:*`;
    const userKeys = await this.redis.keys(userStatsPattern);

    // ユーザー統計を並列取得
    const userStats = await Promise.all(
      userKeys.map(async key => {
        const userId = key.replace(`${REDIS_KEYS.USER_STATS}:`, '');
        const stats = await this.getUserStats(userId);
        return { userId, stats };
      })
    );

    // グローバル統計を取得
    const globalStats = await this.getGlobalStats();

    console.log(
      `💾 [Counter] 統計フラッシュ: 投稿${postStats.length}件, ユーザー${userStats.length}件`
    );

    return { postStats, userStats, globalStats };
  }
  /**
   * 分散ロックの取得を試行（スタンピード対策用）
   */
  public async acquireLock(lockKey: string, ttlSeconds: number = 5): Promise<boolean> {
    const key = `${REDIS_KEYS.LOCK}:${lockKey}`;
    const result = await this.redis.set(key, 'locked', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * ロックの解放
   */
  public async releaseLock(lockKey: string): Promise<void> {
    const key = `${REDIS_KEYS.LOCK}:${lockKey}`;
    await this.redis.del(key);
  }

  /**
   * 統計情報を一括セット（再同期用）
   */
  public async setPostStats(postId: string, stats: Partial<PostStats>): Promise<void> {
    const key = `${REDIS_KEYS.POST_STATS}:${postId}`;
    await this.redis.hset(key, stats as Record<string, string | number>);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // TTL 30日
  }
}

/**
 * カウンター管理インスタンスをエクスポート
 */
export const counterManager = RedisCounterManager.getInstance();
