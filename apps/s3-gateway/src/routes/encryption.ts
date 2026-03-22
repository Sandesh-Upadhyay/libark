/**
 * Encryption Routes
 */

import { FastifyInstance } from 'fastify';

import { getEncryptionService } from '../services/encryption.js';

export async function encryptionRoutes(app: FastifyInstance) {
  app.get('/encryption/status', async (request, reply) => {
    try {
      const encryptionService = getEncryptionService();
      const keyInfo = encryptionService.getKeyInfo();
      return {
        status: 'success',
        data: {
          enabled: keyInfo.enabled,
          algorithm: keyInfo.algorithm,
          keyLength: keyInfo.keyLength,
          keyValid: keyInfo.keyLength === 32,
        },
      };
    } catch (error) {
      app.log.error({ err: error }, 'Encryption status error:');
      return reply.status(500).send({
        error: { message: 'Encryption status error', code: 'ENCRYPTION_ERROR' },
      });
    }
  });
}
