/**
 * 🚀 高性能権限キャッシュシステム
 *
 * 責任:
 * - ユーザー権限の高速キャッシュ
 * - 権限チェックの最適化
 * - 権限変更時の自動無効化
 * - 統計情報の収集
 */

import type { Redis } from 'ioredis';
import type { PrismaClient } from '@libark/db';
import { LRUCache } from 'lru-cache';
import { SecurityEventType, logSecurityEvent } from '@libark/core-shared';

// 権限情報
export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  isActive: boolean;
  permission: {
    id: string;
    name: string;
    description: string;
  };
}

// キャッシュされた権限情報
export interface CachedPermissions {
  userId: string;
  permissions: string[]; // 権限名の配列
  isAdmin: boolean;
  isSuperAdmin: boolean;
  cachedAt: number;
  expiresAt: number;
}

// 権限キャッシュ統計
export interface PermissionCacheStats {
  l1Hits: number;
  l2Hits: number;
  dbHits: number;
  totalRequests: number;
  hitRate: number;
  enabled: boolean;
}

/**
 * 高性能権限キャッシュシステム
 */
export class PermissionCache {
  private l1Cache: LRUCache<string, CachedPermissions>;
  private stats: PermissionCacheStats;
  private readonly L1_TTL = 5 * 60 * 1000; // 5分
  private readonly L2_TTL = 15 * 60; // 15分（秒）
  private readonly CACHE_KEY_PREFIX = 'perm:';

  constructor(
    private redis: Redis,
    private prisma: PrismaClient
  ) {
    // L1キャッシュ（メモリ）の初期化
    this.l1Cache = new LRUCache<string, CachedPermissions>({
      max: 1000, // 最大1000ユーザーの権限をキャッシュ
      ttl: this.L1_TTL,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });

    // 統計情報の初期化
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      dbHits: 0,
      totalRequests: 0,
      hitRate: 0,
      enabled: true,
    };

    console.log('🚀 [PermissionCache] 高性能権限キャッシュシステム初期化完了');
  }

  /**
   * ユーザーの権限を取得（キャッシュ優先）
   */
  async getUserPermissions(userId: string): Promise<CachedPermissions | null> {
    this.stats.totalRequests++;

    try {
      // L1キャッシュ（メモリ）をチェック
      const l1Result = this.l1Cache.get(userId);
      if (l1Result && l1Result.expiresAt > Date.now()) {
        this.stats.l1Hits++;
        this.updateHitRate();
        return l1Result;
      }

      // L2キャッシュ（Redis）をチェック
      const l2Key = `${this.CACHE_KEY_PREFIX}${userId}`;
      const l2Result = await this.redis.get(l2Key);

      if (l2Result) {
        const cachedPermissions: CachedPermissions = JSON.parse(l2Result);

        if (cachedPermissions.expiresAt > Date.now()) {
          this.stats.l2Hits++;
          this.updateHitRate();

          // L1キャッシュにも保存
          this.l1Cache.set(userId, cachedPermissions);

          return cachedPermissions;
        }
      }

      // データベースから取得
      const permissions = await this.fetchPermissionsFromDB(userId);
      if (!permissions) {
        return null;
      }

      this.stats.dbHits++;
      this.updateHitRate();

      // キャッシュに保存
      await this.cachePermissions(userId, permissions);

      return permissions;
    } catch (error) {
      console.error('❌ [PermissionCache] 権限取得エラー:', error);

      // エラー時はDBから直接取得を試行
      try {
        return await this.fetchPermissionsFromDB(userId);
      } catch (dbError) {
        console.error('❌ [PermissionCache] DB権限取得エラー:', dbError);
        return null;
      }
    }
  }

  /**
   * 権限チェック（高速化）
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    if (!permissions) {
      return false;
    }

    return permissions.permissions.includes(permissionName);
  }

  /**
   * 管理者権限チェック
   */
  async isAdmin(userId: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    if (!permissions) {
      return false;
    }

    return permissions.isAdmin;
  }

  /**
   * スーパー管理者権限チェック
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    if (!permissions) {
      return false;
    }

    return permissions.isSuperAdmin;
  }

  /**
   * 複数権限チェック
   */
  async hasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    if (!permissions) {
      return false;
    }

    return permissionNames.some(name => permissions.permissions.includes(name));
  }

  /**
   * 全権限チェック
   */
  async hasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    if (!permissions) {
      return false;
    }

    return permissionNames.every(name => permissions.permissions.includes(name));
  }

  /**
   * データベースから権限を取得（新しいRole + Permission分離システム）
   */
  private async fetchPermissionsFromDB(userId: string): Promise<CachedPermissions | null> {
    try {
      // ユーザーとロール、権限を取得
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
          permissionOverrides: {
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user) return null;

      // ロールから継承される権限
      const rolePermissions = (user.role?.permissions || []).map(
        (rp: { permission: { name: string } }) => rp.permission.name
      );

      // ユーザー個別の上書き権限
      const overrides = new Map<string, boolean>();
      (user.permissionOverrides || []).forEach(
        (override: { permission: { name: string }; allowed: boolean }) => {
          overrides.set(override.permission.name, override.allowed);
        }
      );

      // 最終的な権限リスト（上書きを適用）
      const finalPermissions = new Set<string>();

      // ロール権限を追加
      rolePermissions.forEach((permission: string) => {
        if (!overrides.has(permission) || overrides.get(permission) === true) {
          finalPermissions.add(permission);
        }
      });

      // 明示的に許可された上書き権限を追加
      overrides.forEach((allowed, permission) => {
        if (allowed) {
          finalPermissions.add(permission);
        }
      });

      const permissions = Array.from(finalPermissions);
      const isAdmin = permissions.includes('ADMIN_PANEL') || permissions.includes('MANAGE_USERS');
      const isSuperAdmin = user.role?.name === 'SUPER_ADMIN';

      const now = Date.now();
      return {
        userId,
        permissions,
        isAdmin,
        isSuperAdmin,
        cachedAt: now,
        expiresAt: now + this.L1_TTL,
      };
    } catch (error) {
      console.error('❌ [PermissionCache] DB権限取得エラー:', error);
      return null;
    }
  }

  /**
   * 権限をキャッシュに保存
   */
  private async cachePermissions(userId: string, permissions: CachedPermissions): Promise<void> {
    try {
      // L1キャッシュ（メモリ）に保存
      this.l1Cache.set(userId, permissions);

      // L2キャッシュ（Redis）に保存
      const l2Key = `${this.CACHE_KEY_PREFIX}${userId}`;
      await this.redis.setex(l2Key, this.L2_TTL, JSON.stringify(permissions));
    } catch (error) {
      console.error('❌ [PermissionCache] キャッシュ保存エラー:', error);
    }
  }

  /**
   * ユーザーの権限キャッシュを無効化
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      // L1キャッシュから削除
      this.l1Cache.delete(userId);

      // L2キャッシュから削除
      const l2Key = `${this.CACHE_KEY_PREFIX}${userId}`;
      await this.redis.del(l2Key);

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.CONFIGURATION_CHANGE,
        userId,
        severity: 'LOW',
        details: { action: 'permission_cache_invalidated' },
      });

      console.log(`🔄 [PermissionCache] ユーザー権限キャッシュ無効化: ${userId}`);
    } catch (error) {
      console.error('❌ [PermissionCache] キャッシュ無効化エラー:', error);
    }
  }

  /**
   * 全権限キャッシュを無効化
   */
  async invalidateAll(): Promise<void> {
    try {
      // L1キャッシュをクリア
      this.l1Cache.clear();

      // L2キャッシュをクリア（パターンマッチング）
      const keys = await this.redis.keys(`${this.CACHE_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // セキュリティログ記録
      logSecurityEvent({
        eventType: SecurityEventType.CONFIGURATION_CHANGE,
        severity: 'MEDIUM',
        details: { action: 'all_permission_cache_invalidated', keysCleared: keys.length },
      });

      console.log(`🔄 [PermissionCache] 全権限キャッシュ無効化完了: ${keys.length}件`);
    } catch (error) {
      console.error('❌ [PermissionCache] 全キャッシュ無効化エラー:', error);
    }
  }

  /**
   * ヒット率を更新
   */
  private updateHitRate(): void {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    this.stats.hitRate =
      this.stats.totalRequests > 0 ? (totalHits / this.stats.totalRequests) * 100 : 0;
  }

  /**
   * 統計情報を取得
   */
  getStats(): PermissionCacheStats {
    return { ...this.stats };
  }

  /**
   * 統計情報をリセット
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      dbHits: 0,
      totalRequests: 0,
      hitRate: 0,
      enabled: true,
    };
  }
}
