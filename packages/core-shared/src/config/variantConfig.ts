/**
 * 🎯 統一バリアント設定システム
 *
 * 全てのメディア処理で使用される統一バリアント設定を提供
 * MediaProcessingWorkerとその他のメディア処理システムで共有
 */

import type {
  MediaProcessingVariantConfig,
  MediaTypeVariantConfigs,
  SpecialVariantConfigs,
  OnDemandOgpConfigs,
} from '../types/mediaProcessing.js';

// ================================
// 標準バリアント設定
// ================================

/**
 * メディアタイプ別バリアント設定
 * Prismaスキーマの定義に完全準拠
 */
export const VARIANT_CONFIGS: MediaTypeVariantConfigs = {
  // 投稿画像: Prismaスキーマ準拠（正方形）
  post: [
    { variantType: 'THUMB', width: 300, height: 300, fit: 'cover', quality: 80 },
    { variantType: 'MEDIUM', width: 800, height: 800, fit: 'cover', quality: 85 },
    { variantType: 'LARGE', width: 1200, height: 1200, fit: 'cover', quality: 90 },
  ],

  // アバター画像: Prismaスキーマ準拠（正方形）
  avatar: [
    { variantType: 'THUMB', width: 300, height: 300, fit: 'cover', quality: 80 },
    { variantType: 'MEDIUM', width: 800, height: 800, fit: 'cover', quality: 85 },
    { variantType: 'LARGE', width: 1200, height: 1200, fit: 'cover', quality: 90 },
  ],

  // カバー画像: Prismaスキーマ準拠（正方形）
  cover: [
    { variantType: 'THUMB', width: 300, height: 300, fit: 'cover', quality: 80 },
    { variantType: 'MEDIUM', width: 800, height: 800, fit: 'cover', quality: 85 },
    { variantType: 'LARGE', width: 1200, height: 1200, fit: 'cover', quality: 90 },
  ],

  // OGP画像: Prismaスキーマ準拠（正方形）
  ogp: [{ variantType: 'THUMB', width: 300, height: 300, fit: 'cover', quality: 80 }],
};

/**
 * 特殊バリアント設定（Worker事前生成用）
 * UI用のBLURプレースホルダのみ
 */
export const SPECIAL_VARIANTS: SpecialVariantConfigs = {
  BLUR: {
    variantType: 'BLUR',
    width: 20,
    height: 20,
    fit: 'cover',
    quality: 60,
  },
};

/**
 * オンデマンドOGP設定（s3-gatewayで使用）
 * OGPはオンデマンド生成へ移行済み
 */
export const ON_DEMAND_OGP_CONFIG: OnDemandOgpConfigs = {
  STANDARD: {
    variantType: 'STANDARD',
    width: 1200,
    height: 630,
    fit: 'cover',
    quality: 85,
  },
  TEASER_TEMPLATE: {
    variantType: 'TEASER_TEMPLATE',
    width: 1200,
    height: 630,
    fit: 'cover',
    quality: 85,
  },
};

// ================================
// 設定取得関数
// ================================

/**
 * メディアタイプに対応するバリアント設定を取得
 *
 * @param mediaType - メディアタイプ（post, avatar, cover, ogp）
 * @returns バリアント設定の配列
 */
export function getVariantConfigs(mediaType: string): MediaProcessingVariantConfig[] {
  const configs = VARIANT_CONFIGS[mediaType.toLowerCase()];
  if (!configs) {
    console.warn(`Unknown media type: ${mediaType}, using default post configs`);
    return VARIANT_CONFIGS.post;
  }
  return configs;
}

/**
 * 特殊バリアント設定を取得
 *
 * @returns 特殊バリアント設定（OGP, BLUR）
 */
export function getSpecialVariantConfigs(): SpecialVariantConfigs {
  return SPECIAL_VARIANTS;
}

/**
 * 特定の特殊バリアント設定を取得
 *
 * @param variantType - バリアントタイプ（BLURのみ）
 * @returns 特殊バリアント設定
 */
export function getSpecialVariantConfig(variantType: 'BLUR'): MediaProcessingVariantConfig {
  return SPECIAL_VARIANTS[variantType];
}

/**
 * 全てのバリアント設定を取得（標準 + 特殊）
 *
 * @param mediaType - メディアタイプ
 * @returns 全バリアント設定の配列
 */
export function getAllVariantConfigs(mediaType: string): MediaProcessingVariantConfig[] {
  const standardConfigs = getVariantConfigs(mediaType);
  const specialConfigs = Object.values(SPECIAL_VARIANTS);
  return [...standardConfigs, ...specialConfigs];
}

// ================================
// バリアント設定検証関数
// ================================

/**
 * バリアント設定の妥当性を検証
 *
 * @param config - 検証するバリアント設定
 * @returns 検証結果
 */
export function validateVariantConfig(config: MediaProcessingVariantConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 必須フィールドの検証
  if (!config.variantType) {
    errors.push('variantType is required');
  }

  if (!config.width || config.width <= 0) {
    errors.push('width must be a positive number');
  }

  if (!config.height || config.height <= 0) {
    errors.push('height must be a positive number');
  }

  if (!config.fit) {
    errors.push('fit is required');
  }

  if (!config.quality || config.quality < 1 || config.quality > 100) {
    errors.push('quality must be between 1 and 100');
  }

  // 値の範囲検証
  if (config.width && config.width > 4096) {
    errors.push('width should not exceed 4096 pixels');
  }

  if (config.height && config.height > 4096) {
    errors.push('height should not exceed 4096 pixels');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * メディアタイプの妥当性を検証
 *
 * @param mediaType - 検証するメディアタイプ
 * @returns 検証結果
 */
export function validateMediaType(mediaType: string): boolean {
  const validTypes = Object.keys(VARIANT_CONFIGS);
  return validTypes.includes(mediaType.toLowerCase());
}

// ================================
// 設定概要取得関数
// ================================

/**
 * 設定概要を取得（デバッグ用）
 *
 * @returns 設定概要
 */
export function getVariantConfigSummary(): {
  standardConfigs: Record<string, number>;
  specialConfigs: string[];
  totalVariantTypes: number;
} {
  const standardConfigs: Record<string, number> = {};

  Object.entries(VARIANT_CONFIGS).forEach(([mediaType, configs]) => {
    standardConfigs[mediaType] = configs.length;
  });

  const specialConfigs = Object.keys(SPECIAL_VARIANTS);
  const totalVariantTypes = new Set([
    ...Object.values(VARIANT_CONFIGS)
      .flat()
      .map(c => c.variantType),
    ...specialConfigs,
  ]).size;

  return {
    standardConfigs,
    specialConfigs,
    totalVariantTypes,
  };
}
