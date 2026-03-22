/**
 * 🚀 S3GatewayClient - S3 Gateway統合クライアント
 *
 * 統一S3設定システムを使用した機能:
 * - S3 Gateway API経由でのプリサインURL生成
 * - 暗号化対応
 * - 既存ZenkoMediaClientとの互換性
 * - POST/PUT両方式対応
 */

import { v4 as uuidv4 } from 'uuid';
import {
  generateS3Key,
  normalizeMediaType,
  getS3GatewayUrl,
  generatePublicMediaUrl,
} from '@libark/core-shared';

// ================================
// 型定義
// ================================

export interface PresignedUploadInput {
  filename: string;
  contentType: string;
  size: number;
  userId: string;
  mediaType?: string;
  mediaId?: string; // バックエンドで生成されたmediaId（オプション）
  s3Key?: string; // バックエンドで生成されたs3Key（オプション）
}

export interface PresignedUploadData {
  uploadUrl: string;
  downloadUrl: string;
  s3Key: string;
  mediaId: string;
  expiresAt: Date;
  fields?: Record<string, string>;
}

export interface MultipartUploadInput {
  filename: string;
  contentType: string;
  size: number;
  userId: string;
  partCount: number;
  mediaType?: string;
}

export interface MultipartUploadData {
  uploadId: string;
  s3Key: string;
  partUrls: PartUploadUrl[];
  mediaId: string;
  expiresAt: Date;
}

export interface PartUploadUrl {
  partNumber: number;
  uploadUrl: string;
}

export interface CompletedPart {
  partNumber: number;
  etag: string;
}

export interface S3GatewayConfig {
  gatewayUrl: string; // S3 Gateway URL (例: http://s3-gateway:8080)
  bucket: string;
  publicUrl?: string; // パブリックアクセス用URL
  timeout?: number; // リクエストタイムアウト（ミリ秒）
}

export interface S3GatewayPresignResponse {
  uploadUrl: string;
  headers: Record<string, string>;
  mediaId: string;
  key: string;
  method: string;
  expiresIn: number;
  maxSize: number;
}

// ================================
// S3GatewayClient実装
// ================================

export class S3GatewayClient {
  public config: S3GatewayConfig;
  public s3Client: unknown; // 互換性のため（実際には使用しない）

  constructor(config?: Partial<S3GatewayConfig>) {
    // 環境に応じた適切な設定（統一URL生成システム使用）
    const gatewayUrl = getS3GatewayUrl();
    const bucket = 'media';
    const publicUrl = `${gatewayUrl}/files/media`;
    const timeout = 30000;

    const defaultConfig: S3GatewayConfig = {
      gatewayUrl,
      bucket,
      publicUrl,
      timeout,
    };

    this.config = {
      ...defaultConfig,
      ...(config || {}),
    };

    // 互換性のためのダミーs3Client（実際には使用しない）
    this.s3Client = {
      send: () => {
        throw new Error(
          'S3GatewayClient: 直接S3操作はサポートされていません。S3 Gateway API経由でアクセスしてください。'
        );
      },
    };

    console.log('🔧 S3GatewayClient初期化完了:', {
      gatewayUrl: this.config.gatewayUrl,
      bucket: this.config.bucket,
      publicUrl: this.config.publicUrl,
      env: {
        S3_GATEWAY_URL: process.env.S3_GATEWAY_URL,
        NEXT_PUBLIC_S3_GATEWAY_URL: process.env.NEXT_PUBLIC_S3_GATEWAY_URL,
      },
    });
  }

  /**
   * プリサインドアップロードURL生成（S3 Gateway API経由）
   */
  async generatePresignedUpload(input: PresignedUploadInput): Promise<PresignedUploadData> {
    // バックエンドから渡されたmediaIdとs3Keyを優先使用（責任分離）
    const mediaId = input.mediaId || uuidv4();
    const s3Key =
      input.s3Key || this.generateS3Key(input.filename, input.userId, mediaId, input.mediaType);

    try {
      // S3 Gateway API呼び出し
      const response = await this.callGatewayAPI('/presign/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: input.filename,
          contentType: input.contentType,
          size: input.size,
          mediaId,
          s3Key,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `S3 Gateway API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const data: S3GatewayPresignResponse = await response.json();

      console.log('🔧 [S3GatewayClient] プリサインURL生成完了:', {
        mediaId: data.mediaId,
        s3Key: data.key,
        uploadUrl: data.uploadUrl,
        gatewayUrl: this.config.gatewayUrl,
      });

      const downloadUrl = this.generateDownloadUrl(data.key);
      const expiresAt = new Date(Date.now() + data.expiresIn * 1000);

      return {
        uploadUrl: data.uploadUrl,
        downloadUrl,
        s3Key: data.key,
        mediaId: data.mediaId,
        expiresAt,
        fields: data.headers,
      };
    } catch (error) {
      console.error('❌ [S3GatewayClient] プリサインURL生成エラー:', error);
      throw new Error(
        `プリサインURL生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * プリサインドダウンロードURL生成
   * 暗号化が有効な場合はS3 Gatewayプロキシ経由のURLを返す
   */
  async generatePresignedDownload(s3Key: string, expiresIn = 3600): Promise<string> {
    try {
      // まず暗号化ステータスを確認
      const encryptionResponse = await this.callGatewayAPI('/encryption/status', {
        method: 'GET',
      });

      if (!encryptionResponse.ok) {
        console.error('❌ [S3GatewayClient] 暗号化ステータス確認エラー:', {
          status: encryptionResponse.status,
          statusText: encryptionResponse.statusText,
        });
        throw new Error(
          `暗号化ステータス確認に失敗しました: ${encryptionResponse.status} ${encryptionResponse.statusText}`
        );
      }

      const encryptionData = await encryptionResponse.json();
      const isEncryptionEnabled = encryptionData?.data?.enabled === true;

      console.log('🔍 [S3GatewayClient] 暗号化ステータス確認:', {
        enabled: isEncryptionEnabled,
        encryptionData,
      });

      if (isEncryptionEnabled) {
        // 暗号化が有効な場合はS3 Gatewayプロキシ経由のURLを返す
        const isServer = typeof window === 'undefined';
        const baseUrl = isServer ? 'http://s3-gateway:8080' : 'http://localhost';
        const proxyUrl = `${baseUrl}/files/media/${s3Key}`;

        console.log('🔐 [S3GatewayClient] 暗号化有効のためプロキシURL使用:', {
          s3Key,
          proxyUrl,
          isServer,
          configGatewayUrl: this.config.gatewayUrl,
        });
        return proxyUrl;
      }

      // 暗号化が無効な場合は通常のプリサインドURLを生成
      const response = await this.callGatewayAPI('/presign/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: this.config.bucket,
          key: s3Key,
          expiresIn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `S3 Gateway API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      console.log('📝 [S3GatewayClient] プリサインドURL生成完了:', {
        s3Key,
        downloadUrl: data.downloadUrl,
      });
      return data.downloadUrl;
    } catch (error) {
      console.error('❌ [S3GatewayClient] プリサインダウンロードURL生成エラー:', {
        error,
        s3Key,
        gatewayUrl: this.config.gatewayUrl,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `プリサインダウンロードURL生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * マルチパートアップロード開始（未実装 - 将来の拡張用）
   */
  async initiateMultipartUpload(_input: MultipartUploadInput): Promise<MultipartUploadData> {
    throw new Error('マルチパートアップロードはS3 Gatewayでは未実装です');
  }

  /**
   * マルチパートアップロード完了（未実装）
   */
  async completeMultipartUpload(
    _uploadId: string,
    _s3Key: string,
    _parts: CompletedPart[]
  ): Promise<void> {
    throw new Error('マルチパートアップロードはS3 Gatewayでは未実装です');
  }

  /**
   * マルチパートアップロード中止（未実装）
   */
  async abortMultipartUpload(_uploadId: string, _s3Key: string): Promise<void> {
    throw new Error('マルチパートアップロードはS3 Gatewayでは未実装です');
  }

  /**
   * S3キー生成 - 共通ユーティリティ使用
   */
  private generateS3Key(
    filename: string,
    _userId: string,
    mediaId: string,
    mediaType?: string
  ): string {
    return generateS3Key({
      mediaId,
      filename,
      mediaType: normalizeMediaType(mediaType || 'general'),
    });
  }

  /**
   * ダウンロードURL生成 - 統一URL生成システム使用
   */
  private generateDownloadUrl(s3Key: string): string {
    const finalUrl = generatePublicMediaUrl(s3Key);

    console.log('🔧 [S3GatewayClient] ダウンロードURL生成:', {
      s3Key,
      bucket: this.config.bucket,
      configGatewayUrl: this.config.gatewayUrl,
      finalUrl,
    });

    return finalUrl;
  }

  /**
   * S3 Gateway API呼び出しヘルパー
   */
  private async callGatewayAPI(path: string, options: RequestInit): Promise<Response> {
    const url = `${this.config.gatewayUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`S3 Gateway API timeout: ${url}`);
      }
      throw error;
    }
  }
}

/**
 * S3GatewayClientファクトリー関数
 */
export function createS3GatewayClient(config?: Partial<S3GatewayConfig>): S3GatewayClient {
  return new S3GatewayClient(config);
}
