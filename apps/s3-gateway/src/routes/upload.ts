/**
 * File Upload Routes
 */

import { Transform } from 'stream';

import { FastifyInstance } from 'fastify';
import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getRedisClient } from '@libark/redis-client';
import { UploadSessionManager, UploadTokenService } from '@libark/upload-session';

// generateUnifiedMediaUrl は廃止予定のため削除

import { getS3ClientService } from '../services/s3-client.js';
import { getEncryptionService } from '../services/encryption.js';
import { getConfig } from '../config/index.js';

// トークンサービスのシングルトン
let tokenService: UploadTokenService | null = null;

function getTokenService(): UploadTokenService {
  if (!tokenService) {
    const config = getConfig();
    tokenService = new UploadTokenService(config.jwt.secret);
  }
  return tokenService;
}

// セッションマネージャーのシングルトン
let sessionManager: UploadSessionManager | null = null;

function getSessionManager(): UploadSessionManager {
  if (!sessionManager) {
    const redisClient = getRedisClient();
    sessionManager = new UploadSessionManager(redisClient);
  }
  return sessionManager;
}

// リクエストパラメータの型定義
interface UploadParams {
  uploadId: string;
}

// 認証ヘッダーの型定義
interface AuthHeaders {
  authorization?: string;
}

export async function uploadRoutes(app: FastifyInstance) {
  const s3Service = getS3ClientService();
  const encryptionService = getEncryptionService();

  app.post('/upload-proxy', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          error: { message: 'File not found', code: 'FILE_NOT_FOUND' },
        });
      }

      const fileBuffer = await data.toBuffer();
      const filename = data.filename || 'unknown';
      const contentType = data.mimetype || 'application/octet-stream';
      const fileSize = fileBuffer.length;

      if (fileSize > 100 * 1024 * 1024) {
        return reply.status(400).send({
          error: { message: 'File too large', code: 'FILE_TOO_LARGE' },
        });
      }

      // 🚀 Phase 2: 純粋プロキシ化 - バックエンドから送信されたパラメータを使用
      const fields = data.fields;
      const s3Key =
        fields?.s3Key && 'value' in fields.s3Key ? String(fields.s3Key.value) : undefined;
      const metadata =
        fields?.metadata && 'value' in fields.metadata ? String(fields.metadata.value) : undefined;

      // インフラレベルの基本チェックのみ
      if (!s3Key) {
        return reply.status(400).send({
          error: {
            message: 'Missing s3Key parameter',
            code: 'MISSING_S3_KEY',
          },
        });
      }

      app.log.info(
        {
          s3Key,
          filename,
          contentType,
          fileSize,
          hasMetadata: !!metadata,
        },
        '🚀 [S3Gateway] 純粋プロキシアップロード:'
      );

      const s3Client = s3Service.getClient();
      const s3Config = s3Service.getConfig();

      // 純粋なS3操作パラメータ
      const putObjectParams: PutObjectCommandInput = {
        Bucket: s3Config.backend.bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
      };

      // メタデータがバックエンドから提供された場合のみ追加
      if (metadata) {
        try {
          putObjectParams.Metadata = JSON.parse(metadata);
        } catch (error) {
          app.log.warn({ metadata, err: error }, '⚠️ [S3Gateway] メタデータのパースに失敗:');
          // メタデータのパース失敗は警告のみ（アップロードは継続）
        }
      }

      if (encryptionService.isEnabled()) {
        const ssecParams = await encryptionService.generateSSECParams();
        Object.assign(putObjectParams, ssecParams);
      }

      const command = new PutObjectCommand(putObjectParams);
      const response = await s3Client.send(command);

      app.log.info(
        {
          key: s3Key,
          etag: response.ETag,
          bucket: s3Config.backend.bucket,
          size: fileSize,
        },
        '✅ [S3Gateway] アップロード成功:'
      );

      // 純粋なレスポンス（ビジネスロジック情報を除去）
      return {
        success: true,
        data: {
          key: s3Key,
          filename,
          contentType,
          size: fileSize,
          encrypted: encryptionService.isEnabled(),
          etag: response.ETag,
        },
      };
    } catch (error: unknown) {
      app.log.error({ err: error }, 'Upload failed:');
      return reply.status(500).send({
        error: { message: 'Upload failed', code: 'UPLOAD_FAILED' },
      });
    }
  });

  /**
   * バリアント専用アップロードエンドポイント
   * - S3イベント送信なし（無限ループ防止）
   * - バリアント画像専用処理
   * - MediaProcessingWorkerから使用
   */
  app.post('/upload-variant', async (request, reply) => {
    try {
      // デバッグ: リクエストの詳細をログ出力
      app.log.info(
        {
          contentType: request.headers['content-type'],
          contentLength: request.headers['content-length'],
          userAgent: request.headers['user-agent'],
          headers: Object.keys(request.headers),
        },
        'S3Gateway /upload-variant request received:'
      );

      const data = await request.file();

      // デバッグ: ファイルデータの詳細をログ出力
      app.log.info(
        {
          hasData: !!data,
          filename: data?.filename,
          mimetype: data?.mimetype,
          encoding: data?.encoding,
          fieldsKeys: data?.fields ? Object.keys(data.fields) : 'no fields',
        },
        'S3Gateway /upload-variant file data:'
      );

      if (!data) {
        app.log.error('S3Gateway /upload-variant: No file data received');
        return reply.status(400).send({
          error: { message: 'File not found', code: 'FILE_NOT_FOUND' },
        });
      }

      const fileBuffer = await data.toBuffer();
      const filename = data.filename || 'variant.webp';
      const contentType = data.mimetype || 'image/webp';
      const fileSize = fileBuffer.length;

      if (fileSize > 50 * 1024 * 1024) {
        // バリアントは50MB制限
        return reply.status(400).send({
          error: { message: 'Variant file too large', code: 'FILE_TOO_LARGE' },
        });
      }

      // ワーカーから送信されたパラメータを使用
      const fields = data.fields;

      // デバッグ: 受信したフィールドをログ出力
      app.log.info(
        {
          fieldsKeys: fields ? Object.keys(fields) : 'no fields',
          fields: fields
            ? Object.fromEntries(
                Object.entries(fields).map(([key, value]) => [
                  key,
                  value && typeof value === 'object' && 'value' in value ? value.value : value,
                ])
              )
            : null,
          filename,
          contentType,
          fileSize,
        },
        'S3Gateway /upload-variant received fields:'
      );

      const mediaId =
        fields?.mediaId && 'value' in fields.mediaId ? String(fields.mediaId.value) : undefined;
      const s3Key =
        fields?.s3Key && 'value' in fields.s3Key ? String(fields.s3Key.value) : undefined;

      // 必須パラメータのチェック
      if (!mediaId || !s3Key) {
        app.log.error(
          {
            mediaId,
            s3Key,
            fieldsReceived: fields ? Object.keys(fields) : 'no fields',
          },
          'S3Gateway /upload-variant missing required params:'
        );
        return reply.status(400).send({
          error: {
            message: 'mediaId and s3Key are required for variant upload',
            code: 'MISSING_REQUIRED_PARAMS',
            debug: {
              receivedFields: fields ? Object.keys(fields) : 'no fields',
              mediaId,
              s3Key,
            },
          },
        });
      }

      app.log.info(
        {
          mediaId,
          s3Key,
          filename,
          contentType,
          fileSize,
        },
        'S3Gateway バリアントアップロード:'
      );

      const s3Client = s3Service.getClient();
      const s3Config = s3Service.getConfig();

      const putObjectParams: PutObjectCommandInput = {
        Bucket: s3Config.backend.bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          'media-id': mediaId,
          'original-filename': filename,
          'upload-timestamp': new Date().toISOString(),
          'upload-type': 'variant', // バリアント識別用
        },
      };

      if (encryptionService.isEnabled()) {
        const ssecParams = encryptionService.generateSSECParams();
        Object.assign(putObjectParams, ssecParams);
      }

      const command = new PutObjectCommand(putObjectParams);
      const response = await s3Client.send(command);

      // セキュアメディア配信エンドポイントを使用
      const downloadUrl = `http://localhost/api/media/${mediaId}`;

      return {
        success: true,
        data: {
          mediaId,
          key: s3Key,
          filename,
          contentType,
          size: fileSize,
          downloadUrl,
          encrypted: encryptionService.isEnabled(),
          etag: response.ETag,
          type: 'variant',
        },
      };
    } catch (error: unknown) {
      app.log.error({ err: error }, 'Variant upload failed:');
      return reply.status(500).send({
        error: { message: 'Variant upload failed', code: 'VARIANT_UPLOAD_FAILED' },
      });
    }
  });

  /**
   * PUT /upload/:uploadId - プリサインドURL移行用アップロードエンドポイント
   *
   * 認証:
   * - Authorization: Bearer <uploadAuthToken> (required)
   *
   * 状態遷移:
   * - CREATED → UPLOADING → UPLOADED
   *
   * エラーレスポンス:
   * - 401/403: token invalid/expired
   * - 404: session not found / expired
   * - 409: invalid state (UPLOADING/UPLOADED/COMPLETED)
   * - 413: payload too large (maxBytes exceeded)
   * - 415: content-type mismatch
   * - 500: upload failure (sets session FAILED)
   */
  app.put<{ Params: UploadParams }>('/upload/:uploadId', async (request, reply) => {
    const { uploadId } = request.params;
    const headers = request.headers as AuthHeaders;
    const tokenService = getTokenService();
    const sessionManager = getSessionManager();
    const s3Service = getS3ClientService();
    const encryptionService = getEncryptionService();

    try {
      // ========================================
      // 1. 認証チェック
      // ========================================
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        app.log.warn({ uploadId }, '🔐 [S3Gateway] 認証ヘッダーが見つかりません:');
        return reply.status(401).send({
          error: {
            message: 'Authorization header is required',
            code: 'AUTHORIZATION_REQUIRED',
          },
        });
      }

      const token = authHeader.substring(7); // 'Bearer ' を除去
      const payload = tokenService.verifyToken(token);

      if (!payload) {
        app.log.warn({ uploadId }, '🔐 [S3Gateway] トークン検証に失敗しました:');
        return reply.status(401).send({
          error: {
            message: 'Invalid or expired token',
            code: 'TOKEN_INVALID',
          },
        });
      }

      // トークンのuploadIdとパスのuploadIdが一致するか確認
      if (payload.uploadId !== uploadId) {
        app.log.warn(
          {
            tokenUploadId: payload.uploadId,
            pathUploadId: uploadId,
          },
          '🔐 [S3Gateway] uploadIdが一致しません:'
        );
        return reply.status(403).send({
          error: {
            message: 'uploadId mismatch',
            code: 'UPLOAD_ID_MISMATCH',
          },
        });
      }

      // ========================================
      // 2. セッション取得と所有者チェック
      // ========================================
      const session = await sessionManager.getSession(uploadId);
      if (!session) {
        app.log.warn({ uploadId }, '🔐 [S3Gateway] セッションが見つかりません:');
        return reply.status(404).send({
          error: {
            message: 'Upload session not found or expired',
            code: 'SESSION_NOT_FOUND',
          },
        });
      }

      // セッションのuserIdとトークンのuserIdが一致するか確認
      if (session.userId !== payload.userId) {
        app.log.warn(
          {
            sessionUserId: session.userId,
            tokenUserId: payload.userId,
          },
          '🔐 [S3Gateway] セッションの所有者ではありません:'
        );
        return reply.status(403).send({
          error: {
            message: 'Session owner mismatch',
            code: 'SESSION_OWNER_MISMATCH',
          },
        });
      }

      // ========================================
      // 3. 状態遷移チェック
      // ========================================
      const startResult = await sessionManager.startUpload(uploadId);
      if (!startResult.allowed) {
        const currentSession = startResult.session;
        if (currentSession) {
          app.log.warn(
            {
              uploadId,
              status: currentSession.status,
              lockUntil: currentSession.lockUntil,
            },
            '🔐 [S3Gateway] 無効な状態:'
          );
        }
        return reply.status(409).send({
          error: {
            message: `Invalid session state: ${currentSession?.status}`,
            code: 'INVALID_STATE',
            status: currentSession?.status,
          },
        });
      }

      // ========================================
      // 4. Content-Type検証
      // ========================================
      const contentType = request.headers['content-type'];
      if (!contentType) {
        app.log.warn({ uploadId }, '🔐 [S3Gateway] Content-Typeが見つかりません:');
        await sessionManager.failSession(uploadId, 'Missing Content-Type');
        return reply.status(415).send({
          error: {
            message: 'Content-Type header is required',
            code: 'CONTENT_TYPE_REQUIRED',
          },
        });
      }

      // セッションのcontentTypeと一致するか確認
      if (contentType !== session.contentType) {
        app.log.warn(
          {
            expected: session.contentType,
            received: contentType,
          },
          '🔐 [S3Gateway] Content-Typeが一致しません:'
        );
        await sessionManager.failSession(uploadId, 'Content-Type mismatch');
        return reply.status(415).send({
          error: {
            message: `Content-Type mismatch. Expected: ${session.contentType}, Received: ${contentType}`,
            code: 'CONTENT_TYPE_MISMATCH',
          },
        });
      }

      // ========================================
      // 5. ストリーム処理とS3アップロード
      // ========================================
      const s3Client = s3Service.getClient();
      const s3Config = s3Service.getConfig();

      // バイト数カウント用のTransformストリーム
      let receivedBytes = 0;
      const maxBytes = session.maxBytes;

      // ストリームサイズチェック
      const sizeCheckStream = new Transform({
        transform(chunk, encoding, callback) {
          receivedBytes += chunk.length;

          // maxBytesを超えたら即座にエラー
          if (receivedBytes > maxBytes) {
            const error = new Error(
              `Payload too large: ${receivedBytes} bytes exceeds max ${maxBytes} bytes`
            ) as Error & { code?: string };
            error.code = 'PAYLOAD_TOO_LARGE';
            return callback(error);
          }

          callback(null, chunk);
        },
      });

      // 暗号化パラメータの準備
      const putObjectParams: PutObjectCommandInput = {
        Bucket: s3Config.backend.bucket,
        Key: session.s3Key,
        ContentType: session.contentType,
      };

      if (encryptionService.isEnabled()) {
        const ssecParams = await encryptionService.generateSSECParams();
        Object.assign(putObjectParams, ssecParams);
      }

      // マルチパートアップロード（@aws-sdk/lib-storageを使用）
      // ストリームの配管: request.body (stream) -> sizeCheckStream -> S3
      // アプリケーション設定でContent-Typeパーサーがストリームを返すように設定されている前提
      const sourceStream = request.body as NodeJS.ReadableStream;
      const stream = sourceStream.pipe(sizeCheckStream);

      const upload = new Upload({
        client: s3Client,
        params: {
          ...putObjectParams,
          Body: stream,
        },
        leavePartsOnError: false, // エラー時にパートを削除
      });

      type ManagedUploadResult = { ETag?: string };
      type ManagedUploadLike = {
        done?: () => Promise<ManagedUploadResult>;
        promise?: () => Promise<ManagedUploadResult>;
      };

      const runManagedUpload = async (
        managedUpload: ManagedUploadLike
      ): Promise<ManagedUploadResult> => {
        if (typeof managedUpload.done === 'function') {
          return managedUpload.done();
        }
        if (typeof managedUpload.promise === 'function') {
          return managedUpload.promise();
        }
        throw new Error('Managed upload API is not available');
      };

      // リクエストストリーム → サイズチェック → S3アップロード
      try {
        const uploadResult = await runManagedUpload(upload as ManagedUploadLike);
        const etag = uploadResult.ETag || '';

        app.log.info(
          {
            uploadId,
            s3Key: session.s3Key,
            receivedBytes,
            etag,
          },
          '✅ [S3Gateway] S3アップロード成功:'
        );

        // ========================================
        // 6. 完了処理
        // ========================================
        const completeResult = await sessionManager.completeUpload(uploadId, receivedBytes, etag);
        if (!completeResult) {
          app.log.error({ uploadId }, '❌ [S3Gateway] セッションの完了に失敗しました:');
          // S3にはアップロード済みだが、Redisの更新に失敗した場合
          // 後でリカバリできるようにログを残す
          app.log.error(
            {
              uploadId,
              s3Key: session.s3Key,
              receivedBytes,
              etag,
            },
            '⚠️ [S3Gateway] S3アップロード済みですがRedis更新失敗:'
          );
        }

        // 204 No Content
        return reply.status(204).send();
      } catch (uploadError: unknown) {
        const error = uploadError as Error & { code?: string; message?: string; stack?: string };
        // maxBytes超過エラーの場合
        if (error.code === 'PAYLOAD_TOO_LARGE') {
          app.log.warn(
            {
              uploadId,
              receivedBytes,
              maxBytes,
            },
            '🔐 [S3Gateway] Payload too large:'
          );
          await sessionManager.failSession(uploadId, 'Payload too large');
          return reply.status(413).send({
            error: {
              message: `Payload too large: ${receivedBytes} bytes exceeds max ${maxBytes} bytes`,
              code: 'PAYLOAD_TOO_LARGE',
            },
          });
        }

        // その他のS3アップロードエラー
        app.log.error(
          {
            uploadId,
            error: error.message,
            stack: error.stack,
          },
          '❌ [S3Gateway] S3アップロード失敗:'
        );
        await sessionManager.failSession(
          uploadId,
          `S3 upload failed: ${error.message || 'Unknown error'}`
        );
        return reply.status(500).send({
          error: {
            message: 'Upload failed',
            code: 'UPLOAD_FAILED',
          },
        });
      }
    } catch (error: unknown) {
      const err = error as Error & { message?: string; stack?: string };
      app.log.error(
        {
          uploadId,
          error: err.message,
          stack: err.stack,
        },
        '❌ [S3Gateway] PUT /upload/:uploadId エラー:'
      );

      // エラーが発生した場合、セッションをFAILEDに設定
      try {
        await sessionManager.failSession(uploadId, err.message || 'Unknown error');
      } catch (failError) {
        app.log.error(
          {
            uploadId,
            err: failError,
          },
          '❌ [S3Gateway] セッションの失敗設定にも失敗:'
        );
      }

      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  });
}
