import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthenticatedUser } from '@libark/core-shared';

import { AuthCache } from '../AuthCache';

// モックのPrismaClientを作成
const createMockPrisma = (): any => ({
  user: {
    findUnique: vi.fn(),
  },
  role: {
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  },
  userPermissionOverride: {
    findMany: vi.fn(),
  },
  userFeaturePermission: {
    findMany: vi.fn(),
  },
});

// モックのRedisを作成
const createMockRedis = (): any => ({
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
});

// モックのユーザーを作成
const createMockUser = (overrides = {}): AuthenticatedUser => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  isActive: true,
  isVerified: true,
  role: 'BASIC_USER',
  permissions: [],
  createdAt: new Date(),
  lastLoginAt: new Date(),
  ...overrides,
});

describe('AuthCache', () => {
  let authCache: AuthCache;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();

    // AuthCacheのインスタンスを作成
    authCache = new AuthCache(mockRedis, mockPrisma);
  });

  describe('getUser', () => {
    it('should return user from L1 cache', async () => {
      const mockUser = createMockUser();
      // L1キャッシュに直接セット（LRUCacheの内部実装を回避）
      (authCache as any).l1Cache.set('user-1', {
        user: mockUser,
        permissions: [],
        lastUpdated: new Date(),
        ttl: 5 * 60 * 1000,
      });

      const result = await authCache.getUser('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should return user from L2 cache when L1 cache miss', async () => {
      const mockUser = createMockUser();
      const cacheEntry = {
        user: mockUser,
        permissions: [],
        lastUpdated: new Date(),
        ttl: 5 * 60 * 1000,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cacheEntry));

      const result = await authCache.getUser('user-1');

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
        lastLoginAt: mockUser.lastLoginAt.toISOString(),
      });
      expect(mockRedis.get).toHaveBeenCalledWith('auth:user:user-1');
    });

    it('should fetch user from DB when cache miss', async () => {
      const mockUser = createMockUser();
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authCache.getUser('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          isActive: true,
        },
      });
    });

    it('should return null when user not found in DB', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authCache.getUser('user-1');

      expect(result).toBeNull();
    });

    it('should handle DB errors gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await authCache.getUser('user-1');

      expect(result).toBeNull();
    });

    it('should update cache stats correctly', async () => {
      const mockUser = createMockUser();
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authCache.getUser('user-1');

      const stats = authCache.getStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions from Redis cache', async () => {
      const permissions = ['CREATE_POST', 'EDIT_OWN_POST'];
      mockRedis.get.mockResolvedValue(JSON.stringify(permissions));

      const result = await authCache.getUserPermissions('user-1');

      expect(result).toEqual(permissions);
      expect(mockRedis.get).toHaveBeenCalledWith('auth:permissions:user-1');
    });

    it('should fetch permissions from DB when cache miss', async () => {
      const permissions = ['CREATE_POST', 'EDIT_OWN_POST'];
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: {
          permissions: [
            { permission: { name: 'CREATE_POST' } },
            { permission: { name: 'EDIT_OWN_POST' } },
          ],
        },
      });
      mockPrisma.userPermissionOverride.findMany.mockResolvedValue([]);
      mockPrisma.userFeaturePermission.findMany.mockResolvedValue([]);

      const result = await authCache.getUserPermissions('user-1');

      expect(result).toEqual(permissions);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'auth:permissions:user-1',
        10 * 60,
        JSON.stringify(permissions)
      );
    });

    it('should handle DB errors gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await authCache.getUserPermissions('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('cacheUser', () => {
    it('should cache user in L1 and L2', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: {
          permissions: [
            { permission: { name: 'CREATE_POST' } },
            { permission: { name: 'EDIT_OWN_POST' } },
          ],
        },
      });
      mockPrisma.userPermissionOverride.findMany.mockResolvedValue([]);
      mockPrisma.userFeaturePermission.findMany.mockResolvedValue([]);

      await authCache.cacheUser(mockUser);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'auth:user:user-1',
        15 * 60,
        expect.stringContaining('"user":')
      );
    });

    it('should handle cache errors gracefully', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(authCache.cacheUser(mockUser)).resolves.not.toThrow();
    });
  });

  describe('invalidateUser', () => {
    it('should remove user from L1 and L2 cache', async () => {
      await authCache.invalidateUser('user-1');

      // Redis.delが呼ばれることを検証
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should handle invalidation errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(authCache.invalidateUser('user-1')).resolves.not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should clear all auth cache entries', async () => {
      mockRedis.keys.mockResolvedValue([
        'auth:user:user-1',
        'auth:permissions:user-1',
        'auth:user:user-2',
      ]);

      await authCache.clearAll();

      // Redis.delが呼ばれることを検証
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should handle no keys gracefully', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await expect(authCache.clearAll()).resolves.not.toThrow();
    });

    it('should handle clear errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      await expect(authCache.clearAll()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = authCache.getStats();

      expect(stats).toHaveProperty('l1Hits');
      expect(stats).toHaveProperty('l2Hits');
      expect(stats).toHaveProperty('dbHits');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should return correct initial stats', () => {
      const stats = authCache.getStats();

      expect(stats.l1Hits).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.dbHits).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset cache statistics', () => {
      // 統計を更新
      (authCache as any).stats.l1Hits = 10;
      (authCache as any).stats.l2Hits = 5;
      (authCache as any).stats.dbHits = 3;
      (authCache as any).stats.totalRequests = 18;

      authCache.resetStats();

      const stats = authCache.getStats();

      expect(stats.l1Hits).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.dbHits).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle expired cache entries', async () => {
      const mockUser = createMockUser();
      const expiredEntry = {
        user: mockUser,
        permissions: [],
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000), // 10分前
        ttl: 5 * 60 * 1000, // 5分TTL
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredEntry));
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authCache.getUser('user-1');

      // 有効期限切れなのでDBから取得
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should handle concurrent cache requests', async () => {
      const mockUser = createMockUser();
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const promises = [
        authCache.getUser('user-1'),
        authCache.getUser('user-1'),
        authCache.getUser('user-1'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([mockUser, mockUser, mockUser]);
    });

    it('should handle malformed cache data', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      await authCache.getUser('user-1');

      // 不正なJSONの場合、DBから取得
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should calculate hit rate correctly', async () => {
      const mockUser = createMockUser();
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // 最初のリクエスト（DBヒット）
      await authCache.getUser('user-1');

      let stats = authCache.getStats();
      expect(stats.dbHits).toBe(1);
      expect(stats.hitRate).toBe(0);

      // 2回目のリクエスト（L1キャッシュヒット）
      (authCache as any).l1Cache.set('user-1', {
        user: mockUser,
        permissions: [],
        lastUpdated: new Date(),
        ttl: 5 * 60 * 1000,
      });

      await authCache.getUser('user-1');

      stats = authCache.getStats();
      expect(stats.l1Hits).toBe(1);
      expect(stats.hitRate).toBe(50); // 1/2 = 50%
    });
  });
});
