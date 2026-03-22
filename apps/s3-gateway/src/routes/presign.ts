/**
 * Presigned URL Routes
 */

import { FastifyInstance } from 'fastify';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';

import { getS3ClientService } from '../services/s3-client.js';
import { getEncryptionService } from '../services/encryption.js';
import { getConfig } from '../config/index.js';

export async function presignRoutes(app: FastifyInstance) {
  const config = getConfig();
  const s3Service = getS3ClientService();
  const encryptionService = getEncryptionService();

  app.post('/presign/upload', async (request, reply) => {
    try {
      const { filename, contentType, size, mediaId, s3Key } = request.body as {
        filename: string;
        contentType: string;
        size: number;
        mediaId: string;
        s3Key: string;
      };

      if (!filename || !contentType || !size || !mediaId || !s3Key) {
        return reply.status(400).send({
          error: {
            message: 'Missing required fields: filename, contentType, size, mediaId, s3Key',
            code: 'MISSING_FIELDS',
          },
        });
      }

      if (size > 100 * 1024 * 1024) {
        return reply.status(400).send({
          error: { message: 'File too large', code: 'FILE_TOO_LARGE' },
        });
      }

      const s3Client = s3Service.getClient();
      const s3Config = s3Service.getConfig();

      const putObjectParams: PutObjectCommandInput = {
        Bucket: s3Config.backend.bucket,
        Key: s3Key,
        ContentType: contentType,
        Metadata: {
          'media-id': mediaId,
          'original-filename': filename,
          'upload-timestamp': new Date().toISOString(),
        },
      };

      if (encryptionService.isEnabled()) {
        const ssecParams = await encryptionService.generateSSECParams();
        Object.assign(putObjectParams, ssecParams);
      }

      const command = new PutObjectCommand(putObjectParams);
      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: config.s3.presigned.expiresIn,
      });

      const headers: Record<string, string> = {};

      if (encryptionService.isEnabled()) {
        const encryptionHeaders = await encryptionService.generateEncryptionHeaders();
        Object.assign(headers, encryptionHeaders);
      }

      return {
        uploadUrl,
        headers,
        mediaId,
        key: s3Key,
        method: 'PUT',
        expiresIn: config.s3.presigned.expiresIn,
      };
    } catch (error: unknown) {
      app.log.error({ err: error }, 'Presign upload error:');
      return reply.status(500).send({
        error: { message: 'Presign upload failed', code: 'PRESIGN_ERROR' },
      });
    }
  });

  app.post('/presign/download', async (request, reply) => {
    try {
      const {
        bucket,
        key,
        expiresIn = 3600,
      } = request.body as {
        bucket: string;
        key: string;
        expiresIn?: number;
      };

      if (!bucket || !key) {
        return reply.status(400).send({
          error: { message: 'Missing bucket or key', code: 'MISSING_FIELDS' },
        });
      }

      const s3Client = s3Service.getClient();
      const getObjectParams: GetObjectCommandInput = { Bucket: bucket, Key: key };

      if (encryptionService.isEnabled()) {
        const ssecParams = await encryptionService.generateSSECParams();
        Object.assign(getObjectParams, ssecParams);
      }

      const command = new GetObjectCommand(getObjectParams);
      const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

      const response: unknown = { downloadUrl, expiresIn, key };

      if (encryptionService.isEnabled()) {
        (response as { headers?: unknown }).headers =
          await encryptionService.generateEncryptionHeaders();
      }

      return response;
    } catch (error: unknown) {
      app.log.error({ err: error }, 'Presign download error:');
      return reply.status(500).send({
        error: { message: 'Presign download failed', code: 'PRESIGN_ERROR' },
      });
    }
  });
}
