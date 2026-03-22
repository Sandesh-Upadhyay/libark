/**
 * 🚀 高性能認証キャッシュシステム
 *
 * 3層キャッシュ戦略:
 * - L1: メモリキャッシュ（最高速）
 * - L2: Redisキャッシュ（分散対応）
 * - L3: データベース（永続化）
 */

import { LRUCache } from 'lru-cache';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '@libark/db';
import type { AuthenticatedUser } from '@libark/core-shared';
import { envUtils } from '@libark/core-shared';

export interface UserCacheEntry {
  user: AuthenticatedUser;
  permissions: string[];
  lastUpdated: Date;
  ttl: number;
}

export interface CacheStats {
  l1Hits: number;
  l2Hits: number;
  dbHits: number;
  totalRequests: number;
  hitRate: number;
}

export class AuthCache {
  private l1Cache: LRUCache<string, UserCacheEntry>;
  private redis: Redis;
  private prisma: PrismaClient;
  private stats: CacheStats;

  // キャッシュ設定
  private readonly L1_MAX_SIZE = 1000;
  private readonly L1_TTL = 5 * 60 * 1000; // 5分
  private readonly L2_TTL = 15 * 60; // 15分（秒）
  private readonly PERMISSION_TTL = 10 * 60; // 10分（秒）

  constructor(redis: Redis, prisma: PrismaClient) {
    this.redis = redis;
    this.prisma = prisma;

    // L1キャッシュ（メモリ）初期化
    this.l1Cache = new LRUCache<string, UserCacheEntry>({
      max: this.L1_MAX_SIZE,
      ttl: this.L1_TTL,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });

    // 統計情報初期化
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      dbHits: 0,
      totalRequests: 0,
      hitRate: 0,
    };

    this.logCacheInfo();
  }

  /**
   * ユーザー情報を取得（3層キャッシュ戦略）
   */
  async getUser(userId: string): Promise<AuthenticatedUser | null> {
    this.stats.totalRequests++;
    const cacheKey = `auth:user:${userId}`;

    try {
      // L1キャッシュチェック（メモリ）
      const l1Entry = this.l1Cache.get(userId);
      if (l1Entry && !this.isExpired(l1Entry)) {
        this.stats.l1Hits++;
        this.updateHitRate();
        return l1Entry.user;
      }

      // L2キャッシュチェック（Redis）
      const l2Data = await this.redis.get(cacheKey);
      if (l2Data) {
        try {
          const entry: UserCacheEntry = JSON.parse(l2Data);
          if (!this.isExpired(entry)) {
            // L1に昇格
            this.l1Cache.set(userId, entry);
            this.stats.l2Hits++;
            this.updateHitRate();
            return entry.user;
          }
        } catch (error) {
          console.warn(`⚠️ [AuthCache] L2キャッシュ解析エラー: ${cacheKey}`, error);
        }
      }

      // L3（データベース）から取得
      const user = await this.fetchUserFromDB(userId);
      if (user) {
        await this.cacheUser(user);
        this.stats.dbHits++;
      }

      this.updateHitRate();
      return user;
    } catch (error) {
      console.error(`❌ [AuthCache] ユーザー取得エラー: ${userId}`, error);
      // キャッシュエラー時はDBから直接取得
      return this.fetchUserFromDB(userId);
    }
  }

  /**
   * ユーザー権限を取得（キャッシュ優先）
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `auth:permissions:${userId}`;

    try {
      // Redisキャッシュチェック
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // データベースから取得
      const permissions = await this.fetchUserPermissions(userId);

      // キャッシュに保存
      await this.redis.setex(cacheKey, this.PERMISSION_TTL, JSON.stringify(permissions));

      return permissions;
    } catch (error) {
      console.error(`❌ [AuthCache] 権限取得エラー: ${userId}`, error);
      return this.fetchUserPermissions(userId);
    }
  }

  /**
   * ユーザー情報をキャッシュに保存
   */
  async cacheUser(user: AuthenticatedUser): Promise<void> {
    try {
      const permissions = await this.getUserPermissions(user.id);
      const entry: UserCacheEntry = {
        user,
        permissions,
        lastUpdated: new Date(),
        ttl: this.L1_TTL,
      };

      // L1とL2の両方にキャッシュ
      this.l1Cache.set(user.id, entry);
      await this.redis.setex(`auth:user:${user.id}`, this.L2_TTL, JSON.stringify(entry));

      if (envUtils.isDevelopment()) {
        console.log(`✅ [AuthCache] ユーザーキャッシュ保存: ${user.username}`);
      }
    } catch (error) {
      console.error(`❌ [AuthCache] キャッシュ保存エラー: ${user.id}`, error);
    }
  }

  /**
   * キャッシュを無効化
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      // L1キャッシュから削除
      this.l1Cache.delete(userId);

      // L2キャッシュから削除
      await Promise.all([
        this.redis.del(`auth:user:${userId}`),
        this.redis.del(`auth:permissions:${userId}`),
      ]);

      if (envUtils.isDevelopment()) {
        console.log(`🗑️ [AuthCache] キャッシュ無効化: ${userId}`);
      }
    } catch (error) {
      console.error(`❌ [AuthCache] キャッシュ無効化エラー: ${userId}`, error);
    }
  }

  /**
   * 全キャッシュをクリア
   */
  async clearAll(): Promise<void> {
    try {
      this.l1Cache.clear();

      // Redisの認証関連キーを削除
      const keys = await this.redis.keys('auth:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      console.log('🧹 [AuthCache] 全キャッシュクリア完了');
    } catch (error) {
      console.error('❌ [AuthCache] キャッシュクリアエラー:', error);
    }
  }

  /**
   * キャッシュ統計情報を取得
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * キャッシュ統計をリセット
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      dbHits: 0,
      totalRequests: 0,
      hitRate: 0,
    };
  }

  // プライベートメソッド

  private async fetchUserFromDB(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          isActive: true,
        },
      });

      return user as AuthenticatedUser | null;
    } catch (error) {
      console.error(`❌ [AuthCache] DB取得エラー: ${userId}`, error);
      return null;
    }
  }

  private async fetchUserPermissions(userId: string): Promise<string[]> {
    try {
      // 実際のテーブル構造に対応: User-Role直接関連
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // ロールから権限を取得
      const rolePermissions = (user?.role?.permissions || []).map((rp: { permission: { id: string; name: string } }) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      }));

      // 個別権限上書きを取得
      const userPermissionOverrides = await this.prisma.userPermissionOverride.findMany({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          permission: true,
        },
      });

      // 上書き権限を処理（許可されたもののみ）
      const overridePermissions = userPermissionOverrides
        .filter((upo: { allowed: boolean }) => upo.allowed)
        .map((upo: { permission: { id: string; name: string } }) => ({
          id: upo.permission.id,
          name: upo.permission.name,
        }));

      // 機能権限を取得（UserFeaturePermissionは権限名を直接持つ）
      const userFeaturePermissions = await this.prisma.userFeaturePermission.findMany({
        where: {
          userId,
          isEnabled: true,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      const featurePermissions = userFeaturePermissions.map((ufp: { featureName: string }) => ufp.featureName);

      // 重複を除去して結合
      return [
        ...new Set([
          ...rolePermissions.map((p: { name: string }) => p.name),
          ...overridePermissions.map((p: { name: string }) => p.name),
          ...featurePermissions,
        ]),
      ];
    } catch (error) {
      console.error(`❌ [AuthCache] 権限取得エラー: ${userId}`, error);
      // フォールバック: 空の権限リストを返す
      return [];
    }
  }

  private isExpired(entry: UserCacheEntry): boolean {
    const now = Date.now();
    const entryTime = new Date(entry.lastUpdated).getTime();
    return now - entryTime > entry.ttl;
  }

  private updateHitRate(): void {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    this.stats.hitRate =
      this.stats.totalRequests > 0 ? (totalHits / this.stats.totalRequests) * 100 : 0;
  }

  private logCacheInfo(): void {
    if (envUtils.isDevelopment()) {
      console.log('🚀 [AuthCache] 高性能認証キャッシュシステム初期化完了');
      console.log(`   L1キャッシュ: ${this.L1_MAX_SIZE}エントリ, TTL: ${this.L1_TTL / 1000}秒`);
      console.log(`   L2キャッシュ: TTL: ${this.L2_TTL}秒`);
      console.log(`   権限キャッシュ: TTL: ${this.PERMISSION_TTL}秒`);
    }
  }
}
