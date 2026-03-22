/**
 * S3 Gateway Configuration
 */

import { getS3ConfigForService, type UnifiedS3Config } from '@libark/core-shared';

export interface S3GatewayConfig {
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  s3: {
    backend: {
      type: 'r2' | 'gcs' | 'aws' | 'do_spaces';
      endpoint: string;
      region: string;
      accessKey: string;
      secretKey: string;
      bucket: string;
    };
    presigned: {
      expiresIn: number;
    };
  };
  encryption: {
    enabled: boolean;
    key?: string;
    algorithm: string;
  };
  jwt: {
    secret: string;
  };
  logging: {
    level: string;
    pretty: boolean;
  };
}

/**
 * 統一S3設定システムから設定を取得
 */
export function getConfig(): S3GatewayConfig {
  // 統一S3設定を取得
  const unifiedConfig = getS3ConfigForService('s3-gateway') as Partial<UnifiedS3Config>;

  return {
    port: parseInt(process.env.S3_GATEWAY_PORT || '8080', 10),

    cors: {
      origin: process.env.S3_GATEWAY_CORS_ORIGIN?.split(',') || ['*'],
      credentials: process.env.S3_GATEWAY_CORS_CREDENTIALS === 'true',
    },

    s3: {
      backend: {
        type: unifiedConfig.backend?.type || 'r2',
        endpoint:
          unifiedConfig.backend?.endpoint ||
          'https://f25991cce89a4c211ef744fa4de7acdd.r2.cloudflarestorage.com',
        region: unifiedConfig.backend?.region || 'auto',
        accessKey: unifiedConfig.backend?.accessKey || '',
        secretKey: unifiedConfig.backend?.secretKey || '',
        bucket: unifiedConfig.backend?.bucket || 'media',
      },
      presigned: {
        expiresIn: unifiedConfig.presigned?.expiresIn || 3600,
      },
    },

    encryption: {
      enabled: unifiedConfig.encryption?.enabled || false,
      key: unifiedConfig.encryption?.key,
      algorithm: unifiedConfig.encryption?.algorithm || 'AES256',
    },

    jwt: {
      secret: process.env.JWT_SECRET || 'default-secret',
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      pretty: process.env.NODE_ENV === 'development',
    },
  };
}

/**
 * 統一S3設定システムを使用した設定バリデーション
 */
export function validateConfig(config: S3GatewayConfig): void {
  if (!config.s3.backend.accessKey) {
    throw new Error('S3_BACKEND_ACCESS_KEY is required');
  }

  if (!config.s3.backend.secretKey) {
    throw new Error('S3_BACKEND_SECRET_KEY is required');
  }

  if (config.encryption.enabled && !config.encryption.key) {
    throw new Error('S3_GATEWAY_ENCRYPTION_KEY is required when encryption is enabled');
  }

  if (!config.jwt.secret || config.jwt.secret === 'default-secret') {
    throw new Error('JWT_SECRET is required');
  }
}

/**
 * 統一S3設定システムから直接設定を取得（新しいAPI）
 */
export function getUnifiedConfig(): Partial<UnifiedS3Config> {
  return getS3ConfigForService('s3-gateway');
}
