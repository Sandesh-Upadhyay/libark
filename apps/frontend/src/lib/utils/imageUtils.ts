/**
 * 🎯 画像関連ユーティリティ関数
 *
 * 画像ソースの判定や処理に関する統一されたユーティリティ
 */

/**
 * 画像ソースのタイプ定義
 */
export type ImageSourceType = 'media' | 'url' | 'none';

/**
 * UUID形式の正規表現（RFC 4122準拠）
 * より厳密なUUID判定を行う
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 画像ソースのタイプを判定する
 *
 * @param src - 画像ソース文字列
 * @returns ImageSourceType - "media" | "url" | "none"
 */
export const detectImageSourceType = (src?: string | null): ImageSourceType => {
  // 空またはnullの場合
  if (!src || typeof src !== 'string' || src.trim().length === 0) {
    return 'none';
  }

  const trimmedSrc = src.trim();

  // UUID形式の判定（メディアID）
  if (UUID_REGEX.test(trimmedSrc)) {
    return 'media';
  }

  // URL形式の判定
  try {
    const url = new URL(trimmedSrc);
    // httpまたはhttpsプロトコルのみ許可
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return 'url';
    }
    return 'none';
  } catch {
    // URL形式でない場合
    return 'none';
  }
};

/**
 * メディアIDかどうかを判定する
 *
 * @param src - 画像ソース文字列
 * @returns boolean - メディアIDの場合true
 */
export const isMediaId = (src?: string | null): boolean => {
  return detectImageSourceType(src) === 'media';
};

/**
 * 外部URLかどうかを判定する
 *
 * @param src - 画像ソース文字列
 * @returns boolean - 外部URLの場合true
 */
export const isExternalUrl = (src?: string | null): boolean => {
  return detectImageSourceType(src) === 'url';
};

/**
 * 有効な画像ソースかどうかを判定する
 *
 * @param src - 画像ソース文字列
 * @returns boolean - 有効な画像ソースの場合true
 */
export const hasValidImageSource = (src?: string | null): boolean => {
  const type = detectImageSourceType(src);
  return type === 'media' || type === 'url';
};

/**
 * フォールバック文字を生成する
 *
 * @param displayName - 表示名
 * @param username - ユーザー名
 * @param fallback - デフォルトフォールバック文字
 * @returns string - フォールバック文字（大文字）
 */
export const generateFallbackText = (
  displayName?: string | null,
  username?: string | null,
  fallback: string = '?'
): string => {
  const name = displayName || username || '';
  const firstChar = name.trim().charAt(0);
  return firstChar ? firstChar.toUpperCase() : fallback.toUpperCase();
};

/**
 * alt属性用のテキストを生成する
 *
 * @param displayName - 表示名
 * @param username - ユーザー名
 * @param customAlt - カスタムalt文字列
 * @returns string - alt属性用テキスト
 */
export const generateAltText = (
  displayName?: string | null,
  username?: string | null,
  customAlt?: string
): string => {
  if (customAlt) return customAlt;

  const name = displayName || username;
  if (name) {
    return `${name}のアバター`;
  }

  return 'ユーザーアバター';
};

/**
 * 🎯 統一URL生成ユーティリティ
 *
 * 全ての画像タイプに対応した統一されたURL生成ロジック
 */

/**
 * バリアント型定義
 */
export type ImageVariant = 'thumb' | 'main' | 'medium' | 'large' | 'high' | 'blur' | 'webp';

/**
 * 画像ソース型定義（統一版）
 */
export type UnifiedImageSource =
  | { type: 'media'; mediaId: string; variant?: ImageVariant }
  | { type: 'url'; url: string }
  | { type: 'blob'; url: string }
  | { type: 'fallback'; fallbackType: 'avatar' | 'cover' | 'post' | 'default' };

/**
 * 統一画像URL生成関数
 *
 * @param source - 画像ソース
 * @returns string | null - 生成されたURL、またはnull
 */
export const generateUnifiedImageUrl = (source: UnifiedImageSource): string | null => {
  switch (source.type) {
    case 'media': {
      // 統一メディアURL生成システムを使用（環境変数対応）
      const isProduction =
        typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      const baseUrl = isProduction
        ? 'https://libark.io'
        : typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost';
      const mediaUrl = `${baseUrl}/api/media/${source.mediaId}`;
      return source.variant ? `${mediaUrl}?variant=${source.variant.toUpperCase()}` : mediaUrl;
    }

    case 'url': {
      // 外部URLはそのまま（/api/media を付与しない）
      return source.url;
    }

    case 'blob':
      // Blob URL（検証済み）
      return source.url.startsWith('blob:') ? source.url : null;

    case 'fallback':
      // フォールバック処理は別関数で処理
      return null;

    default:
      return null;
  }
};

/**
 * 画像ソースからUnifiedImageSourceを生成
 *
 * @param src - 画像ソース文字列
 * @param variant - バリアント（メディアIDの場合）
 * @returns UnifiedImageSource
 */
export const createUnifiedImageSource = (
  src?: string | null,
  variant?: ImageVariant
): UnifiedImageSource => {
  const sourceType = detectImageSourceType(src);

  switch (sourceType) {
    case 'media':
      return { type: 'media', mediaId: src!, variant };
    case 'url':
      return { type: 'url', url: src! };
    case 'none':
    default:
      if (src?.startsWith('blob:')) {
        return { type: 'blob', url: src };
      }
      return { type: 'fallback', fallbackType: 'default' };
  }
};

/**
 * 🎯 統一フォールバック処理
 */

/**
 * フォールバック設定型
 */
export interface FallbackConfig {
  type: 'avatar' | 'cover' | 'post' | 'default';
  displayName?: string | null;
  username?: string | null;
  customMessage?: string;
  showIcon?: boolean;
}

/**
 * フォールバック内容を生成
 *
 * @param config - フォールバック設定
 * @returns フォールバック内容
 */
export const generateFallbackContent = (config: FallbackConfig) => {
  switch (config.type) {
    case 'avatar':
      return {
        type: 'text' as const,
        content: generateFallbackText(config.displayName, config.username),
        className: 'bg-muted text-muted-foreground',
        message: config.customMessage || 'アバター画像なし',
      };

    case 'cover':
      return {
        type: 'gradient' as const,
        content: null,
        className: 'bg-gradient-to-r from-primary/20 to-primary/10',
        message: config.customMessage || 'カバー画像なし',
      };

    case 'post':
      return {
        type: 'placeholder' as const,
        content: null,
        className: 'bg-muted',
        message: config.customMessage || '画像を読み込めませんでした',
      };

    case 'default':
    default:
      return {
        type: 'placeholder' as const,
        content: null,
        className: 'bg-gray-100',
        message: config.customMessage || '画像なし',
      };
  }
};
