/**
 * 🌐 統一メディアクライアント - Phase 2実装
 *
 * S3ゲートウェイとの通信を抽象化し、責任分離を強化
 * バックエンドリゾルバーから直接S3ゲートウェイを呼び出すことを防ぐ
 */

import { UnifiedUploadError, UPLOAD_ERROR_CODES, getS3GatewayUrl } from '@libark/core-shared';

// ================================
// 型定義
// ================================

export interface UploadFileParams {
  fileData: Buffer;
  s3Key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadFileResult {
  downloadUrl: string;
  etag: string;
  size: number;
  encrypted: boolean;
}

export interface MediaClientConfig {
  gatewayUrl: string;
  frontendGatewayUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  logger?: Logger;
}

export interface Logger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

// ================================
// 統一メディアクライアント
// ================================

export class MediaClient {
  private readonly config: Required<MediaClientConfig>;

  constructor(config: MediaClientConfig) {
    this.config = {
      frontendGatewayUrl: config.gatewayUrl,
      timeout: 30000, // 30秒
      retryAttempts: 3,
      logger: console,
      ...config,
    };
  }

  /**
   * ファイルアップロード（S3ゲートウェイ経由）
   */
  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    const { fileData, s3Key, contentType, metadata } = params;

    this.config.logger.info('📤 [MediaClient] ファイルアップロード開始', {
      s3Key,
      contentType,
      size: fileData.length,
      hasMetadata: !!metadata,
    });

    try {
      console.log('🔍 [MediaClient] uploadFile内部開始');

      // contentType のフォールバック
      const type = contentType ?? 'application/octet-stream';

      // Node標準の FormData + Blob を使用
      console.log('🔍 [MediaClient] FormData作成開始');
      const fd = new FormData();
      console.log('🔍 [MediaClient] FormData作成完了');

      console.log('🔍 [MediaClient] fd.append開始');
      fd.append('file', new Blob([new Uint8Array(fileData)], { type }), 'upload');
      console.log('🔍 [MediaClient] file append完了');

      fd.append('s3Key', s3Key);
      console.log('🔍 [MediaClient] s3Key append完了');

      if (metadata) {
        fd.append('metadata', JSON.stringify(metadata));
        console.log('🔍 [MediaClient] metadata append完了');
      }

      // リトライ機能付きアップロード
      console.log(
        '🔍 [MediaClient] S3ゲートウェイ呼び出し開始:',
        `${this.config.gatewayUrl}/upload-proxy`
      );

      const result = await this.executeWithRetry(async () => {
        console.log('🔍 [MediaClient] fetch実行開始');

        // Node.js環境でのfetch対応（fetchFn を維持 - DI / テスト / ランタイム差し替えのため）
        const fetchFn = globalThis.fetch || (await import('node-fetch')).default;
        console.log('🔍 [MediaClient] fetch関数取得完了:', !!fetchFn);

        const response = await fetchFn(`${this.config.gatewayUrl}/upload-proxy`, {
          method: 'POST',
          body: fd,
          // ⚠️ Content-Type は書かない（fetch が boundary 込みで付ける）
          // Node.js環境ではAbortSignal.timeoutが利用できない場合があるため条件分岐
          ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? { signal: AbortSignal.timeout(this.config.timeout) }
            : {}),
        });

        console.log('🔍 [MediaClient] fetch応答受信:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'レスポンス読み取り失敗');
          console.error('❌ [MediaClient] S3ゲートウェイエラー:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw UnifiedUploadError.fromNetwork(
            response.status,
            response.statusText,
            `${this.config.gatewayUrl}/upload-proxy`
          );
        }

        const jsonResult = await response.json();
        console.log('🔍 [MediaClient] JSON応答:', jsonResult);
        return jsonResult;
      });

      console.log('🔍 [MediaClient] executeWithRetry完了:', result);

      if (!result.success) {
        throw new UnifiedUploadError(
          UPLOAD_ERROR_CODES.S3_GATEWAY_ERROR,
          result.error?.message || 'S3ゲートウェイでエラーが発生しました',
          result.error
        );
      }

      const uploadResult: UploadFileResult = {
        downloadUrl: this.generateDownloadUrl(s3Key),
        etag: result.data.etag,
        size: result.data.size,
        encrypted: result.data.encrypted || false,
      };

      this.config.logger.info('✅ [MediaClient] ファイルアップロード完了', {
        s3Key,
        downloadUrl: uploadResult.downloadUrl,
        etag: uploadResult.etag,
      });

      return uploadResult;
    } catch (error) {
      console.error('❌ [MediaClient] uploadFile内部エラー:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        s3Key,
      });

      this.config.logger.error('❌ [MediaClient] ファイルアップロード失敗', {
        s3Key,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof UnifiedUploadError) {
        throw error;
      }

      throw new UnifiedUploadError(
        UPLOAD_ERROR_CODES.S3_GATEWAY_ERROR,
        `ファイルアップロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        {
          s3Key,
          originalError: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      );
    }
  }

  /**
   * ダウンロードURLの生成
   */
  generateDownloadUrl(s3Key: string): string {
    const baseUrl = this.config.frontendGatewayUrl.replace(/\/$/, '');
    return `${baseUrl}/files/media/${s3Key}`;
  }

  /**
   * ファイルの存在確認
   */
  async checkFileExists(s3Key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.gatewayUrl}/check/${encodeURIComponent(s3Key)}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5秒タイムアウト
      });

      return response.ok;
    } catch (error) {
      this.config.logger.warn('⚠️ [MediaClient] ファイル存在確認失敗', {
        s3Key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * ファイルの削除
   */
  async deleteFile(s3Key: string): Promise<void> {
    this.config.logger.info('🗑️ [MediaClient] ファイル削除開始', { s3Key });

    try {
      const response = await fetch(`${this.config.gatewayUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ s3Key }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw UnifiedUploadError.fromNetwork(
          response.status,
          response.statusText,
          `${this.config.gatewayUrl}/delete`
        );
      }

      this.config.logger.info('✅ [MediaClient] ファイル削除完了', { s3Key });
    } catch (error) {
      this.config.logger.error('❌ [MediaClient] ファイル削除失敗', {
        s3Key,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof UnifiedUploadError) {
        throw error;
      }

      throw new UnifiedUploadError(
        UPLOAD_ERROR_CODES.S3_GATEWAY_ERROR,
        `ファイル削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        { s3Key }
      );
    }
  }

  /**
   * バッチファイルアップロード
   */
  async uploadFiles(files: UploadFileParams[]): Promise<UploadFileResult[]> {
    this.config.logger.info('📤 [MediaClient] バッチアップロード開始', {
      fileCount: files.length,
    });

    const results: UploadFileResult[] = [];
    const errors: Array<{ index: number; error: UnifiedUploadError }> = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(files[i]);
        results.push(result);
      } catch (error) {
        const unifiedError =
          error instanceof UnifiedUploadError
            ? error
            : new UnifiedUploadError(
                UPLOAD_ERROR_CODES.S3_GATEWAY_ERROR,
                `ファイル ${i + 1} のアップロードに失敗しました`
              );

        errors.push({ index: i, error: unifiedError });
      }
    }

    if (errors.length > 0) {
      this.config.logger.error('❌ [MediaClient] バッチアップロードで一部失敗', {
        totalFiles: files.length,
        successCount: results.length,
        errorCount: errors.length,
        errors: errors.map(e => ({ index: e.index, message: e.error.message })),
      });

      throw new UnifiedUploadError(
        UPLOAD_ERROR_CODES.S3_GATEWAY_ERROR,
        `${errors.length}個のファイルのアップロードに失敗しました`,
        { errors: errors.map(e => e.error.toJSON()) }
      );
    }

    this.config.logger.info('✅ [MediaClient] バッチアップロード完了', {
      fileCount: results.length,
    });

    return results;
  }

  /**
   * リトライ機能付き実行
   */
  private async executeWithRetry<T>(operation: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (attempt >= this.config.retryAttempts) {
        throw error;
      }

      // リトライ可能なエラーかチェック（型安全な方法で）
      if (error instanceof UnifiedUploadError) {
        const uploadError = error as UnifiedUploadError;
        if (!uploadError.canRetry()) {
          throw uploadError;
        }
      }

      this.config.logger.warn(`⚠️ [MediaClient] リトライ ${attempt}/${this.config.retryAttempts}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // 指数バックオフ
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.executeWithRetry(operation, attempt + 1);
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.gatewayUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;
      const healthy = response.ok;

      this.config.logger.info('🏥 [MediaClient] ヘルスチェック', {
        healthy,
        latency,
        status: response.status,
      });

      return { healthy, latency };
    } catch (error) {
      const latency = Date.now() - startTime;

      this.config.logger.error('❌ [MediaClient] ヘルスチェック失敗', {
        latency,
        error: error instanceof Error ? error.message : String(error),
      });

      return { healthy: false, latency };
    }
  }
}

// ================================
// ファクトリー関数
// ================================

/**
 * 環境設定からメディアクライアントを作成
 */
export function createUnifiedMediaClient(logger?: Logger): MediaClient {
  // 統一URL生成システムを使用
  const gatewayUrl = getS3GatewayUrl();
  const frontendGatewayUrl = getS3GatewayUrl(); // 統一システムで環境別URL取得

  return new MediaClient({
    gatewayUrl,
    frontendGatewayUrl,
    logger,
  });
}

/**
 * テスト用メディアクライアントを作成
 */
export function createTestMediaClient(config: Partial<MediaClientConfig> = {}): MediaClient {
  return new MediaClient({
    gatewayUrl: 'http://localhost:8080',
    frontendGatewayUrl: 'http://localhost:3000',
    timeout: 5000,
    retryAttempts: 1,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    ...config,
  });
}
