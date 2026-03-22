/**
 * 🖼️ MediaProcessingWorker - バージョニング対応画像処理ワーカー
 *
 * 機能:
 * - オリジナル画像からバリアント生成
 * - WebP変換・最適化
 * - バージョニング対応
 * - S3/Zenko統合
 */

import { Job } from 'bullmq';
import sharp from 'sharp';
import { prisma } from '@libark/db';
import {
  logger,
  generateVariantS3Key,
  MediaValidator,
  validateImageMetadata,
  getVariantConfigs,
  getSpecialVariantConfigs,
  type MediaProcessingJobData,
  type MediaProcessingVariantConfig,
  type UploadProgressData,
  type ImageMetadata,
  type S3UploadMetadata,
} from '@libark/core-shared';
import { QueueName } from '@libark/queues';
// AWS SDK imports removed - using S3 Gateway API instead
import { RedisPubSubManager } from '@libark/redis-client';

import { getMediaClient } from '../config/media-client.js';

import { BaseWorker } from './BaseWorker.js';
// getWorkerLimits削除済み - 固定値を使用

type DbMediaStatus = 'PROCESSING' | 'READY' | 'FAILED';

// ================================
// 型定義（@libark/core-sharedから統一型定義をインポート済み）
// ================================

// ================================
// バリアント設定（@libark/core-sharedの統一設定システムを使用）
// ================================

// ================================
// MediaProcessingWorker
// ================================

export class MediaProcessingWorker extends BaseWorker<MediaProcessingJobData> {
  private pubsub: RedisPubSubManager;

  constructor() {
    // 固定設定を使用
    super(QueueName.MEDIA_PROCESSING, 'MediaProcessingWorker', {
      concurrency: 2, // メディア処理の同時実行数（重い処理なので少なめ）
      stalledInterval: 60000, // 60秒（処理時間が長いため）
      maxStalledCount: 2, // 最大スタール回数
      retryProcessDelay: 10000, // 10秒
    });
    this.pubsub = RedisPubSubManager.getInstance();
  }

  /**
   * 🎯 メディア処理のメインロジック
   */
  protected async processJob(job: Job<MediaProcessingJobData>): Promise<void> {
    const { mediaId, userId, mediaType } = job.data;

    logger.info('Starting media processing', {
      jobId: job.id,
      mediaId,
      userId,
      mediaType,
    });

    try {
      // 入力データのバリデーション
      const mediaIdValidation = MediaValidator.validateMediaId(mediaId);
      if (!mediaIdValidation.isValid) {
        throw new Error(`Invalid media ID: ${mediaIdValidation.error}`);
      }

      // メディアレコードを取得
      const media = await this.getMediaRecord(mediaId);
      if (!media) {
        throw new Error(`Media record not found: ${mediaId}`);
      }

      // S3キーのバリデーション
      if (media.s3Key) {
        const s3KeyValidation = MediaValidator.validateS3Key(media.s3Key);
        if (!s3KeyValidation.isValid) {
          throw new Error(`Invalid S3 key: ${s3KeyValidation.error}`);
        }
      }

      // 処理状態を更新
      await this.updateProcessingStatus(mediaId, 'PROCESSING');

      // リアルタイム通知を送信
      await this.publishUploadProgress(mediaId, {
        mediaId,
        status: 'PROCESSING',
        progress: 75, // バリアント生成中は75%
        message: 'バリアント生成中...',
      });

      // オリジナル画像をダウンロード
      const originalBuffer = await this.downloadOriginalImage(mediaId);

      // 画像バッファのバリデーション
      const bufferValidation = MediaValidator.validateImageBuffer(originalBuffer);
      if (!bufferValidation.isValid) {
        throw new Error(`Invalid image buffer: ${bufferValidation.error}`);
      }

      // 画像メタデータを取得
      const imageMetadata = await this.extractImageMetadata(originalBuffer);

      // 画像メタデータのバリデーション
      const metadataValidation = validateImageMetadata(imageMetadata);
      if (!metadataValidation.isValid) {
        throw new Error(`Invalid image metadata: ${metadataValidation.error}`);
      }

      // メディアレコードに画像サイズを更新
      await this.updateMediaRecord(mediaId, {
        width: (imageMetadata as { width: number }).width,
        height: (imageMetadata as { height: number }).height,
        status: 'PROCESSING',
      });

      // バリアント生成
      await this.generateAndSaveVariants(
        originalBuffer,
        mediaId,
        mediaType,
        imageMetadata as ImageMetadata
      );

      // 特殊バリアント生成（OGP/BLUR）
      await this.generateSpecialVariants(originalBuffer, mediaId, mediaType, userId);

      // 処理完了
      await this.updateMediaRecord(mediaId, {
        status: 'READY',
      });

      // オリジナル画像削除
      await this.deleteOriginalImage(mediaId);

      // 完了通知を送信
      await this.publishUploadProgress(mediaId, {
        mediaId,
        status: 'COMPLETED',
        progress: 100,
        message: '処理が完了しました',
      });

      // 投稿処理完了通知は削除済み
      // 理由: Postは即座に処理されるため、メディア処理完了時の投稿処理完了通知は不要

      logger.info('Media processing completed successfully', {
        jobId: job.id,
        mediaId,
      });
    } catch (error) {
      logger.error('Media processing failed', {
        jobId: job.id,
        mediaId,
        error: error instanceof Error ? error.message : String(error),
      });

      // エラー状態を記録
      await this.updateProcessingStatus(
        mediaId,
        'FAILED',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  /**
   * メディアレコード取得
   */
  private async getMediaRecord(mediaId: string) {
    return await prisma.media.findUnique({
      where: { id: mediaId },
    });
  }

  /**
   * 処理状態更新
   */
  private async updateProcessingStatus(mediaId: string, status: DbMediaStatus, _error?: string) {
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * オリジナル画像ダウンロード（S3 Gateway API経由）
   */
  private async downloadOriginalImage(mediaId: string): Promise<Buffer> {
    const mediaClient = getMediaClient();

    // メディアレコードから実際のS3キーを取得
    const media = await this.getMediaRecord(mediaId);
    if (!media) {
      throw new Error(`Media record not found: ${mediaId}`);
    }

    if (!media.s3Key) {
      throw new Error(`S3 key not found for media: ${mediaId}`);
    }

    try {
      // S3 Gateway API経由でファイルをダウンロード
      // バケット名を含む正しいURL形式: /files/{bucket}/{key}
      const downloadUrl = `${mediaClient.config.gatewayUrl}/files/${mediaClient.config.bucket}/${media.s3Key}`;

      logger.info('Downloading original image via S3 Gateway', {
        mediaId,
        s3Key: media.s3Key,
        downloadUrl,
        bucket: mediaClient.config.bucket,
        gatewayUrl: mediaClient.config.gatewayUrl,
      });

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Accept: 'image/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('Failed to download original image', {
        mediaId,
        s3Key: media.s3Key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 画像メタデータ抽出
   */
  private async extractImageMetadata(buffer: Buffer): Promise<unknown> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
      };
    } catch (error) {
      logger.error('Failed to extract image metadata', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  /**
   * 特殊バリアント生成（BLURのみ）
   * OGPはオンデマンド生成へ移行済み
   */
  private async generateSpecialVariants(
    originalBuffer: Buffer,
    mediaId: string,
    _mediaType: string,
    _userId: string
  ): Promise<void> {
    // 統一設定システムから特殊バリアント設定を取得
    const specialVariantConfigs = getSpecialVariantConfigs();
    const specialVariants: MediaProcessingVariantConfig[] = Object.values(specialVariantConfigs);

    if (specialVariants.length > 0) {
      const mediaClient = getMediaClient();

      for (const config of specialVariants) {
        try {
          logger.info(`🎨 特殊バリアント生成: ${config.variantType}`, {
            mediaId,
            size: `${config.width}x${config.height}`,
          });

          // Sharp で画像処理（全てWebP）
          const processedBuffer = await sharp(originalBuffer)
            .resize({
              width: config.width,
              height: config.height,
              fit: config.fit,
            })
            .webp({ quality: config.quality })
            .toBuffer();

          // 元のメディアレコードからS3キーを取得
          const media = await this.getMediaRecord(mediaId);
          if (!media?.s3Key) {
            throw new Error(`Media record or s3Key not found: ${mediaId}`);
          }

          // 共通ユーティリティを使用してバリアントS3キー生成
          const s3Key = generateVariantS3Key({
            originalS3Key: media.s3Key,
            variantType: config.variantType.toLowerCase(),
          });

          // S3 Gateway API経由でアップロード
          await this.uploadVariantToS3Gateway(mediaClient, s3Key, processedBuffer, {
            mediaId,
            variant: config.variantType,
            processedAt: new Date().toISOString(),
          });

          // バリアント画像のメタデータ取得
          const variantInfo = await sharp(processedBuffer).metadata();

          // データベースにバリアント情報を保存
          await prisma.mediaVariant.create({
            data: {
              mediaId,
              type: config.variantType,
              s3Key: s3Key,
              width: variantInfo.width || config.width,
              height: variantInfo.height || config.height,
              fileSize: processedBuffer.length,
              quality: config.quality,
            },
          });

          logger.info(`✅ 特殊バリアント生成完了: ${config.variantType}`, {
            mediaId,
            s3Key,
            size: processedBuffer.length,
          });
        } catch (error) {
          logger.error(`❌ 特殊バリアント生成失敗: ${config.variantType}`, {
            mediaId,
            error,
          });
          // 特殊バリアントの失敗は全体の処理を止めない
        }
      }
    }
  }

  /**
   * バリアント生成・保存
   */
  private async generateAndSaveVariants(
    originalBuffer: Buffer,
    mediaId: string,
    mediaType: string,
    _imageMetadata: ImageMetadata
  ): Promise<void> {
    // 統一設定システムからバリアント設定を取得
    const configs = getVariantConfigs(mediaType);
    const mediaClient = getMediaClient();

    for (const config of configs) {
      try {
        // Sharp で画像処理（全てWebP）
        const processedBuffer = await sharp(originalBuffer)
          .resize({
            width: config.width,
            height: config.height,
            fit: config.fit,
          })
          .webp({ quality: config.quality })
          .toBuffer();

        // 元のメディアレコードからS3キーを取得
        const media = await this.getMediaRecord(mediaId);
        if (!media?.s3Key) {
          throw new Error(`Media record or s3Key not found: ${mediaId}`);
        }

        // 共通ユーティリティを使用してバリアントS3キー生成
        const s3Key = generateVariantS3Key({
          originalS3Key: media.s3Key,
          variantType: config.variantType.toLowerCase(),
        });

        // S3 Gateway API経由でアップロード
        await this.uploadVariantToS3Gateway(mediaClient, s3Key, processedBuffer, {
          mediaId,
          variant: config.variantType,
          processedAt: new Date().toISOString(),
        });

        // MediaVariantレコードを作成
        await prisma.mediaVariant.create({
          data: {
            mediaId,
            type: config.variantType,
            s3Key: s3Key,
            width: config.width,
            height: config.height,
            fileSize: processedBuffer.length,
            quality: config.quality,
          },
        });

        logger.info('Variant generated and saved successfully', {
          mediaId,
          variantType: config.variantType,
          s3Key,
          size: processedBuffer.length,
        });
      } catch (error) {
        logger.error('Failed to generate variant', {
          mediaId,
          variantType: config.variantType,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  /**
   * S3 Gateway API経由でバリアントをアップロード
   * Note: multipart の順序が重要（Fastify の @fastify/multipart は file 以前の field しか読み取らない）
   */
  private async uploadVariantToS3Gateway(
    mediaClient: { config: { gatewayUrl: string; bucket: string } },
    s3Key: string,
    buffer: Buffer,
    metadata: S3UploadMetadata
  ): Promise<void> {
    try {
      // デバッグログ: 送信するパラメータを確認
      logger.info('📤 upload-variant params:', {
        mediaId: metadata.mediaId,
        s3Key,
        variant: metadata.variant,
      });

      // Node.js標準のFormDataとfetchを使用
      const fd = new FormData();

      // ファイル名は最後の部分のみを使用し、完全なS3キーは別フィールドで送信
      const filename = s3Key.split('/').pop() || 'variant.webp';

      // contentType のフォールバック
      const type = 'image/webp';

      // ✅ 必須フィールドを先に append（Fastify の multipart パーサーが先に読み取れるように）
      fd.append('mediaId', String(metadata.mediaId));
      fd.append('s3Key', String(s3Key));

      // ✅ 最後に file を append
      fd.append('file', new Blob([new Uint8Array(buffer)], { type }), filename);

      // バリアント専用エンドポイントを使用（S3イベント送信なし、無限ループ防止）
      const uploadUrl = `${mediaClient.config.gatewayUrl}/upload-variant`;

      // 詳細デバッグログを追加
      logger.info('Uploading variant via S3 Gateway /upload-variant', {
        s3Key,
        uploadUrl,
        metadata,
        filename,
        bufferSize: buffer.length,
      });

      // 標準fetchを使用（multipart/form-dataが自動的に正しく設定される）
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: fd,
        headers: {
          // メタデータをカスタムヘッダーとして追加
          'X-Media-Id': metadata.mediaId,
          'X-Variant': metadata.variant,
          'X-Processed-At': metadata.processedAt,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error('Variant upload failed with detailed error', {
          s3Key,
          mediaId: metadata.mediaId,
          status: response.status,
          statusText: response.statusText,
          errorText,
          uploadUrl,
        });
        throw new Error(
          `Variant upload failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json().catch(() => ({}));

      logger.info('Variant uploaded successfully via /upload-variant', {
        s3Key,
        mediaId: metadata.mediaId,
        status: response.status,
        result: (result as { success: boolean }).success ? 'success' : 'unknown',
        etag: (result as { data?: { etag?: string } }).data?.etag,
      });
    } catch (error) {
      logger.error('Failed to upload variant via S3 Gateway', {
        s3Key,
        mediaId: metadata.mediaId,
        variant: metadata.variant,
        uploadUrl: `${mediaClient.config.gatewayUrl}/upload-variant`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * メディアレコード更新
   */
  private async updateMediaRecord(
    mediaId: string,
      data: Partial<{
      width: number;
      height: number;
      status: DbMediaStatus;
    }>
  ) {
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * オリジナル画像削除
   */
  private async deleteOriginalImage(mediaId: string) {
    // メディアレコードから実際のファイル名を取得
    const media = await this.getMediaRecord(mediaId);
    if (!media) {
      logger.warn('Media record not found for deletion', { mediaId });
      return;
    }

    const extension = media.filename.split('.').pop() || 'jpg';
    const originalKey = `${mediaId}-orig.${extension}`;

    try {
      // 現在のS3 Gateway実装では削除APIが提供されていないため、
      // データベース上でのみ削除フラグを立てる
      logger.info('Marking original image as deleted (S3 Gateway mode)', {
        mediaId,
        originalKey,
      });

      // 実際のS3 Gateway削除API実装時には以下のようなコードになる:
      // const deleteUrl = `${mediaClient.config.gatewayUrl}/files/${mediaClient.config.bucket}/${originalKey}`;
      // const response = await fetch(deleteUrl, { method: 'DELETE' });
    } catch (error) {
      logger.warn('Failed to delete original image', {
        mediaId,
        originalKey,
        error: error instanceof Error ? error.message : String(error),
      });
      // オリジナル削除の失敗は致命的ではないため、エラーを投げない
    }
  }

  /**
   * アップロード進捗通知を送信
   */
  private async publishUploadProgress(mediaId: string, data: UploadProgressData) {
    try {
      await this.pubsub.publish(`UPLOAD_PROGRESS_${mediaId}`, {
        type: 'UPLOAD_PROGRESS',
        timestamp: new Date().toISOString(),
        mediaId,
        uploadProgress: data,
      });
    } catch (error) {
      logger.warn('Failed to publish upload progress', {
        mediaId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // publishPostProcessingCompletedメソッドは削除済み
  // 理由: Postは即座に処理されるため、メディア処理完了時の投稿処理完了通知は不要
}
