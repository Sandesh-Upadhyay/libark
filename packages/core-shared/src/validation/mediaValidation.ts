/**
 * 🎯 統一メディアバリデーションシステム
 *
 * 全てのメディアアップロードで使用する単一のバリデーションロジック
 * フロントエンド、バックエンド、S3ゲートウェイ間での重複を排除
 */

export interface MediaTypeConfig {
  maxFileSize: number;
  allowedTypes: string[];
  maxFiles: number;
  allowMultiple: boolean;
  description: string;
}

/**
 * メディアタイプ別設定
 * 全てのアップロード処理で参照される単一の設定源
 */
export const MEDIA_TYPE_CONFIGS: Record<string, MediaTypeConfig> = {
  POST: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 4,
    allowMultiple: true,
    description: '投稿画像',
  },
  AVATAR: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1,
    allowMultiple: false,
    description: 'アバター画像',
  },
  COVER: {
    maxFileSize: 8 * 1024 * 1024, // 8MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1,
    allowMultiple: false,
    description: 'カバー画像',
  },
  OGP: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1,
    allowMultiple: false,
    description: 'OGP画像',
  },
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * 統一メディアバリデーター
 * 全てのメディアタイプに対応した統一バリデーションロジック
 */
export class MediaValidator {
  /**
   * 単一ファイルのバリデーション
   */
  static validateFile(file: File, mediaType: string): ValidationResult {
    const config = MEDIA_TYPE_CONFIGS[mediaType];
    if (!config) {
      return {
        isValid: false,
        error: `未知のメディアタイプです: ${mediaType}`,
        code: 'UNKNOWN_MEDIA_TYPE',
        details: { mediaType, availableTypes: Object.keys(MEDIA_TYPE_CONFIGS) },
      };
    }

    // ファイルサイズチェック
    if (file.size > config.maxFileSize) {
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます。最大サイズ: ${this.formatFileSize(config.maxFileSize)}`,
        code: 'FILE_TOO_LARGE',
        details: {
          fileSize: file.size,
          maxFileSize: config.maxFileSize,
          fileName: file.name,
        },
      };
    }

    // ファイルタイプチェック
    if (!config.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `サポートされていないファイル形式です: ${file.type}。許可されている形式: ${config.allowedTypes.join(', ')}`,
        code: 'UNSUPPORTED_FILE_TYPE',
        details: {
          fileType: file.type,
          allowedTypes: config.allowedTypes,
          fileName: file.name,
        },
      };
    }

    // 空ファイルチェック
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'ファイルが空です',
        code: 'EMPTY_FILE',
        details: { fileName: file.name },
      };
    }

    return { isValid: true };
  }

  /**
   * 複数ファイルのバリデーション
   */
  static validateFiles(files: File[], mediaType: string): ValidationResult {
    const config = MEDIA_TYPE_CONFIGS[mediaType];

    if (!config) {
      return {
        isValid: false,
        error: `未知のメディアタイプです: ${mediaType}`,
        code: 'UNKNOWN_MEDIA_TYPE',
      };
    }

    // ファイル数チェック
    if (files.length > config.maxFiles) {
      return {
        isValid: false,
        error: `ファイル数が多すぎます。最大: ${config.maxFiles}個`,
        code: 'TOO_MANY_FILES',
        details: {
          fileCount: files.length,
          maxFiles: config.maxFiles,
        },
      };
    }

    // 複数ファイル許可チェック
    if (files.length > 1 && !config.allowMultiple) {
      return {
        isValid: false,
        error: `${config.description}は複数ファイルをサポートしていません`,
        code: 'MULTIPLE_FILES_NOT_ALLOWED',
        details: {
          fileCount: files.length,
          mediaType,
        },
      };
    }

    // 各ファイルの個別バリデーション
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = this.validateFile(file, mediaType);
      if (!result.isValid) {
        return {
          ...result,
          details: {
            ...result.details,
            fileIndex: i,
            totalFiles: files.length,
          },
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Base64データのバリデーション（バックエンド用）
   */
  static validateBase64Data(
    base64Data: string,
    declaredSize: number,
    contentType: string,
    mediaType: string
  ): ValidationResult {
    const config = MEDIA_TYPE_CONFIGS[mediaType];
    if (!config) {
      return {
        isValid: false,
        error: `未知のメディアタイプです: ${mediaType}`,
        code: 'UNKNOWN_MEDIA_TYPE',
      };
    }

    // Base64データサイズチェック
    const actualSize = Math.floor((base64Data.length * 3) / 4);
    if (Math.abs(actualSize - declaredSize) > 1024) {
      // 1KB の誤差を許容
      return {
        isValid: false,
        error: 'ファイルサイズが一致しません',
        code: 'SIZE_MISMATCH',
        details: {
          declaredSize,
          actualSize,
          difference: Math.abs(actualSize - declaredSize),
        },
      };
    }

    // ファイルサイズ制限チェック
    if (declaredSize > config.maxFileSize) {
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます。最大サイズ: ${this.formatFileSize(config.maxFileSize)}`,
        code: 'FILE_TOO_LARGE',
        details: {
          fileSize: declaredSize,
          maxFileSize: config.maxFileSize,
        },
      };
    }

    // コンテンツタイプチェック
    if (!config.allowedTypes.includes(contentType)) {
      return {
        isValid: false,
        error: `サポートされていないファイル形式です: ${contentType}`,
        code: 'UNSUPPORTED_FILE_TYPE',
        details: {
          contentType,
          allowedTypes: config.allowedTypes,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * メディアタイプ設定の取得
   */
  static getMediaTypeConfig(mediaType: string): MediaTypeConfig | null {
    return MEDIA_TYPE_CONFIGS[mediaType] || null;
  }

  /**
   * 利用可能なメディアタイプの一覧取得
   */
  static getAvailableMediaTypes(): string[] {
    return Object.keys(MEDIA_TYPE_CONFIGS);
  }

  /**
   * ファイルサイズのフォーマット
   */
  private static formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }

  /**
   * メディアIDの妥当性検証（MediaProcessingWorker用）
   */
  static validateMediaId(mediaId: string): ValidationResult {
    // UUID v4形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!mediaId || typeof mediaId !== 'string') {
      return {
        isValid: false,
        error: 'メディアIDが指定されていません',
        code: 'MISSING_MEDIA_ID',
      };
    }

    if (!uuidRegex.test(mediaId)) {
      return {
        isValid: false,
        error: '無効なメディアID形式です',
        code: 'INVALID_MEDIA_ID_FORMAT',
        details: { mediaId },
      };
    }

    return { isValid: true };
  }

  /**
   * 画像バッファの妥当性検証（MediaProcessingWorker用）
   */
  static validateImageBuffer(buffer: Buffer): ValidationResult {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return {
        isValid: false,
        error: '無効な画像データです',
        code: 'INVALID_BUFFER',
      };
    }

    if (buffer.length === 0) {
      return {
        isValid: false,
        error: '画像データが空です',
        code: 'EMPTY_BUFFER',
      };
    }

    // 最小サイズチェック（100バイト未満は無効とみなす）
    if (buffer.length < 100) {
      return {
        isValid: false,
        error: '画像データが小さすぎます',
        code: 'BUFFER_TOO_SMALL',
        details: { size: buffer.length },
      };
    }

    // 最大サイズチェック（100MB）
    const maxSize = 100 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return {
        isValid: false,
        error: '画像データが大きすぎます',
        code: 'BUFFER_TOO_LARGE',
        details: {
          size: buffer.length,
          maxSize,
          sizeFormatted: this.formatFileSize(buffer.length),
          maxSizeFormatted: this.formatFileSize(maxSize),
        },
      };
    }

    return { isValid: true };
  }

  /**
   * S3キーの妥当性検証（MediaProcessingWorker用）
   */
  static validateS3Key(s3Key: string): ValidationResult {
    if (!s3Key || typeof s3Key !== 'string') {
      return {
        isValid: false,
        error: 'S3キーが指定されていません',
        code: 'MISSING_S3_KEY',
      };
    }

    if (s3Key.length === 0) {
      return {
        isValid: false,
        error: 'S3キーが空です',
        code: 'EMPTY_S3_KEY',
      };
    }

    if (s3Key.length > 1024) {
      return {
        isValid: false,
        error: 'S3キーが長すぎます',
        code: 'S3_KEY_TOO_LONG',
        details: { length: s3Key.length, maxLength: 1024 },
      };
    }

    // 無効な文字のチェック
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(s3Key)) {
      return {
        isValid: false,
        error: 'S3キーに無効な文字が含まれています',
        code: 'INVALID_S3_KEY_CHARS',
        details: { s3Key },
      };
    }

    return { isValid: true };
  }
}

/**
 * 便利な型ガード関数
 */
export function isValidMediaType(mediaType: string): mediaType is keyof typeof MEDIA_TYPE_CONFIGS {
  return mediaType in MEDIA_TYPE_CONFIGS;
}

/**
 * バリデーション結果の型ガード
 */
export function isValidationSuccess(
  result: ValidationResult
): result is ValidationResult & { isValid: true } {
  return result.isValid;
}

/**
 * バリデーション結果からエラーメッセージを取得
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.isValid) {
    return '';
  }
  return result.error || 'バリデーションエラーが発生しました';
}

/**
 * 画像メタデータの妥当性検証
 */
export function validateImageMetadata(metadata?: unknown): ValidationResult {
  if (!metadata || typeof metadata !== 'object') {
    return {
      isValid: false,
      error: '画像メタデータが無効です',
      code: 'INVALID_METADATA',
    };
  }

  // 幅と高さの検証
  const metadataObj = metadata as { width?: number; height?: number };
  if (metadataObj.width && (typeof metadataObj.width !== 'number' || metadataObj.width <= 0)) {
    return {
      isValid: false,
      error: '無効な画像幅です',
      code: 'INVALID_WIDTH',
      details: { width: metadataObj.width },
    };
  }

  if (metadataObj.height && (typeof metadataObj.height !== 'number' || metadataObj.height <= 0)) {
    return {
      isValid: false,
      error: '無効な画像高さです',
      code: 'INVALID_HEIGHT',
      details: { height: metadataObj.height },
    };
  }

  // 最大解像度チェック（16K解像度まで許可）
  const maxDimension = 16384;
  if (metadataObj.width && metadataObj.width > maxDimension) {
    return {
      isValid: false,
      error: `画像幅が大きすぎます（最大: ${maxDimension}px）`,
      code: 'WIDTH_TOO_LARGE',
      details: { width: metadataObj.width, maxDimension },
    };
  }

  if (metadataObj.height && metadataObj.height > maxDimension) {
    return {
      isValid: false,
      error: `画像高さが大きすぎます（最大: ${maxDimension}px）`,
      code: 'HEIGHT_TOO_LARGE',
      details: { height: metadataObj.height, maxDimension },
    };
  }

  return { isValid: true };
}
