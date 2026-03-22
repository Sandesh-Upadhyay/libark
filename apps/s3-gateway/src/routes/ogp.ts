/**
 * 🎯 OGP匿名配信ルート
 *
 * OGP画像を匿名で配信するエンドポイント
 * オンデマンド生成対応の新フローを含む
 * 署名検証、S3アクセス、キャッシュヘッダー、監査ログを含む
 */

import { Readable } from 'stream';

import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  GetObjectCommand,
  HeadObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommandInput,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import {
  verifySignature,
  verifyOnDemandSignature,
  generateOnDemandSignature,
} from '@libark/core-server';
import { rateLimiter, type RateLimitConfig } from '@libark/redis-client';

import { getS3ClientService } from '../services/s3-client.js';
import { getEncryptionService } from '../services/encryption.js';
import {
  getOgpMetaService,
  type OnDemandMeta,
  type OnDemandVariant,
} from '../services/ogp-meta.js';

/**
 * OGPルートパラメータ（既存の後方互換）
 */
interface OgpRouteParams {
  mediaId: string;
  variant: string;
  hash: string;
  ext: string;
}

/**
 * オンデマンドOGPルートパラメータ
 */
interface OnDemandOgpRouteParams {
  mediaId: string;
  variant: OnDemandVariant;
  contentHash: string;
  ext: string;
}

/**
 * OGPクエリパラメータ（既存の後方互換）
 */
interface OgpQueryParams {
  exp: string;
  sig: string;
}

/**
 * オンデマンドOGPクエリパラメータ
 */
interface OnDemandOgpQueryParams {
  sig: string;
}

/**
 * 監査ログエラータイプ
 */
type AuditErrorType =
  | 'SIGNATURE_REQUIRED'
  | 'SIGNATURE_EXPIRED'
  | 'INVALID_SIGNATURE'
  | 'INVALID_PARAM'
  | 'META_NOT_FOUND'
  | 'INTERNAL_API_ERROR'
  | 'S3_NO_SUCH_KEY';

/**
 * 許可するバリアント（既存の後方互換）
 */
const ALLOWED_VARIANTS_LEGACY = ['summary', 'large'] as const;

/**
 * 許可するオンデマンドバリアント
 */
const ALLOWED_ON_DEMAND_VARIANTS = ['standard', 'teaser'] as const;

/**
 * 許可する拡張子
 */
const ALLOWED_EXTENSIONS = ['webp', 'jpg'] as const;

/**
 * UUID正規表現
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 64hex正規表現
 */
const HASH64_REGEX = /^[0-9a-f]{64}$/i;

/**
 * 監査ログを記録（成功）
 */
function logAuditSuccess(
  app: FastifyInstance,
  request: FastifyRequest,
  mediaId: string,
  variant: string,
  status: number,
  bytes?: number,
  cacheStatus: 'HIT' | 'MISS' | 'GENERATED' | 'FALLBACK' = 'MISS',
  latency: number = 0,
  ogpKey?: string,
  contentHash?: string,
  isPaid?: boolean
): void {
  const ip = (request.headers['x-forwarded-for'] as string) || request.ip;

  app.log.info({
    mediaId,
    variant,
    status,
    bytes,
    cacheStatus,
    latency,
    ogpKey,
    contentHash,
    isPaid,
    ip,
  }, '✅ [OGP] 配信成功');
}

/**
 * 監査ログを記録（失敗）
 */
function logAuditError(
  app: FastifyInstance,
  request: FastifyRequest,
  mediaId: string,
  variant: string,
  errorType: AuditErrorType,
  details?: string,
  ogpKey?: string,
  contentHash?: string,
  isPaid?: boolean
): void {
  const ip = (request.headers['x-forwarded-for'] as string) || request.ip;
  const ua = (request.headers['user-agent'] as string) || '';

  app.log.warn({
    mediaId,
    variant,
    errorType,
    details,
    ogpKey,
    contentHash,
    isPaid,
    ip,
    ua,
  }, '❌ [OGP] 配信失敗');
}

/**
 * Rate limitチェック
 */
async function checkRateLimit(
  app: FastifyInstance,
  request: FastifyRequest,
  mediaId: string,
  variant: string
): Promise<{ allowed: boolean; errorType?: AuditErrorType }> {
  const ip = (request.headers['x-forwarded-for'] as string) || request.ip;

  // OGP用のrate limit設定（軽量）
  const ogpRateLimitConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1分
    maxRequests: parseInt(process.env.OGP_RATE_LIMIT_MAX || '60', 10), // デフォルト60リクエスト/分
    blockDurationMs: 60 * 1000, // 1分ブロック
  };

  try {
    const result = await rateLimiter.checkRateLimit({
      identifier: ip,
      action: 'ogp',
      config: ogpRateLimitConfig,
    });

    if (!result.allowed) {
      app.log.warn({
        mediaId,
        variant,
        ip,
        retryAfter: result.retryAfter,
      }, '🚫 [OGP] Rate limit超過');

      return { allowed: false, errorType: 'INVALID_PARAM' };
    }

    return { allowed: true };
  } catch (error) {
    app.log.error({ err: error }, '❌ [OGP] Rate limitチェックエラー:');
    // エラー時は許可する（fail-safe）
    return { allowed: true };
  }
}

/**
 * パラメータを検証（既存の後方互換）
 */
function validateParams(
  params: OgpRouteParams,
  query: OgpQueryParams
): { valid: boolean; errorType?: AuditErrorType } {
  // UUID形式チェック
  if (!UUID_REGEX.test(params.mediaId)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // バリアントチェック
  if (!ALLOWED_VARIANTS_LEGACY.includes(params.variant as any)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // ハッシュチェック（64hex）
  if (!HASH64_REGEX.test(params.hash)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // 拡張子チェック
  if (!ALLOWED_EXTENSIONS.includes(params.ext as any)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // クエリパラメータチェック
  if (!query.exp || !query.sig) {
    return { valid: false, errorType: 'SIGNATURE_REQUIRED' };
  }

  // expとsigの型チェック
  const exp = parseInt(query.exp, 10);
  if (isNaN(exp) || exp <= 0) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // sigはhex文字列チェック
  if (!/^[0-9a-f]{64}$/i.test(query.sig)) {
    return { valid: false, errorType: 'INVALID_SIGNATURE' };
  }

  return { valid: true };
}

/**
 * オンデマンドOGPパラメータを検証
 */
function validateOnDemandParams(
  params: OnDemandOgpRouteParams,
  query: OnDemandOgpQueryParams
): { valid: boolean; errorType?: AuditErrorType } {
  // UUID形式チェック
  if (!UUID_REGEX.test(params.mediaId)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // バリアントチェック
  if (!ALLOWED_ON_DEMAND_VARIANTS.includes(params.variant)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // ハッシュチェック（64hex）
  if (!HASH64_REGEX.test(params.contentHash)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // 拡張子チェック
  if (!ALLOWED_EXTENSIONS.includes(params.ext as any)) {
    return { valid: false, errorType: 'INVALID_PARAM' };
  }

  // クエリパラメータチェック
  if (!query.sig) {
    return { valid: false, errorType: 'SIGNATURE_REQUIRED' };
  }

  // sigはhex文字列チェック
  if (!/^[0-9a-f]{64}$/i.test(query.sig)) {
    return { valid: false, errorType: 'INVALID_SIGNATURE' };
  }

  return { valid: true };
}

/**
 * 署名を検証（既存の後方互換）
 */
function verifyOgpSignature(
  params: OgpRouteParams,
  query: OgpQueryParams,
  salt: string,
  signingKey: string,
  maxFutureSec: number
): { valid: boolean; errorType?: AuditErrorType } {
  const path = `/ogp/${params.mediaId}/${params.variant}/${params.hash}/${params.ext}`;
  const exp = parseInt(query.exp, 10);
  const signature = query.sig;

  const isValid = verifySignature(path, salt, exp, signature, signingKey, maxFutureSec);

  if (!isValid) {
    // 期限切れか署名不一致かを判断
    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) {
      return { valid: false, errorType: 'SIGNATURE_EXPIRED' };
    }
    return { valid: false, errorType: 'INVALID_SIGNATURE' };
  }

  return { valid: true };
}

/**
 * オンデマンドOGP署名を検証
 */
function verifyOnDemandOgpSignature(
  params: OnDemandOgpRouteParams,
  query: OnDemandOgpQueryParams,
  signingKey: string
): { valid: boolean; errorType?: AuditErrorType } {
  const { mediaId, variant, contentHash, ext } = params;
  const signature = query.sig;

  const isValid = verifyOnDemandSignature(
    mediaId,
    variant,
    contentHash,
    ext,
    signature,
    signingKey
  );

  if (!isValid) {
    return { valid: false, errorType: 'INVALID_SIGNATURE' };
  }

  return { valid: true };
}

/**
 * Rangeヘッダーをパース
 * @returns 成功時は { start, end }、失敗時は { error: true }、Rangeヘッダーなしは undefined
 */
function parseRangeHeader(
  rangeHeader: string | undefined
): { start: number; end?: number } | { error: true } | undefined {
  if (!rangeHeader) {
    return undefined;
  }

  // 単一レンジのみ許可（複数レンジは拒否）
  const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) {
    // 複数レンジや不正な形式の場合はエラー
    return { error: true };
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : undefined;

  // 不正な範囲チェック（start > end）
  if (end !== undefined && start > end) {
    return { error: true };
  }

  return { start, end };
}

/**
 * キャッシュヘッダーを計算（既存の後方互換）
 */
function calculateCacheHeaders(exp: number): { 'Cache-Control': string; maxAge: number } {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = Math.min(3600, Math.max(0, exp - now)); // 最大1時間、ただしexp残り未満

  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    maxAge,
  };
}

/**
 * オンデマンドOGPキャッシュヘッダーを計算
 */
function calculateOnDemandCacheHeaders(): { 'Cache-Control': string } {
  return {
    'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  };
}

/**
 * オンデマンドOGP生成を処理
 *
 * @param meta - オンデマンドOGPメタデータ
 * @param signingKey - 署名キー
 * @param s3Client - S3クライアント
 * @param bucket - バケット名
 * @returns 生成された画像データ
 * @throws エラー（フォールバック画像を返す）
 */
async function handleOnDemandGeneration(
  meta: OnDemandMeta,
  signingKey: string,
  s3Client: any,
  bucket: string
): Promise<{
  body: Readable;
  contentType: string;
  contentLength: number;
  etag: string;
  cacheStatus: 'GENERATED' | 'FALLBACK';
}> {
  const { getOgpGeneratorService } = await import('../services/ogp-generator.js');
  const { getOgpLockService } = await import('../services/ogp-lock.js');

  const generator = getOgpGeneratorService();
  const lockService = getOgpLockService();

  const lockKey = lockService.generateLockKey(meta.ogpKey);
  const lockAcquired = await lockService.acquireLock(lockKey, 60);

  try {
    if (lockAcquired) {
      // ロック取得成功: 画像を生成
      const buffer =
        meta.isPaid && meta.variant === 'teaser'
          ? await generator.generateTeaserOgp({
              mediaId: meta.mediaId,
              variant: meta.variant,
              postId: meta.postId,
              isPaid: meta.isPaid,
            })
          : await generator.generateStandardOgp({
              mediaId: meta.mediaId,
              variant: meta.variant,
              postId: meta.postId,
              isPaid: meta.isPaid,
            });

      const etag = generator.generateEtag(buffer);

      // S3に保存
      await generator.saveOgpToS3(meta.ogpKey, buffer, meta.contentType, s3Client, bucket);

      // ストリームに変換して返す
      const stream = generator.bufferToStream(buffer);

      return {
        body: stream,
        contentType: meta.contentType,
        contentLength: buffer.length,
        etag,
        cacheStatus: 'GENERATED',
      };
    } else {
      // ロック取得失敗: 他のリクエストが生成中
      console.warn('⚠️ [OGP] ロック競合発生', {
        mediaId: meta.mediaId,
        variant: meta.variant,
        ogpKey: meta.ogpKey,
        isPaid: meta.isPaid,
      });

      // 短時間ポーリングしてS3オブジェクトの出現を待つ
      const objectExists = await lockService.waitForObject({
        s3Client,
        bucket,
        ogpKey: meta.ogpKey,
        intervalMs: 200,
        timeoutMs: 2500,
      });

      if (objectExists) {
        // オブジェクトが出現した: S3から返す（呼び出し元で処理）
        throw new Error('OBJECT_APPEARED');
      } else {
        // タイムアウト: フォールバック画像を返す
        console.warn('⚠️ [OGP] フォールバック画像を返す', {
          mediaId: meta.mediaId,
          variant: meta.variant,
          ogpKey: meta.ogpKey,
          isPaid: meta.isPaid,
        });

        const fallbackBuffer = await generator.generateFallbackOgp();
        const fallbackEtag = generator.generateEtag(fallbackBuffer);
        const fallbackStream = generator.bufferToStream(fallbackBuffer);

        return {
          body: fallbackStream,
          contentType: 'image/jpeg',
          contentLength: fallbackBuffer.length,
          etag: fallbackEtag,
          cacheStatus: 'FALLBACK',
        };
      }
    }
  } finally {
    // ロックを解放
    if (lockAcquired) {
      await lockService.releaseLock(lockKey);
    }
  }
}

/**
 * オンデマンドOGPルートを登録
 */
export async function ogpRoutes(app: FastifyInstance) {
  // 🚩 フィーチャーフラグチェック（デフォルト: 有効）
  const ogpEnabled = process.env.OGP_ENABLED !== 'false';
  if (!ogpEnabled) {
    app.log.warn('⚠️ [OGP] OGP匿名配信機能は無効化されています');
    return;
  }

  // 🚩 オンデマンド生成フィーチャーフラグチェック（デフォルト: 有効）
  const onDemandEnabled = process.env.OGP_ON_DEMAND_ENABLED !== 'false';

  const s3Service = getS3ClientService();
  const encryptionService = getEncryptionService();
  const ogpMetaService = getOgpMetaService();

  const signingKey = process.env.OGP_SIGNING_KEY || '';
  const maxFutureSec = parseInt(process.env.OGP_MAX_FUTURE_SEC || '2592000', 10);

  if (!signingKey) {
    app.log.warn('⚠️ [OGP] OGP_SIGNING_KEYが設定されていません');
  }

  if (!onDemandEnabled) {
    app.log.info('ℹ️ [OGP] オンデマンド生成機能は無効化されています');
  }

  /**
   * オンデマンドOGPルート
   * GET /ogp/:mediaId/:variant/:contentHash.:ext
   * HEAD /ogp/:mediaId/:variant/:contentHash.:ext
   */
  app.get<{ Params: OnDemandOgpRouteParams; Querystring: OnDemandOgpQueryParams }>(
    '/ogp/:mediaId/:variant/:contentHash.:ext',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            mediaId: { type: 'string' },
            variant: { type: 'string', enum: ['standard', 'teaser'] },
            contentHash: { type: 'string' },
            ext: { type: 'string', enum: ['jpg', 'webp'] },
          },
          required: ['mediaId', 'variant', 'contentHash', 'ext'],
        },
        querystring: {
          type: 'object',
          properties: {
            sig: { type: 'string' },
          },
          required: ['sig'],
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now();
      const params = request.params as OnDemandOgpRouteParams;
      const query = request.query as OnDemandOgpQueryParams;
      const { mediaId, variant, contentHash, ext } = params;

      try {
        // 0. Rate limitチェック（署名検証より前）
        const rateLimitResult = await checkRateLimit(app, request, mediaId, variant);
        if (!rateLimitResult.allowed) {
          logAuditError(app, request, mediaId, variant, rateLimitResult.errorType!);
          return reply.status(429).send({
            error: {
              message: 'リクエスト数が制限を超えています',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          });
        }

        // (a) パラメータ検証
        const validation = validateOnDemandParams(params, query);
        if (!validation.valid) {
          logAuditError(app, request, mediaId, variant, validation.errorType!);
          return reply.status(validation.errorType === 'SIGNATURE_REQUIRED' ? 401 : 400).send({
            error: {
              message:
                validation.errorType === 'SIGNATURE_REQUIRED'
                  ? '署名パラメータが必要です'
                  : '無効なパラメータです',
              code: validation.errorType,
            },
          });
        }

        // (b) backend internal-ogp を呼び、onDemand meta を取得
        const meta = await ogpMetaService.getOnDemandMeta(mediaId, variant);
        if (!meta) {
          logAuditError(app, request, mediaId, variant, 'META_NOT_FOUND');
          return reply.status(404).send({
            error: {
              message: 'OGPメタデータが見つかりません',
              code: 'META_NOT_FOUND',
            },
          });
        }

        // (c) sig検証は必ず実施（S3有無に関わらず、生成前に弾く）
        const signatureValidation = verifyOnDemandOgpSignature(params, query, signingKey);
        if (!signatureValidation.valid) {
          logAuditError(
            app,
            request,
            mediaId,
            variant,
            signatureValidation.errorType!,
            undefined,
            meta.ogpKey,
            meta.contentHash,
            meta.isPaid
          );
          return reply.status(401).send({
            error: {
              message: '無効な署名です',
              code: signatureValidation.errorType,
            },
          });
        }

        // (d) URLのhashが期待値と違う場合は 301 で canonical URL へリダイレクト
        if (contentHash !== meta.contentHash) {
          // canonical URLを生成
          const canonicalPath = `/ogp/${mediaId}/${variant}/${meta.contentHash}.${ext}`;

          // canonical URL用の署名を生成
          const canonicalSig = generateOnDemandSignature(
            mediaId,
            variant,
            meta.contentHash,
            ext,
            signingKey
          );

          const canonicalUrl = `${canonicalPath}?sig=${canonicalSig}`;

          logAuditError(
            app,
            request,
            mediaId,
            variant,
            'INVALID_PARAM',
            'Hash mismatch, redirecting to canonical URL',
            meta.ogpKey,
            meta.contentHash,
            meta.isPaid
          );
          return reply.code(301).header('Location', canonicalUrl).send();
        }

        // (e) status=READY または S3に存在するなら S3 から配信
        const s3Client = s3Service.getClient();
        const s3Config = s3Service.getConfig();
        const isHead = request.method === 'HEAD';

        // Rangeヘッダーをパース
        const range = parseRangeHeader(request.headers.range);

        // 不正なRangeリクエスト（複数レンジなど）は拒否
        if (range && 'error' in range) {
          logAuditError(app, request, mediaId, variant, 'INVALID_PARAM', 'Invalid Range header');
          return reply.status(400).send({
            error: {
              message: '無効なRangeヘッダーです',
              code: 'INVALID_PARAM',
            },
          });
        }

        // キャッシュヘッダーを設定
        const cacheHeaders = calculateOnDemandCacheHeaders();
        reply.header('Cache-Control', cacheHeaders['Cache-Control']);

        // セキュリティヘッダー
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

        // S3コマンド準備
        const commandParams: GetObjectCommandInput | HeadObjectCommandInput = {
          Bucket: s3Config.backend.bucket,
          Key: meta.ogpKey,
        };

        if (range && !('error' in range)) {
          commandParams.Range = `bytes=${range.start}-${range.end || ''}`;
        }

        // 暗号化パラメータを追加
        if (encryptionService.isEnabled()) {
          const ssecParams = await encryptionService.generateSSECParams();
          Object.assign(commandParams, ssecParams);
        }

        // S3コマンド実行
        const command = isHead
          ? new HeadObjectCommand(commandParams as HeadObjectCommandInput)
          : new GetObjectCommand(commandParams as GetObjectCommandInput);

        const s3Response = await s3Client.send(command);

        // レスポンスヘッダー設定
        if (s3Response.ContentType) {
          reply.type(s3Response.ContentType);
        }
        if (s3Response.ContentLength !== undefined) {
          reply.header('Content-Length', s3Response.ContentLength);
        }
        if (s3Response.ETag) {
          reply.header('ETag', s3Response.ETag);
        }
        if (s3Response.LastModified) {
          reply.header('Last-Modified', s3Response.LastModified.toUTCString());
        }

        // X-OGP-Cacheヘッダー（HIT）
        reply.header('X-OGP-Cache', 'HIT');

        // Rangeレスポンスの場合は206を返す
        if (range && !('error' in range)) {
          reply.status(206);
          reply.header('Accept-Ranges', 'bytes');
          if (s3Response.ContentRange) {
            reply.header('Content-Range', s3Response.ContentRange);
          }
        }

        // HEADリクエストの場合はここで終了
        if (isHead) {
          const latency = Date.now() - startTime;
          logAuditSuccess(
            app,
            request,
            mediaId,
            variant,
            200,
            undefined,
            'HIT',
            latency,
            meta.ogpKey,
            meta.contentHash,
            undefined
          );
          return reply.send();
        }

        // GETリクエストの場合はストリームをパイプ
        const getObjectResponse = s3Response as GetObjectCommandOutput;
        if (getObjectResponse.Body instanceof Readable) {
          let bytes = 0;
          const stream = getObjectResponse.Body.on('data', (chunk: Buffer) => {
            bytes += chunk.length;
          });

          await reply.send(stream);

          const latency = Date.now() - startTime;
          logAuditSuccess(
            app,
            request,
            mediaId,
            variant,
            range && !('error' in range) ? 206 : 200,
            bytes,
            'HIT',
            latency,
            meta.ogpKey,
            meta.contentHash,
            undefined
          );
          return;
        }

        // BodyがReadableでない場合（エラー）
        logAuditError(app, request, mediaId, variant, 'S3_NO_SUCH_KEY', 'Invalid response body');
        return reply.status(500).send({
          error: {
            message: 'S3レスポンスが無効です',
            code: 'INTERNAL_ERROR',
          },
        });
      } catch (error: any) {
        const _latency = Date.now() - startTime;

        // S3 NoSuchKeyエラー
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
          // (f) S3に無い場合は「オンデマンド生成」へ進むフックを用意
          // 🚩 オンデマンド生成フィーチャーフラグチェック
          if (!onDemandEnabled) {
            logAuditError(
              app,
              request,
              mediaId,
              variant,
              'S3_NO_SUCH_KEY',
              'On-demand generation disabled',
              undefined,
              undefined,
              undefined
            );
            return reply.status(404).send({
              error: {
                message: 'ファイルが見つかりません',
                code: 'S3_NO_SUCH_KEY',
              },
            });
          }

          try {
            // S3クライアントと設定を再取得
            const s3Client = s3Service.getClient();
            const s3Config = s3Service.getConfig();

            // オンデマンドメタデータを再取得（キャッシュが古い可能性があるため）
            const meta = await ogpMetaService.getOnDemandMeta(mediaId, variant);
            if (!meta) {
              logAuditError(
                app,
                request,
                mediaId,
                variant,
                'META_NOT_FOUND',
                undefined,
                undefined,
                undefined,
                undefined
              );
              return reply.status(404).send({
                error: {
                  message: 'OGPメタデータが見つかりません',
                  code: 'META_NOT_FOUND',
                },
              });
            }

            // オンデマンド生成を試みる
            const generated = await handleOnDemandGeneration(
              meta,
              signingKey,
              s3Client,
              s3Config.backend.bucket
            );

            // 生成成功の場合はレスポンスを返す
            reply.type(generated.contentType);
            reply.header('Content-Length', generated.contentLength);
            reply.header('ETag', generated.etag);
            reply.header('X-OGP-Cache', generated.cacheStatus);
            reply.header('Cache-Control', calculateOnDemandCacheHeaders()['Cache-Control']);

            const isHead = request.method === 'HEAD';
            if (isHead) {
              const latency = Date.now() - startTime;
              logAuditSuccess(
                app,
                request,
                mediaId,
                variant,
                200,
                undefined,
                generated.cacheStatus,
                latency,
                meta.ogpKey,
                meta.contentHash,
                meta.isPaid
              );
              return reply.send();
            }

            let bytes = 0;
            const stream = generated.body.on('data', (chunk: Buffer) => {
              bytes += chunk.length;
            });

            await reply.send(stream);

            const genLatency = Date.now() - startTime;
            logAuditSuccess(
              app,
              request,
              mediaId,
              variant,
              200,
              bytes,
              generated.cacheStatus,
              genLatency,
              meta.ogpKey,
              meta.contentHash,
              meta.isPaid
            );
            return;
          } catch (generationError: any) {
            // 生成失敗の場合は404を返す（存在秘匿）
            logAuditError(
              app,
              request,
              mediaId,
              variant,
              'S3_NO_SUCH_KEY',
              generationError.message
            );
            return reply.status(404).send({
              error: {
                message: 'ファイルが見つかりません',
                code: 'S3_NO_SUCH_KEY',
              },
            });
          }
        }

        // 内部APIエラー
        if (error.message?.includes('Internal API error')) {
          logAuditError(app, request, mediaId, variant, 'INTERNAL_API_ERROR', error.message);
          return reply.status(502).send({
            error: {
              message: '内部APIエラー',
              code: 'INTERNAL_API_ERROR',
            },
          });
        }

        // OGPメタデータ取得エラー
        if (error.message?.includes('OGPメタデータ取得エラー')) {
          logAuditError(app, request, mediaId, variant, 'INTERNAL_API_ERROR', error.message);
          return reply.status(502).send({
            error: {
              message: '内部APIエラー',
              code: 'INTERNAL_API_ERROR',
            },
          });
        }

        // その他のエラー
        const bucket = s3Service.getConfig().backend.bucket;
        // metaはtryブロック内定義のため参照できない可能性がある
        // paramsは利用可能
        const key = `ogp/${mediaId}/${variant}`; // contentHash, ext はこのルートのparamsにはないため含めない

        app.log.error({
          error: error instanceof Error ? error.message : 'Unknown error',
          code: (error as { Code?: string; name?: string }).Code || (error as { name?: string }).name,
          statusCode: (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode,
          bucket,
          key, // 構築したキー（または推定キー）
          stack: error instanceof Error ? error.stack : undefined,
        }, 'File serve error:');
        logAuditError(app, request, mediaId, variant, 'INTERNAL_API_ERROR', error.message);
        return reply.status(500).send({
          error: {
            message: 'サーバーエラー',
            code: 'INTERNAL_SERVER_ERROR',
          },
        });
      }
    }
  );

  /**
   * 既存のOGPルート（後方互換）
   * GET /ogp/:mediaId/:variant/:hash/:ext
   * HEAD /ogp/:mediaId/:variant/:hash/:ext
   */
  app.get<{ Params: OgpRouteParams; Querystring: OgpQueryParams }>(
    '/ogp/:mediaId/:variant/:hash/:ext',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            mediaId: { type: 'string' },
            variant: { type: 'string' },
            hash: { type: 'string' },
            ext: { type: 'string' },
          },
          required: ['mediaId', 'variant', 'hash', 'ext'],
        },
        querystring: {
          type: 'object',
          properties: {
            exp: { type: 'string' },
            sig: { type: 'string' },
          },
          required: ['exp', 'sig'],
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now();
      const params = request.params as OgpRouteParams;
      const query = request.query as OgpQueryParams;

      try {
        // 0. Rate limitチェック（署名検証より前）
        const rateLimitResult = await checkRateLimit(app, request, params.mediaId, params.variant);
        if (!rateLimitResult.allowed) {
          logAuditError(app, request, params.mediaId, params.variant, rateLimitResult.errorType!);
          return reply.status(429).send({
            error: {
              message: 'リクエスト数が制限を超えています',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          });
        }

        // 1. 厳格バリデーション
        const validation = validateParams(params, query);
        if (!validation.valid) {
          logAuditError(app, request, params.mediaId, params.variant, validation.errorType!);
          return reply.status(validation.errorType === 'SIGNATURE_REQUIRED' ? 401 : 400).send({
            error: {
              message:
                validation.errorType === 'SIGNATURE_REQUIRED'
                  ? '署名パラメータが必要です'
                  : '無効なパラメータです',
              code: validation.errorType,
            },
          });
        }

        // 2. OGPメタデータ取得
        const meta = await ogpMetaService.getOgpMeta(params.mediaId);
        if (!meta) {
          logAuditError(app, request, params.mediaId, params.variant, 'META_NOT_FOUND');
          return reply.status(404).send({
            error: {
              message: 'OGPメタデータが見つかりません',
              code: 'META_NOT_FOUND',
            },
          });
        }

        // 3. ハッシュ検証（URLのハッシュとメタデータのハッシュが一致するか）
        if (params.hash !== meta.contentHash) {
          logAuditError(
            app,
            request,
            params.mediaId,
            params.variant,
            'INVALID_SIGNATURE',
            'Hash mismatch',
            meta.ogpKey,
            meta.contentHash,
            undefined
          );
          return reply.status(401).send({
            error: {
              message: '無効な署名です',
              code: 'INVALID_SIGNATURE',
            },
          });
        }

        // 4. 署名検証（S3アクセス前に行う）
        const signatureValidation = verifyOgpSignature(
          params,
          query,
          meta.salt,
          signingKey,
          maxFutureSec
        );
        if (!signatureValidation.valid) {
          logAuditError(
            app,
            request,
            params.mediaId,
            params.variant,
            signatureValidation.errorType!,
            undefined,
            meta.ogpKey,
            meta.contentHash,
            undefined
          );
          return reply.status(401).send({
            error: {
              message:
                signatureValidation.errorType === 'SIGNATURE_EXPIRED'
                  ? '署名の有効期限が切れています'
                  : '無効な署名です',
              code: signatureValidation.errorType,
            },
          });
        }

        // 5. S3アクセス準備
        const s3Client = s3Service.getClient();
        const _s3Config = s3Service.getConfig();
        const isHead = request.method === 'HEAD';

        // 6. Rangeヘッダーをパース
        const range = parseRangeHeader(request.headers.range);

        // 不正なRangeリクエスト（複数レンジなど）は拒否
        if (range && 'error' in range) {
          logAuditError(
            app,
            request,
            params.mediaId,
            params.variant,
            'INVALID_PARAM',
            'Invalid Range header'
          );
          return reply.status(400).send({
            error: {
              message: '無効なRangeヘッダーです',
              code: 'INVALID_PARAM',
            },
          });
        }

        // 7. キャッシュヘッダーを計算
        const exp = parseInt(query.exp, 10);
        const cacheHeaders = calculateCacheHeaders(exp);
        reply.header('Cache-Control', cacheHeaders['Cache-Control']);

        // 8. セキュリティヘッダー
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

        // 9. S3コマンド準備
        const commandParams: GetObjectCommandInput | HeadObjectCommandInput = {
          Bucket: meta.bucket,
          Key: meta.ogpKey,
        };

        if (range && !('error' in range)) {
          commandParams.Range = `bytes=${range.start}-${range.end || ''}`;
        }

        // 10. 暗号化パラメータを追加
        if (encryptionService.isEnabled()) {
          const ssecParams = await encryptionService.generateSSECParams();
          Object.assign(commandParams, ssecParams);
        }

        // 11. S3コマンド実行
        const command = isHead
          ? new HeadObjectCommand(commandParams as HeadObjectCommandInput)
          : new GetObjectCommand(commandParams as GetObjectCommandInput);

        const s3Response = await s3Client.send(command);

        // 12. レスポンスヘッダー設定
        if (s3Response.ContentType) {
          reply.type(s3Response.ContentType);
        }
        if (s3Response.ContentLength !== undefined) {
          reply.header('Content-Length', s3Response.ContentLength);
        }
        if (s3Response.ETag) {
          reply.header('ETag', s3Response.ETag);
        }
        if (s3Response.LastModified) {
          reply.header('Last-Modified', s3Response.LastModified.toUTCString());
        }

        // 13. Rangeレスポンスの場合は206を返す
        if (range && !('error' in range)) {
          reply.status(206);
          reply.header('Accept-Ranges', 'bytes');
          if (s3Response.ContentRange) {
            reply.header('Content-Range', s3Response.ContentRange);
          }
        }

        // 14. HEADリクエストの場合はここで終了
        if (isHead) {
          const latency = Date.now() - startTime;
          logAuditSuccess(
            app,
            request,
            params.mediaId,
            params.variant,
            200,
            undefined,
            'MISS',
            latency,
            meta.ogpKey,
            meta.contentHash,
            undefined
          );
          return reply.send();
        }

        // 15. GETリクエストの場合はストリームをパイプ
        const getObjectResponse = s3Response as GetObjectCommandOutput;
        if (getObjectResponse.Body instanceof Readable) {
          let bytes = 0;
          const stream = getObjectResponse.Body.on('data', (chunk: Buffer) => {
            bytes += chunk.length;
          });

          await reply.send(stream);

          const latency = Date.now() - startTime;
          logAuditSuccess(
            app,
            request,
            params.mediaId,
            params.variant,
            range && !('error' in range) ? 206 : 200,
            bytes,
            'MISS',
            latency,
            meta.ogpKey,
            meta.contentHash,
            undefined
          );
          return;
        }

        // 16. BodyがReadableでない場合（エラー）
        logAuditError(
          app,
          request,
          params.mediaId,
          params.variant,
          'S3_NO_SUCH_KEY',
          'Invalid response body'
        );
        return reply.status(500).send({
          error: {
            message: 'S3レスポンスが無効です',
            code: 'INTERNAL_ERROR',
          },
        });
      } catch (error: any) {
        const _latency = Date.now() - startTime;

        // S3 NoSuchKeyエラー
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
          logAuditError(app, request, params.mediaId, params.variant, 'S3_NO_SUCH_KEY');
          return reply.status(404).send({
            error: {
              message: 'ファイルが見つかりません',
              code: 'S3_NO_SUCH_KEY',
            },
          });
        }

        // 内部APIエラー
        if (error.message?.includes('Internal API error')) {
          logAuditError(
            app,
            request,
            params.mediaId,
            params.variant,
            'INTERNAL_API_ERROR',
            error.message
          );
          return reply.status(502).send({
            error: {
              message: '内部APIエラー',
              code: 'INTERNAL_API_ERROR',
            },
          });
        }

        // OGPメタデータ取得エラー
        if (error.message?.includes('OGPメタデータ取得エラー')) {
          logAuditError(
            app,
            request,
            params.mediaId,
            params.variant,
            'INTERNAL_API_ERROR',
            error.message
          );
          return reply.status(502).send({
            error: {
              message: '内部APIエラー',
              code: 'INTERNAL_API_ERROR',
            },
          });
        }

        // その他のエラー
        app.log.error('❌ [OGP] エラー:', error);
        logAuditError(
          app,
          request,
          params.mediaId,
          params.variant,
          'INTERNAL_API_ERROR',
          error.message
        );
        return reply.status(500).send({
          error: {
            message: 'サーバーエラー',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  );
}
