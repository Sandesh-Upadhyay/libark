/**
 * 🚀 Media V2 GraphQL Resolvers - S3 Gateway統合版
 *
 * 機能:
 * - プリサインドURL生成
 * - マルチパートアップロード
 * - 透明暗号化対応
 * - バッチ処理キュー
 */

import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { createMediaClient, S3GatewayClient, calculatePartCount } from '@libark/media';
import { v4 as uuidv4 } from 'uuid';
import {
  UPLOAD_CONSTANTS,
  SUPPORTED_IMAGE_FORMATS,
  generateS3Key,
  sanitizeFilename,
  normalizeMediaType,
} from '@libark/core-shared';
import { getRedisClient } from '@libark/redis-client';
import {
  UploadSessionManager,
  UploadSessionStatus,
  UploadTokenService,
  UPLOAD_CONSTANTS as UPLOAD_SESSION_CONSTANTS,
} from '@libark/upload-session';
import type { PrismaClient } from '@libark/db';

import { GraphQLContext, requireAuthentication } from '../graphql/context.js';

/**
 * サイト機能の有効性をチェック
 */
async function checkSiteFeatureEnabled(
  context: GraphQLContext,
  featureName: string
): Promise<boolean> {
  try {
    const siteFeature = await context.prisma.siteFeatureSetting.findUnique({
      where: { featureName },
    });

    // 設定が存在しない場合はデフォルトで有効
    return siteFeature?.isEnabled ?? true;
  } catch (error) {
    context.fastify.log.error({ err: error }, 'サイト機能チェックエラー:');
    return true; // エラー時はデフォルトで有効
  }
}

// ================================
// メディアクライアント初期化（S3 Gateway統合版）
// ================================

let mediaClient: S3GatewayClient | null = null;

function getMediaClient(): S3GatewayClient {
  if (!mediaClient) {
    mediaClient = createMediaClient();
    console.log('🔧 メディアクライアント初期化完了（S3 Gateway統合版）');
  }

  if (!mediaClient) {
    throw new Error('メディアクライアント初期化に失敗しました');
  }

  return mediaClient;
}

// ================================
// 🎯 Zodバリデーションスキーマ
// ================================

// 統一メディアタイプ（シンプル命名）
const MediaTypeSchema = z.enum(['POST', 'AVATAR', 'COVER', 'OGP']);

const PresignedUploadInputSchema = z.object({
  filename: z
    .string()
    .min(1, 'ファイル名は必須です')
    .max(255, 'ファイル名は255文字以内である必要があります')
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, '無効な文字が含まれています'),
  contentType: z
    .string()
    .min(1, 'Content-Typeは必須です')
    .refine(
      type =>
        SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.includes(
          type as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp'
            | 'image/avif'
            | 'image/bmp'
            | 'image/tiff'
        ),
      `サポートされているファイル形式: ${SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.join(', ')}`
    ),
  size: z
    .number()
    .int('ファイルサイズは整数である必要があります')
    .min(1, 'ファイルサイズは1バイト以上である必要があります')
    .max(
      UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
      `ファイルサイズは${UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB以下である必要があります`
    ),
  mediaType: MediaTypeSchema.default('POST'),
});

// プロキシアップロード用スキーマ（責任分離対応）
const ProxyUploadInputSchema = z.object({
  filename: z
    .string()
    .min(1, 'ファイル名は必須です')
    .max(255, 'ファイル名は255文字以内である必要があります'),
  contentType: z
    .string()
    .min(1, 'Content-Typeは必須です')
    .refine(
      type =>
        SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.includes(
          type as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp'
            | 'image/avif'
            | 'image/bmp'
            | 'image/tiff'
        ),
      `サポートされているファイル形式: ${SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.join(', ')}`
    ),
  size: z
    .number()
    .int('ファイルサイズは整数である必要があります')
    .min(1, 'ファイルサイズは1バイト以上である必要があります')
    .max(
      UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
      `ファイルサイズは${UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB以下である必要があります`
    ),
  mediaType: MediaTypeSchema.default('POST'),
  fileData: z.string().min(1, 'ファイルデータは必須です'), // Base64エンコードされたファイルデータ
});

const MultipartUploadInputSchema = z.object({
  filename: z
    .string()
    .min(1, 'ファイル名は必須です')
    .max(255, 'ファイル名は255文字以内である必要があります')
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, '無効な文字が含まれています'),
  contentType: z
    .string()
    .min(1, 'Content-Typeは必須です')
    .refine(
      type =>
        SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.includes(
          type as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp'
            | 'image/avif'
            | 'image/bmp'
            | 'image/tiff'
        ),
      `サポートされているファイル形式: ${SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.join(', ')}`
    ),
  size: z
    .number()
    .int('ファイルサイズは整数である必要があります')
    .min(5 * 1024 * 1024, `マルチパートアップロードは5MB以上のファイルで使用してください`)
    .max(
      UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
      `ファイルサイズは${UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB以下である必要があります`
    ),
  partCount: z
    .number()
    .int('パート数は整数である必要があります')
    .min(1, 'パート数は1以上である必要があります')
    .max(10000, 'パート数は10000以下である必要があります'),
  mediaType: MediaTypeSchema.default('POST'),
});

const _CompleteUploadSchema = z.object({
  mediaId: z.string().uuid('無効なメディアID形式です'),
  s3Key: z.string().min(1, 'S3キーは必須です'),
});

const _CompleteMultipartSchema = z.object({
  uploadId: z.string().min(1, 'アップロードIDは必須です'),
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().min(1),
        etag: z.string().min(1),
      })
    )
    .min(1, 'パート情報は必須です'),
});

const _PresignedDownloadSchema = z.object({
  mediaId: z.string().uuid('無効なメディアID形式です'),
  expiresIn: z.number().int().min(1).max(86400).default(3600),
});

// UploadSession用スキーマ
const CreateUploadSessionInputSchema = z.object({
  kind: MediaTypeSchema,
  filename: z
    .string()
    .min(1, 'ファイル名は必須です')
    .max(255, 'ファイル名は255文字以内である必要があります')
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, '無効な文字が含まれています'),
  contentType: z
    .string()
    .min(1, 'Content-Typeは必須です')
    .refine(
      type =>
        SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.includes(
          type as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp'
            | 'image/avif'
            | 'image/bmp'
            | 'image/tiff'
        ),
      `サポートされているファイル形式: ${SUPPORTED_IMAGE_FORMATS.INPUT_MIME_TYPES.join(', ')}`
    ),
  byteSize: z
    .number()
    .int('ファイルサイズは整数である必要があります')
    .min(1, 'ファイルサイズは1バイト以上である必要があります')
    .max(50 * 1024 * 1024, 'ファイルサイズは50MB以下である必要があります'), // 異常値防止
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// ================================
// ヘルパー関数
// ================================

/**
 * フロントエンドからのS3イベント送信（責任分離版）
 */
async function sendS3EventFromFrontend(
  context: GraphQLContext,
  mediaId: string,
  s3Key: string,
  media: any
): Promise<void> {
  try {
    const redisClient = getRedisClient();

    const metadata: Record<string, string> = {
      'user-id': context.user!.id,
      'media-id': mediaId,
      'original-filename': media.filename,
      'media-type': media.type,
      'upload-timestamp': new Date().toISOString(),
    };

    const s3Event = {
      Records: [
        {
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          eventTime: new Date().toISOString(),
          eventName: 's3:ObjectCreated:Put',
          userIdentity: {
            principalId: 'ANONYMOUS',
          },
          requestParameters: {
            sourceIPAddress: '127.0.0.1',
          },
          responseElements: {
            'x-amz-request-id': uuidv4(),
            'x-amz-id-2': uuidv4(),
          },
          s3: {
            s3SchemaVersion: '1.0',
            configurationId: 'libark-frontend',
            bucket: {
              name: 'media',
              ownerIdentity: {
                principalId: 'ANONYMOUS',
              },
              arn: 'arn:aws:s3:::media',
            },
            object: {
              key: s3Key,
              size: media.fileSize || 0,
              eTag: uuidv4(),
              sequencer: Date.now().toString(),
            },
          },
          userMetadata: {
            userid: metadata['user-id'],
            originalname: metadata['original-filename'],
            mediatype: metadata['media-type'],
            mediaid: metadata['media-id'],
            uploadedat: metadata['upload-timestamp'],
          },
        },
      ],
    };

    await redisClient.publish('s3:events', JSON.stringify(s3Event));

    context.fastify.log.info({
      bucketName: 'media',
      objectKey: s3Key,
      mediaId,
      eventName: 's3:ObjectCreated:Put',
    }, '📨 S3 event sent from frontend:');
  } catch (error) {
    context.fastify.log.error({
      error: error instanceof Error ? error.message : String(error),
      mediaId,
      s3Key,
    }, '❌ Failed to send S3 event from frontend:');
    // S3イベント送信の失敗はアップロード自体の失敗とはしない
  }
}

/**
 * メディア処理ワーカーキューに追加（エラーハンドリング強化版）
 */
async function addMediaProcessingJob(
  mediaId: string,
  mediaType: string,
  userId: string
): Promise<void> {
  try {
    const { getQueue, QueueName } = await import('@libark/queues');
    const queue = getQueue(QueueName.MEDIA_PROCESSING);

    // メディアタイプを統一形式に正規化
    const normalizedType = normalizeMediaType(mediaType);

    // ジョブオプションを設定（リトライ機能強化）
    const jobOptions = {
      priority: getMediaProcessingPriority(normalizedType),
      attempts: 3, // 最大3回リトライ
      backoff: {
        type: 'exponential' as const,
        delay: 10000, // 10秒から開始して指数的に増加
      },
      removeOnComplete: 100, // 完了したジョブを100個まで保持
      removeOnFail: 20, // 失敗したジョブを20個まで保持
      delay: 0, // 即座に実行
    };

    const job = await queue.add(
      'process-media',
      {
        mediaId,
        userId,
        mediaType: normalizedType,
      },
      jobOptions
    );

    console.log('✅ [MediaProcessing] ジョブ追加完了:', {
      jobId: job.id,
      mediaId,
      mediaType: normalizedType,
      userId,
      queue: 'media-processing',
      priority: jobOptions.priority,
      attempts: jobOptions.attempts,
    });

    return;
  } catch (error) {
    console.error('❌ メディア処理ジョブ追加失敗:', {
      mediaId,
      mediaType,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // ジョブ追加失敗は重要なエラーなので、呼び出し元に伝播
    throw new Error(
      `メディア処理ジョブの追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * メディアタイプに応じた処理優先度
 */
function getMediaProcessingPriority(mediaType: string): number {
  switch (mediaType) {
    case 'avatar':
    case 'cover':
      return 1; // 最高優先度（プロフィール関連）
    case 'post':
      return 2; // 高優先度（投稿関連）
    case 'ogp':
      return 3; // 中優先度（OGP関連）
    default:
      return 5; // 通常優先度
  }
}

// ================================
// 型定義
// ================================

export interface PresignedUploadArgs {
  input: z.infer<typeof PresignedUploadInputSchema>;
}

export interface MultipartUploadArgs {
  input: z.infer<typeof MultipartUploadInputSchema>;
}

export type CompleteUploadArgs = z.infer<typeof _CompleteUploadSchema>;
export type CompleteMultipartArgs = z.infer<typeof _CompleteMultipartSchema>;
export type PresignedDownloadArgs = z.infer<typeof _PresignedDownloadSchema>;

// ================================
// GraphQL Resolvers
// ================================

const resolvers = {
  Subscription: {
    /**
     * アップロード進捗通知
     */
    uploadProgress: {
      subscribe: async (
        _parent: any,
        { mediaId }: { mediaId: string },
        context: GraphQLContext
      ) => {
        // 認証チェック
        const user = await requireAuthentication(context);

        // メディアの所有者確認
        const media = await context.prisma.media.findUnique({
          where: { id: mediaId },
          select: { userId: true },
        });

        if (!media || media.userId !== user.id) {
          throw new GraphQLError('メディアが見つからないか、アクセス権限がありません', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        context.fastify.log.info({
          mediaId,
          userId: user.id,
        }, '📡 [GraphQL] アップロード進捗サブスクリプション開始:');

        // Redis Pub/Sub チャンネルを購読
        if (!context.redisPubSub) {
          throw new GraphQLError('PubSub not available');
        }
        return context.redisPubSub.asyncIterator([`UPLOAD_PROGRESS_${mediaId}`]);
      },
    },
  },

  Mutation: {
    /**
     * プリサインドアップロードURL生成
     */
    generatePresignedUpload: async (
      _parent: any,
      { input }: PresignedUploadArgs,
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 画像アップロード機能が有効かチェック
        const isImageUploadEnabled = await checkSiteFeatureEnabled(context, 'POST_IMAGE_UPLOAD');
        if (!isImageUploadEnabled) {
          throw new GraphQLError('画像アップロード機能は現在無効になっています', {
            extensions: { code: 'FEATURE_DISABLED' },
          });
        }

        // Zodバリデーション
        const validatedInput = PresignedUploadInputSchema.parse(input);
        const { filename, contentType, size, mediaType } = validatedInput;

        // バックエンドでS3キー生成（責任分離）
        const sanitizedFilename = sanitizeFilename(filename);
        const mediaId = uuidv4();
        const s3Key = generateS3Key({
          mediaId,
          filename: sanitizedFilename,
          mediaType: normalizeMediaType(mediaType.toLowerCase()),
        });

        const mediaClient = getMediaClient();
        const presignedData = await mediaClient.generatePresignedUpload({
          filename: sanitizedFilename,
          contentType,
          size,
          userId: context.user.id,
          mediaType,
          mediaId, // バックエンドで生成したmediaIdを渡す
          s3Key, // バックエンドで生成したs3Keyを渡す
        });

        // プリサインアップロード時にメディアレコードを作成
        const presignedDataObj = presignedData as { mediaId: string; s3Key: string };
        await context.prisma.media.create({
          data: {
            id: presignedDataObj.mediaId,
            userId: context.user.id,
            filename: sanitizedFilename, // 表示用（サニタイズ済み）
            s3Key: presignedDataObj.s3Key, // S3キー（統一フィールド名）
            mimeType: contentType,
            fileSize: size,
            type: mediaType, // メディアタイプを正しく設定
            status: 'PROCESSING', // アップロード待ち
          },
        });

        context.fastify.log.info({
          mediaId: presignedDataObj.mediaId,
          filename: sanitizedFilename,
          size,
          userId: context.user.id,
        }, '✅ プリサインドURL生成完了:');

        return presignedData;
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify.log.warn({
            errors: error.errors,
            input,
          }, '❌ プリサインドアップロードバリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify.log.error({ err: error }, '❌ プリサインドURL生成エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('プリサインドURL生成に失敗しました', {
          extensions: { code: 'PRESIGNED_URL_GENERATION_FAILED' },
        });
      }
    },

    /**
     * プロキシアップロード（責任分離対応）
     * S3ゲートウェイクライアント経由でアップロードし、アプリケーション層でデータベース操作を実行
     */
    uploadFileProxy: async (_: unknown, args: { input: { filename: string; contentType: string; size: number; mediaType: string; fileData: string } }, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 画像アップロード機能が有効かチェック
        const isImageUploadEnabled = await checkSiteFeatureEnabled(context, 'POST_IMAGE_UPLOAD');
        if (!isImageUploadEnabled) {
          throw new GraphQLError('画像アップロード機能は現在無効になっています', {
            extensions: { code: 'FEATURE_DISABLED' },
          });
        }

        // Zodバリデーション
        const validatedInput = ProxyUploadInputSchema.parse(args.input);
        const { filename, contentType, size, mediaType, fileData } = validatedInput;

        const sanitizedFilename = sanitizeFilename(filename);

        // Base64データをBufferに変換
        const fileBuffer = Buffer.from(fileData, 'base64');

        // ファイルサイズの検証
        if (fileBuffer.length !== size) {
          throw new GraphQLError('ファイルサイズが一致しません', {
            extensions: { code: 'FILE_SIZE_MISMATCH' },
          });
        }

        // メディアIDとS3キーを生成（統一ユーティリティ使用）
        const mediaId = uuidv4();
        const normalizedMediaType = normalizeMediaType(mediaType.toLowerCase());
        const s3Key = generateS3Key({
          mediaId,
          filename: sanitizedFilename,
          mediaType: normalizedMediaType,
        });

        // S3ゲートウェイに直接アップロード
        const gatewayUrl = process.env.S3_GATEWAY_URL || 'http://localhost:8081';

        // contentType のフォールバック
        const type = contentType ?? 'application/octet-stream';

        // Node標準の FormData + Blob を使用
        const fd = new FormData();
        fd.append('file', new Blob([new Uint8Array(fileBuffer)], { type }), sanitizedFilename);
        fd.append('mediaId', mediaId);
        fd.append('s3Key', s3Key);

        // S3ゲートウェイにアップロード
        const uploadResponse = await fetch(`${gatewayUrl}/upload-proxy`, {
          method: 'POST',
          body: fd,
          // ⚠️ Content-Type は書かない（fetch が boundary 込みで付ける）
        });

        if (!uploadResponse.ok) {
          const text = await uploadResponse.text().catch(() => '');
          throw new Error(
            `upload-proxy failed: ${uploadResponse.status} ${uploadResponse.statusText} ${text}`
          );
        }

        const uploadResult = await uploadResponse.json();

        // データベースにメディアレコードを作成
        await context.prisma.media.create({
          data: {
            id: mediaId,
            userId: context.user.id,
            filename: sanitizedFilename,
            s3Key: s3Key, // S3キー（統一フィールド名）
            mimeType: contentType,
            fileSize: size,
            type: mediaType,
            status: 'PROCESSING', // バリアント生成処理待ち状態
          },
        });

        // メディア処理ワーカーキューに追加
        try {
          await addMediaProcessingJob(mediaId, mediaType, context.user.id);
          context.fastify?.log.info({
            mediaId,
            mediaType,
            userId: context.user.id,
          }, '✅ メディア処理ジョブ追加完了:');
        } catch (jobError) {
          context.fastify?.log.error({
            mediaId,
            error: jobError instanceof Error ? jobError.message : String(jobError),
          }, '❌ メディア処理ジョブ追加失敗:');
          // ジョブ追加失敗でもアップロード自体は成功とする
        }

        context.fastify?.log.info({
          mediaId,
          filename: sanitizedFilename,
          size,
          userId: context.user.id,
          s3Key,
        }, '✅ プロキシアップロード完了:');

        return {
          success: true,
          mediaId,
          filename: sanitizedFilename,
          contentType,
          size,
          downloadUrl:
            (uploadResult as { data?: { downloadUrl?: string } })?.data?.downloadUrl ||
            `http://localhost/api/media/${mediaId}`,
          encrypted: (uploadResult as { data?: { encrypted?: boolean } })?.data?.encrypted || false,
        };
      } catch (error: unknown) {
        context.fastify?.log.error({ err: error }, '❌ プロキシアップロードエラー:');

        if (error instanceof z.ZodError) {
          throw new GraphQLError(
            `バリデーションエラー: ${error.errors.map(e => e.message).join(', ')}`,
            {
              extensions: { code: 'VALIDATION_ERROR' },
            }
          );
        }

        throw new GraphQLError('プロキシアップロードに失敗しました', {
          extensions: { code: 'PROXY_UPLOAD_FAILED' },
        });
      }
    },

    // プリサインドダウンロードURL生成（削除済み - セキュアメディア配信システムに移行）
    // 代替: /api/media/{mediaId} エンドポイントを使用

    /**
     * マルチパートアップロード開始
     */
    initiateMultipartUpload: async (
      _parent: any,
      { input }: MultipartUploadArgs,
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 画像アップロード機能が有効かチェック
        const isImageUploadEnabled = await checkSiteFeatureEnabled(context, 'POST_IMAGE_UPLOAD');
        if (!isImageUploadEnabled) {
          throw new GraphQLError('画像アップロード機能は現在無効になっています', {
            extensions: { code: 'FEATURE_DISABLED' },
          });
        }

        // Zodバリデーション
        const validatedInput = MultipartUploadInputSchema.parse(input);
        const { filename, contentType, size, partCount, mediaType } = validatedInput;

        // 追加の業務ロジック検証
        const calculatedPartCount = calculatePartCount(size);
        if (partCount !== calculatedPartCount) {
          throw new GraphQLError(`パート数が正しくありません。期待値: ${calculatedPartCount}`, {
            extensions: { code: 'INVALID_PART_COUNT' },
          });
        }

        const mediaClient = getMediaClient();
        const sanitizedFilename = sanitizeFilename(filename);

        const multipartData = await mediaClient.initiateMultipartUpload({
          filename: sanitizedFilename,
          contentType,
          size,
          userId: context.user.id,
          partCount,
          mediaType,
        });

        const multipartDataObj = multipartData as { uploadId: string; mediaId: string };
        context.fastify?.log.info({
          uploadId: multipartDataObj.uploadId,
          mediaId: multipartDataObj.mediaId,
          partCount,
          userId: context.user.id,
        }, '✅ マルチパートアップロード開始:');

        return multipartData;
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify?.log.warn({
            errors: error.errors,
            input,
          }, '❌ マルチパートアップロードバリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify?.log.error({ err: error }, '❌ マルチパートアップロード開始エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('マルチパートアップロード開始に失敗しました', {
          extensions: { code: 'MULTIPART_UPLOAD_INITIATION_FAILED' },
        });
      }
    },

    /**
     * マルチパートアップロード完了
     */
    completeMultipartUpload: async (
      _parent: any,
      { uploadId: _uploadId, parts: _parts }: CompleteMultipartArgs,
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        // マルチパートアップロード完了機能は現在実装されていません
        throw new GraphQLError('マルチパートアップロード完了機能は実装中です', {
          extensions: { code: 'NOT_IMPLEMENTED' },
        });
      } catch (error) {
        context.fastify?.log.error({ err: error }, '❌ マルチパートアップロード完了エラー:');
        throw error;
      }
    },

    /**
     * アップロード完了通知（フロントエンド責任分離版）
     *
     * フロントエンドがS3 Gatewayへのアップロード完了後に呼び出し、
     * S3イベントを送信してメディア処理を開始する
     */
    notifyUploadComplete: async (
      _parent: any,
      { mediaId, s3Key }: CompleteUploadArgs,
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        // メディアレコードの状態を確認
        const media = await context.prisma.media.findUnique({
          where: { id: mediaId },
          select: {
            id: true,
            status: true,
            userId: true,
            filename: true,
            fileSize: true,
            type: true,
          },
        });

        if (!media) {
          throw new GraphQLError('メディアが見つかりません', {
            extensions: { code: 'MEDIA_NOT_FOUND' },
          });
        }

        if (media.userId !== context.user.id) {
          throw new GraphQLError('アクセス権限がありません', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // 既に処理済みの場合は現在の状態を返す
        if (media.status !== 'PROCESSING') {
          return {
            media,
            success: true,
            message: `メディアは既に${media.status}状態です`,
          };
        }

        // メディア処理ワーカーキューに追加
        try {
          await addMediaProcessingJob(mediaId, media.type, context.user.id);
          context.fastify?.log.info({
            mediaId: media.id,
            mediaType: media.type,
            userId: media.userId,
          }, '✅ メディア処理ジョブ追加完了:');
        } catch (jobError) {
          context.fastify.log.error({
            mediaId,
            error: jobError instanceof Error ? jobError.message : String(jobError),
          }, '❌ メディア処理ジョブ追加失敗:');
          // ジョブ追加失敗でもアップロード完了通知は成功とする
        }

        // S3イベントをワーカーに送信（責任分離版）
        await sendS3EventFromFrontend(context, mediaId, s3Key, media);

        context.fastify?.log.info({
          mediaId,
          s3Key,
          userId: context.user.id,
        }, '✅ フロントエンドからのアップロード完了通知:');

        return {
          media,
          success: true,
          message: 'アップロード完了通知を受信しました。メディア処理を開始します。',
        };
      } catch (error) {
        context.fastify?.log.error({ err: error }, '❌ アップロード完了通知エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('アップロード完了通知の処理に失敗しました', {
          extensions: { code: 'UPLOAD_NOTIFICATION_FAILED' },
        });
      }
    },

    // 🚫 generatePresignedDownloadByKey は削除されました（generatePresignedDownloadを使用）

    /**
     * UploadSessionを作成
     */
    createUploadSession: async (
      _parent: any,
      { input }: { input: z.infer<typeof CreateUploadSessionInputSchema> },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 画像アップロード機能が有効かチェック
        const isImageUploadEnabled = await checkSiteFeatureEnabled(context, 'POST_IMAGE_UPLOAD');
        if (!isImageUploadEnabled) {
          throw new GraphQLError('画像アップロード機能は現在無効になっています', {
            extensions: { code: 'FEATURE_DISABLED' },
          });
        }

        // Zodバリデーション
        const validatedInput = CreateUploadSessionInputSchema.parse(input);
        const { kind, filename, contentType, byteSize, width, height } = validatedInput;

        // Kind別のmaxBytesを取得
        const kindUpper =
          kind.toUpperCase() as keyof typeof UPLOAD_SESSION_CONSTANTS.MAX_BYTES_BY_KIND;
        const maxBytes = UPLOAD_SESSION_CONSTANTS.MAX_BYTES_BY_KIND[kindUpper] ?? 10 * 1024 * 1024;

        // バリデーション: byteSize <= maxBytes
        if (byteSize > maxBytes) {
          throw new GraphQLError(
            `ファイルサイズが制限を超えています。最大サイズ: ${maxBytes} バイト`,
            {
              extensions: { code: 'FILE_SIZE_TOO_LARGE' },
            }
          );
        }

        // uploadId (UUID) 生成 - mediaIdと統一
        const uploadId = uuidv4();

        // S3 Key 生成
        const sanitizedFilename = sanitizeFilename(filename);
        const s3Key = generateS3Key({
          mediaId: uploadId,
          filename: sanitizedFilename,
          mediaType: normalizeMediaType(kind.toLowerCase()),
        });

        // Redisにセッション保存
        const redisClient = getRedisClient();
        const sessionManager = new UploadSessionManager(redisClient);
        await sessionManager.createSession({
          uploadId,
          userId: context.user.id,
          kind,
          filename: sanitizedFilename,
          contentType,
          declaredBytes: byteSize,
          maxBytes,
          s3Key,
          width,
          height,
        });

        // トークン生成
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        const tokenService = new UploadTokenService(jwtSecret);
        const uploadAuthToken = tokenService.generateToken(uploadId, context.user.id, contentType);

        // Gateway URL (PUT /upload/:uploadId)
        const _gatewayUrl = process.env.S3_GATEWAY_URL || 'http://localhost:8081';
        const uploadPath = `/upload/${uploadId}`;

        // requiredHeaders: Content-Type のみ（Authorizationは別フィールド）
        const requiredHeaders: Array<{ key: string; value: string }> = [
          { key: 'Content-Type', value: contentType },
        ];

        // expiresAt: TTL秒後
        const expiresAt = new Date(Date.now() + UPLOAD_SESSION_CONSTANTS.SESSION_TTL * 1000);

        context.fastify?.log.info({
          uploadId,
          userId: context.user.id,
          kind,
          contentType,
          byteSize,
          maxBytes,
          s3Key,
        }, '✅ UploadSession作成完了:');

        return {
          uploadId,
          uploadPath,
          uploadAuthToken,
          expiresAt,
          requiredHeaders,
          maxBytes,
        };
      } catch (error) {
        // Zodバリデーションエラーの処理
        if (error instanceof z.ZodError) {
          context.fastify?.log.warn({
            errors: error.errors,
            input: { filename: input.filename, contentType: input.contentType, kind: input.kind, byteSize: input.byteSize, width: input.width, height: input.height },
          }, '❌ UploadSession作成バリデーションエラー:');

          const errorMessage = error.errors.map(err => err.message).join(', ');
          throw new GraphQLError(`入力データが無効です: ${errorMessage}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              validationErrors: error.errors,
            },
          });
        }

        context.fastify?.log.error({ err: error }, '❌ UploadSession作成エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('UploadSessionの作成に失敗しました', {
          extensions: { code: 'UPLOAD_SESSION_CREATION_FAILED' },
        });
      }
    },

    /**
     * UploadSessionを完了
     */
    completeUploadSession: async (
      _parent: any,
      { uploadId }: { uploadId: string },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Redisからセッション取得
        const redisClient = getRedisClient();
        const sessionManager = new UploadSessionManager(redisClient);
        const session = await sessionManager.getSession(uploadId);

        if (!session) {
          throw new GraphQLError('UploadSessionが見つかりません', {
            extensions: { code: 'UPLOAD_SESSION_NOT_FOUND' },
          });
        }

        // 所有者チェック
        if (session.userId !== context.user.id) {
          throw new GraphQLError('アクセス権限がありません', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Statusチェック: UPLOADEDであること
        if (session.status !== 'UPLOADED') {
          throw new GraphQLError(
            `UploadSessionの状態が正しくありません。現在の状態: ${session.status}`,
            {
              extensions: { code: 'INVALID_SESSION_STATUS' },
            }
          );
        }

        // 整合性チェック
        if (!session.receivedBytes || session.receivedBytes <= 0) {
          throw new GraphQLError('アップロードされたファイルのサイズが無効です', {
            extensions: { code: 'INVALID_FILE_SIZE' },
          });
        }

        // 既にCOMPLETEDの場合は冪等に同じMediaを返す
        const existingMedia = await context.prisma.media.findUnique({
          where: { id: uploadId },
        });

        if (existingMedia) {
          // セッションをCOMPLETEDに更新
          await sessionManager.updateStatus(uploadId, UploadSessionStatus.COMPLETED);
          return existingMedia;
        }

        // Mediaレコード作成
        const media = await context.prisma.media.create({
          data: {
            id: uploadId,
            userId: context.user.id,
            filename: sanitizeFilename(session.filename || 'unknown'),
            s3Key: session.s3Key,
            mimeType: session.contentType,
            fileSize: session.receivedBytes,
            type: session.kind.toUpperCase() as 'POST' | 'AVATAR' | 'COVER' | 'OGP',
            status: 'PROCESSING',
            ...(session.width &&
              session.height && {
                width: session.width,
                height: session.height,
              }),
          },
        });

        // セッションをCOMPLETEDに更新
        await sessionManager.updateStatus(uploadId, UploadSessionStatus.COMPLETED);

        // メディア処理ワーカーキューに追加
        try {
          await addMediaProcessingJob(uploadId, session.kind, context.user.id);
          context.fastify.log.info({
            mediaId: uploadId,
            mediaType: session.kind,
            userId: context.user.id,
          }, '✅ メディア処理ジョブ追加完了:');
        } catch (jobError) {
          context.fastify?.log.error({
            mediaId: media.id,
            error: jobError instanceof Error ? jobError.message : String(jobError),
          }, '❌ メディア処理ジョブ追加失敗:');
          // ジョブ追加失敗でも完了処理は成功とする
        }

        context.fastify?.log.info({
        uploadId,
        userId: context.user.id,
        s3Key: session.s3Key,
        fileSize: session.receivedBytes,
      }, '✅ UploadSession完了処理完了:');
        return media;
      } catch (error) {
        context.fastify?.log.error({ err: error }, '❌ UploadSession完了エラー:');
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('UploadSessionの完了処理に失敗しました', {
          extensions: { code: 'UPLOAD_SESSION_COMPLETION_FAILED' },
        });
      }
    },
  },
  Query: {
    /**
     * メディア詳細取得
     */
    media: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const media = await context.prisma.media.findUnique({
        where: { id },
        include: {
          variants: {
            select: {
              id: true,
              type: true,
              s3Key: true,
              width: true,
              height: true,
              fileSize: true,
              quality: true,
              createdAt: true,
            },
          },
        },
      });

      if (!media) {
        return null; // GraphQLではnullを返すことでメディアが見つからないことを示す
      }

      return media;
    },

    /**
     * 自分のメディア一覧取得
     */
    myMedia: async (
      _parent: any,
      { first = 20, after }: { first?: number; after?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('認証が必要です', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const media = await context.prisma.media.findMany({
        where: { userId: context.user.id },
        include: {
          variants: {
            select: {
              id: true,
              type: true,
              s3Key: true,
              width: true,
              height: true,
              fileSize: true,
              quality: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: first,
        skip: after ? 1 : 0,
        cursor: after ? { id: after } : undefined,
      });

      return media;
    },

    // ================================
    // 統一メディア関連クエリ
    // ================================

    /**
     * 統一メディア取得
     */
    getUnifiedMedia: async (
      _parent: any,
      { mediaId }: { mediaId: string },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const media = await context.prisma.media.findUnique({
          where: { id: mediaId },
          include: {
            variants: true,
            user: true,
            post: {
              select: {
                visibility: true,
              },
            },
          },
        });

        if (!media) {
          throw new GraphQLError('メディアが見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const isPaid = media.post?.visibility === 'PAID';
        const accessGranted =
          !isPaid ||
          media.userId === context.user.id ||
          (await checkUserHasPurchased(context.prisma, context.user.id, media.postId));

        // BLURバリアントの存在チェック
        const hasBlurVariant = media.variants.some((v: any) => v.type === 'BLUR');

        return {
          media,
          variants: media.variants,
          isPaid,
          hasBlurVariant,
          accessGranted,
        };
      } catch (error) {
        console.error('❌ 統一メディア取得エラー:', error);
        throw error;
      }
    },

    /**
     * 統一メディア一覧取得
     */
    getUnifiedMediaList: async (
      _parent: any,
      {
        mediaType,
        userId,
        limit = 20,
        offset = 0,
      }: {
        mediaType?: string;
        userId?: string;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const where: any = {};
        if (mediaType) where.type = mediaType;
        if (userId) where.userId = userId;

        const [media, totalCount] = await Promise.all([
          context.prisma.media.findMany({
            where,
            include: {
              variants: true,
              user: true,
              post: {
                select: {
                  visibility: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          context.prisma.media.count({ where }),
        ]);

        const mediaWithAccess = await Promise.all(
          media.map(async (item: any) => {
            const isPaid = item.post?.visibility === 'PAID';
            const accessGranted =
              !isPaid ||
              item.userId === context.user!.id ||
              (await checkUserHasPurchased(context.prisma, context.user!.id, item.postId));

            // BLURバリアントの存在チェック
            const hasBlurVariant = item.variants.some((v: any) => v.type === 'BLUR');

            return {
              media: item,
              variants: item.variants,
              isPaid,
              hasBlurVariant,
              accessGranted,
            };
          })
        );

        return {
          media: mediaWithAccess,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        console.error('❌ 統一メディア一覧取得エラー:', error);
        throw error;
      }
    },

    /**
     * Paid投稿購入状況確認
     */
    checkPostPurchaseStatus: async (
      _parent: any,
      { postId }: { postId: string },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const post = await context.prisma.post.findUnique({
          where: { id: postId },
        });

        if (!post) {
          throw new GraphQLError('投稿が見つかりません', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const isPaid = post.visibility === 'PAID';
        let isPurchased = false;
        let purchasedAt = null;
        let canAccess = false;

        if (isPaid) {
          const purchase = await context.prisma.postPurchase.findUnique({
            where: {
              userId_postId: {
                userId: context.user.id,
                postId: postId,
              },
            },
          });

          isPurchased = !!purchase;
          purchasedAt = purchase?.purchasedAt || null;
          canAccess = isPurchased || post.userId === context.user.id;
        } else {
          canAccess = true; // 無料投稿は誰でもアクセス可能
        }

        return {
          postId,
          isPaid,
          price: isPaid ? post.price : null,
          isPurchased,
          purchasedAt,
          canAccess,
        };
      } catch (error) {
        console.error('❌ Paid投稿購入状況確認エラー:', error);
        throw error;
      }
    },

    /**
     * ユーザーの購入済み投稿一覧
     */
    getUserPurchasedPosts: async (
      _parent: any,
      {
        userId,
        limit = 20,
        offset = 0,
      }: {
        userId?: string;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('認証が必要です', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const targetUserId = userId || context.user.id;

        // 自分以外のユーザーの購入履歴は見れない
        if (targetUserId !== context.user.id) {
          throw new GraphQLError('他のユーザーの購入履歴は閲覧できません', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const [purchases, totalCount] = await Promise.all([
          context.prisma.postPurchase.findMany({
            where: { userId: targetUserId },
            include: {
              post: {
                include: {
                  user: true,
                  media: {
                    include: {
                      variants: true,
                    },
                  },
                },
              },
            },
            orderBy: { purchasedAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          context.prisma.postPurchase.count({
            where: { userId: targetUserId },
          }),
        ]);

        const postsWithPurchaseInfo = purchases.map((purchase: any) => ({
          post: purchase.post,
          purchaseInfo: purchase,
        }));

        return {
          posts: postsWithPurchaseInfo,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        console.error('❌ 購入済み投稿一覧取得エラー:', error);
        throw error;
      }
    },
  },
};

// ================================
// ヘルパー関数
// ================================

/**
 * ユーザーが特定のメディアを購入済みかチェック
 */
async function checkUserHasPurchased(
  prisma: PrismaClient,
  userId: string,
  postId?: string | null
): Promise<boolean> {
  if (!postId) {
    return false;
  }

  const purchase = await prisma.postPurchase.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  return !!purchase;
}

// resolversとgetMediaClient関数をエクスポート
export { resolvers as mediaV2Resolvers, getMediaClient };
