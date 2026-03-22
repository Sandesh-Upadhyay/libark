/**
 * 🎯 ファイルバリデーター
 *
 * 責任:
 * - ファイルの妥当性検証
 * - エラーメッセージの生成
 * - 統一されたバリデーションロジック
 */

import type { FileValidationConfig, FileValidationResult } from './types';

/**
 * ファイルがドラッグ&ドロップイベントから画像ファイルかどうかを判定
 * HEIC形式は除外
 */
export function hasImageFiles(dataTransfer: DataTransfer): boolean {
  const files = Array.from(dataTransfer.files);
  return files.some(file => {
    // HEIC形式を明示的に除外
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      return false;
    }
    // 拡張子でもチェック
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      return false;
    }
    return file.type.startsWith('image/');
  });
}

/**
 * ドラッグ&ドロップイベントから画像ファイルのみを抽出
 * HEIC形式は明示的に除外
 */
export function extractImageFiles(dataTransfer: DataTransfer): File[] {
  const files = Array.from(dataTransfer.files);
  return files.filter(file => {
    // HEIC形式を明示的に除外
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      return false;
    }
    // 拡張子でもチェック
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      return false;
    }
    return file.type.startsWith('image/');
  });
}

/**
 * 単一ファイルのバリデーション
 */
export function validateFile(file: File, config: FileValidationConfig): FileValidationResult {
  // ファイルサイズチェック
  if (file.size > config.maxFileSize) {
    const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
    return {
      isValid: false,
      error: `ファイルサイズは${maxSizeMB}MB以下にしてください`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // MIMEタイプチェック
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '対応していないファイル形式です',
      errorCode: 'INVALID_TYPE',
    };
  }

  // 拡張子チェック（追加の安全性確保）
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (fileExtension && !config.allowedExtensions.includes(`.${fileExtension}`)) {
    return {
      isValid: false,
      error: '対応していないファイル拡張子です',
      errorCode: 'INVALID_TYPE',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * 複数ファイルのバリデーション
 */
export function validateFiles(files: File[], config: FileValidationConfig): FileValidationResult {
  // ファイル数チェック
  if (config.maxFiles && files.length > config.maxFiles) {
    return {
      isValid: false,
      error: `ファイルは${config.maxFiles}個まで選択できます`,
      errorCode: 'TOO_MANY_FILES',
    };
  }

  // ファイルが選択されていない場合
  if (files.length === 0) {
    return {
      isValid: false,
      error: 'ファイルを選択してください',
      errorCode: 'NO_FILES',
    };
  }

  // 各ファイルの個別バリデーション
  for (const file of files) {
    const result = validateFile(file, config);
    if (!result.isValid) {
      return result;
    }
  }

  return {
    isValid: true,
  };
}

/**
 * 画像ファイル専用のバリデーション設定
 */
export function createImageValidationConfig(options: {
  maxFileSize?: number;
  maxFiles?: number;
}): FileValidationConfig {
  // 統一設定を使用
  const UNIFIED_MAX_SIZE = 20 * 1024 * 1024; // 20MB

  return {
    maxFileSize: options.maxFileSize ?? UNIFIED_MAX_SIZE,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxFiles: options.maxFiles,
  };
}

/**
 * アバター専用のバリデーション設定
 */
export function createAvatarValidationConfig(): FileValidationConfig {
  // 統一設定を使用
  const UNIFIED_MAX_SIZE = 20 * 1024 * 1024; // 20MB

  return createImageValidationConfig({
    maxFileSize: UNIFIED_MAX_SIZE,
    maxFiles: 1,
  });
}

/**
 * 投稿画像専用のバリデーション設定（統一設定を使用）
 */
export function createPostImageValidationConfig(): FileValidationConfig {
  // 統一設定から投稿メディアの制限を取得
  try {
    const { getMediaTypeLimits } = require('@libark/core-shared/config');
    const postMediaLimits = getMediaTypeLimits('postMedia');

    return createImageValidationConfig({
      maxFileSize: postMediaLimits.maxFileSize,
      maxFiles: postMediaLimits.maxFiles,
    });
  } catch (error) {
    // フォールバック（統一定数を使用）
    console.warn('統一設定の読み込みに失敗しました。フォールバック値を使用します:', error);
    return createImageValidationConfig({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
    });
  }
}
