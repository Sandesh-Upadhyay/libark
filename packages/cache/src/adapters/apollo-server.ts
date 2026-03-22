/**
 * 🚀 Apollo Server キャッシュアダプター
 *
 * Apollo Serverのキャッシュインターフェースに対応したアダプター
 */

// import type { KeyValueCache } from '@apollo/utils.keyvaluecache';

import { UnifiedCacheManager } from '../cache-manager.js';
import { getDefaultCacheManager } from '../singleton.js';
import type { CacheManagerOptions } from '../cache-manager.js';

/**
 * Apollo Server用キャッシュアダプター（一時的に無効化）
 */
export class ApolloServerCacheAdapter /* implements KeyValueCache */ {
  private cacheManager: UnifiedCacheManager;

  constructor(options?: CacheManagerOptions) {
    this.cacheManager = options ? new UnifiedCacheManager(options) : getDefaultCacheManager();
  }

  /**
   * データの取得
   */
  async get(key: string): Promise<string | undefined> {
    try {
      const result = await this.cacheManager.get<string>('graphql', key);
      return result || undefined;
    } catch (error) {
      console.error('[ApolloCache] Get error:', error);
      return undefined;
    }
  }

  /**
   * データの設定
   */
  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    try {
      await this.cacheManager.set('graphql', key, value, {
        ttl: options?.ttl,
      });
    } catch (error) {
      console.error('[ApolloCache] Set error:', error);
      // Apollo Serverではエラーを投げずに無視
    }
  }

  /**
   * データの削除
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.cacheManager.delete('graphql', key);
      return true;
    } catch (error) {
      console.error('[ApolloCache] Delete error:', error);
      return false;
    }
  }

  /**
   * 全データのクリア
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.clearCategory('graphql');
    } catch (error) {
      console.error('[ApolloCache] Clear error:', error);
    }
  }
}

/**
 * Apollo Server用キャッシュアダプターファクトリー
 */
export function createApolloServerCache(options?: CacheManagerOptions): ApolloServerCacheAdapter {
  return new ApolloServerCacheAdapter(options);
}
