/**
 * 🎯 メディアバリアントフィールドリゾルバー
 *
 * MediaVariant型のフィールドリゾルバー（URL生成やリレーション）
 */

import type { GraphQLContext } from '../../graphql/context.js';

export const mediaVariantFields = {
  /**
   * バリアントのURL（セキュアメディア配信エンドポイント経由）
   */
  url: (parent: any) => {
    if (!parent.mediaId || !parent.type) return null;
    // 🔐 バリアント用のセキュアメディア配信エンドポイントを使用
    return `http://localhost/api/media/${parent.mediaId}?variant=${parent.type}`;
  },

  /**
   * 関連メディア
   */
  media: async (parent: any, _args: any, context: GraphQLContext) => {
    return await context.prisma.media.findUnique({
      where: { id: parent.mediaId },
    });
  },
};
