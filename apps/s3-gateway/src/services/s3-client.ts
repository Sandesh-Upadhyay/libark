/**
 * 🔗 Dynamic S3 Client Service
 *
 * Provides dynamic S3 client creation based on backend type
 * Supports: Cloudflare R2, AWS S3, Google Cloud Storage, DigitalOcean Spaces
 */

import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

import { getConfig, S3GatewayConfig } from '../config/index.js';

export type S3BackendType = 'r2' | 'gcs' | 'aws' | 'do_spaces';

export interface S3ClientService {
  getClient(): S3Client;
  getConfig(): S3GatewayConfig['s3'];
  validateConnection(): Promise<boolean>;
}

/**
 * Create S3 client based on backend type
 */
export function createS3Client(config: S3GatewayConfig['s3']): S3Client {
  const clientConfig: S3ClientConfig = {
    region: config.backend.region,
    credentials: {
      accessKeyId: config.backend.accessKey,
      secretAccessKey: config.backend.secretKey,
    },
    logger: console, // デバッグログ有効化
  };

  // Configure endpoint based on backend type
  switch (config.backend.type) {
    case 'r2':
      // Cloudflare R2
      clientConfig.endpoint = config.backend.endpoint;
      clientConfig.forcePathStyle = true;
      break;

    case 'gcs':
      // Google Cloud Storage (S3 compatible)
      clientConfig.endpoint = config.backend.endpoint || 'https://storage.googleapis.com';
      clientConfig.forcePathStyle = true;
      break;

    case 'aws':
      // AWS S3 (use default endpoint)
      if (config.backend.endpoint) {
        clientConfig.endpoint = config.backend.endpoint;
      }
      break;

    case 'do_spaces':
      // DigitalOcean Spaces
      clientConfig.endpoint = config.backend.endpoint;
      clientConfig.forcePathStyle = false;
      break;

    default:
      throw new Error(`Unsupported S3 backend type: ${config.backend.type}`);
  }

  return new S3Client(clientConfig);
}

/**
 * S3 Client Service Implementation
 */
export class S3ClientServiceImpl implements S3ClientService {
  private client: S3Client;
  private config: S3GatewayConfig['s3'];

  constructor() {
    const gatewayConfig = getConfig();
    this.config = gatewayConfig.s3;
    this.client = createS3Client(this.config);
  }

  getClient(): S3Client {
    return this.client;
  }

  getConfig(): S3GatewayConfig['s3'] {
    return this.config;
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (limit to 1 for efficiency)
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.backend.bucket,
          MaxKeys: 1,
        })
      );

      return true;
    } catch (error) {
      console.error('S3 connection validation failed:', error);
      return false;
    }
  }
}

// Singleton instance
let s3ClientService: S3ClientService | null = null;

/**
 * Get singleton S3 client service instance
 */
export function getS3ClientService(): S3ClientService {
  if (!s3ClientService) {
    s3ClientService = new S3ClientServiceImpl();
  }
  return s3ClientService;
}

/**
 * Reset S3 client service (useful for testing or config changes)
 */
export function resetS3ClientService(): void {
  s3ClientService = null;
}
