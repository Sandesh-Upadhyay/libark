/**
 * 🎯 GraphQL型定義
 *
 * GraphQLコンテキストとリゾルバーの型定義
 */

import type { PrismaClient } from '@libark/db';
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type { RedisPubSubManager } from '@libark/redis-client';
import type { AuthenticatedUser } from '@libark/core-shared';

/**
 * GraphQLコンテキスト
 */
export interface GraphQLContext {
  prisma: PrismaClient;
  user?: AuthenticatedUser;
  request: FastifyRequest | null;
  reply: FastifyReply | null;
  fastify: FastifyInstance;
  authService: FastifyInstance['auth']['authService'];
  redisPubSub: RedisPubSubManager;
  websocket?: unknown;
  connectionParams?: Record<string, unknown>;
}

/**
 * GraphQLリゾルバー引数
 */
export interface GraphQLResolverArgs {
  parent: unknown;
  args: Record<string, unknown>;
  context: GraphQLContext;
  info: unknown;
}
