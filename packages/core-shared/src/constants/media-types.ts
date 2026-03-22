/**
 * 🎯 メディアタイプ定数
 *
 * 全システムで統一されたメディアタイプ管理
 * アップロード、処理、表示で一貫性を保つ
 */

/**
 * メディアタイプ列挙（シンプル命名）
 */
export const MEDIA_TYPES = {
  POST: 'POST',
  AVATAR: 'AVATAR',
  COVER: 'COVER',
  OGP: 'OGP',
} as const;

/**
 * メディアタイプの型定義
 */
export type MediaTypeConstant = (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES];

/**
 * ワーカー処理用メタデータタイプ
 */
export const WORKER_METADATA_TYPES = {
  AVATAR: 'avatar',
  MEDIA: 'media',
} as const;

export type WorkerMetadataType = (typeof WORKER_METADATA_TYPES)[keyof typeof WORKER_METADATA_TYPES];

/**
 * メディアタイプとワーカーメタデータタイプのマッピング（v4.0対応）
 */
export const MEDIA_TYPE_TO_WORKER_METADATA: Record<MediaTypeConstant, WorkerMetadataType> = {
  [MEDIA_TYPES.POST]: WORKER_METADATA_TYPES.MEDIA,
  [MEDIA_TYPES.AVATAR]: WORKER_METADATA_TYPES.AVATAR,
  [MEDIA_TYPES.COVER]: WORKER_METADATA_TYPES.AVATAR,
  [MEDIA_TYPES.OGP]: WORKER_METADATA_TYPES.MEDIA,
};

/**
 * アバター系メディアタイプの判定
 */
export function isAvatarType(mediaType: MediaTypeConstant): boolean {
  return mediaType === MEDIA_TYPES.AVATAR || mediaType === MEDIA_TYPES.COVER;
}

/**
 * 投稿系メディアタイプの判定（v4.0対応）
 */
export function isPostType(mediaType: MediaTypeConstant): boolean {
  return mediaType === MEDIA_TYPES.POST;
}

/**
 * メディアタイプに応じたフォルダパス生成
 */
export function getMediaFolderPath(mediaType: MediaTypeConstant): string {
  switch (mediaType) {
    case MEDIA_TYPES.POST:
      return 'post';
    case MEDIA_TYPES.AVATAR:
      return 'avatar';
    case MEDIA_TYPES.COVER:
      return 'cover';
    case MEDIA_TYPES.OGP:
      return 'ogp';
  }
}

/**
 * メディアタイプに応じた処理優先度
 */
export function getMediaProcessingPriority(mediaType: MediaTypeConstant): number {
  switch (mediaType) {
    case MEDIA_TYPES.AVATAR:
    case MEDIA_TYPES.COVER:
      return 1; // 最高優先度（プロフィール関連）
    case MEDIA_TYPES.POST:
      return 2; // 高優先度（投稿関連）
    case MEDIA_TYPES.OGP:
      return 3; // 低優先度（OGP生成）
    default:
      return 4; // 通常優先度
  }
}

/**
 * メディアタイプに応じたワーカーメタデータ生成
 */
export function createWorkerMetadata(
  mediaType: MediaTypeConstant,
  userId: string,
  originalFilename: string,
  additionalData?: Record<string, unknown>
) {
  const baseMetadata = {
    type: MEDIA_TYPE_TO_WORKER_METADATA[mediaType],
    userId,
    originalFilename,
    mediaType,
    ...additionalData,
  };

  // アバター系の場合は追加情報
  if (isAvatarType(mediaType)) {
    return {
      ...baseMetadata,
      type: 'avatar' as const,
    };
  }

  // 投稿系の場合は追加情報
  if (isPostType(mediaType)) {
    return {
      ...baseMetadata,
      type: 'media' as const,
    };
  }

  return baseMetadata;
}
