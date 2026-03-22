/**
 * 🏭 キャッシュアダプターファクトリー
 */

import type { CacheManagerOptions } from '../cache-manager.js';

import { ApolloServerCacheAdapter, createApolloServerCache } from './apollo-server.js';

/**
 * アダプター種別
 */
export type CacheAdapterType = 'apollo-server' | 'express-session' | 'generic';

/**
 * アダプターオプション
 */
export interface CacheAdapterOptions extends CacheManagerOptions {
  type: CacheAdapterType;
}

/**
 * 汎用キャッシュアダプター
 */
export interface GenericCacheAdapter {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * キャッシュアダプターファクトリー
 */
export function createCacheAdapter(
  options: CacheAdapterOptions
): ApolloServerCacheAdapter | GenericCacheAdapter {
  switch (options.type) {
    case 'apollo-server':
      return createApolloServerCache(options);

    case 'generic':
      return createGenericAdapter(options);

    default:
      throw new Error(`Unsupported adapter type: ${options.type}`);
  }
}

/**
 * 汎用アダプターの作成
 */
function createGenericAdapter(options: CacheManagerOptions): GenericCacheAdapter {
  const { UnifiedCacheManager } = require('../cache-manager.js');
  const cacheManager = new UnifiedCacheManager(options);

  return {
    async get<T = any>(key: string): Promise<T | null> {
      return (await cacheManager.get('api', key)) as T | null;
    },

    async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
      await cacheManager.set('api', key, value, { ttl });
    },

    async delete(key: string): Promise<boolean> {
      try {
        await cacheManager.delete('api', key);
        return true;
      } catch {
        return false;
      }
    },

    async clear(): Promise<void> {
      await cacheManager.clearCategory('api');
    },

    async has(key: string): Promise<boolean> {
      const result = await cacheManager.get('api', key);
      return result !== null;
    },
  };
}

/**
 * Express Session用アダプター（将来の拡張用）
 */
export interface ExpressSessionAdapter {
  // Express Session Store インターフェース
  get(callback: (error?: Error, result?: unknown) => void): void;
  set(callback: (error?: Error) => void): void;
  destroy(callback: (error?: Error) => void): void;
  length(callback: (error?: Error, length?: number) => void): void;
  clear(callback: (error?: Error) => void): void;
  touch(callback: (error?: Error) => void): void;
}
