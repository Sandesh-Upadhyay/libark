/**
 * 🚦 Redis レートリミッター
 *
 * 責任:
 * - API制限（ユーザー別・IP別）
 * - ログイン試行制限
 * - 投稿・アップロード制限
 * - 分散環境対応
 */

import type { Redis } from 'ioredis';

import { getRedisClient } from './redis-manager.js';
import { REDIS_KEYS } from './constants.js';

export interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  blockDurationMs?: number; // ブロック期間（省略時は windowMs と同じ）
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // ブロック中の場合の待機時間（秒）
}

export interface RateLimitOptions {
  identifier: string; // ユーザーID、IP等の識別子
  action: string; // アクション名（api, login, post, upload等）
  config: RateLimitConfig;
}

/**
 * Redis レートリミッタークラス
 */
export class RedisRateLimiter {
  private static instance: RedisRateLimiter;
  private redis: Redis;

  // デフォルト設定
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    // API制限（一般）
    api: {
      windowMs: 15 * 60 * 1000, // 15分
      maxRequests: 1000, // 1000リクエスト
    },

    // API制限（認証済みユーザー）
    api_authenticated: {
      windowMs: 15 * 60 * 1000, // 15分
      maxRequests: 5000, // 5000リクエスト
    },

    // ログイン試行制限
    login: {
      windowMs: 15 * 60 * 1000, // 15分
      maxRequests: 5, // 5回まで
      blockDurationMs: 60 * 60 * 1000, // 1時間ブロック
    },

    // 投稿制限
    post: {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 50, // 50投稿
    },

    // アップロード制限
    upload: {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 20, // 20ファイル
    },

    // いいね制限
    like: {
      windowMs: 60 * 1000, // 1分
      maxRequests: 60, // 60いいね
    },

    // コメント制限
    comment: {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 100, // 100コメント
    },
  };

  private constructor() {
    this.redis = getRedisClient();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter();
    }
    return RedisRateLimiter.instance;
  }

  /**
   * レート制限チェック
   */
  public async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { identifier, action, config } = options;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Redisキー生成
    const key = this.generateKey(action, identifier);
    const blockKey = `${key}:blocked`;

    // ブロック状態チェック
    const blockExpiry = await this.redis.get(blockKey);
    if (blockExpiry) {
      const retryAfter = Math.ceil((parseInt(blockExpiry) - now) / 1000);
      if (retryAfter > 0) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: parseInt(blockExpiry),
          retryAfter,
        };
      }
    }

    // スライディングウィンドウログを使用したレート制限
    const pipeline = this.redis.pipeline();

    // 古いエントリを削除
    pipeline.zremrangebyscore(key, 0, windowStart);

    // 現在のリクエスト数を取得
    pipeline.zcard(key);

    // 現在のリクエストを追加
    const requestId = `${now}-${Math.random()}`;
    pipeline.zadd(key, now, requestId);

    // TTLを設定（ウィンドウサイズの2倍で安全マージン）
    pipeline.expire(key, Math.ceil(config.windowMs / 1000) * 2);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    const currentCount = (results[1][1] as number) + 1; // +1は今回のリクエスト分
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetTime = now + config.windowMs;

    // 制限を超えた場合
    if (currentCount > config.maxRequests) {
      // ブロック期間を設定
      const blockDuration = config.blockDurationMs || config.windowMs;
      const blockUntil = now + blockDuration;

      await this.redis.setex(blockKey, Math.ceil(blockDuration / 1000), blockUntil.toString());

      console.warn(
        `🚫 [RateLimiter] 制限超過: ${action}:${identifier} (${currentCount}/${config.maxRequests})`
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockUntil,
        retryAfter: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime,
    };
  }

  /**
   * 事前定義された設定でレート制限チェック
   */
  public async checkPredefinedLimit(
    action: keyof typeof RedisRateLimiter.DEFAULT_CONFIGS,
    identifier: string
  ): Promise<RateLimitResult> {
    const config = RedisRateLimiter.DEFAULT_CONFIGS[action];
    if (!config) {
      throw new Error(`Unknown rate limit action: ${action}`);
    }

    return this.checkRateLimit({ identifier, action, config });
  }

  /**
   * IP別API制限チェック
   */
  public async checkIPLimit(ip: string, authenticated: boolean = false): Promise<RateLimitResult> {
    const action = authenticated ? 'api_authenticated' : 'api';
    return this.checkPredefinedLimit(action, `ip:${ip}`);
  }

  /**
   * ユーザー別制限チェック
   */
  public async checkUserLimit(
    userId: string,
    action: keyof typeof RedisRateLimiter.DEFAULT_CONFIGS
  ): Promise<RateLimitResult> {
    return this.checkPredefinedLimit(action, `user:${userId}`);
  }

  /**
   * ログイン試行制限チェック
   */
  public async checkLoginAttempt(identifier: string): Promise<RateLimitResult> {
    return this.checkPredefinedLimit('login', identifier);
  }

  /**
   * 制限をリセット
   */
  public async resetLimit(action: string, identifier: string): Promise<void> {
    const key = this.generateKey(action, identifier);
    const blockKey = `${key}:blocked`;

    await this.redis.del(key, blockKey);
    console.log(`🔄 [RateLimiter] 制限リセット: ${action}:${identifier}`);
  }

  /**
   * 制限状況を取得
   */
  public async getLimitStatus(
    action: string,
    identifier: string
  ): Promise<{
    currentCount: number;
    windowStart: number;
    windowEnd: number;
    isBlocked: boolean;
    blockUntil?: number;
  }> {
    const key = this.generateKey(action, identifier);
    const blockKey = `${key}:blocked`;
    const now = Date.now();

    // ブロック状態チェック
    const blockExpiry = await this.redis.get(blockKey);
    const isBlocked = blockExpiry ? parseInt(blockExpiry) > now : false;

    // 現在のカウント取得
    const config =
      RedisRateLimiter.DEFAULT_CONFIGS[action as keyof typeof RedisRateLimiter.DEFAULT_CONFIGS];
    const windowMs = config?.windowMs || 15 * 60 * 1000;
    const windowStart = now - windowMs;

    const currentCount = await this.redis.zcount(key, windowStart, now);

    return {
      currentCount,
      windowStart,
      windowEnd: now + windowMs,
      isBlocked,
      blockUntil: blockExpiry ? parseInt(blockExpiry) : undefined,
    };
  }

  /**
   * Redisキー生成
   */
  private generateKey(action: string, identifier: string): string {
    return `${REDIS_KEYS.RATE_LIMIT_API}:${action}:${identifier}`;
  }

  /**
   * 統計情報取得
   */
  public async getStats(): Promise<{
    totalKeys: number;
    blockedIdentifiers: number;
  }> {
    const pattern = `${REDIS_KEYS.RATE_LIMIT_API}:*`;
    const keys = await this.redis.keys(pattern);

    const blockedKeys = keys.filter(key => key.endsWith(':blocked'));

    return {
      totalKeys: keys.length,
      blockedIdentifiers: blockedKeys.length,
    };
  }
}

/**
 * レートリミッターインスタンスをエクスポート
 */
export const rateLimiter = RedisRateLimiter.getInstance();
