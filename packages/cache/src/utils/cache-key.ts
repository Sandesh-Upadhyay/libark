/**
 * 🔑 キャッシュキー管理ユーティリティ
 */

import type { CacheCategory, CacheKey } from '../types.js';

/**
 * キャッシュキーの区切り文字
 */
const KEY_SEPARATOR = ':';

/**
 * キャッシュキーの構造
 */
export interface ParsedCacheKey {
  category: CacheCategory;
  key: CacheKey;
  version?: string;
  fullKey: string;
}

/**
 * 統一キャッシュキーの生成
 *
 * @param category - キャッシュカテゴリ
 * @param key - キー
 * @param version - バージョン（省略可）
 * @returns 統一キャッシュキー
 */
export function createCacheKey(category: CacheCategory, key: CacheKey, version?: string): string {
  // 基本キーの生成
  let fullKey = `${category}${KEY_SEPARATOR}${key}`;

  // バージョンの追加
  if (version) {
    fullKey += `${KEY_SEPARATOR}v${version}`;
  }

  // キーの正規化（特殊文字のエスケープ）
  return normalizeKey(fullKey);
}

/**
 * キャッシュキーのパース
 *
 * @param fullKey - 完全なキャッシュキー
 * @returns パースされたキー情報
 */
export function parseCacheKey(fullKey: string): ParsedCacheKey | null {
  try {
    const parts = fullKey.split(KEY_SEPARATOR);

    if (parts.length < 2) {
      return null;
    }

    const category = parts[0] as CacheCategory;
    const key = parts[1];

    if (!category || !key) {
      return null;
    }

    // バージョンの抽出
    let version: string | undefined;
    if (parts.length > 2 && parts[2] && parts[2].startsWith('v')) {
      version = parts[2].substring(1);
    }

    return {
      category,
      key,
      version,
      fullKey,
    };
  } catch {
    return null;
  }
}

/**
 * キーの正規化
 *
 * @param key - 正規化するキー
 * @returns 正規化されたキー
 */
function normalizeKey(key: string): string {
  return (
    key
      // 空白文字を削除
      .replace(/\s+/g, '')
      // 特殊文字をエスケープ
      .replace(/[^\w\-.:]/g, '_')
      // 連続するアンダースコアを単一に
      .replace(/_+/g, '_')
      // 先頭・末尾のアンダースコアを削除
      .replace(/^_|_$/g, '')
  );
}

/**
 * カテゴリ用のパターンキーを生成
 *
 * @param category - カテゴリ
 * @returns パターンキー（ワイルドカード付き）
 */
export function createCategoryPattern(category: CacheCategory): string {
  return `${category}${KEY_SEPARATOR}*`;
}

/**
 * タグ用のキーを生成
 *
 * @param tag - タグ名
 * @returns タグキー
 */
export function createTagKey(tag: string): string {
  return `tag${KEY_SEPARATOR}${normalizeKey(tag)}`;
}

/**
 * 一時キーを生成
 *
 * @param prefix - プレフィックス
 * @param suffix - サフィックス（省略時はタイムスタンプ）
 * @returns 一時キー
 */
export function createTempKey(prefix: string, suffix?: string): string {
  const timestamp = suffix || Date.now().toString();
  return createCacheKey('temp', `${prefix}_${timestamp}`);
}

/**
 * セッションキーを生成
 *
 * @param sessionId - セッションID
 * @param key - キー
 * @returns セッションキー
 */
export function createSessionKey(sessionId: string, key: string): string {
  return createCacheKey('session', `${sessionId}_${key}`);
}

/**
 * ユーザー固有キーを生成
 *
 * @param userId - ユーザーID
 * @param key - キー
 * @returns ユーザーキー
 */
export function createUserKey(userId: string, key: string): string {
  return createCacheKey('user', `${userId}_${key}`);
}

/**
 * キーの妥当性チェック
 *
 * @param key - チェックするキー
 * @returns 妥当性
 */
export function isValidCacheKey(key: string): boolean {
  // 空文字チェック
  if (!key || key.trim().length === 0) {
    return false;
  }

  // 長さチェック（Redis制限: 512MB、実用的には1KB以下推奨）
  if (key.length > 1024) {
    return false;
  }

  // 文字チェック（制御文字を含まない）
  if (/[\x00-\x1f\x7f]/.test(key)) {
    return false;
  }

  return true;
}

/**
 * キーのハッシュ化（長いキー用）
 *
 * @param key - ハッシュ化するキー
 * @returns ハッシュ化されたキー
 */
export function hashKey(key: string): string {
  // 簡単なハッシュ実装（実際にはcrypto.createHashを使用推奨）
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(36);
}

/**
 * 階層キーを生成（ネストしたデータ用）
 *
 * @param category - カテゴリ
 * @param path - パス配列
 * @returns 階層キー
 */
export function createHierarchicalKey(category: CacheCategory, path: string[]): string {
  const hierarchicalKey = path.join('.');
  return createCacheKey(category, hierarchicalKey);
}
