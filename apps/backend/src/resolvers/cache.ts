/**
 * 🚀 キャッシュ統計GraphQLリゾルバー
 *
 * 認証キャッシュシステムの統計情報を提供
 */

import { GraphQLError } from 'graphql';
import { envUtils } from '@libark/core-shared';

import type { GraphQLContext } from '../graphql/context.js';

export interface CacheStatsResponse {
  l1Hits: number;
  l2Hits: number;
  dbHits: number;
  totalRequests: number;
  hitRate: number;
  enabled: boolean;
}

export interface RateLimitStatsResponse {
  totalKeys: number;
  blockedIdentifiers: number;
  enabled: boolean;
}

export const cacheResolvers = {
  Query: {
    /**
     * 認証キャッシュ統計情報を取得（開発環境のみ）
     */
    authCacheStats: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<CacheStatsResponse> => {
      // 開発環境でのみ利用可能
      if (!envUtils.isDevelopment()) {
        throw new GraphQLError('この機能は開発環境でのみ利用可能です', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // 管理者権限チェック（将来的に実装）
      // if (!context.user || !hasPermission(context.user, 'ADMIN')) {
      //   throw new GraphQLError('管理者権限が必要です', {
      //     extensions: { code: 'FORBIDDEN' },
      //   });
      // }

      try {
        const stats = context.fastify.auth.getCacheStats();

        if (!stats) {
          return {
            l1Hits: 0,
            l2Hits: 0,
            dbHits: 0,
            totalRequests: 0,
            hitRate: 0,
            enabled: false,
          };
        }

        return {
          l1Hits: Number(stats.l1Hits ?? 0),
          l2Hits: Number(stats.l2Hits ?? 0),
          dbHits: Number(stats.dbHits ?? 0),
          totalRequests: Number(stats.totalRequests ?? 0),
          hitRate: Number(stats.hitRate ?? 0),
          enabled: true,
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ キャッシュ統計取得エラー:');
        throw new GraphQLError('キャッシュ統計の取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },

    /**
     * レート制限統計情報を取得（開発環境のみ）
     */
    rateLimitStats: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<RateLimitStatsResponse> => {
      // 開発環境でのみ利用可能
      if (!envUtils.isDevelopment()) {
        throw new GraphQLError('この機能は開発環境でのみ利用可能です', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        const stats = await context.fastify.auth.getRateLimitStats();

        return {
          ...(stats as { totalKeys?: number; blockedIdentifiers?: number }),
          totalKeys: (stats as { totalKeys?: number }).totalKeys || 0,
          blockedIdentifiers: (
            (stats as { blockedIdentifiers?: string[] }).blockedIdentifiers || []
          ).length,
          enabled: true,
        };
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ レート制限統計取得エラー:');
        throw new GraphQLError('レート制限統計の取得に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * ユーザーキャッシュを無効化（開発環境のみ）
     */
    invalidateUserCache: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      // 開発環境でのみ利用可能
      if (!envUtils.isDevelopment()) {
        throw new GraphQLError('この機能は開発環境でのみ利用可能です', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // 管理者権限チェック（将来的に実装）
      // if (!context.user || !hasPermission(context.user, 'ADMIN')) {
      //   throw new GraphQLError('管理者権限が必要です', {
      //     extensions: { code: 'FORBIDDEN' },
      //   });
      // }

      try {
        await context.fastify.auth.invalidateUserCache(userId);
        context.fastify.log.info(`✅ ユーザーキャッシュ無効化: ${userId}`);
        return true;
      } catch (error) {
        context.fastify.log.error({ err: error }, '❌ キャッシュ無効化エラー:');
        throw new GraphQLError('キャッシュの無効化に失敗しました', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    },
  },
};
