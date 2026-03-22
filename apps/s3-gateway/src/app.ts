/**
 * S3 Gateway Application
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

import { getConfig, validateConfig } from './config/index.js';
import { healthRoutes } from './routes/health.js';
import { presignRoutes } from './routes/presign.js';
import { proxyRoutes } from './routes/proxy.js';
import { uploadRoutes } from './routes/upload.js';
import { encryptionRoutes } from './routes/encryption.js';
import { ogpRoutes } from './routes/ogp.js';

export async function createApp() {
  const config = getConfig();
  validateConfig(config);

  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.logging.pretty
        ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss Z' },
          }
        : undefined,
    },
  });

  await app.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-amz-*'],
  });

  await app.register(multipart, {
    limits: { fileSize: 100 * 1024 * 1024 },
    // PUTリクエストはmultipart処理をスキップ（PUT /upload/:uploadId用）
    attachFieldsToBody: false,
    // multipart以外のContent-Typeも許可
    sharedSchemaId: undefined,
  });

  // PUT /upload/:uploadIdのContent-Type解析をカスタマイズ
  // ストリームとして扱うためにbodyをそのまま通過させる
  const STREAM_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
  ] as const;

  const streamParser = (
    _req: unknown,
    payload: NodeJS.ReadableStream,
    done: (err: Error | null, body?: NodeJS.ReadableStream) => void
  ) => {
    done(null, payload);
  };

  for (const contentType of STREAM_TYPES) {
    app.addContentTypeParser(contentType, streamParser);
  }

  await app.register(healthRoutes);
  await app.register(presignRoutes);
  await app.register(uploadRoutes);
  await app.register(proxyRoutes);
  await app.register(encryptionRoutes);
  await app.register(ogpRoutes);

  app.setErrorHandler(async (originalError, request, reply) => {
    const error = originalError as { statusCode?: number; message?: string };
    app.log.error({ err: error }, 'Global error handler');
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : error.message;
    return reply.status(statusCode).send({
      error: { message, statusCode, timestamp: new Date().toISOString() },
    });
  });

  return app;
}
