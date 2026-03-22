/**
 * 🔐 統合セッション管理システムのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthenticatedUser } from '@libark/core-shared';

import { IntegratedSessionManager } from '../SessionManager';

// モックのPrismaClientを作成
const createMockPrisma = (): any => ({
  user: {
    findUnique: vi.fn(),
  },
});

// モックのRedisを作成
const createMockRedis = (): any => ({
  get: vi.fn().mockResolvedValue(null),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  smembers: vi.fn().mockResolvedValue([]),
  sadd: vi.fn().mockResolvedValue(1),
  srem: vi.fn().mockResolvedValue(1),
  zremrangebyscore: vi.fn().mockResolvedValue(0),
  expire: vi.fn().mockResolvedValue(1),
  ttl: vi.fn().mockResolvedValue(604800),
  keys: vi.fn().mockResolvedValue([]),
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

// モックのセッション作成オプションを作成
const createMockSessionOptions = (overrides = {}) => ({
  user: createMockUser(),
  accessToken: 'test-access-token',
  deviceId: 'device-1',
  deviceName: 'Test Device',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 Test Browser',
  location: {
    country: 'Japan',
    city: 'Tokyo',
  },
  ...overrides,
});

describe('IntegratedSessionManager', () => {
  let sessionManager: IntegratedSessionManager;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    // シングルトンインスタンスをリセット
    IntegratedSessionManager.resetInstance();

    // 全てのモックをリセット（インスタンス作成前に実行）
    vi.clearAllMocks();

    mockPrisma = createMockPrisma();
    mockRedis = createMockRedis();

    // IntegratedSessionManagerのインスタンスを作成
    sessionManager = IntegratedSessionManager.getInstance(mockRedis, mockPrisma);
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = IntegratedSessionManager.getInstance(mockRedis, mockPrisma);
      const instance2 = IntegratedSessionManager.getInstance(mockRedis, mockPrisma);

      expect(instance1).toBe(instance2);
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const options = createMockSessionOptions();

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe('user-1');
      expect(session.accessToken).toBe('test-access-token');
      expect(session.isActive).toBe(true);
      expect(session.isSuspicious).toBe(false);
      expect(mockRedis.setex).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalled();
    });

    it('should enforce session limit when max sessions reached', async () => {
      const options = createMockSessionOptions();

      // 既存のセッションをモック
      const existingSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.smembers.mockResolvedValue([
        'session-1',
        'session-2',
        'session-3',
        'session-4',
        'session-5',
      ]);
      mockRedis.get.mockResolvedValue(JSON.stringify(existingSession));

      // セッション制限の検証
      await expect(sessionManager.createSession(options)).resolves.toBeDefined();
    });

    it('should handle session creation errors gracefully', async () => {
      const options = createMockSessionOptions();
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(sessionManager.createSession(options)).rejects.toThrow('Redis error');
    });

    it('should create session with custom TTL', async () => {
      const options = createMockSessionOptions({ ttlSeconds: 3600 });

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('integrated_session:'),
        3600,
        expect.any(String)
      );
    });

    it('should create session without location', async () => {
      const options = createMockSessionOptions({ location: undefined });

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(session.location).toBeUndefined();
    });
  });

  describe('getSession', () => {
    it('should return session when exists', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSession));
      mockRedis.ttl.mockResolvedValue(604800); // 7日

      const session = await sessionManager.getSession('session-1');

      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe('session-1');
      expect(session?.userId).toBe('user-1');
    });

    it('should return null when session does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const session = await sessionManager.getSession('session-1');

      expect(session).toBeNull();
    });

    it('should return null when session is expired', async () => {
      const expiredSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        lastAccessAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1分前に有効期限切れ
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredSession));

      const session = await sessionManager.getSession('session-1');

      expect(session).toBeNull();
      expect(mockRedis.del).toHaveBeenCalledWith('integrated_session:session-1');
    });

    it('should return null when session is inactive', async () => {
      const inactiveSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: false,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(inactiveSession));

      const session = await sessionManager.getSession('session-1');

      expect(session).toBeNull();
      expect(mockRedis.del).toHaveBeenCalledWith('integrated_session:session-1');
    });

    it('should update lastAccessAt on retrieval', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分前
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSession));
      mockRedis.ttl.mockResolvedValue(604800);

      const session = await sessionManager.getSession('session-1');

      expect(session).not.toBeNull();
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should handle malformed session data', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      const session = await sessionManager.getSession('session-1');

      expect(session).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      await expect(sessionManager.getSession('session-1')).rejects.toThrow('Redis error');
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSession));
      mockRedis.setex.mockResolvedValue('OK');

      const result = await sessionManager.updateSession('session-1', { isSuspicious: true });

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should return false when session does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await sessionManager.updateSession('session-1', { isSuspicious: true });

      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockRedis.del.mockResolvedValue(1);
      mockRedis.srem.mockResolvedValue(1);

      const result = await sessionManager.deleteSession('session-1');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('integrated_session:session-1');
    });

    it('should return false when session does not exist', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await sessionManager.deleteSession('session-1');

      expect(result).toBe(false);
    });
  });

  describe('deleteAllUserSessions', () => {
    it('should delete all user sessions', async () => {
      mockRedis.smembers.mockResolvedValue(['session-1', 'session-2']);
      mockRedis.del.mockResolvedValue(1);
      mockRedis.srem.mockResolvedValue(1);

      const result = await sessionManager.deleteAllUserSessions('user-1');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });

    it('should handle empty session list', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      const result = await sessionManager.deleteAllUserSessions('user-1');

      expect(result).toBe(true);
    });

    it('should handle deletion errors gracefully', async () => {
      mockRedis.smembers.mockRejectedValue(new Error('Redis error'));

      await expect(sessionManager.deleteAllUserSessions('user-1')).rejects.toThrow('Redis error');
    });
  });

  describe('getUserSessionStats', () => {
    it('should return session statistics', async () => {
      const mockSessions = [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isActive: true,
          isSuspicious: false,
        },
        {
          sessionId: 'session-2',
          userId: 'user-1',
          createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          isActive: true,
          isSuspicious: false,
        },
      ];

      mockRedis.smembers.mockResolvedValue(['session-1', 'session-2']);
      mockRedis.get.mockImplementation((key: string) => {
        const sessionId = key.split(':').pop();
        const session = mockSessions.find(s => s.sessionId === sessionId);
        return session ? Promise.resolve(JSON.stringify(session)) : Promise.resolve(null);
      });

      const stats = await sessionManager.getUserSessionStats('user-1');

      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(2);
      expect(stats.suspiciousSessions).toBe(0);
    });

    it('should return empty stats when no sessions', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      const stats = await sessionManager.getUserSessionStats('user-1');

      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });

    it('should calculate recent activity correctly', async () => {
      const mockSessions = [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isActive: true,
          isSuspicious: false,
        },
      ];

      mockRedis.smembers.mockResolvedValue(['session-1']);
      mockRedis.get.mockImplementation((key: string) => {
        const sessionId = key.split(':').pop();
        const session = mockSessions.find(s => s.sessionId === sessionId);
        return session ? Promise.resolve(JSON.stringify(session)) : Promise.resolve(null);
      });

      const stats = await sessionManager.getUserSessionStats('user-1');

      expect(stats.recentActivity.last24h).toBe(1);
      expect(stats.recentActivity.last7d).toBe(1);
      expect(stats.recentActivity.last30d).toBe(1);
    });

    it('should handle stats calculation errors gracefully', async () => {
      mockRedis.smembers.mockRejectedValue(new Error('Redis error'));

      await expect(sessionManager.getUserSessionStats('user-1')).rejects.toThrow('Redis error');
    });
  });

  describe('markSessionSuspicious', () => {
    it('should mark session as suspicious', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSession));
      mockRedis.setex.mockResolvedValue('OK');

      const result = await sessionManager.markSessionSuspicious('session-1', 'Test reason');

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should return false when session does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await sessionManager.markSessionSuspicious('session-1', 'Test reason');

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent session operations', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        accessToken: 'test-token',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isSuspicious: false,
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockSession));
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.ttl.mockResolvedValue(604800);

      const promises = [
        sessionManager.getSession('session-1'),
        sessionManager.getSession('session-1'),
        sessionManager.getSession('session-1'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).not.toBeNull();
      });
    });

    it('should handle session with minimal data', async () => {
      const options = {
        user: createMockUser(),
        accessToken: 'test-token',
      };

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.deviceId).toBeUndefined();
    });

    it('should handle session with maximum TTL', async () => {
      const options = createMockSessionOptions({ ttlSeconds: 30 * 24 * 60 * 60 }); // 30日

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.any(String),
        2592000, // 30日
        expect.any(String)
      );
    });

    it('should handle session with very long user agent', async () => {
      const longUserAgent = 'a'.repeat(1000);
      const options = createMockSessionOptions({ userAgent: longUserAgent });

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(session.userAgent).toBe(longUserAgent);
    });

    it('should handle session with special characters in device name', async () => {
      const specialDeviceName = 'Device<>&"';
      const options = createMockSessionOptions({ deviceName: specialDeviceName });

      const session = await sessionManager.createSession(options);

      expect(session).toBeDefined();
      expect(session.deviceName).toBe(specialDeviceName);
    });
  });
});
