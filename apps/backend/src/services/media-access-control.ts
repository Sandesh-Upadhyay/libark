/**
 * 🔐 メディアアクセス制御サービス
 *
 * 購入状態に基づいたメディアアクセス制御を提供
 */

import type { PrismaClient } from '@libark/db';
import type { FastifyBaseLogger } from 'fastify';

export interface MediaAccessResult {
  allowed: boolean;
  reason?: string;
  code?: string;
}

export interface MediaAccessContext {
  userId?: string;
  mediaId: string;
  userRole?: string;
  variant?: string; // バリアント指定（BLUR、OGPなど）
}

export class MediaAccessControlService {
  constructor(
    private prisma: PrismaClient,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * メディアアクセス権限をチェック
   */
  async checkAccess(context: MediaAccessContext): Promise<MediaAccessResult> {
    try {
      this.logger.info(
        {
          userId: context.userId,
          mediaId: context.mediaId,
        },
        '🔍 [MediaAccess] アクセス権限チェック開始'
      );

      // メディア情報を取得
      const media = await this.prisma.media.findUnique({
        where: { id: context.mediaId },
        include: {
          user: {
            select: { id: true, username: true },
          },
          post: {
            select: {
              id: true,
              userId: true,
              price: true,
              visibility: true,
              isDeleted: true,
            },
          },
        },
      });

      if (!media) {
        return {
          allowed: false,
          reason: 'メディアが見つかりません',
          code: 'MEDIA_NOT_FOUND',
        };
      }

      // 削除されたメディアへのアクセス拒否
      if (media.post?.isDeleted) {
        return {
          allowed: false,
          reason: '削除された投稿のメディアです',
          code: 'POST_DELETED',
        };
      }

      // 管理者は全てのメディアにアクセス可能（権限ベースチェック）
      if (context.userId) {
        const hasAdminPermission = await this.prisma.userPermissionOverride.findFirst({
          where: {
            userId: context.userId,
            permission: { name: { in: ['ADMIN_PANEL', 'MANAGE_USERS'] } },
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });

        if (hasAdminPermission) {
          this.logger.info(
            {
              userId: context.userId,
              mediaId: context.mediaId,
            },
            '✅ [MediaAccess] 管理者アクセス許可'
          );
          return { allowed: true };
        }
      }

      // メディア所有者は自分のメディアにアクセス可能
      if (context.userId && media.userId === context.userId) {
        this.logger.info(
          {
            userId: context.userId,
            mediaId: context.mediaId,
          },
          '✅ [MediaAccess] 所有者アクセス許可'
        );
        return { allowed: true };
      }

      // パブリックアクセス可能なメディアタイプとバリアントのチェック
      const isPublicMediaType =
        media.type === 'AVATAR' || media.type === 'COVER' || media.type === 'OGP';
      const isPublicVariant = context.variant === 'BLUR' || context.variant === 'OGP';

      if (isPublicMediaType || isPublicVariant) {
        this.logger.info(
          {
            userId: context.userId,
            mediaId: context.mediaId,
            mediaType: media.type,
            variant: context.variant,
          },
          '✅ [MediaAccess] パブリックメディア/バリアントアクセス許可'
        );
        return { allowed: true };
      }

      // 投稿に関連付けられていないメディア（アバター、カバー画像など）
      if (!media.post) {
        // その他のメディアは所有者のみ
        return {
          allowed: false,
          reason: 'アクセス権限がありません',
          code: 'ACCESS_DENIED',
          // このエラーコードはクライアント側で処理分岐に使われる可能性がある
        };
      }

      // 投稿の可視性チェック
      if (media.post.visibility === 'PRIVATE') {
        return {
          allowed: false,
          reason: 'プライベート投稿のメディアです',
          code: 'PRIVATE_POST',
        };
      }

      // 無料投稿のメディアは誰でもアクセス可能（priceがnullまたは0の場合）
      if (!media.post.price || media.post.price.equals(0)) {
        return { allowed: true };
      }

      // 有料投稿の場合、ログインが必要
      if (!context.userId) {
        return {
          allowed: false,
          reason: '有料コンテンツにアクセスするには認証が必要です',
          code: 'AUTHENTICATION_REQUIRED',
        };
      }

      // 投稿作成者は自分の有料投稿にアクセス可能
      if (media.post.userId === context.userId) {
        return { allowed: true };
      }

      // 購入状態をチェック
      const purchase = await this.prisma.postPurchase.findUnique({
        where: {
          userId_postId: {
            userId: context.userId,
            postId: media.post.id,
          },
        },
      });

      if (!purchase) {
        return {
          allowed: false,
          reason: 'この有料コンテンツを購入していません',
          code: 'PURCHASE_REQUIRED',
        };
      }

      // 購入が無効化されている場合
      if (!purchase.isActive) {
        return {
          allowed: false,
          reason: '購入が無効化されています',
          code: 'PURCHASE_INACTIVE',
        };
      }

      // 有効期限チェック
      if (purchase.expiresAt && purchase.expiresAt < new Date()) {
        return {
          allowed: false,
          reason: '購入の有効期限が切れています',
          code: 'PURCHASE_EXPIRED',
        };
      }

      this.logger.info(
        {
          userId: context.userId,
          mediaId: context.mediaId,
          postId: media.post.id,
          purchaseId: purchase.id,
        },
        '✅ [MediaAccess] 購入済みアクセス許可'
      );

      return { allowed: true };
    } catch (error) {
      this.logger.error(
        {
          userId: context.userId,
          mediaId: context.mediaId,
          error: error instanceof Error ? error.message : String(error),
        },
        '❌ [MediaAccess] アクセス権限チェックエラー'
      );

      return {
        allowed: false,
        reason: 'アクセス権限の確認中にエラーが発生しました',
        code: 'ACCESS_CHECK_ERROR',
      };
    }
  }

  /**
   * 複数メディアの一括アクセス権限チェック
   */
  async checkBatchAccess(
    mediaIds: string[],
    context: Omit<MediaAccessContext, 'mediaId'>
  ): Promise<Record<string, MediaAccessResult>> {
    const results: Record<string, MediaAccessResult> = {};

    for (const mediaId of mediaIds) {
      results[mediaId] = await this.checkAccess({
        ...context,
        mediaId,
      });
    }

    return results;
  }
}

/**
 * サービスインスタンス作成ヘルパー
 */
export function createMediaAccessControlService(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): MediaAccessControlService {
  return new MediaAccessControlService(prisma, logger);
}
