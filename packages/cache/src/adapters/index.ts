/**
 * 🔌 キャッシュアダプター
 */

// Apollo Server アダプター
export { ApolloServerCacheAdapter, createApolloServerCache } from './apollo-server.js';

// ファクトリー
export {
  createCacheAdapter,
  type CacheAdapterOptions,
  type GenericCacheAdapter,
  type ExpressSessionAdapter,
} from './factory.js';

export type { CacheAdapterType } from './factory.js';

// レガシー互換アダプター
export {
  LegacyRedisCacheAdapter,
  legacyDistributedCache,
  type LegacyCacheOptions,
  type LegacyCacheEntry,
  type LegacyCacheStats,
  type CacheableUserProfile,
  type CacheablePost,
  type CacheableFeed,
  type CacheableSearchResult,
} from './legacy-redis-cache.js';
