/**
 * 🧪 テストセットアップファイル
 */

import { beforeAll, vi } from 'vitest';
import dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config({ path: '../../.env.test' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env' });

// テスト用環境変数設定
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-not-for-production-use';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-key-for-testing';
if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required for backend tests');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.REDIS_HOST = process.env.REDIS_HOST || 'redis';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.P2P_ENCRYPTION_KEY = 'YWFiYmNjZGRlZWZmZ2doaWlqamtrbGxtbW5ubm9vcHA='; // 32 bytes base64

// S3設定
process.env.S3_ACCESS_KEY = 'test-access-key';
process.env.S3_SECRET_KEY = 'test-secret-key';
process.env.S3_BUCKET = 'test-bucket';
process.env.S3_REGION = 'us-east-1';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_PUBLIC_URL = 'http://localhost:9000/test-bucket';

// 公開設定
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_FRONTEND_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:9000/test-bucket';

process.env.S3_BACKEND_ACCESS_KEY = 'test-backend-access-key';
process.env.S3_BACKEND_SECRET_KEY = 'test-backend-secret-key';
process.env.S3_BACKEND_TYPE = 'r2';
process.env.S3_BACKEND_REGION = 'auto';
process.env.S3_BACKEND_ENDPOINT = 'https://test.r2.cloudflarestorage.com';

// プロセス終了を防ぐ（重複チェック付き）
if (!(process.exit as unknown).isMockFunction) {
  vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit called with code ${code}`);
  });
}

// 完全なRedisモック実装
const mockRedisStore = new Map<string, unknown>();
const mockRedisExpiry = new Map<string, number>();

const mockRedisInstance = {
  // 接続管理
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  ping: vi.fn().mockResolvedValue('PONG'),

  // 基本操作
  get: vi.fn().mockImplementation(async (key: string) => {
    // 期限切れチェック
    const expiry = mockRedisExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      mockRedisStore.delete(key);
      mockRedisExpiry.delete(key);
      return null;
    }
    return mockRedisStore.get(key) || null;
  }),

  set: vi.fn().mockImplementation(async (key: string, value: unknown) => {
    mockRedisStore.set(key, value);
    return 'OK';
  }),

  setex: vi.fn().mockImplementation(async (key: string, seconds: number, value: unknown) => {
    mockRedisStore.set(key, value);
    mockRedisExpiry.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }),

  del: vi.fn().mockImplementation(async (...keys: string[]) => {
    let deleted = 0;
    keys.forEach(key => {
      if (mockRedisStore.has(key)) {
        mockRedisStore.delete(key);
        mockRedisExpiry.delete(key);
        deleted++;
      }
    });
    return deleted;
  }),

  exists: vi.fn().mockImplementation(async (...keys: string[]) => {
    return keys.filter(key => mockRedisStore.has(key)).length;
  }),

  expire: vi.fn().mockImplementation(async (key: string, seconds: number) => {
    if (mockRedisStore.has(key)) {
      mockRedisExpiry.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }),

  ttl: vi.fn().mockImplementation(async (key: string) => {
    const expiry = mockRedisExpiry.get(key);
    if (!expiry) return -1;
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }),

  // 数値操作
  incr: vi.fn().mockImplementation(async (key: string) => {
    const current = parseInt(String(mockRedisStore.get(key) || '0'));
    const newValue = current + 1;
    mockRedisStore.set(key, newValue.toString());
    return newValue;
  }),

  decr: vi.fn().mockImplementation(async (key: string) => {
    const current = parseInt(String(mockRedisStore.get(key) || '0'));
    const newValue = current - 1;
    mockRedisStore.set(key, newValue.toString());
    return newValue;
  }),

  // ハッシュ操作
  hget: vi.fn().mockImplementation(async (key: string, field: string) => {
    const hash = mockRedisStore.get(key);
    if (hash && typeof hash === 'object') {
      return (hash as Record<string, unknown>)[field] || null;
    }
    return null;
  }),

  hset: vi.fn().mockImplementation(async (key: string, field: string, value: unknown) => {
    let hash = mockRedisStore.get(key) as Record<string, unknown> | undefined;
    if (!hash || typeof hash !== 'object') {
      hash = {};
    }
    hash[field] = value;
    mockRedisStore.set(key, hash);
    return 1;
  }),

  hdel: vi.fn().mockImplementation(async (key: string, ...fields: string[]) => {
    const hash = mockRedisStore.get(key) as Record<string, unknown> | undefined;
    if (!hash || typeof hash !== 'object') return 0;

    let deleted = 0;
    fields.forEach(field => {
      if (field in hash) {
        delete hash[field];
        deleted++;
      }
    });

    mockRedisStore.set(key, hash);
    return deleted;
  }),

  hincrby: vi.fn().mockImplementation(async (key: string, field: string, increment: number) => {
    let hash = mockRedisStore.get(key) as Record<string, unknown> | undefined;
    if (!hash || typeof hash !== 'object') {
      hash = {};
    }

    const current = parseInt(String(hash[field] || '0'));
    const newValue = current + increment;
    hash[field] = newValue.toString();
    mockRedisStore.set(key, hash);
    return newValue;
  }),

  hmget: vi.fn().mockImplementation(async (key: string, ...fields: string[]) => {
    const hash = mockRedisStore.get(key) as Record<string, unknown> | undefined;
    if (!hash || typeof hash !== 'object') {
      return fields.map(() => null);
    }
    return fields.map(field => hash[field] || null);
  }),

  // セット操作
  smembers: vi.fn().mockImplementation(async (key: string) => {
    const set = mockRedisStore.get(key);
    return Array.isArray(set) ? set : [];
  }),

  sadd: vi.fn().mockImplementation(async (key: string, ...members: string[]) => {
    let set = mockRedisStore.get(key) as string[] | undefined;
    if (!Array.isArray(set)) set = [];

    let added = 0;
    members.forEach(member => {
      if (!set.includes(member)) {
        set.push(member);
        added++;
      }
    });

    mockRedisStore.set(key, set);
    return added;
  }),

  srem: vi.fn().mockImplementation(async (key: string, ...members: string[]) => {
    const set = mockRedisStore.get(key) as string[] | undefined;
    if (!Array.isArray(set)) return 0;

    let removed = 0;
    members.forEach(member => {
      const index = set.indexOf(member);
      if (index > -1) {
        set.splice(index, 1);
        removed++;
      }
    });

    mockRedisStore.set(key, set);
    return removed;
  }),

  // Sorted Set操作
  zadd: vi.fn().mockImplementation(async (key: string, ...args: unknown[]) => {
    let sortedSet = mockRedisStore.get(key) as Array<{ member: string; score: number }> | undefined;
    if (!Array.isArray(sortedSet)) sortedSet = [];

    let added = 0;
    for (let i = 0; i < args.length; i += 2) {
      const score = parseFloat(String(args[i]));
      const member = args[i + 1] as string;

      // 既存のメンバーを削除
      const existingIndex = sortedSet.findIndex(
        (item: { member: string; score: number }) => item.member === member
      );
      if (existingIndex > -1) {
        sortedSet.splice(existingIndex, 1);
      } else {
        added++;
      }

      // 新しいメンバーを追加
      sortedSet.push({ score, member });
    }

    // スコア順にソート
    sortedSet.sort((a: { score: number }, b: { score: number }) => a.score - b.score);
    mockRedisStore.set(key, sortedSet);
    return added;
  }),

  zremrangebyscore: vi.fn().mockImplementation(async (key: string, min: number, max: number) => {
    const sortedSet = mockRedisStore.get(key) as
      | Array<{ member: string; score: number }>
      | undefined;
    if (!Array.isArray(sortedSet)) return 0;

    const originalLength = sortedSet.length;
    const filteredSet = sortedSet.filter(item => item.score < min || item.score > max);
    mockRedisStore.set(key, filteredSet);

    return originalLength - filteredSet.length;
  }),

  zrange: vi
    .fn()
    .mockImplementation(async (key: string, start: number, stop: number, ...options: string[]) => {
      const sortedSet = mockRedisStore.get(key) as
        | Array<{ member: string; score: number }>
        | undefined;
      if (!Array.isArray(sortedSet)) return [];

      const slice = sortedSet.slice(start, stop + 1);

      if (options.includes('WITHSCORES')) {
        const result: unknown[] = [];
        slice.forEach(item => {
          result.push(item.member, item.score.toString());
        });
        return result;
      }

      return slice.map(item => item.member);
    }),

  zcard: vi.fn().mockImplementation(async (key: string) => {
    const sortedSet = mockRedisStore.get(key) as
      | Array<{ member: string; score: number }>
      | undefined;
    if (!Array.isArray(sortedSet)) return 0;
    return sortedSet.length;
  }),

  // データベース操作
  flushdb: vi.fn().mockImplementation(async () => {
    mockRedisStore.clear();
    mockRedisExpiry.clear();
    return 'OK';
  }),

  // パイプライン操作
  pipeline: vi.fn(() => {
    const commands: Array<() => Promise<unknown>> = [];

    const pipelineInstance = {
      get: vi.fn().mockImplementation((key: string) => {
        commands.push(() => mockRedisInstance.get(key));
        return pipelineInstance;
      }),
      set: vi.fn().mockImplementation((key: string, value: unknown) => {
        commands.push(() => mockRedisInstance.set(key, value));
        return pipelineInstance;
      }),
      setex: vi.fn().mockImplementation((key: string, seconds: number, value: unknown) => {
        commands.push(() => mockRedisInstance.setex(key, seconds, value));
        return pipelineInstance;
      }),
      del: vi.fn().mockImplementation((...keys: string[]) => {
        commands.push(() => mockRedisInstance.del(...keys));
        return pipelineInstance;
      }),
      incr: vi.fn().mockImplementation((key: string) => {
        commands.push(() => mockRedisInstance.incr(key));
        return pipelineInstance;
      }),
      decr: vi.fn().mockImplementation((key: string) => {
        commands.push(() => mockRedisInstance.decr(key));
        return pipelineInstance;
      }),
      expire: vi.fn().mockImplementation((key: string, seconds: number) => {
        commands.push(() => mockRedisInstance.expire(key, seconds));
        return pipelineInstance;
      }),
      zadd: vi.fn().mockImplementation((key: string, ...args: unknown[]) => {
        commands.push(() => mockRedisInstance.zadd(key, ...args));
        return pipelineInstance;
      }),
      zremrangebyscore: vi.fn().mockImplementation((key: string, min: number, max: number) => {
        commands.push(() => mockRedisInstance.zremrangebyscore(key, min, max));
        return pipelineInstance;
      }),
      hincrby: vi.fn().mockImplementation((key: string, field: string, increment: number) => {
        commands.push(() => mockRedisInstance.hincrby(key, field, increment));
        return pipelineInstance;
      }),
      zcard: vi.fn().mockImplementation((key: string) => {
        commands.push(() => mockRedisInstance.zcard(key));
        return pipelineInstance;
      }),
      exec: vi.fn().mockImplementation(async () => {
        const results = [];
        for (const command of commands) {
          try {
            const result = await command();
            results.push([null, result]);
          } catch (error) {
            results.push([error, null]);
          }
        }
        commands.length = 0; // クリア
        return results;
      }),
    };

    return pipelineInstance;
  }),

  // Pub/Sub
  publish: vi.fn().mockResolvedValue(1),
  subscribe: vi.fn().mockResolvedValue(undefined),
  unsubscribe: vi.fn().mockResolvedValue(undefined),

  // イベント
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('ioredis', () => {
  const MockRedis = vi.fn(() => mockRedisInstance);
  return {
    default: MockRedis,
    Redis: MockRedis,
  };
});

vi.mock('@libark/redis-client', () => {
  const mockRedisPubSubInstance = {
    publishGraphQLNotification: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(1),
  };
  const blacklistedTokens = new Map<string, number>();
  const loginAttempts = new Map<string, number>();

  return {
    RedisPubSubManager: {
      getInstance: vi.fn(() => mockRedisPubSubInstance),
    },
    getRedisClient: vi.fn(() => mockRedisInstance),
    RedisConnectionManager: {
      closeAllConnections: vi.fn().mockResolvedValue(undefined),
      getInstance: vi.fn(() => ({
        closeAllConnections: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
      })),
    },
    sessionManager: {
      createSession: vi.fn().mockResolvedValue(undefined),
      getUserSessionStats: vi.fn().mockResolvedValue([]),
      isTokenBlacklisted: vi.fn().mockImplementation(async (token: string) => {
        const expiresAt = blacklistedTokens.get(token);
        if (!expiresAt) return false;
        if (Date.now() > expiresAt) {
          blacklistedTokens.delete(token);
          return false;
        }
        return true;
      }),
      blacklistToken: vi.fn().mockImplementation(async (token: string, _data?: unknown, ttl = 3600) => {
        blacklistedTokens.set(token, Date.now() + ttl * 1000);
      }),
    },
    counterManager: {
      recordActiveUser: vi.fn().mockResolvedValue(undefined),
      acquireLock: vi.fn().mockResolvedValue(true),
      releaseLock: vi.fn().mockResolvedValue(undefined),
      getPostStats: vi.fn().mockResolvedValue({ likes: 0, comments: 0, views: 0 }),
      setPostStats: vi.fn().mockResolvedValue(undefined),
      incrementPostStat: vi.fn().mockResolvedValue(1),
      decrementPostStat: vi.fn().mockResolvedValue(0),
      incrementUserStat: vi.fn().mockResolvedValue(1),
      decrementUserStat: vi.fn().mockResolvedValue(0),
      incrementGlobalStat: vi.fn().mockResolvedValue(1),
      decrementGlobalStat: vi.fn().mockResolvedValue(0),
      getCommentStats: vi.fn().mockResolvedValue({ likes: 0 }),
      incrementCommentStat: vi.fn().mockResolvedValue(1),
      decrementCommentStat: vi.fn().mockResolvedValue(0),
    },
    rateLimiter: {
      checkLoginAttempt: vi.fn().mockImplementation(async (key: string, maxAttempts = 5) => {
        const attempts = loginAttempts.get(key) ?? 0;
        const allowed = attempts < maxAttempts;
        if (!allowed) {
          return { allowed: false, remaining: 0, resetTime: Date.now() + 15 * 60 * 1000 };
        }
        loginAttempts.set(key, attempts + 1);
        return { allowed: true, remaining: Math.max(0, maxAttempts - (attempts + 1)), resetTime: 0 };
      }),
      resetLimit: vi.fn().mockImplementation(async (key: string) => {
        loginAttempts.delete(key);
      }),
      getStats: vi.fn().mockResolvedValue({}),
    },
  };
});

/**
 * BullMQ/Queue をテスト中は完全に無効化する。
 * 目的: テストが実Redisへ接続しに行くのを防ぎ、ECONNREFUSED / timeout を避ける。
 */
vi.mock('@libark/queues', () => {
  const createMockQueue = () => {
    return {
      add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  };

  const createMockQueueEvents = () => {
    return {
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  };

  // enum互換（実装側は QueueName.MEDIA_PROCESSING のように参照）
  const QueueName = {
    MEDIA_PROCESSING: 'media-processing',
    BLUR_PROCESSING: 'blur-processing',
    S3_EVENTS: 's3-events',
    MEDIA_CLEANUP: 'media-cleanup',
  } as const;

  return {
    QueueName,
    getQueue: vi.fn(() => createMockQueue()),
    getQueueEvents: vi.fn(() => createMockQueueEvents()),
    closeAllQueues: vi.fn().mockResolvedValue(undefined),
  };
});

// 改善されたPrisma Client モック
const mockPrismaStore = new Map<string, Map<string, unknown>>();

const createMockModel = (modelName: string) => {
  if (!mockPrismaStore.has(modelName)) {
    mockPrismaStore.set(modelName, new Map());
  }

  const store = mockPrismaStore.get(modelName)!;

  return {
    findMany: vi.fn((args?: unknown) => {
      let records = Array.from(store.values());

      const matches = (
        rec: Record<string, unknown>,
        whereClause: Record<string, unknown>
      ): boolean => {
        if (!whereClause) return true;

        // 非論理キー（OR/AND以外）を先に評価
        const nonLogicalOk = Object.entries(whereClause).every(([key, value]) => {
          if (key === 'OR' || key === 'AND') return true;

          // 複合ユニークキー（例: followerId_followingId）の簡易対応
          if (typeof value === 'object' && value !== null && key.includes('_')) {
            const parts = key.split('_');
            return parts.every(k => rec[k] === (value as unknown)[k]);
          }

          if (typeof value === 'object' && value !== null) {
            if ((value as unknown).equals !== undefined) {
              const eq = (value as unknown).equals;
              if (eq === null) return rec[key] === null || rec[key] === undefined;
              return rec[key] === eq;
            }
            if ((value as unknown).contains !== undefined)
              return (rec[key] as unknown)?.includes((value as unknown).contains);
            if ((value as unknown).gt !== undefined)
              return (rec[key] as unknown) > (value as unknown).gt;
            if ((value as unknown).gte !== undefined)
              return (rec[key] as unknown) >= (value as unknown).gte;
            if ((value as unknown).lt !== undefined)
              return (rec[key] as unknown) < (value as unknown).lt;
            if ((value as unknown).lte !== undefined)
              return (rec[key] as unknown) <= (value as unknown).lte;
            if ((value as unknown).in !== undefined)
              return (value as unknown).in.includes(rec[key]);
            return true;
          }
          if (value === null) return rec[key] === null || rec[key] === undefined;
          return rec[key] === value;
        });

        const orOk = Array.isArray(whereClause.OR)
          ? whereClause.OR.some((cond: Record<string, unknown>) => matches(rec, cond))
          : true;
        const andOk = Array.isArray(whereClause.AND)
          ? whereClause.AND.every((cond: Record<string, unknown>) => matches(rec, cond))
          : true;

        return nonLogicalOk && orOk && andOk;
      };

      if (args?.where) {
        records = records.filter(rec => matches(rec, args.where));
      }

      // orderBy の簡易対応（createdAt等、単一キー想定）
      if (args?.orderBy) {
        const [k, dir] = Object.entries(args.orderBy)[0] as [string, 'asc' | 'desc'];
        records.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const av = a[k];
          const bv = b[k];
          if (av instanceof Date && bv instanceof Date) {
            return dir === 'asc' ? av.getTime() - bv.getTime() : bv.getTime() - av.getTime();
          }
          if (typeof av === 'number' && typeof bv === 'number') {
            return dir === 'asc' ? av - bv : bv - av;
          }
          const as = String(av);
          const bs = String(bv);
          return dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
        });
      }

      // take / skip の簡易対応
      if (typeof args?.skip === 'number') {
        records = records.slice(args.skip);
      }
      if (typeof args?.take === 'number') {
        const limit = Math.abs(args.take);
        records = records.slice(0, limit);
      }

      // include句の処理（既存）
      if (args?.include) {
        records = records.map(record => {
          const newRecord = { ...record };
          Object.keys(args.include).forEach(includeKey => {
            if (args.include[includeKey]) {
              if (includeKey === 'permissionOverrides') {
                newRecord[includeKey] = [];
              } else if (includeKey === 'roles') {
                newRecord[includeKey] = [];
              } else if (includeKey === 'permissions') {
                newRecord[includeKey] = [];
              } else if (includeKey === 'variants') {
                newRecord[includeKey] = [
                  {
                    id: `variant-${record.id}-thumb`,
                    mediaId: record.id,
                    type: 'THUMB',
                    s3Key: `${record.s3Key || 'media'}_thumb.jpg`,
                    width: 150,
                    height: 150,
                    fileSize: 5120,
                    quality: 80,
                    createdAt: new Date(),
                  },
                ];
              } else if (includeKey === 'role') {
                newRecord[includeKey] = {
                  id: 'mock-role-id',
                  name: 'user',
                  permissions: [],
                };
              } else if (includeKey === 'user') {
                const userStore = mockPrismaStore.get('user');
                if (userStore && record.userId) {
                  const user = userStore.get(record.userId);
                  if (user) {
                    newRecord[includeKey] = user;
                  } else {
                    newRecord[includeKey] = {
                      id: record.userId,
                      username: `user-${record.userId.slice(0, 8)}`,
                      email: `user-${record.userId.slice(0, 8)}@example.com`,
                      displayName: 'Mock User',
                      isActive: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                  }
                } else {
                  newRecord[includeKey] = null;
                }
              } else if (includeKey === 'seller' || includeKey === 'buyer') {
                const userStore = mockPrismaStore.get('user');
                const userId = includeKey === 'seller' ? record.sellerId : record.buyerId;
                if (userStore && userId) {
                  const user = userStore.get(userId);
                  if (user) {
                    newRecord[includeKey] = user;
                  } else {
                    newRecord[includeKey] = {
                      id: userId,
                      username: `user-${userId.slice(0, 8)}`,
                      email: `user-${userId.slice(0, 8)}@example.com`,
                      displayName: 'Mock User',
                      isActive: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                  }
                } else {
                  newRecord[includeKey] = null;
                }
              } else if (includeKey === 'offer') {
                const offerStore = mockPrismaStore.get('p2POffer');
                if (offerStore && record.offerId) {
                  const offer = offerStore.get(record.offerId);
                  if (offer) {
                    newRecord[includeKey] = offer;
                  } else {
                    newRecord[includeKey] = null;
                  }
                } else {
                  newRecord[includeKey] = null;
                }
              } else {
                newRecord[includeKey] = [];
              }
            }
          });
          return newRecord;
        });
      }

      return records;
    }),

    findUnique: vi.fn().mockImplementation(async (args: unknown) => {
      let record: Record<string, unknown> | null = null;

      const matches = (rec: unknown, where: unknown): boolean => {
        if (!where) return true;
        const whereObj = where as { OR?: unknown[]; AND?: unknown[] };
        if (Array.isArray(whereObj.OR)) {
          if (whereObj.OR.length === 0) return true;
          return whereObj.OR.some((cond: unknown) => matches(rec, cond));
        }
        if (Array.isArray(whereObj.AND)) {
          return whereObj.AND.every((cond: unknown) => matches(rec, cond));
        }
        return Object.entries(where).every(([key, value]) => {
          if (key === 'OR' || key === 'AND') return true;
          if (typeof value === 'object' && value !== null) {
            // 複合ユニークキー（例: followerId_followingId）対応
            if (key.includes('_')) {
              const parts = key.split('_');
              return parts.every(k => rec[k] === (value as unknown)[k]);
            }
            if ((value as unknown).equals !== undefined) {
              const eq = (value as unknown).equals;
              if (eq === null) return rec[key] === null || rec[key] === undefined;
              return rec[key] === eq;
            }
            if ((value as unknown).contains !== undefined)
              return (rec[key] as unknown)?.includes((value as unknown).contains);
            if ((value as unknown).gt !== undefined)
              return (rec[key] as unknown) > (value as unknown).gt;
            if ((value as unknown).gte !== undefined)
              return (rec[key] as unknown) >= (value as unknown).gte;
            if ((value as unknown).lt !== undefined)
              return (rec[key] as unknown) < (value as unknown).lt;
            if ((value as unknown).lte !== undefined)
              return (rec[key] as unknown) <= (value as unknown).lte;
            if ((value as unknown).in !== undefined)
              return (value as unknown).in.includes(rec[key]);
            return true;
          }
          if (value === null) return rec[key] === null || rec[key] === undefined;
          return rec[key] === value;
        });
      };

      if (args?.where?.id) {
        record = store.get(args.where.id) || null;
      } else if (args?.where) {
        const records = Array.from(store.values());
        record = records.find(r => matches(r, args.where)) || null;
      }

      // include句の処理
      if (record && args?.include) {
        record = { ...record };
        Object.keys(args.include).forEach(includeKey => {
          if (args.include[includeKey]) {
            // 関連データのモック
            if (includeKey === 'permissionOverrides') {
              record[includeKey] = [];
            } else if (includeKey === 'roles') {
              record[includeKey] = [];
            } else if (includeKey === 'permissions') {
              record[includeKey] = [];
            } else if (includeKey === 'variants') {
              // メディアバリアントのモック
              record[includeKey] = [
                {
                  id: `variant-${record.id}-thumb`,
                  mediaId: record.id,
                  type: 'THUMB',
                  s3Key: `${record.s3Key || 'media'}_thumb.jpg`,
                  width: 150,
                  height: 150,
                  fileSize: 5120,
                  quality: 80,
                  createdAt: new Date(),
                },
              ];
            } else if (includeKey === 'role') {
              // ユーザーのロール情報をモック
              record[includeKey] = {
                id: 'mock-role-id',
                name: 'user',
                permissions: [],
              };
            } else if (includeKey === 'post') {
              // post関連データのモック（select句も考慮）
              const postInclude = args.include[includeKey];
              if (postInclude && typeof postInclude === 'object' && postInclude.select) {
                record[includeKey] = {
                  id: record.postId || 'mock-post-id',
                  updatedAt: record.updatedAt || new Date(),
                  visibility: 'PUBLIC',
                };
                // select句で指定されたフィールドのみを返す
                if (postInclude.select) {
                  const selectedPost: Record<string, unknown> = {};
                  Object.keys(postInclude.select).forEach(key => {
                    if (postInclude.select[key]) {
                      selectedPost[key] = record[includeKey][key];
                    }
                  });
                  record[includeKey] = selectedPost;
                }
              } else {
                record[includeKey] = {
                  id: record.postId || 'mock-post-id',
                  updatedAt: record.updatedAt || new Date(),
                  visibility: 'PUBLIC',
                };
              }
            } else if (includeKey === 'user') {
              // 投稿のユーザー情報をモック
              const userStore = mockPrismaStore.get('user');
              if (userStore && record.userId) {
                const user = userStore.get(record.userId);
                if (user) {
                  record[includeKey] = user;
                } else {
                  // ユーザーが見つからない場合はモックユーザーを作成
                  record[includeKey] = {
                    id: record.userId,
                    username: `user-${record.userId.slice(0, 8)}`,
                    email: `user-${record.userId.slice(0, 8)}@example.com`,
                    displayName: 'Mock User',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                }
              } else {
                record[includeKey] = null;
              }
            } else if (includeKey === 'seller' || includeKey === 'buyer') {
              const userStore = mockPrismaStore.get('user');
              const userId = includeKey === 'seller' ? record.sellerId : record.buyerId;
              if (userStore && userId) {
                const user = userStore.get(userId);
                if (user) {
                  record[includeKey] = user;
                } else {
                  record[includeKey] = {
                    id: userId,
                    username: `user-${userId.slice(0, 8)}`,
                    email: `user-${userId.slice(0, 8)}@example.com`,
                    displayName: 'Mock User',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                }
              } else {
                record[includeKey] = null;
              }
            } else if (includeKey === 'offer') {
              const offerStore = mockPrismaStore.get('p2POffer');
              if (offerStore && record.offerId) {
                const offer = offerStore.get(record.offerId);
                if (offer) {
                  record[includeKey] = offer;
                } else {
                  record[includeKey] = null;
                }
              } else {
                record[includeKey] = null;
              }
            } else {
              record[includeKey] = [];
            }
          }
        });
      }

      return record;
    }),

    findFirst: vi.fn((args: unknown) => {
      const records = Array.from(store.values());

      const matches = (rec: unknown, where: unknown): boolean => {
        if (!where) return true;

        const nonLogicalOk = Object.entries(where).every(([key, value]) => {
          if (key === 'OR' || key === 'AND') return true;

          // 複合ユニークキー（例: followerId_followingId）の簡易対応
          if (typeof value === 'object' && value !== null && key.includes('_')) {
            const parts = key.split('_');
            return parts.every(k => rec[k] === (value as unknown)[k]);
          }

          if (typeof value === 'object' && value !== null) {
            if ((value as unknown).gt !== undefined)
              return (rec[key] as unknown) > (value as unknown).gt;
            if ((value as unknown).gte !== undefined)
              return (rec[key] as unknown) >= (value as unknown).gte;
            if ((value as unknown).lt !== undefined)
              return (rec[key] as unknown) < (value as unknown).lt;
            if ((value as unknown).lte !== undefined)
              return (rec[key] as unknown) <= (value as unknown).lte;
            if ((value as unknown).in !== undefined)
              return (value as unknown).in.includes(rec[key] as unknown);
            if ((value as unknown).not !== undefined) return rec[key] !== (value as unknown).not;
            if ((value as unknown).equals !== undefined) {
              const eq = (value as unknown).equals;
              if (eq === null) return rec[key] === null || rec[key] === undefined;
              return rec[key] === eq;
            }
            if ((value as unknown).contains !== undefined)
              return (rec[key] as unknown)?.includes((value as unknown).contains);
            return true;
          }
          if (value === null) return rec[key] === null || rec[key] === undefined;
          return rec[key] === value;
        });

        const whereObj = where as { OR?: unknown[]; AND?: unknown[] };
        const orOk = Array.isArray(whereObj.OR)
          ? whereObj.OR.some((cond: unknown) => matches(rec, cond))
          : true;
        const andOk = Array.isArray(whereObj.AND)
          ? whereObj.AND.every((cond: unknown) => matches(rec, cond))
          : true;
        return nonLogicalOk && orOk && andOk;
      };

      if (args?.where) {
        let result = records.find(rec => matches(rec, args.where)) || null;

        // include句の処理
        if (result && args?.include) {
          result = { ...result };
          Object.keys(args.include).forEach(includeKey => {
            if (args.include[includeKey]) {
              // 関連データのモック
              if (includeKey === 'permissionOverrides') {
                result[includeKey] = [];
              } else if (includeKey === 'roles') {
                result[includeKey] = [];
              } else if (includeKey === 'permissions') {
                result[includeKey] = [];
              } else if (includeKey === 'variants') {
                result[includeKey] = [
                  {
                    id: `variant-${result.id}-thumb`,
                    mediaId: result.id,
                    type: 'THUMB',
                    s3Key: `${result.s3Key || 'media'}_thumb.jpg`,
                    width: 150,
                    height: 150,
                    fileSize: 5120,
                    quality: 80,
                    createdAt: new Date(),
                  },
                ];
              } else if (includeKey === 'role') {
                result[includeKey] = {
                  id: 'mock-role-id',
                  name: 'user',
                  permissions: [],
                };
              } else if (includeKey === 'post') {
                // post関連データのモック（select句も考慮）
                const postInclude = args.include[includeKey];
                if (postInclude && typeof postInclude === 'object' && postInclude.select) {
                  result[includeKey] = {
                    id: result.postId || 'mock-post-id',
                    updatedAt: result.updatedAt || new Date(),
                    visibility: 'PUBLIC',
                  };
                  // select句で指定されたフィールドのみを返す
                  if (postInclude.select) {
                    const selectedPost: Record<string, unknown> = {};
                    Object.keys(postInclude.select).forEach(key => {
                      if (postInclude.select[key]) {
                        selectedPost[key] = result[includeKey][key];
                      }
                    });
                    result[includeKey] = selectedPost;
                  }
                } else {
                  result[includeKey] = {
                    id: result.postId || 'mock-post-id',
                    updatedAt: result.updatedAt || new Date(),
                    visibility: 'PUBLIC',
                  };
                }
              } else if (includeKey === 'user') {
                const userStore = mockPrismaStore.get('user');
                if (userStore && result.userId) {
                  const user = userStore.get(result.userId);
                  if (user) {
                    result[includeKey] = user;
                  } else {
                    result[includeKey] = {
                      id: result.userId,
                      username: `user-${result.userId.slice(0, 8)}`,
                      email: `user-${result.userId.slice(0, 8)}@example.com`,
                      displayName: 'Mock User',
                      isActive: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                  }
                } else {
                  result[includeKey] = null;
                }
              } else if (includeKey === 'seller' || includeKey === 'buyer') {
                const userStore = mockPrismaStore.get('user');
                const userId = includeKey === 'seller' ? result.sellerId : result.buyerId;
                if (userStore && userId) {
                  const user = userStore.get(userId);
                  if (user) {
                    result[includeKey] = user;
                  } else {
                    result[includeKey] = {
                      id: userId,
                      username: `user-${userId.slice(0, 8)}`,
                      email: `user-${userId.slice(0, 8)}@example.com`,
                      displayName: 'Mock User',
                      isActive: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                  }
                } else {
                  result[includeKey] = null;
                }
              } else if (includeKey === 'offer') {
                const offerStore = mockPrismaStore.get('p2POffer');
                if (offerStore && result.offerId) {
                  const offer = offerStore.get(result.offerId);
                  if (offer) {
                    result[includeKey] = offer;
                  } else {
                    result[includeKey] = null;
                  }
                } else {
                  result[includeKey] = null;
                }
              } else {
                result[includeKey] = [];
              }
            }
          });
        }

        return result;
      }
      return records[0] || null;
    }),

    create: vi.fn().mockImplementation(async (args: unknown) => {
      // UUIDv4形式のIDを生成
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const id = (args as { data: Record<string, unknown> }).data.id || generateUUID();
      const record: Record<string, unknown> = {
        id,
        ...args.data,
        createdAt: args.data.createdAt ? new Date(args.data.createdAt) : new Date(),
        updatedAt: new Date(),
      };

      // モデル固有のデフォルト補完
      if (modelName === 'post') {
        if (record.visibility === undefined) record.visibility = 'PUBLIC';
        if (record.isDeleted === undefined) record.isDeleted = false;
        if (record.isProcessing === undefined) record.isProcessing = false;
      }
      if (modelName === 'p2POffer') {
        if (record.isDeleted === undefined) record.isDeleted = false;
        if (record.isActive === undefined) record.isActive = true;
      }
      if (modelName === 'wallet') {
        if (record.balanceUsd === undefined) record.balanceUsd = 0;
      }
      if (modelName === 'depositRequest') {
        if (record.status === undefined) record.status = 'PENDING';
      }
      if (modelName === 'withdrawalRequest') {
        if (record.status === undefined) record.status = 'PENDING';
      }

      store.set(id, record);
      return record;
    }),

    update: vi.fn().mockImplementation(async (args: unknown) => {
      const applyAtomicUpdates = (
        existing: Record<string, unknown>,
        data: Record<string, unknown>
      ) => {
        const result = { ...existing };
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object') {
            const valObj = value as Record<string, unknown>;
            if (valObj.increment !== undefined) {
              const current = Number(result[key]) || 0;
              const inc = Number(valObj.increment) || 0;
              result[key] = current + inc;
              continue;
            }
            if (valObj.decrement !== undefined) {
              const current = Number(result[key]) || 0;
              const dec = Number(valObj.decrement) || 0;
              result[key] = current - dec;
              continue;
            }
          }
          result[key] = value;
        }
        return result;
      };

      // 1) id指定があればそれを優先
      if (args?.where?.id) {
        const id = args.where.id;
        const existing = store.get(id);
        if (!existing) {
          throw new Error(`Record not found: ${id}`);
        }
        const updated = { ...applyAtomicUpdates(existing, args.data), updatedAt: new Date() };
        store.set(id, updated);
        return updated;
      }

      // 2) walletのuserIdによる検索を特別にサポート
      if (modelName === 'wallet' && args?.where?.userId) {
        const userId = (args.where as { userId: string }).userId;
        for (const [id, record] of store.entries()) {
          if ((record as { userId?: string }).userId === userId) {
            const updated = { ...applyAtomicUpdates(record, args.data), updatedAt: new Date() };
            store.set(id, updated);
            return updated;
          }
        }
        throw new Error(`Wallet not found by userId: ${userId}`);
      }

      // 3) それ以外（uniqueキー: e.g. paymentId 等）での更新をサポート
      if (args?.where && typeof args.where === 'object') {
        let targetId: string | null = null;
        let existing: Record<string, unknown> | null = null;
        for (const [id, record] of store.entries()) {
          const matches = Object.entries(args.where).every(([key, value]) => record[key] === value);
          if (matches) {
            targetId = id;
            existing = record;
            break;
          }
        }
        if (!targetId || !existing) {
          const keys = Object.keys(args.where);
          throw new Error(`Record not found by where: ${keys.join(',')}`);
        }
        const updated = { ...applyAtomicUpdates(existing, args.data), updatedAt: new Date() };
        store.set(targetId, updated);
        return updated;
      }

      throw new Error('update called without valid where clause');
    }),

    delete: vi.fn().mockImplementation(async (args: unknown) => {
      const id = args.where.id;
      const existing = store.get(id);
      if (!existing) {
        throw new Error(`Record not found: ${id}`);
      }
      store.delete(id);
      return existing;
    }),

    deleteMany: vi.fn((args: unknown) => {
      if (args?.where) {
        const records = Array.from(store.entries());
        let deleted = 0;
        records.forEach(([id, record]) => {
          const matches = Object.entries(args.where).every(([key, value]) => {
            return record[key] === value;
          });
          if (matches) {
            store.delete(id);
            deleted++;
          }
        });
        return { count: deleted };
      } else {
        const count = store.size;
        store.clear();
        return { count };
      }
    }),

    updateMany: vi.fn((args: unknown) => {
      const records = Array.from(store.entries());
      let updated = 0;
      records.forEach(([id, record]) => {
        const matches = (rec: Record<string, unknown>, where: Record<string, unknown>): boolean => {
          if (!where) return true;
          return Object.entries(where).every(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              if (value.in !== undefined) {
                return value.in.includes(rec[key]);
              }
              if (value.equals !== undefined) {
                return rec[key] === value.equals;
              }
              return true;
            }
            return rec[key] === value;
          });
        };

        if (matches(record, args.where)) {
          const applyAtomicUpdates = (
            existing: Record<string, unknown>,
            data: Record<string, unknown>
          ) => {
            const result = { ...existing };
            for (const [key, value] of Object.entries(data)) {
              if (value && typeof value === 'object') {
                const valObj = value as Record<string, unknown>;
                if (valObj.increment !== undefined) {
                  const current = Number(result[key]) || 0;
                  const inc = Number(valObj.increment) || 0;
                  result[key] = current + inc;
                  continue;
                }
                if (valObj.decrement !== undefined) {
                  const current = Number(result[key]) || 0;
                  const dec = Number(valObj.decrement) || 0;
                  result[key] = current - dec;
                  continue;
                }
              }
              result[key] = value;
            }
            return result;
          };
          const updatedRecord = { ...applyAtomicUpdates(record, args.data), updatedAt: new Date() };
          store.set(id, updatedRecord);
          updated++;
        }
      });
      return { count: updated };
    }),

    createMany: vi.fn((args: unknown) => {
      const data = args?.data || [];
      const created = [];
      for (const item of data) {
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };

        const id = item.id || generateUUID();
        const record: Record<string, unknown> = {
          id,
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: new Date(),
        };

        // モデル固有のデフォルト補完
        if (modelName === 'post') {
          if (record.visibility === undefined) record.visibility = 'PUBLIC';
          if (record.isDeleted === undefined) record.isDeleted = false;
          if (record.isProcessing === undefined) record.isProcessing = false;
        }
        if (modelName === 'p2POffer') {
          if (record.isDeleted === undefined) record.isDeleted = false;
          if (record.isActive === undefined) record.isActive = true;
        }
        if (modelName === 'depositRequest' || modelName === 'withdrawalRequest') {
          if (record.status === undefined) record.status = 'PENDING';
        }

        store.set(id, record);
        created.push(record);
      }
      return { count: created.length };
    }),

    count: vi.fn((args: unknown) => {
      if (args?.where) {
        const records = Array.from(store.values());
        return records.filter(record => {
          return Object.entries((args as { where: Record<string, unknown> }).where).every(
            ([key, value]) => {
              return record[key] === value;
            }
          );
        }).length;
      }
      return store.size;
    }),
    upsert: vi
      .fn()
      .mockImplementation(
        async (args: {
          where: Record<string, unknown>;
          update: Record<string, unknown>;
          create: Record<string, unknown>;
        }) => {
          const { where, update, create } = args;
          const records = Array.from(store.entries());
          let existing: Record<string, unknown> | null = null;
          let existingId: string | null = null;

          const matches = (
            rec: Record<string, unknown>,
            condition: Record<string, unknown>
          ): boolean => {
            return Object.entries(condition).every(([key, value]) => {
              if (typeof value === 'object' && value !== null && key.includes('_')) {
                const parts = key.split('_');
                return parts.every(k => rec[k] === (value as any)[k]);
              }
              return rec[key] === value;
            });
          };

          for (const [id, record] of records) {
            if (matches(record, where)) {
              existing = record;
              existingId = id;
              break;
            }
          }

          if (existing) {
            const updated = { ...existing, ...update, updatedAt: new Date() };
            store.set(existingId!, updated);
            return updated;
          } else {
            const generateUUID = () => {
              return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
              });
            };
            const id = create.id || generateUUID();
            const record: Record<string, unknown> = {
              id,
              ...create,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // デフォルト値補完
            if (modelName === 'depositRequest' || modelName === 'withdrawalRequest') {
              if (record.status === undefined) record.status = 'PENDING';
            }
            if (modelName === 'wallet') {
              if (record.balanceUsd === undefined) record.balanceUsd = 0;
              if (record.p2pBalanceUsd === undefined) record.p2pBalanceUsd = 0;
              if (record.p2pLockedUsd === undefined) record.p2pLockedUsd = 0;
            }

            store.set(id, record);
            return record;
          }
        }
      ),
  };
};

vi.mock('@prisma/client', () => {
  let mockInstance: Record<string, unknown> | null = null;

  const MockPrismaClient = vi.fn(() => {
    mockInstance = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $transaction: vi.fn().mockImplementation(async callback => {
        return await callback(mockInstance);
      }),

      // 主要なモデル
      user: createMockModel('user'),
      post: createMockModel('post'),
      media: createMockModel('media'),
      mediaVariant: createMockModel('mediaVariant'),
      comment: createMockModel('comment'),
      like: createMockModel('like'),
      follow: createMockModel('follow'),
      notification: createMockModel('notification'),

      // 権限システム
      role: createMockModel('role'),
      permission: createMockModel('permission'),
      userPermission: createMockModel('userPermission'),
      userPermissionOverride: createMockModel('userPermissionOverride'),
      userRole: createMockModel('userRole'),
      rolePermission: createMockModel('rolePermission'),

      // ウォレットシステム
      wallet: createMockModel('wallet'),
      userWallet: createMockModel('userWallet'),
      walletTransaction: createMockModel('walletTransaction'),
      paymentRequest: createMockModel('paymentRequest'),
      withdrawalRequest: createMockModel('withdrawalRequest'),
      depositRequest: createMockModel('depositRequest'),
      nowPaymentsPayment: createMockModel('nowPaymentsPayment'),
      p2POffer: createMockModel('p2POffer'),
      p2PTradeRequest: createMockModel('p2PTradeRequest'),

      // メッセージシステム
      conversation: createMockModel('conversation'),
      message: createMockModel('message'),
      conversationParticipant: createMockModel('conversationParticipant'),

      // システム設定
      siteFeatureSetting: createMockModel('siteFeatureSetting'),
      userFeaturePermission: createMockModel('userFeaturePermission'),
      userSettings: createMockModel('userSettings'),
      exchangeRate: createMockModel('exchangeRate'),

      // OGPシステム
      ogpPublicMedia: createMockModel('ogpPublicMedia'),
    };
    return mockInstance;
  });

  return {
    PrismaClient: MockPrismaClient,
  };
});

/**
 * @libark/db/server をモックして、モックされた Prisma Client を返すようにする
 * test-app.ts は @libark/db/server から prisma をインポートしているため、
 * ここをモックする必要がある
 */
vi.mock('@libark/db/server', () => {
  // モックされた Prisma Client インスタンスを作成
  const mockInstance = {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn().mockImplementation(async callback => {
      return await callback(mockInstance);
    }),

    // 主要なモデル
    user: createMockModel('user'),
    post: createMockModel('post'),
    media: createMockModel('media'),
    mediaVariant: createMockModel('mediaVariant'),
    comment: createMockModel('comment'),
    like: createMockModel('like'),
    follow: createMockModel('follow'),
    notification: createMockModel('notification'),

    // 権限システム
    role: createMockModel('role'),
    permission: createMockModel('permission'),
    userPermission: createMockModel('userPermission'),
    userPermissionOverride: createMockModel('userPermissionOverride'),
    userRole: createMockModel('userRole'),
    rolePermission: createMockModel('rolePermission'),

    // ウォレットシステム
    wallet: createMockModel('wallet'),
    userWallet: createMockModel('userWallet'),
    walletTransaction: createMockModel('walletTransaction'),
    paymentRequest: createMockModel('paymentRequest'),
    withdrawalRequest: createMockModel('withdrawalRequest'),
    depositRequest: createMockModel('depositRequest'),
    nowPaymentsPayment: createMockModel('nowPaymentsPayment'),
    p2POffer: createMockModel('p2POffer'),
    p2PTradeRequest: createMockModel('p2PTradeRequest'),

    // メッセージシステム
    conversation: createMockModel('conversation'),
    message: createMockModel('message'),
    conversationParticipant: createMockModel('conversationParticipant'),

    // システム設定
    siteFeatureSetting: createMockModel('siteFeatureSetting'),
    userFeaturePermission: createMockModel('userFeaturePermission'),
    userSettings: createMockModel('userSettings'),
    exchangeRate: createMockModel('exchangeRate'),

    // OGPシステム
    ogpPublicMedia: createMockModel('ogpPublicMedia'),
  };

  return {
    prisma: mockInstance,
    PrismaClient: vi.fn(() => mockInstance),
    createPrismaClient: vi.fn(() => mockInstance),
  };
});

// bcryptモック（グローバル）
vi.mock('bcrypt', () => {
  const mockBcrypt = {
    hash: vi.fn().mockImplementation(async (password: string, saltRounds: number) => {
      return `$2b$${saltRounds}$hashed_${password}`;
    }),
    compare: vi.fn().mockImplementation(async (password: string, hash: string) => {
      // ハッシュから元のパスワードを抽出
      const match = hash.match(/\$2b\$\d+\$hashed_(.+)$/);
      if (match) {
        return match[1] === password;
      }
      return false;
    }),
  };

  return {
    default: mockBcrypt,
    ...mockBcrypt,
  };
});

// @libark/core-server/security/passwordモック
vi.mock('@libark/core-server/security/password', () => ({
  hashPassword: vi.fn().mockImplementation(async (password: string, options: unknown = {}) => {
    const saltRounds = options.saltRounds || 10;
    return `$2b$${saltRounds}$hashed_${password}`;
  }),
  verifyPassword: vi.fn().mockImplementation(async (password: string, hash: string) => {
    // ハッシュから元のパスワードを抽出
    const match = hash.match(/\$2b\$\d+\$hashed_(.+)$/);
    if (match) {
      return match[1] === password;
    }
    return false;
  }),
  passwordUtils: {
    hashPassword: vi.fn().mockImplementation(async (password: string, options: unknown = {}) => {
      const saltRounds = options.saltRounds || 10;
      return `$2b$${saltRounds}$hashed_${password}`;
    }),
    verifyPassword: vi.fn().mockImplementation(async (password: string, hash: string) => {
      const match = hash.match(/\$2b\$\d+\$hashed_(.+)$/);
      if (match) {
        return match[1] === password;
      }
      return false;
    }),
  },
}));

// グローバルテストセットアップ
beforeAll(async () => {
  console.log('🧪 テスト環境初期化中...');

  // 必要な環境変数の確認
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️ ${envVar} が設定されていません。テスト用デフォルト値を使用します。`);
    }
  }

  console.log('✅ テスト環境初期化完了');
});

// グローバルテストクリーンアップはglobal-teardown.tsで実行
