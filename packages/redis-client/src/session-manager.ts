/**
 * 🔐 Redis セッション管理システム
 *
 * 責任:
 * - セッション作成・検証・無効化
 * - トークンブラックリスト管理
 * - リフレッシュトークン管理
 * - セキュリティポリシーの統一
 */

import type { Redis } from 'ioredis';

import { getRedisClient } from './redis-manager.js';
import { REDIS_KEYS } from './constants.js';

export interface SessionData {
  userId: string;
  username: string;
  email?: string;
  role: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastAccessAt: string;
}

export interface TokenBlacklistEntry {
  tokenId: string;
  userId: string;
  reason: 'logout' | 'security' | 'expired' | 'revoked';
  blacklistedAt: string;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  deviceId?: string;
  createdAt: string;
  lastUsedAt: string;
}

/**
 * Redis セッション管理クラス
 */
export class RedisSessionManager {
  private static instance: RedisSessionManager;
  private redis: Redis;

  private constructor() {
    this.redis = getRedisClient();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): RedisSessionManager {
    if (!RedisSessionManager.instance) {
      RedisSessionManager.instance = new RedisSessionManager();
    }
    return RedisSessionManager.instance;
  }

  /**
   * セッション作成
   */
  public async createSession(
    sessionId: string,
    sessionData: Omit<SessionData, 'createdAt' | 'lastAccessAt'>,
    ttlSeconds: number = 7 * 24 * 60 * 60 // 7日
  ): Promise<void> {
    const now = new Date().toISOString();
    const fullSessionData: SessionData = {
      ...sessionData,
      createdAt: now,
      lastAccessAt: now,
    };

    const key = `${REDIS_KEYS.SESSION}:${sessionData.userId}:${sessionId}`;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(fullSessionData));

    console.log(`✅ [SessionManager] セッション作成: ${sessionData.userId}:${sessionId}`);
  }

  /**
   * セッション取得・更新
   */
  public async getSession(userId: string, sessionId: string): Promise<SessionData | null> {
    const key = `${REDIS_KEYS.SESSION}:${userId}:${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(data);

      // 最終アクセス時刻を更新
      sessionData.lastAccessAt = new Date().toISOString();

      // TTLを取得して同じ期間で更新
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, JSON.stringify(sessionData));
      }

      return sessionData;
    } catch (error) {
      console.error(`❌ [SessionManager] セッション解析エラー: ${key}`, error);
      return null;
    }
  }

  /**
   * セッション削除
   */
  public async deleteSession(userId: string, sessionId: string): Promise<void> {
    const key = `${REDIS_KEYS.SESSION}:${userId}:${sessionId}`;
    await this.redis.del(key);
    console.log(`🗑️ [SessionManager] セッション削除: ${userId}:${sessionId}`);
  }

  /**
   * ユーザーの全セッション削除
   */
  public async deleteAllUserSessions(userId: string): Promise<void> {
    const pattern = `${REDIS_KEYS.SESSION}:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`🗑️ [SessionManager] 全セッション削除: ${userId} (${keys.length}件)`);
    }
  }

  /**
   * トークンをブラックリストに追加
   */
  public async blacklistToken(
    tokenId: string,
    entry: TokenBlacklistEntry,
    ttlSeconds: number
  ): Promise<void> {
    const key = `${REDIS_KEYS.TOKEN_BLACKLIST}:${tokenId}`;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(entry));
    console.log(`🚫 [SessionManager] トークンブラックリスト追加: ${tokenId} (${entry.reason})`);
  }

  /**
   * トークンがブラックリストに登録されているかチェック
   */
  public async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const key = `${REDIS_KEYS.TOKEN_BLACKLIST}:${tokenId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * リフレッシュトークン保存
   */
  public async storeRefreshToken(
    tokenId: string,
    tokenData: Omit<RefreshTokenData, 'createdAt' | 'lastUsedAt'>,
    ttlSeconds: number = 7 * 24 * 60 * 60 // 7日
  ): Promise<void> {
    const now = new Date().toISOString();
    const fullTokenData: RefreshTokenData = {
      ...tokenData,
      createdAt: now,
      lastUsedAt: now,
    };

    const key = `${REDIS_KEYS.REFRESH_TOKEN}:${tokenId}`;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(fullTokenData));
  }

  /**
   * リフレッシュトークン取得・更新
   */
  public async getRefreshToken(tokenId: string): Promise<RefreshTokenData | null> {
    const key = `${REDIS_KEYS.REFRESH_TOKEN}:${tokenId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      const tokenData: RefreshTokenData = JSON.parse(data);

      // 最終使用時刻を更新
      tokenData.lastUsedAt = new Date().toISOString();

      // TTLを取得して同じ期間で更新
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, JSON.stringify(tokenData));
      }

      return tokenData;
    } catch (error) {
      console.error(`❌ [SessionManager] リフレッシュトークン解析エラー: ${key}`, error);
      return null;
    }
  }

  /**
   * リフレッシュトークン削除
   */
  public async deleteRefreshToken(tokenId: string): Promise<void> {
    const key = `${REDIS_KEYS.REFRESH_TOKEN}:${tokenId}`;
    await this.redis.del(key);
  }

  /**
   * ユーザーの全リフレッシュトークン削除
   */
  public async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    // パターンマッチングでユーザーのトークンを検索
    const pattern = `${REDIS_KEYS.REFRESH_TOKEN}:*`;
    const keys = await this.redis.keys(pattern);

    const userTokenKeys: string[] = [];

    // 並列でデータを取得
    const keyDataPairs = await Promise.all(
      keys.map(async key => {
        const data = await this.redis.get(key);
        return { key, data };
      })
    );

    for (const { key, data } of keyDataPairs) {
      if (data) {
        try {
          const tokenData: RefreshTokenData = JSON.parse(data);
          if (tokenData.userId === userId) {
            userTokenKeys.push(key);
          }
        } catch {
          // 無効なデータは削除
          userTokenKeys.push(key);
        }
      }
    }

    if (userTokenKeys.length > 0) {
      await this.redis.del(...userTokenKeys);
      console.log(
        `🗑️ [SessionManager] 全リフレッシュトークン削除: ${userId} (${userTokenKeys.length}件)`
      );
    }
  }

  /**
   * セッション統計取得
   */
  public async getSessionStats(userId: string): Promise<{
    activeSessions: number;
    activeRefreshTokens: number;
  }> {
    const sessionPattern = `${REDIS_KEYS.SESSION}:${userId}:*`;
    const sessionKeys = await this.redis.keys(sessionPattern);

    // リフレッシュトークンの数を取得
    const refreshTokenPattern = `${REDIS_KEYS.REFRESH_TOKEN}:*`;
    const refreshTokenKeys = await this.redis.keys(refreshTokenPattern);

    let activeRefreshTokens = 0;

    // 並列でデータを取得
    const tokenDataPairs = await Promise.all(
      refreshTokenKeys.map(async key => {
        const data = await this.redis.get(key);
        return { key, data };
      })
    );

    for (const { data } of tokenDataPairs) {
      if (data) {
        try {
          const tokenData: RefreshTokenData = JSON.parse(data);
          if (tokenData.userId === userId) {
            activeRefreshTokens++;
          }
        } catch {
          // 無効なデータはカウントしない
        }
      }
    }

    return {
      activeSessions: sessionKeys.length,
      activeRefreshTokens,
    };
  }
}

/**
 * セッション管理インスタンスをエクスポート
 */
export const sessionManager = RedisSessionManager.getInstance();
