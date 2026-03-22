/**
 * Post関係のバリデーションユーティリティ
 */

import type { PostSubmissionData } from '@/features/posts/types';

import { POST_FORM_CONFIG, POST_ERROR_MESSAGES } from '../constants/post.constants';

/**
 * 投稿内容のバリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 投稿内容をバリデーション
 */
export function validatePostContent(content: string): ValidationResult {
  // 空文字チェック
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: POST_ERROR_MESSAGES.emptyContent,
    };
  }

  // 文字数チェック
  if (content.length > POST_FORM_CONFIG.maxContentLength) {
    return {
      isValid: false,
      error: POST_ERROR_MESSAGES.contentTooLong,
    };
  }

  return { isValid: true };
}

/**
 * 画像ファイルをバリデーション
 */
export function validateImageFile(file: File): ValidationResult {
  // ファイル形式チェック
  if (!POST_FORM_CONFIG.allowedImageTypes.includes(file.type)) {
    return {
      isValid: false,
      error: POST_ERROR_MESSAGES.unsupportedFileType,
    };
  }

  // ファイルサイズチェック
  if (file.size > POST_FORM_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: POST_ERROR_MESSAGES.fileTooLarge,
    };
  }

  return { isValid: true };
}

/**
 * 画像ファイル配列をバリデーション
 */
export function validateImageFiles(files: File[]): ValidationResult {
  // 画像数チェック
  if (files.length > POST_FORM_CONFIG.maxImageCount) {
    return {
      isValid: false,
      error: POST_ERROR_MESSAGES.tooManyImages,
    };
  }

  // 各ファイルをバリデーション
  for (const file of files) {
    const result = validateImageFile(file);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

/**
 * 投稿送信データをバリデーション
 */
export function validatePostSubmission(data: PostSubmissionData): ValidationResult {
  // 内容のバリデーション
  const contentResult = validatePostContent(data.content);
  if (!contentResult.isValid) {
    return contentResult;
  }

  // 有料投稿の価格チェック
  if (data.visibility === 'PAID') {
    if (!data.price || data.price <= 0) {
      return {
        isValid: false,
        error: '有料投稿の価格を設定してください',
      };
    }
    if (data.price > 10000) {
      return {
        isValid: false,
        error: '価格は10,000円以下で設定してください',
      };
    }
  }

  return { isValid: true };
}

/**
 * ファイル名をサニタイズ
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}

/**
 * 投稿内容をサニタイズ（基本的なHTMLエスケープ）
 */
export function sanitizePostContent(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * URLが安全かどうかチェック
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
