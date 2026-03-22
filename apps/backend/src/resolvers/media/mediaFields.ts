/**
 * 📷 メディアフィールドリゾルバー
 *
 * Media型のフィールドリゾルバー（URL生成やリレーション）
 */

import { generateMediaUrl, generateThumbnailUrl } from '@libark/core-shared';
import { generateSignature } from '@libark/core-server';

import type { GraphQLContext } from '../../graphql/context.js';

export const mediaFields = {
  /**
   * セキュアメディア配信エンドポイント経由でのURL生成（認証・購入状態チェック付き）
   */
  url: (parent: any) => {
    if (!parent.id) return null;

    // 🔐 環境に応じたセキュアメディア配信エンドポイントを使用
    return generateMediaUrl(parent.id);
  },

  /**
   * サムネイルURL（POST_THUMBバリアントを使用）
   */
  thumbnailUrl: async (parent: any, _args: any, context: GraphQLContext) => {
    // サムネイルバリアントを取得
    const thumbVariant = await context.prisma.mediaVariant.findFirst({
      where: {
        mediaId: parent.id,
        type: 'THUMB',
      },
    });

    if (!thumbVariant) {
      // アバター画像の場合、オリジナル画像をサムネイルとして使用
      if (parent.s3Key?.includes('avatar')) {
        // 🔐 環境に応じたセキュアメディア配信エンドポイントを使用
        return generateMediaUrl(parent.id);
      }
      return null;
    }

    // 🔐 バリアント用のセキュアメディア配信エンドポイントを使用
    return generateThumbnailUrl(parent.id);
  },

  /**
   * バリアント一覧（空の場合は空配列を返す）
   */
  variants: async (parent: any, _args: any, context: GraphQLContext) => {
    return await context.prisma.mediaVariant.findMany({
      where: { mediaId: parent.id },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * メディア所有者
   */
  user: async (parent: any, _args: any, context: GraphQLContext) => {
    return await context.prisma.user.findUnique({
      where: { id: parent.userId },
    });
  },

  /**
   * 関連投稿
   */
  post: async (parent: any, _args: any, context: GraphQLContext) => {
    if (!parent.postId) return null;
    return await context.prisma.post.findUnique({
      where: { id: parent.postId },
    });
  },

  /**
   * OGP署名付きURLを生成
   * @param variant - OGPバリアントタイプ（デフォルト: "summary"）
   * @returns 署名付きOGP URL
   */
  ogpUrl: async (
    parent: any,
    args: { variant?: string },
    context: GraphQLContext
  ): Promise<string | null> => {
    const { variant = 'summary' } = args;

    // 🚩 フィーチャーフラグチェック（デフォルト: 有効）
    const ogpEnabled = process.env.OGP_ENABLED !== 'false';
    if (!ogpEnabled) {
      context.fastify?.log.warn('⚠️ [OGP] OGP匿名配信機能は無効化されています');
      return null;
    }

    if (!parent.id) {
      return null;
    }

    try {
      // OgpPublicMediaを取得
      const ogpPublicMedia = await context.prisma.ogpPublicMedia.findUnique({
        where: {
          mediaId_variant: {
            mediaId: parent.id,
            variant: variant.toUpperCase(),
          },
        },
      });

      if (!ogpPublicMedia) {
        context.fastify?.log.warn({
          mediaId: parent.id,
          variant,
        }, '🚫 [OGP] OGPメタデータが見つかりません');
        return null;
      }

      // 環境変数から署名キーと有効期限を取得
      const signingKey = process.env.OGP_SIGNING_KEY;
      const expiresIn = parseInt(process.env.OGP_SIGNATURE_EXPIRES_IN || '1209600', 10); // デフォルト14日

      if (!signingKey) {
        context.fastify?.log.error('❌ [OGP] OGP_SIGNING_KEYが設定されていません');
        return null;
      }

      // 有効期限を計算
      const now = Math.floor(Date.now() / 1000);
      const exp = now + expiresIn;

      // パスを生成（形式: /ogp/{mediaId}/{variant}/{hash}.{ext}）
      const path = `/ogp/${parent.id}/${variant}/${ogpPublicMedia.contentHash}.${ogpPublicMedia.ext}`;

      // 署名を生成
      const signature = generateSignature(path, ogpPublicMedia.salt, exp, signingKey);

      // クエリパラメータを構築
      const queryParams = new URLSearchParams({
        exp: exp.toString(),
        sig: signature,
      });

      // PUBLIC_URLから完全なURLを生成
      const publicUrl = process.env.PUBLIC_URL || 'http://localhost:8000';
      const fullUrl = `${publicUrl}${path}?${queryParams.toString()}`;

      context.fastify?.log.info({
        mediaId: parent.id,
        variant,
        path,
        exp,
      }, '✅ [OGP] OGP URL生成成功');

      return fullUrl;
    } catch (error) {
      context.fastify?.log.error({
        mediaId: parent.id,
        variant,
        error: error instanceof Error ? error.message : String(error),
      }, '❌ [OGP] OGP URL生成エラー');
      return null;
    }
  },

  /**
   * 複数のOGPバリアントURLを生成
   * @returns OGPバリアントURLのオブジェクト
   */
  ogpUrls: async (
    parent: any,
    _args: any,
    context: GraphQLContext
  ): Promise<{ summary?: string; large?: string }> => {
    // 🚩 フィーチャーフラグチェック（デフォルト: 有効）
    const ogpEnabled = process.env.OGP_ENABLED !== 'false';
    if (!ogpEnabled) {
      context.fastify?.log.warn('⚠️ [OGP] OGP匿名配信機能は無効化されています');
      return {};
    }

    if (!parent.id) {
      return {};
    }

    try {
      // すべてのOGPバリアントを取得
      const ogpPublicMedias = await context.prisma.ogpPublicMedia.findMany({
        where: {
          mediaId: parent.id,
        },
      });

      if (!ogpPublicMedias || ogpPublicMedias.length === 0) {
        return {};
      }

      // 環境変数から署名キーと有効期限を取得
      const signingKey = process.env.OGP_SIGNING_KEY;
      const expiresIn = parseInt(process.env.OGP_SIGNATURE_EXPIRES_IN || '1209600', 10); // デフォルト14日

      if (!signingKey) {
        context.fastify?.log.error('❌ [OGP] OGP_SIGNING_KEYが設定されていません');
        return {};
      }

      // 有効期限を計算
      const now = Math.floor(Date.now() / 1000);
      const exp = now + expiresIn;

      // 各バリアントのURLを生成
      const urls: { summary?: string; large?: string } = {};
      const publicUrl = process.env.PUBLIC_URL || 'http://localhost:8000';

      for (const ogpMedia of ogpPublicMedias) {
        const variant = ogpMedia.variant.toLowerCase();

        // パスを生成（形式: /ogp/{mediaId}/{variant}/{hash}.{ext}）
        const path = `/ogp/${parent.id}/${variant}/${ogpMedia.contentHash}.${ogpMedia.ext}`;

        // 署名を生成
        const signature = generateSignature(path, ogpMedia.salt, exp, signingKey);

        // クエリパラメータを構築
        const queryParams = new URLSearchParams({
          exp: exp.toString(),
          sig: signature,
        });

        // 完全なURLを生成
        urls[variant as 'summary' | 'large'] = `${publicUrl}${path}?${queryParams.toString()}`;
      }

      return urls;
    } catch (error) {
      context.fastify?.log.error({
        mediaId: parent.id,
        error: error instanceof Error ? error.message : String(error),
      }, '❌ [OGP] OGP URLs生成エラー');
      return {};
    }
  },
};
