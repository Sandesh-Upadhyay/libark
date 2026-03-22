/**
 * 🔒 内部APIルート - OGP匿名配信メタデータエンドポイント
 *
 * S3 Gatewayから呼び出される内部API
 * X-Internal-Tokenヘッダーによる認証が必要
 */

import { createHash } from 'crypto';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateOnDemandSignature } from '@libark/core-server';

interface OgpMetaParams {
  mediaId: string;
}

interface OgpMetaResponse {
  bucket: string;
  ogpKey: string;
  salt: string;
  contentHash: string;
  contentType: string;
  ext: string;
  variant: string;
}

/**
 * オンデマンドOGPバリアントタイプ
 */
type OnDemandVariant = 'standard' | 'teaser';

/**
 * オンデマンドOGPステータス
 */
type OnDemandStatus = 'READY' | 'MISSING';

/**
 * オンデマンドOGPメタデータ
 */
interface OnDemandMeta {
  contentHash: string;
  ogpKey: string;
  sig: string;
  ext: string;
  contentType: string;
  variant: OnDemandVariant;
  status: OnDemandStatus;
  postId?: string;
  mediaId: string;
  isPaid: boolean;
}

/**
 * オンデマンドOGPメタデータ（両バリアント含む）
 */
interface OnDemandMetaWithVariants {
  standard: OnDemandMeta;
  teaser: OnDemandMeta;
}

/**
 * 拡張されたOGPメタデータレスポンス（後方互換）
 */
interface ExtendedOgpMetaResponse {
  bucket?: string;
  ogpKey?: string;
  salt?: string;
  contentHash?: string;
  contentType?: string;
  ext?: string;
  variant?: string;
  onDemand: OnDemandMetaWithVariants;
}

/**
 * オンデマンドOGPバージョン（将来のテンプレ変更で強制更新できるように）
 */
const ON_DEMAND_OGP_VERSION = 'v1';

/**
 * 決定論的なコンテンツハッシュを生成
 *
 * @param inputs - ハッシュ生成の入力値
 * @returns 64文字のhexハッシュ
 */
function generateDeterministicContentHash(inputs: {
  postId?: string;
  mediaId: string;
  postUpdatedAt?: Date | null;
  mediaUpdatedAt: Date;
  variant: OnDemandVariant;
}): string {
  const { postId, mediaId, postUpdatedAt, mediaUpdatedAt, variant } = inputs;

  // postIdがない場合（avatar/cover等）はmediaIdをベースにする
  const baseId = postId || mediaId;
  const updatedAt = postUpdatedAt || mediaUpdatedAt;

  // タイムスタンプをISO文字列に変換して一貫性を確保
  const updatedAtStr = updatedAt.toISOString();

  // ハッシュの材料を結合
  const data = `${ON_DEMAND_OGP_VERSION}:${baseId}:${mediaId}:${updatedAtStr}:${variant}`;

  // SHA256で64文字のhexハッシュを生成
  return createHash('sha256').update(data).digest('hex');
}

/**
 * オンデマンドOGPのogpKeyを生成
 *
 * @param mediaId - メディアID
 * @param variant - バリアント
 * @param contentHash - コンテンツハッシュ
 * @returns S3保存先キー
 */
function generateOnDemandOgpKey(
  mediaId: string,
  variant: OnDemandVariant,
  contentHash: string
): string {
  return `ogp/ondemand/${mediaId}/${variant}/${contentHash}.jpg`;
}

/**
 * オンデマンドOGPメタデータを生成
 *
 * @param media - Mediaレコード
 * @param variant - バリアント
 * @param signingKey - 署名キー
 * @returns オンデマンドOGPメタデータ
 */
function generateOnDemandMeta(
  media: {
    id: string;
    postId?: string | null;
    updatedAt: Date;
    post?: { updatedAt?: Date | null } | null;
  },
  variant: OnDemandVariant,
  signingKey: string
): OnDemandMeta {
  const { id: mediaId, postId, updatedAt: mediaUpdatedAt, post } = media;
  const postUpdatedAt = post?.updatedAt || null;

  // 決定論的なコンテンツハッシュを生成
  const contentHash = generateDeterministicContentHash({
    postId: postId || undefined,
    mediaId,
    postUpdatedAt,
    mediaUpdatedAt,
    variant,
  });

  // ogpKeyを生成
  const ogpKey = generateOnDemandOgpKey(mediaId, variant, contentHash);

  // 拡張子とコンテンツタイプは固定
  const ext = 'jpg';
  const contentType = 'image/jpeg';

  // 署名を生成（期限なし）
  const sig = generateOnDemandSignature(mediaId, variant, contentHash, ext, signingKey);

  return {
    contentHash,
    ogpKey,
    sig,
    ext,
    contentType,
    variant,
    status: 'MISSING', // デフォルトはMISSING、後で判定
    postId: postId || undefined,
    mediaId,
    isPaid: false, // デフォルトはfalse、後で判定
  };
}

export async function internalOgpRoutes(app: FastifyInstance) {
  const INTERNAL_API_TOKEN = process.env.OGP_INTERNAL_API_TOKEN;
  const OGP_SIGNING_KEY = process.env.OGP_SIGNING_KEY;

  if (!INTERNAL_API_TOKEN) {
    app.log.warn('⚠️ OGP_INTERNAL_API_TOKENが設定されていません');
  }

  if (!OGP_SIGNING_KEY) {
    app.log.warn('⚠️ OGP_SIGNING_KEYが設定されていません');
  }

  /**
   * OGPメタデータ取得エンドポイント
   * GET /internal/ogp-meta/:mediaId
   */
  app.get<{ Params: OgpMetaParams }>(
    '/internal/ogp-meta/:mediaId',
    async (request: FastifyRequest<{ Params: OgpMetaParams }>, reply: FastifyReply) => {
      const { mediaId } = request.params;

      // 内部APIトークン認証
      const providedToken = request.headers['x-internal-token'] as string;
      if (!providedToken || providedToken !== INTERNAL_API_TOKEN) {
        app.log.warn(
          {
            mediaId,
            hasToken: !!providedToken,
          },
          '🚫 [InternalOGP] 認証失敗'
        );
        return reply.status(401).send({
          error: {
            message: '認証が必要です',
            code: 'UNAUTHORIZED',
          },
        });
      }

      try {
        // Prisma クライアントが初期化されているか確認
        if (!app.prisma) {
          app.log.error('❌ [InternalOGP] Prismaクライアントが初期化されていません');
          return reply.status(404).send({
            error: {
              message: 'OGPメタデータが見つかりません',
              code: 'META_NOT_FOUND',
            },
          });
        }

        app.log.info(
          {
            mediaId,
          },
          '🔍 [InternalOGP] OGPメタデータ取得リクエスト'
        );

        // Mediaレコードを取得（postIdとupdatedAtを含める）
        const media = await app.prisma.media.findUnique({
          where: { id: mediaId },
          include: { post: { select: { id: true, updatedAt: true, visibility: true } } },
        });

        if (!media) {
          app.log.warn(
            {
              mediaId,
            },
            '🚫 [InternalOGP] Mediaが見つかりません'
          );
          return reply.status(404).send({
            error: {
              message: 'メディアが見つかりません',
              code: 'MEDIA_NOT_FOUND',
            },
          });
        }

        // 既存のOgpPublicMediaを取得
        const ogpPublicMedia = await app.prisma.ogpPublicMedia.findFirst({
          where: { mediaId },
        });

        // 既存レスポンス（後方互換）
        const baseResponse: OgpMetaResponse | null = ogpPublicMedia
          ? {
              bucket: ogpPublicMedia.bucket,
              ogpKey: ogpPublicMedia.ogpKey,
              salt: ogpPublicMedia.salt,
              contentHash: ogpPublicMedia.contentHash,
              contentType: ogpPublicMedia.contentType,
              ext: ogpPublicMedia.ext,
              variant: ogpPublicMedia.variant,
            }
          : null;

        // Postが存在する場合は明示的に再度取得してPrismaのリレーションキャッシュを回避
        let postVisibility: string | null = null;
        if (media.postId) {
          const post = await app.prisma.post.findUnique({
            where: { id: media.postId },
            select: { visibility: true },
          });
          postVisibility = post?.visibility ?? null;
        }

        const signingKey = OGP_SIGNING_KEY || '';
        const isPaid = postVisibility === 'PAID';

        // デバッグ: media.postの状態をログに出力
        app.log.info(
          {
            mediaId,
            postId: media.postId,
            hasPost: !!media.post,
            postVisibilityFromRelation: media.post?.visibility,
            postVisibilityFromQuery: postVisibility,
            isPaid,
          },
          '🔍 [InternalOGP] media.post state'
        );

        const onDemandStandard = generateOnDemandMeta(
          { id: media.id, postId: media.postId, updatedAt: media.updatedAt, post: media.post },
          'standard',
          signingKey
        );
        onDemandStandard.isPaid = isPaid;

        const onDemandTeaser = generateOnDemandMeta(
          { id: media.id, postId: media.postId, updatedAt: media.updatedAt, post: media.post },
          'teaser',
          signingKey
        );
        onDemandTeaser.isPaid = isPaid;

        // ステータス判定（DBに同一contentHashのOGPレコードがあるか確認）
        const existingStandard = await app.prisma.ogpPublicMedia.findFirst({
          where: {
            mediaId,
            variant: 'standard',
            contentHash: onDemandStandard.contentHash,
          },
        });

        const existingTeaser = await app.prisma.ogpPublicMedia.findFirst({
          where: {
            mediaId,
            variant: 'teaser',
            contentHash: onDemandTeaser.contentHash,
          },
        });

        onDemandStandard.status = existingStandard ? 'READY' : 'MISSING';
        onDemandTeaser.status = existingTeaser ? 'READY' : 'MISSING';

        // 既存のOgpPublicMediaがない場合、404ではなく200でonDemandメタを返す
        if (!ogpPublicMedia) {
          const response: ExtendedOgpMetaResponse = {
            bucket: '',
            ogpKey: '',
            salt: '',
            contentHash: '',
            contentType: '',
            ext: '',
            variant: '',
            onDemand: {
              standard: onDemandStandard,
              teaser: onDemandTeaser,
            },
          };

          app.log.info(
            {
              mediaId,
              onDemandStandard: {
                contentHash: onDemandStandard.contentHash,
                status: onDemandStandard.status,
              },
              onDemandTeaser: {
                contentHash: onDemandTeaser.contentHash,
                status: onDemandTeaser.status,
              },
            },
            '✅ [InternalOGP] オンデマンドOGPメタデータ取得成功（既存OGPなし）'
          );

          return reply.send(response);
        }

        // 既存のOgpPublicMediaがある場合、後方互換を保ちつつonDemandメタを追加
        const response: ExtendedOgpMetaResponse = {
          ...baseResponse,
          onDemand: {
            standard: onDemandStandard,
            teaser: onDemandTeaser,
          },
        };

        app.log.info(
          {
            mediaId,
            bucket: response.bucket,
            ogpKey: response.ogpKey,
            variant: response.variant,
            onDemandStandard: {
              contentHash: onDemandStandard.contentHash,
              status: onDemandStandard.status,
            },
            onDemandTeaser: {
              contentHash: onDemandTeaser.contentHash,
              status: onDemandTeaser.status,
            },
          },
          '✅ [InternalOGP] OGPメタデータ取得成功（既存OGPあり）'
        );

        return reply.send(response);
      } catch (error) {
        app.log.error(
          {
            mediaId,
            error: error instanceof Error ? error.message : String(error),
          },
          '❌ [InternalOGP] OGPメタデータ取得エラー'
        );

        return reply.status(404).send({
          error: {
            message: 'OGPメタデータが見つかりません',
            code: 'META_NOT_FOUND',
          },
        });
      }
    }
  );
}
