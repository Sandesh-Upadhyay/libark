/**
 * Redis Client Package Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ioredisをモック
const mockRedisClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  ping: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  incr: vi.fn(),
  decr: vi.fn(),
  hGet: vi.fn(),
  hSet: vi.fn(),
  hMGet: vi.fn(),
  hGetAll: vi.fn(),
  hMSet: vi.fn(),
  hIncrBy: vi.fn(),
  hDel: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  zadd: vi.fn(),
  zremrangebyscore: vi.fn(),
  zcard: vi.fn(),
  zcount: vi.fn(),
  keys: vi.fn(),
  pipeline: vi.fn(() => ({
    zremrangebyscore: vi.fn(),
    zcard: vi.fn(),
    zadd: vi.fn(),
    expire: vi.fn(),
    hmget: vi.fn(),
    hmset: vi.fn(),
    hgetall: vi.fn(),
    hincrby: vi.fn(),
    hset: vi.fn(),
    exec: vi.fn(),
  })),
};

vi.mock('ioredis', () => {
  const mockRedis = vi.fn(() => mockRedisClient);
  return {
    default: mockRedis,
    Redis: mockRedis,
  };
});

// 環境設定をモック
vi.mock('@libark/core-shared', () => ({
  getRedisConfig: vi.fn(() => ({
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: undefined,
  })),
  envUtils: {
    getEnvVar: vi.fn((key: string, defaultValue?: string) => {
      const defaults: Record<string, string> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };
      return defaults[key] || defaultValue || '';
    }),
  },
}));

describe('Redis Client Package', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Exports', () => {
    it('主要なクラスがエクスポートされている', async () => {
      const {
        RedisConnectionManager,
        RedisPubSubManager,
        RedisSessionManager,
        RedisRateLimiter,
        RedisCounterManager,
      } = await import('../index.js');

      expect(RedisConnectionManager).toBeDefined();
      expect(RedisPubSubManager).toBeDefined();
      expect(RedisSessionManager).toBeDefined();
      expect(RedisRateLimiter).toBeDefined();
      expect(RedisCounterManager).toBeDefined();
    });

    it('ユーティリティ関数がエクスポートされている', async () => {
      const { getRedisClient, createRedisClient, createRedisPubSubManager } =
        await import('../index.js');

      expect(getRedisClient).toBeDefined();
      expect(createRedisClient).toBeDefined();
      expect(createRedisPubSubManager).toBeDefined();
    });

    it('定数がエクスポートされている', async () => {
      const { REDIS_CHANNELS, REDIS_KEYS, DEFAULT_REDIS_CONFIG } = await import('../index.js');

      expect(REDIS_CHANNELS).toBeDefined();
      expect(REDIS_KEYS).toBeDefined();
      expect(DEFAULT_REDIS_CONFIG).toBeDefined();
    });

    it('インスタンスがエクスポートされている', async () => {
      const { sessionManager, rateLimiter, counterManager } = await import('../index.js');

      expect(sessionManager).toBeDefined();
      expect(rateLimiter).toBeDefined();
      expect(counterManager).toBeDefined();
    });
  });

  describe('RedisConnectionManager', () => {
    it('シングルトンインスタンスを取得できる', async () => {
      const { RedisConnectionManager } = await import('../index.js');

      const instance1 = RedisConnectionManager.getInstance();
      const instance2 = RedisConnectionManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('Redisクライアントを作成できる', async () => {
      const { getRedisClient } = await import('../index.js');

      const client = getRedisClient();
      expect(client).toBeDefined();
    });
  });

  describe('RedisPubSubManager', () => {
    it('PubSubマネージャーを作成できる', async () => {
      const { createRedisPubSubManager } = await import('../index.js');

      const pubsub = await createRedisPubSubManager();
      expect(pubsub).toBeDefined();
    });

    it('PubSubマネージャーのインスタンスを取得できる', async () => {
      const { RedisPubSubManager } = await import('../index.js');

      const instance1 = RedisPubSubManager.getInstance();
      const instance2 = RedisPubSubManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('RedisSessionManager', () => {
    it('セッションマネージャーインスタンスが利用可能', async () => {
      const { sessionManager } = await import('../index.js');

      expect(sessionManager).toBeDefined();
      expect(typeof sessionManager.createSession).toBe('function');
      expect(typeof sessionManager.getSession).toBe('function');
      expect(typeof sessionManager.deleteSession).toBe('function');
    });

    it('セッション操作メソッドが定義されている', async () => {
      const { RedisSessionManager } = await import('../index.js');

      const manager = RedisSessionManager.getInstance();

      expect(typeof manager.createSession).toBe('function');
      expect(typeof manager.getSession).toBe('function');
      expect(typeof manager.deleteSession).toBe('function');
      expect(typeof manager.deleteAllUserSessions).toBe('function');
      expect(typeof manager.blacklistToken).toBe('function');
      expect(typeof manager.isTokenBlacklisted).toBe('function');
      expect(typeof manager.storeRefreshToken).toBe('function');
      expect(typeof manager.getRefreshToken).toBe('function');
      expect(typeof manager.deleteRefreshToken).toBe('function');
      expect(typeof manager.deleteAllUserRefreshTokens).toBe('function');
      expect(typeof manager.getSessionStats).toBe('function');
    });
  });

  describe('RedisRateLimiter', () => {
    it('レートリミッターインスタンスが利用可能', async () => {
      const { rateLimiter } = await import('../index.js');

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter.checkRateLimit).toBe('function');
      expect(typeof rateLimiter.resetLimit).toBe('function');
    });

    it('レートリミット操作メソッドが定義されている', async () => {
      const { RedisRateLimiter } = await import('../index.js');

      const limiter = RedisRateLimiter.getInstance();

      expect(typeof limiter.checkRateLimit).toBe('function');
      expect(typeof limiter.checkPredefinedLimit).toBe('function');
      expect(typeof limiter.checkIPLimit).toBe('function');
      expect(typeof limiter.checkUserLimit).toBe('function');
      expect(typeof limiter.checkLoginAttempt).toBe('function');
      expect(typeof limiter.resetLimit).toBe('function');
      expect(typeof limiter.getLimitStatus).toBe('function');
      expect(typeof limiter.getStats).toBe('function');
    });
  });

  describe('RedisCounterManager', () => {
    it('カウンターマネージャーインスタンスが利用可能', async () => {
      const { counterManager } = await import('../index.js');

      expect(counterManager).toBeDefined();
      expect(typeof counterManager.incrementPostStat).toBe('function');
      expect(typeof counterManager.decrementPostStat).toBe('function');
    });

    it('カウンター操作メソッドが定義されている', async () => {
      const { RedisCounterManager } = await import('../index.js');

      const manager = RedisCounterManager.getInstance();

      expect(typeof manager.incrementPostStat).toBe('function');
      expect(typeof manager.decrementPostStat).toBe('function');
      expect(typeof manager.getPostStats).toBe('function');
      expect(typeof manager.getBatchPostStats).toBe('function');
      expect(typeof manager.incrementCommentStat).toBe('function');
      expect(typeof manager.decrementCommentStat).toBe('function');
      expect(typeof manager.getCommentStats).toBe('function');
      expect(typeof manager.getBatchCommentStats).toBe('function');
      expect(typeof manager.incrementUserStat).toBe('function');
      expect(typeof manager.decrementUserStat).toBe('function');
      expect(typeof manager.getUserStats).toBe('function');
      expect(typeof manager.incrementGlobalStat).toBe('function');
      expect(typeof manager.decrementGlobalStat).toBe('function');
      expect(typeof manager.getGlobalStats).toBe('function');
      expect(typeof manager.recordActiveUser).toBe('function');
      expect(typeof manager.syncStatsFromDatabase).toBe('function');
      expect(typeof manager.flushStatsToDatabase).toBe('function');
      expect(typeof manager.acquireLock).toBe('function');
      expect(typeof manager.releaseLock).toBe('function');
      expect(typeof manager.setPostStats).toBe('function');
    });
  });

  describe('Type Definitions', () => {
    it('SessionDataの型が正しく定義されている', async () => {
      // TypeScriptコンパイル時にエラーが発生しないことを確認
      const sessionData: import('../index.js').SessionData = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        deviceId: 'device-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
      };

      expect(sessionData.userId).toBe('user-123');
      expect(sessionData.email).toBe('test@example.com');
      expect(sessionData.role).toBe('user');
    });

    it('RateLimitConfigの型が正しく定義されている', async () => {
      const config: import('../index.js').RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 100,
        blockDurationMs: 120000,
      };

      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(100);
      expect(config.blockDurationMs).toBe(120000);
    });

    it('PostStatsの型が正しく定義されている', async () => {
      const stats: import('../index.js').PostStats = {
        views: 100,
        likes: 25,
        comments: 10,
        shares: 5,
      };

      expect(stats.views).toBe(100);
      expect(stats.likes).toBe(25);
      expect(stats.comments).toBe(10);
      expect(stats.shares).toBe(5);
    });
  });

  describe('Constants', () => {
    it('REDIS_CHANNELSが正しく定義されている', async () => {
      const { REDIS_CHANNELS } = await import('../index.js');

      expect(REDIS_CHANNELS).toBeDefined();
      expect(typeof REDIS_CHANNELS).toBe('object');
    });

    it('REDIS_KEYSが正しく定義されている', async () => {
      const { REDIS_KEYS } = await import('../index.js');

      expect(REDIS_KEYS).toBeDefined();
      expect(typeof REDIS_KEYS).toBe('object');
    });

    it('DEFAULT_REDIS_CONFIGが正しく定義されている', async () => {
      const { DEFAULT_REDIS_CONFIG } = await import('../index.js');

      expect(DEFAULT_REDIS_CONFIG).toBeDefined();
      expect(typeof DEFAULT_REDIS_CONFIG).toBe('object');
      expect(DEFAULT_REDIS_CONFIG.HOST).toBeDefined();
      expect(DEFAULT_REDIS_CONFIG.PORT).toBeDefined();
    });
  });
});
