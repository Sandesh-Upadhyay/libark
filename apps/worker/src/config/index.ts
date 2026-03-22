/**
 * ワーカーサービスの設定
 * 統一S3設定システムを使用
 */

import {
  serverConfig,
  S3_CONSTANTS,
  envUtils,
  getS3ConfigForService,
  type UnifiedS3Config,
} from '@libark/core-shared';

import { WORKER_SPECIFIC_CONSTANTS } from './workerConfig.js';

// 新しいワーカー設定をエクスポート
export * from './workerConfig.js';

// レガシー互換性のためのインターフェース
interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  bullBoardEnabled: boolean;
  bullBoardBasePath: string;
  s3: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
    endpoint: string;
    domain: string;
    cdnDomain: string;
  };
}

export const config: Config = {
  nodeEnv: serverConfig.server.nodeEnv,
  port: parseInt(
    envUtils.getEnvVar('PORT') || WORKER_SPECIFIC_CONSTANTS.DEFAULT_WORKER_PORT.toString(),
    10
  ), // ワーカー固有のポート
  databaseUrl: serverConfig.database.url,
  redisUrl: serverConfig.redis.url,
  bullBoardEnabled: envUtils.getEnvVar('BULL_BOARD_ENABLED') !== 'false',
  bullBoardBasePath: envUtils.getEnvVar('BULL_BOARD_BASE_PATH') || '/admin/queues',
  s3: (() => {
    // 統一S3設定システムから設定を取得
    const unifiedS3Config = getS3ConfigForService('worker') as Partial<UnifiedS3Config>;

    return {
      accessKey: unifiedS3Config.credentials?.accessKey || serverConfig.s3.accessKey,
      secretKey: unifiedS3Config.credentials?.secretKey || serverConfig.s3.secretKey,
      bucket: unifiedS3Config.storage?.bucket || serverConfig.s3.bucket,
      region: unifiedS3Config.storage?.region || serverConfig.s3.region,
      endpoint: unifiedS3Config.storage?.endpoint || serverConfig.s3.endpoint,
      domain:
        unifiedS3Config.urls?.public || serverConfig.s3.publicUrl || S3_CONSTANTS.DEFAULT_DOMAIN,
      cdnDomain:
        unifiedS3Config.urls?.cdn || serverConfig.s3.cdnDomain || S3_CONSTANTS.DEFAULT_CDN_DOMAIN,
    };
  })(),
};

export default config;
