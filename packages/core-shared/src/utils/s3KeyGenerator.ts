/**
 * 🔑 統一S3キー生成システム
 *
 * 全てのメディアタイプで一貫したS3キー生成を提供
 * 重複した実装を排除し、命名規則を統一
 */

export interface S3KeyParams {
  mediaId: string;
  filename: string;
  mediaType: string;
  variant?: string;
  userId?: string;
}

export interface S3KeyInfo {
  key: string;
  mediaType: string;
  mediaId: string;
  variant?: string;
  extension: string;
  datePrefix: string;
}

/**
 * 統一S3キー生成クラス
 * 全てのメディアアップロードで使用される単一の実装
 */
export class S3KeyGenerator {
  private static readonly DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  private static readonly VALID_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'svg',
    'mp4',
    'mov',
    'avi',
    'webm',
    'pdf',
    'doc',
    'docx',
    'txt',
  ];

  /**
   * メディアキーの生成
   *
   * 生成パターン: {mediaType}/{YYYY-MM-DD}/{mediaId}[_{variant}].{extension}
   * 例: avatar/2025-07-16/12345678-1234-1234-1234-123456789012.webp
   */
  static generateMediaKey(params: S3KeyParams): string {
    const { mediaId, filename, mediaType, variant } = params;

    // 入力値の検証
    this.validateParams(params);

    const normalizedMediaType = this.normalizeMediaType(mediaType);
    const sanitizedFilename = this.sanitizeFilename(filename);
    const datePrefix = this.getCurrentDatePrefix();
    const extension = this.extractExtension(sanitizedFilename);

    // バリアント付きキーの生成
    if (variant) {
      const normalizedVariant = this.normalizeVariant(variant);
      return `${normalizedMediaType}/${datePrefix}/${mediaId}_${normalizedVariant}.${extension}`;
    }

    // 通常のキー生成
    return `${normalizedMediaType}/${datePrefix}/${mediaId}.${extension}`;
  }

  /**
   * バリアントキーの生成
   * 既存のオリジナルキーからバリアント版を生成
   */
  static generateVariantKey(originalKey: string, variant: string): string {
    const keyInfo = this.parseS3Key(originalKey);
    if (!keyInfo) {
      throw new Error(`Invalid S3 key format: ${originalKey}`);
    }

    const normalizedVariant = this.normalizeVariant(variant);
    return `${keyInfo.mediaType}/${keyInfo.datePrefix}/${keyInfo.mediaId}_${normalizedVariant}.${keyInfo.extension}`;
  }

  /**
   * S3キーの解析
   * キーから構成要素を抽出
   */
  static parseS3Key(s3Key: string): S3KeyInfo | null {
    const parts = s3Key.split('/');
    if (parts.length !== 3) {
      return null;
    }

    const [mediaType, datePrefix, filename] = parts;

    // 日付形式の検証
    if (!this.DATE_FORMAT_REGEX.test(datePrefix)) {
      return null;
    }

    // ファイル名の解析
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return null;
    }

    const nameWithoutExt = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex + 1);

    // バリアントの検出
    const underscoreIndex = nameWithoutExt.lastIndexOf('_');
    let mediaId: string;
    let variant: string | undefined;

    if (underscoreIndex !== -1 && underscoreIndex >= 36) {
      // UUID長を考慮（36文字以上の場所にアンダースコアがある場合）
      mediaId = nameWithoutExt.substring(0, underscoreIndex);
      variant = nameWithoutExt.substring(underscoreIndex + 1);
    } else {
      mediaId = nameWithoutExt;
    }

    return {
      key: s3Key,
      mediaType,
      mediaId,
      variant,
      extension,
      datePrefix,
    };
  }

  /**
   * キーの有効性チェック
   */
  static isValidS3Key(s3Key: string): boolean {
    return this.parseS3Key(s3Key) !== null;
  }

  /**
   * 同じメディアIDの全バリアントキーを生成
   */
  static generateAllVariantKeys(originalKey: string, variants: string[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const variant of variants) {
      try {
        result[variant] = this.generateVariantKey(originalKey, variant);
      } catch (error) {
        console.warn(`Failed to generate variant key for ${variant}:`, error);
      }
    }

    return result;
  }

  /**
   * パラメータの検証
   */
  private static validateParams(params: S3KeyParams): void {
    const { mediaId, filename, mediaType } = params;

    if (!mediaId || typeof mediaId !== 'string') {
      throw new Error('mediaId is required and must be a string');
    }

    if (!filename || typeof filename !== 'string') {
      throw new Error('filename is required and must be a string');
    }

    if (!mediaType || typeof mediaType !== 'string') {
      throw new Error('mediaType is required and must be a string');
    }

    // UUID形式の簡易チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mediaId)) {
      throw new Error(`Invalid mediaId format: ${mediaId}`);
    }
  }

  /**
   * メディアタイプの正規化
   */
  static normalizeMediaType(mediaType: string): string {
    if (!mediaType || typeof mediaType !== 'string') {
      throw new Error('mediaType is required and must be a string');
    }

    const normalized = mediaType.toLowerCase().replace(/[^a-z0-9]/g, '');
    const allowedTypes = new Set(['post', 'avatar', 'cover', 'ogp']);

    if (!allowedTypes.has(normalized)) {
      throw new Error(`Unknown mediaType: ${mediaType}`);
    }

    return normalized;
  }

  /**
   * バリアント名の正規化
   */
  private static normalizeVariant(variant: string): string {
    return variant
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // 最大20文字に制限
  }

  /**
   * ファイル名のサニタイズ
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
      .substring(0, 100); // 最大100文字に制限
  }

  /**
   * 現在の日付プレフィックスを取得
   */
  private static getCurrentDatePrefix(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * ファイル拡張子の抽出
   */
  private static extractExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) {
      return 'bin'; // 拡張子がない場合のデフォルト
    }

    const extension = parts[parts.length - 1].toLowerCase();

    // 有効な拡張子かチェック
    if (this.VALID_EXTENSIONS.includes(extension)) {
      return extension;
    }

    // 画像ファイルの場合はwebpにデフォルト
    return 'webp';
  }

  /**
   * 日付プレフィックスから日付範囲でキーをフィルタリング
   */
  static filterKeysByDateRange(keys: string[], startDate: Date, endDate: Date): string[] {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return keys.filter(key => {
      const keyInfo = this.parseS3Key(key);
      if (!keyInfo) return false;

      return keyInfo.datePrefix >= startDateStr && keyInfo.datePrefix <= endDateStr;
    });
  }

  /**
   * メディアタイプでキーをフィルタリング
   */
  static filterKeysByMediaType(keys: string[], mediaType: string): string[] {
    const normalizedType = this.normalizeMediaType(mediaType);

    return keys.filter(key => {
      const keyInfo = this.parseS3Key(key);
      return keyInfo?.mediaType === normalizedType;
    });
  }
}

// 共通ラッパー関数
export function generateS3Key(params: S3KeyParams): string {
  return S3KeyGenerator.generateMediaKey(params);
}

export function generateVariantS3Key(params: {
  originalS3Key: string;
  variantType: string;
}): string {
  return S3KeyGenerator.generateVariantKey(params.originalS3Key, params.variantType);
}

// メディアタイプ正規化のスタンドアロン関数
export function normalizeMediaType(mediaType: string): string {
  return S3KeyGenerator.normalizeMediaType(mediaType);
}

// ファイル名サニタイズのスタンドアロン関数
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .substring(0, 100); // 最大100文字に制限
}

// 廃止済み関数を削除 - セキュアメディア配信システムに移行済み
// 代替: GraphQLのMediaリゾルバーを使用
// URL: http://localhost/api/media/{mediaId}

/**
 * 🔄 サーバーサイドURLをクライアントサイドURLに変換
 * GraphQLリゾルバーで使用
 */
export function convertToClientUrl(serverUrl: string): string {
  return serverUrl.replace('http://s3-gateway:8080', 'http://localhost');
}

// 廃止済み関数を削除 - セキュアメディア配信システムに移行済み
// 代替: GraphQLのMediaリゾルバーでバリアント指定
// URL: http://localhost/api/media/{mediaId}?variant={variantType}

// 便利な型定義 - 統一メディアシステム用
export type MediaType = 'POST' | 'AVATAR' | 'COVER' | 'OGP';
export type VariantType = 'THUMB' | 'MEDIUM' | 'LARGE' | 'BLUR' | 'OGP';

/**
 * よく使用されるバリアントタイプの定数
 */
export const VARIANT_TYPES = {
  THUMB: 'THUMB',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  BLUR: 'BLUR',
  OGP: 'OGP',
} as const;
