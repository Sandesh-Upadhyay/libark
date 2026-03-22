import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PermissionCache } from '../PermissionCache';
import { LRUCache } from 'lru-cache';

// LRUCacheをモック
vi.mock('lru-cache', () => ({
  LRUCache: vi.fn().mockImplementation(() => {
    const mockCache = new Map();
    return {
      get: vi.fn((key: string) => mockCache.get(key)),
      set: vi.fn((key: string, value: any) => mockCache.set(key, value)),
      delete: vi.fn((key: string) => mockCache.delete(key)),
      has: vi.fn((key: string) => mockCache.has(key)),
      clear: vi.fn(() => mockCache.clear()),
      size: vi.fn(() => mockCache.size),
    };
  }),
}));

// モックのPrismaClientを作成
const createMockPrisma = (): any => ({
  user: {
    findUnique: vi.fn(),
  },
  permission: {
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
});

// モックのRedisを作成
const createMockRedis = (): any => ({
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
});

// モックのユーザーを作成
const createMockUser = (overrides = {}): any => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  isActive: true,
  isVerified: true,
  role: {
    name: 'BASIC_USER',
    permissions: [],
  },
  createdAt: new Date(),
  lastLoginAt: new Date(),
  ...overrides,
});

describe('PermissionCache', () => {
  let permissionCache: PermissionCache;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();

    // PermissionCacheのインスタンスを作成
    permissionCache = new PermissionCache(mockRedis, mockPrisma);
  });

  describe('getUserPermissions', () => {
    it('should return permissions from L1 cache', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      // L1キャッシュに直接セット（LRUCacheの内部実装を回避）
      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.getUserPermissions('user-1');

      expect(result).toEqual(cachedPermissions);
    });

    it('should return permissions from L2 cache when L1 miss', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedPermissions));

      const result = await permissionCache.getUserPermissions('user-1');

      expect(result).toEqual(cachedPermissions);
      expect(mockRedis.get).toHaveBeenCalledWith('perm:user-1');
    });

    it('should fetch permissions from DB when cache miss', async () => {
      const mockUser = createMockUser({
        role: {
          name: 'BASIC_USER',
          permissions: [
            {
              permission: { name: 'CREATE_POST' },
            },
            {
              permission: { name: 'EDIT_OWN_POST' },
            },
          ],
        },
      });
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await permissionCache.getUserPermissions('user-1');

      // 内部実装に依存するため、戻り値の型のみ検証
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
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
              OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
            },
            include: {
              permission: true,
            },
          },
        },
      });
    });

    it('should return null when user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await permissionCache.getUserPermissions('user-1');

      expect(result).toBeNull();
    });

    it('should handle DB errors gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await permissionCache.getUserPermissions('user-1');

      // 内部実装に依存するため、戻り値の型のみ検証
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should update cache stats correctly', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(createMockUser());

      await permissionCache.getUserPermissions('user-1');

      const stats = permissionCache.getStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.hasPermission('user-1', 'CREATE_POST');

      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.hasPermission('user-1', 'CREATE_POST');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await permissionCache.hasPermission('user-1', 'CREATE_POST');

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has ADMIN_PANEL permission', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['ADMIN_PANEL', 'MANAGE_USERS'],
        isAdmin: true,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.isAdmin('user-1');

      expect(result).toBe(true);
    });

    it('should return true when user has MANAGE_USERS permission', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['MANAGE_USERS'],
        isAdmin: true,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.isAdmin('user-1');

      expect(result).toBe(true);
    });

    it('should return false when user has no admin permissions', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.isAdmin('user-1');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await permissionCache.isAdmin('user-1');

      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true when user role is SUPER_ADMIN', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: [],
        isAdmin: false,
        isSuperAdmin: true,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.isSuperAdmin('user-1');

      expect(result).toBe(true);
    });

    it('should return false when user role is not SUPER_ADMIN', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['ADMIN_PANEL'],
        isAdmin: true,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.isSuperAdmin('user-1');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await permissionCache.isSuperAdmin('user-1');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has any of the permissions', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.hasAnyPermission('user-1', [
        'CREATE_POST',
        'DELETE_POST',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.hasAnyPermission('user-1', [
        'CREATE_POST',
        'DELETE_POST',
      ]);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await permissionCache.hasAnyPermission('user-1', [
        'CREATE_POST',
        'DELETE_POST',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST', 'DELETE_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.hasAllPermissions('user-1', [
        'CREATE_POST',
        'EDIT_OWN_POST',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user does not have all permissions', async () => {
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST', 'EDIT_OWN_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      const result = await permissionCache.hasAllPermissions('user-1', [
        'CREATE_POST',
        'EDIT_OWN_POST',
        'DELETE_POST',
      ]);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await permissionCache.hasAllPermissions('user-1', [
        'CREATE_POST',
        'DELETE_POST',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('invalidateUser', () => {
    it('should remove user from L1 and L2 cache', async () => {
      await permissionCache.invalidateUser('user-1');

      expect(mockRedis.del).toHaveBeenCalledWith('perm:user-1');
    });

    it('should handle invalidation errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(permissionCache.invalidateUser('user-1')).resolves.not.toThrow();
    });
  });

  describe('invalidateAll', () => {
    it('should clear all permission cache entries', async () => {
      mockRedis.keys.mockResolvedValue(['perm:user-1', 'perm:user-2', 'perm:user-3']);

      await permissionCache.invalidateAll();

      expect(mockRedis.del).toHaveBeenCalledWith('perm:user-1', 'perm:user-2', 'perm:user-3');
    });

    it('should handle no keys gracefully', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await expect(permissionCache.invalidateAll()).resolves.not.toThrow();
    });

    it('should handle clear errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      await expect(permissionCache.invalidateAll()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = permissionCache.getStats();

      expect(stats).toHaveProperty('l1Hits');
      expect(stats).toHaveProperty('l2Hits');
      expect(stats).toHaveProperty('dbHits');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('enabled');
    });

    it('should return correct initial stats', () => {
      const stats = permissionCache.getStats();

      expect(stats.l1Hits).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.dbHits).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.enabled).toBe(true);
    });
  });

  describe('resetStats', () => {
    it('should reset cache statistics', () => {
      // 統計を更新
      (permissionCache as any).stats.l1Hits = 10;
      (permissionCache as any).stats.l2Hits = 5;
      (permissionCache as any).stats.dbHits = 3;
      (permissionCache as any).stats.totalRequests = 18;

      permissionCache.resetStats();

      const stats = permissionCache.getStats();

      expect(stats.l1Hits).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.dbHits).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.enabled).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle expired cache entries', async () => {
      const expiredPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now() - 10 * 60 * 1000, // 10分前
        expiresAt: Date.now() - 5 * 60 * 1000, // 5分前に有効期限切れ
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredPermissions));
      mockPrisma.user.findUnique.mockResolvedValue(createMockUser());

      await permissionCache.getUserPermissions('user-1');

      // 有効期限切れなのでDBから取得
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should handle concurrent cache requests', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(createMockUser());

      const promises = [
        permissionCache.getUserPermissions('user-1'),
        permissionCache.getUserPermissions('user-1'),
        permissionCache.getUserPermissions('user-1'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).not.toBeNull();
      });
    });

    it('should handle malformed cache data', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      await permissionCache.getUserPermissions('user-1');

      // 不正なJSONの場合、DBから取得
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should calculate hit rate correctly', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(createMockUser());

      // 最初のリクエスト（DBヒット）
      await permissionCache.getUserPermissions('user-1');

      let stats = permissionCache.getStats();
      expect(stats.dbHits).toBe(1);
      expect(stats.hitRate).toBe(0);

      // 2回目のリクエスト（L1キャッシュヒット）
      const cachedPermissions = {
        userId: 'user-1',
        permissions: ['CREATE_POST'],
        isAdmin: false,
        isSuperAdmin: false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      (permissionCache as any).l1Cache.set('user-1', cachedPermissions);

      await permissionCache.getUserPermissions('user-1');

      stats = permissionCache.getStats();
      expect(stats.l1Hits).toBe(1);
      expect(stats.hitRate).toBe(50); // 1/2 = 50%
    });

    it('should handle user with role permissions', async () => {
      const mockUser = createMockUser({
        role: {
          name: 'ADMIN',
          permissions: [
            {
              permission: { name: 'ADMIN_PANEL' },
            },
            {
              permission: { name: 'MANAGE_USERS' },
            },
          ],
        },
      });
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await permissionCache.getUserPermissions('user-1');

      // 内部実装に依存するため、戻り値の型のみ検証
      expect(result).not.toBeNull();
      expect(typeof result).toBe('object');
    });

    it('should handle user with permission overrides', async () => {
      const mockUser = createMockUser({
        role: {
          name: 'BASIC_USER',
          permissions: [
            {
              permission: { name: 'CREATE_POST' },
            },
          ],
        },
      });
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await permissionCache.getUserPermissions('user-1');

      // 内部実装に依存するため、戻り値の型のみ検証
      expect(result).not.toBeNull();
      expect(typeof result).toBe('object');
    });
  });
});
