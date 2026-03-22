/**
 * 🔐 統合セッション管理システム
 *
 * 責任:
 * - JWT認証とRedisセッションの統合
 * - セッションライフサイクルの一貫した管理
 * - 同時セッション制限
 * - セッション統計とモニタリング
 * - セキュリティポリシーの統一
 */

import type { Redis } from 'ioredis';
import type { PrismaClient } from '@libark/db';
import { SecurityEventType, logSecurityEvent } from '@libark/core-shared';
import type { AuthenticatedUser } from '@libark/core-shared';
import { randomBytesHex } from '@libark/core-server/security/server-crypto';

// 統合セッション情報（簡素化: refreshToken/tokenExpiresAtを削除）
export interface IntegratedSession {
  sessionId: string;
  userId: string;
  username: string;
  email: string;

  // JWT情報
  accessToken: string;

  // セッション情報
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };

  // タイムスタンプ
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;

  // セキュリティ
  isActive: boolean;
  isSuspicious: boolean;
}

// セッション作成オプション（簡素化: refreshToken除去）
export interface CreateSessionOptions {
  user: AuthenticatedUser;
  accessToken: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
  ttlSeconds?: number;
}

// セッション統計
export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

/**
 * 統合セッション管理システム
 */
export class IntegratedSessionManager {
  private static instance: IntegratedSessionManager;
  private readonly SESSION_PREFIX = 'integrated_session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7日
  private readonly MAX_SESSIONS_PER_USER = 5; // ユーザーあたりの最大セッション数

  private constructor(
    private redis: Redis,
    private prisma: PrismaClient
  ) {
    console.log('🔐 [IntegratedSessionManager] 統合セッション管理システム初期化完了');
  }

  public static getInstance(redis: Redis, prisma: PrismaClient): IntegratedSessionManager {
    if (!IntegratedSessionManager.instance) {
      IntegratedSessionManager.instance = new IntegratedSessionManager(redis, prisma);
    }
    return IntegratedSessionManager.instance;
  }

  public static resetInstance(): void {
    IntegratedSessionManager.instance = undefined as unknown as IntegratedSessionManager;
  }

  /**
   * セッション作成
   */
  async createSession(options: CreateSessionOptions): Promise<IntegratedSession> {
    const sessionId = await this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (options.ttlSeconds || this.DEFAULT_TTL) * 1000);

    const session: IntegratedSession = {
      sessionId,
      userId: options.user.id,
      username: options.user.username,
      email: options.user.email,
      accessToken: options.accessToken,
      deviceId: options.deviceId,
      deviceName: options.deviceName,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      location: options.location,
      createdAt: now,
      lastAccessAt: now,
      expiresAt,
      isActive: true,
      isSuspicious: false,
    };

    // 同時セッション制限チェック
    await this.enforceSessionLimit(options.user.id);

    // Redisに保存
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${options.user.id}`;

    await Promise.all([
      // セッション情報を保存
      this.redis.setex(sessionKey, options.ttlSeconds || this.DEFAULT_TTL, JSON.stringify(session)),
      // ユーザーのセッション一覧に追加
      this.redis.sadd(userSessionsKey, sessionId),
      this.redis.expire(userSessionsKey, options.ttlSeconds || this.DEFAULT_TTL),
    ]);

    // セキュリティログ記録
    logSecurityEvent({
      eventType: SecurityEventType.SESSION_CREATED,
      userId: options.user.id,
      username: options.user.username,
      email: options.user.email,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      severity: 'LOW',
      details: {
        sessionId,
        deviceId: options.deviceId,
        deviceName: options.deviceName,
        location: options.location,
      },
    });

    console.log(`✅ [IntegratedSessionManager] セッション作成: ${options.user.id}:${sessionId}`);
    return session;
  }

  /**
   * セッション取得・更新
   */
  async getSession(sessionId: string): Promise<IntegratedSession | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.redis.get(sessionKey);

    if (!data) {
      return null;
    }

    try {
      const sessionData = JSON.parse(data);

      // 日付フィールドをDateオブジェクトに変換
      const session: IntegratedSession = {
        ...sessionData,
        createdAt: new Date(sessionData.createdAt),
        lastAccessAt: new Date(sessionData.lastAccessAt),
        expiresAt: new Date(sessionData.expiresAt),
      };

      // 有効期限チェック
      if (new Date() > session.expiresAt || !session.isActive) {
        await this.deleteSession(sessionId);
        return null;
      }

      // 最終アクセス時刻を更新
      session.lastAccessAt = new Date();

      // TTLを取得して同じ期間で更新
      const ttl = await this.redis.ttl(sessionKey);
      if (ttl > 0) {
        await this.redis.setex(sessionKey, ttl, JSON.stringify(session));
      }

      return session;
    } catch (error) {
      console.error(`❌ [IntegratedSessionManager] セッション解析エラー: ${sessionKey}`, error);
      return null;
    }
  }

  /**
   * セッション更新（トークンリフレッシュ時）
   */
  async updateSession(sessionId: string, updates: Partial<IntegratedSession>): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const updatedSession = {
      ...session,
      ...updates,
      lastAccessAt: new Date(),
    };

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const ttl = await this.redis.ttl(sessionKey);

    if (ttl > 0) {
      await this.redis.setex(sessionKey, ttl, JSON.stringify(updatedSession));
      return true;
    }

    return false;
  }

  /**
   * セッション削除
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session) {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;

      await Promise.all([this.redis.del(sessionKey), this.redis.srem(userSessionsKey, sessionId)]);

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.SESSION_EXPIRED,
        userId: session.userId,
        username: session.username,
        email: session.email,
        severity: 'LOW',
        details: { sessionId, reason: 'manual_deletion' },
      });

      console.log(`🗑️ [IntegratedSessionManager] セッション削除: ${session.userId}:${sessionId}`);
    }
  }

  /**
   * ユーザーの全セッション削除
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map(id => `${this.SESSION_PREFIX}${id}`);

      await Promise.all([this.redis.del(...sessionKeys), this.redis.del(userSessionsKey)]);

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.SESSION_EXPIRED,
        userId,
        severity: 'MEDIUM',
        details: {
          reason: 'all_sessions_deleted',
          sessionCount: sessionIds.length,
        },
      });

      console.log(
        `🗑️ [IntegratedSessionManager] 全セッション削除: ${userId} (${sessionIds.length}件)`
      );
    }
  }

  /**
   * 同時セッション制限の実施
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    if (sessionIds && sessionIds.length >= this.MAX_SESSIONS_PER_USER) {
      // 最も古いセッションを削除
      const sessions: IntegratedSession[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      // 作成日時でソートして最も古いものを削除
      sessions.sort((a, b) => {
        const aTime =
          a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const bTime =
          b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
      });
      const sessionsToDelete = sessions.slice(0, sessions.length - this.MAX_SESSIONS_PER_USER + 1);

      for (const session of sessionsToDelete) {
        await this.deleteSession(session.sessionId);
      }

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.CONCURRENT_SESSION_LIMIT,
        userId,
        severity: 'MEDIUM',
        details: {
          maxSessions: this.MAX_SESSIONS_PER_USER,
          deletedSessions: sessionsToDelete.length,
        },
      });
    }
  }

  /**
   * セッションID生成
   */
  private async generateSessionId(): Promise<string> {
    return await randomBytesHex(32);
  }

  /**
   * ユーザーのセッション統計取得
   */
  async getUserSessionStats(userId: string): Promise<SessionStats> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    const sessions: IntegratedSession[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const deviceBreakdown: Record<string, number> = {};
    const locationBreakdown: Record<string, number> = {};

    let activeSessions = 0;
    let suspiciousSessions = 0;
    const recentActivity = { last24h: 0, last7d: 0, last30d: 0 };

    for (const session of sessions) {
      if (session.isActive) activeSessions++;
      if (session.isSuspicious) suspiciousSessions++;

      // デバイス統計
      const device = session.deviceName || 'Unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

      // 位置統計
      const location = session.location?.country || 'Unknown';
      locationBreakdown[location] = (locationBreakdown[location] || 0) + 1;

      // アクティビティ統計
      if (session.lastAccessAt > last24h) recentActivity.last24h++;
      if (session.lastAccessAt > last7d) recentActivity.last7d++;
      if (session.lastAccessAt > last30d) recentActivity.last30d++;
    }

    return {
      totalSessions: sessions.length,
      activeSessions,
      suspiciousSessions,
      deviceBreakdown,
      locationBreakdown,
      recentActivity,
    };
  }

  /**
   * 疑わしいセッションをマーク
   */
  async markSessionSuspicious(sessionId: string, reason: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.updateSession(sessionId, { isSuspicious: true });

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId: session.userId,
        username: session.username,
        email: session.email,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        severity: 'HIGH',
        details: { sessionId, reason, suspiciousActivity: true },
      });
      return true;
    }
    return false;
  }
}
