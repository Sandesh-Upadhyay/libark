/**
 * Health Check Routes
 */

import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, _reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'libark-s3-gateway',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  });
}
