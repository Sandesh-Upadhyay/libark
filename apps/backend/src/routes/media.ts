/**
 * 🖼️ セキュアメディア配信ルート
 *
 * 認証・購入状態チェック付きのメディア配信エンドポイント
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { createMediaAccessControlService } from '../services/media-access-control.js';

interface MediaParams {
  mediaId: string;
}

interface MediaQuery {
  variant?: string;
  download?: string;
}

export async function mediaRoutes(app: FastifyInstance) {
  const accessControlService = createMediaAccessControlService(app.prisma, app.log);

  /**
   * セキュアメディア配信エンドポイント
   * GET /api/media/:mediaId
   */
  app.get<{
    Params: MediaParams;
    Querystring: MediaQuery;
  }>(
    '/api/media/:mediaId',
    async (
      request: FastifyRequest<{
        Params: MediaParams;
        Querystring: MediaQuery;
      }>,
      reply: FastifyReply
    ) => {
      const { mediaId } = request.params;
      const { variant, download } = request.query;

      try {
        // 手動認証チェック（任意認証）
        const authResult = await app.auth.authenticate(request);
        if (authResult.success && authResult.data) {
          request.user = authResult.data;
        }

        app.log.info(
          {
            mediaId,
            userId: request.user?.id,
            variant,
            download,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            authenticated: !!request.user,
          },
          '🖼️ [SecureMedia] メディア配信リクエスト'
        );

        // アクセス権限チェック
        const accessResult = await accessControlService.checkAccess({
          userId: request.user?.id,
          mediaId,
          userRole: request.user?.role,
          variant, // バリアント情報を追加
        });

        if (!accessResult.allowed) {
          app.log.warn(
            {
              mediaId,
              userId: request.user?.id,
              reason: accessResult.reason,
              code: accessResult.code,
            },
            '🚫 [SecureMedia] アクセス拒否'
          );

          // アクセス拒否の理由に応じたHTTPステータスコード
          const statusCode = getStatusCodeForAccessDenial(accessResult.code);

          return reply.status(statusCode).send({
            error: {
              message: accessResult.reason || 'アクセスが拒否されました',
              code: accessResult.code || 'ACCESS_DENIED',
            },
          });
        }

        // メディア情報を取得
        const media = await app.prisma.media.findUnique({
          where: { id: mediaId },
          select: {
            id: true,
            s3Key: true,
            filename: true,
            mimeType: true,
            fileSize: true,
            type: true,
            variants: variant
              ? {
                  where: { type: variant.toUpperCase() as import('@libark/db').VariantType },
                  select: { s3Key: true, width: true, height: true },
                }
              : true,
          },
        });

        if (!media) {
          return reply.status(404).send({
            error: {
              message: 'メディアが見つかりません',
              code: 'MEDIA_NOT_FOUND',
            },
          });
        }

        // バリアント指定がある場合の処理
        let targetS3Key = media.s3Key;
        const mediaWithVariants = media as { variants?: { s3Key: string }[] };
        if (variant && mediaWithVariants.variants && mediaWithVariants.variants.length > 0) {
          targetS3Key = mediaWithVariants.variants[0].s3Key;
          app.log.info(
            {
              mediaId,
              variant,
              originalKey: media.s3Key,
              variantKey: targetS3Key,
            },
            '📐 [SecureMedia] バリアント使用'
          );
        }

        // S3Gateway経由でファイルを取得
        const s3GatewayUrl = process.env.S3_GATEWAY_URL || 'http://s3-gateway:8080';
        const bucket = process.env.S3_BACKEND_BUCKET || 'libark-media';
        const proxyUrl = `${s3GatewayUrl}/files/${bucket}/${targetS3Key}`;

        app.log.info(
          {
            mediaId,
            s3Key: targetS3Key,
            proxyUrl,
          },
          '🔄 [SecureMedia] S3Gateway経由でファイル取得'
        );

        try {
          // S3Gatewayからファイルを取得
          const response = await fetch(proxyUrl);

          if (!response.ok) {
            app.log.error(
              {
                mediaId,
                s3Key: targetS3Key,
                status: response.status,
                statusText: response.statusText,
              },
              '❌ [SecureMedia] S3Gateway取得エラー'
            );

            return reply.status(response.status).send({
              error: {
                message: 'ファイルの取得に失敗しました',
                code: 'FILE_FETCH_ERROR',
              },
            });
          }

          // レスポンスヘッダーの設定
          const contentType = response.headers.get('content-type') || media.mimeType;
          const contentLength = response.headers.get('content-length');
          const etag = response.headers.get('etag');
          const lastModified = response.headers.get('last-modified');

          // セキュリティヘッダー
          reply.header('X-Content-Type-Options', 'nosniff');
          reply.header('X-Frame-Options', 'DENY');

          // キャッシュ制御（メディアタイプに応じて調整）
          const cacheControl = getCacheControlForMediaType(media.type);
          reply.header('Cache-Control', cacheControl);

          // ファイル情報ヘッダー
          reply.header('Content-Type', contentType);
          if (contentLength) reply.header('Content-Length', contentLength);
          if (etag) reply.header('ETag', etag);
          if (lastModified) reply.header('Last-Modified', lastModified);

          // ダウンロード指定の場合
          if (download === 'true') {
            reply.header('Content-Disposition', `attachment; filename="${media.filename}"`);
          } else {
            reply.header('Content-Disposition', 'inline');
          }

          // 条件付きリクエストの処理
          const ifNoneMatch = request.headers['if-none-match'];
          if (ifNoneMatch && etag && ifNoneMatch === etag) {
            return reply.status(304).send();
          }

          const ifModifiedSince = request.headers['if-modified-since'];
          if (ifModifiedSince && lastModified) {
            const modifiedSince = new Date(ifModifiedSince);
            const lastMod = new Date(lastModified);
            if (lastMod <= modifiedSince) {
              return reply.status(304).send();
            }
          }

          app.log.info(
            {
              mediaId,
              userId: request.user?.id,
              contentType,
              fileSize: contentLength,
            },
            '✅ [SecureMedia] ファイル配信成功'
          );

          // ストリームとして配信
          if (response.body) {
            // Web ReadableStreamをバッファに変換してから送信
            const buffer = await response.arrayBuffer();
            return reply.send(Buffer.from(buffer));
          } else {
            return reply.status(500).send({
              error: {
                message: 'レスポンスボディが空です',
                code: 'EMPTY_RESPONSE',
              },
            });
          }
        } catch (fetchError) {
          app.log.error(
            {
              mediaId,
              s3Key: targetS3Key,
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            },
            '❌ [SecureMedia] S3Gateway通信エラー'
          );

          return reply.status(500).send({
            error: {
              message: 'ファイルの取得中にエラーが発生しました',
              code: 'INTERNAL_ERROR',
            },
          });
        }
      } catch (error) {
        app.log.error(
          {
            mediaId,
            userId: request.user?.id,
            error: error instanceof Error ? error.message : String(error),
          },
          '❌ [SecureMedia] メディア配信エラー'
        );

        return reply.status(500).send({
          error: {
            message: 'メディア配信中にエラーが発生しました',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  );
}

/**
 * アクセス拒否理由に応じたHTTPステータスコードを取得
 */
function getStatusCodeForAccessDenial(code?: string): number {
  switch (code) {
    case 'MEDIA_NOT_FOUND':
      return 404;
    case 'AUTHENTICATION_REQUIRED':
      return 401;
    case 'PURCHASE_REQUIRED':
    case 'PURCHASE_INACTIVE':
    case 'PURCHASE_EXPIRED':
    case 'ACCESS_DENIED':
    case 'PRIVATE_POST':
      return 403;
    case 'POST_DELETED':
      return 410; // Gone
    default:
      return 403;
  }
}

/**
 * メディアタイプに応じたキャッシュ制御を取得
 */
function getCacheControlForMediaType(mediaType: string): string {
  switch (mediaType) {
    case 'AVATAR':
    case 'COVER':
      // パブリックメディアは長期キャッシュ
      return 'public, max-age=86400, s-maxage=604800'; // 1日/1週間
    case 'POST':
      // 投稿メディアは中期キャッシュ
      return 'private, max-age=3600'; // 1時間
    case 'OGP':
      // OGP画像は長期キャッシュ
      return 'public, max-age=86400, s-maxage=604800'; // 1日/1週間
    default:
      // その他は短期キャッシュ
      return 'private, max-age=300'; // 5分
  }
}
