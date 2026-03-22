/**
 * File Proxy Routes
 */

import { Readable } from 'stream';

import { FastifyInstance } from 'fastify';
import { GetObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';

import { getS3ClientService } from '../services/s3-client.js';
import { getEncryptionService } from '../services/encryption.js';

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.xml': 'application/xml',
};

export async function proxyRoutes(app: FastifyInstance) {
  const s3Service = getS3ClientService();
  const encryptionService = getEncryptionService();

  app.get('/files/:bucket/*', async (request, reply) => {
    const { bucket } = request.params as { bucket: string };
    const key = (request.params as { '*': string })['*'];

    try {
      // Validate bucket name
      const s3Config = s3Service.getConfig();
      if (bucket !== s3Config.backend.bucket) {
        return reply.status(404).send({
          error: {
            message: 'Bucket not found',
            code: 'BUCKET_NOT_FOUND',
          },
        });
      }

      // Get S3 client
      const s3Client = s3Service.getClient();

      // Prepare GetObject command with encryption headers if needed
      const getObjectParams: GetObjectCommandInput = {
        Bucket: bucket,
        Key: key,
      };

      // Try with encryption parameters first, then fallback to unencrypted
      let response;
      const isEncrypted = encryptionService.isEnabled();

      if (isEncrypted) {
        try {
          // First attempt: with encryption parameters
          const ssecParams = await encryptionService.generateSSECParams();
          const encryptedParams = { ...getObjectParams, ...ssecParams };
          const encryptedCommand = new GetObjectCommand(encryptedParams);
          response = await s3Client.send(encryptedCommand);
        } catch (error: unknown) {
          // If encryption fails with InvalidRequest, try without encryption
          if ((error as { Code?: string }).Code === 'InvalidRequest') {
            app.log.warn({
              bucket,
              key,
              error: error instanceof Error ? error.message : 'Unknown error',
            }, 'Encryption parameters not applicable, trying without encryption:');

            // Fallback: try without encryption parameters
            const unencryptedCommand = new GetObjectCommand(getObjectParams);
            response = await s3Client.send(unencryptedCommand);
          } else {
            throw error;
          }
        }
      } else {
        // No encryption enabled, use standard request
        const command = new GetObjectCommand(getObjectParams);
        response = await s3Client.send(command);
      }

      if (!response.Body) {
        return reply.status(404).send({
          error: {
            message: 'File not found',
            code: 'FILE_NOT_FOUND',
          },
        });
      }

      // Determine content type
      const fileExtension = getFileExtension(key);
      const contentType =
        response.ContentType || MIME_TYPES[fileExtension] || 'application/octet-stream';

      // Set response headers for S3 proxy
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Length': response.ContentLength?.toString() || '0',
        'Cache-Control': 'public, max-age=86400', // 24 hours default cache
        ETag: response.ETag || '',
        'Last-Modified': response.LastModified?.toUTCString() || '',
        'Accept-Ranges': 'bytes',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };

      // Add CORS headers for cross-origin access
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      headers['X-Content-Type-Options'] = 'nosniff';

      reply.headers(headers);

      // Handle conditional requests
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === response.ETag) {
        return reply.status(304).send();
      }

      const ifModifiedSince = request.headers['if-modified-since'];
      if (ifModifiedSince && response.LastModified) {
        const modifiedSince = new Date(ifModifiedSince);
        if (response.LastModified <= modifiedSince) {
          return reply.status(304).send();
        }
      }

      // Stream the file content
      const stream = response.Body as Readable;

      return reply.send(stream);
    } catch (error: unknown) {
      app.log.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as { Code?: string; name?: string }).Code || (error as { name?: string }).name,
        statusCode: (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode,
        bucket,
        key,
        stack: error instanceof Error ? error.stack : undefined,
      }, 'File serve error:');

      if (
        (error as { Code?: string }).Code === 'NoSuchKey' ||
        (error as { name?: string }).name === 'NoSuchKey'
      ) {
        return reply.status(404).send({
          error: { message: 'File not found', code: 'FILE_NOT_FOUND' },
        });
      }

      if (
        (error as { Code?: string }).Code === 'AccessDenied' ||
        (error as { name?: string }).name === 'AccessDenied'
      ) {
        return reply.status(403).send({
          error: { message: 'Access denied', code: 'ACCESS_DENIED' },
        });
      }

      return reply.status(500).send({
        error: { message: 'File retrieval failed', code: 'FILE_ERROR' },
      });
    }
  });
}

/**
 * Utility functions
 */

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
}
