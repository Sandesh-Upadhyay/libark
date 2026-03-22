/**
 * 🔍 OGPメタデータ取得サービス
 *
 * 内部APIからOGPメタデータを取得し、Redisキャッシュを管理するサービス
 * オンデマンドOGPメタデータをサポート
 */

import { getRedisClient } from '@libark/redis-client';

/**
 * OGPメタデータ型定義（既存の後方互換）
 */
export interface OgpMeta {
  bucket: string;
  ogpKey: string;
  salt: string;
  contentHash: string;
  contentType: string;
  ext: string;
  variant: string;
}

/**
 * オンデマンドOGPバリアントタイプ
 */
export type OnDemandVariant = 'standard' | 'teaser';

/**
 * オンデマンドOGPステータス
 */
export type OnDemandStatus = 'READY' | 'MISSING';

/**
 * オンデマンドOGPメタデータ
 */
export interface OnDemandMeta {
  contentHash: string;
  ogpKey: string;
  sig: string;
  ext: string;
  contentType: string;
  variant: OnDemandVariant;
  status: OnDemandStatus;
  postId?: string;
  mediaId: string;
  isPaid: boolean;
}

/**
 * オンデマンドOGPメタデータ（両バリアント含む）
 */
export interface OnDemandMetaWithVariants {
  standard: OnDemandMeta;
  teaser: OnDemandMeta;
}

/**
 * 内部APIレスポンス型（拡張）
 */
export interface InternalOgpMetaResponse {
  bucket?: string;
  ogpKey?: string;
  salt?: string;
  contentHash?: string;
  contentType?: string;
  ext?: string;
  variant?: string;
  onDemand: OnDemandMetaWithVariants;
}

/**
 * 内部APIエラーレスポンス型
 */
interface _InternalApiErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

/**
 * OGPメタデータ取得サービス
 */
export class OgpMetaService {
  private redis = getRedisClient();
  private internalApiBaseUrl: string;
  private internalApiToken: string;
  private redisTtlSec: number;

  constructor() {
    this.internalApiBaseUrl = process.env.OGP_INTERNAL_API_BASE_URL || 'http://backend:8000';
    this.internalApiToken = process.env.OGP_INTERNAL_API_TOKEN || '';
    this.redisTtlSec = parseInt(process.env.OGP_REDIS_TTL_SEC || '86400', 10);

    if (!this.internalApiToken) {
      console.warn('⚠️ [OgpMetaService] OGP_INTERNAL_API_TOKENが設定されていません');
    }
  }

  /**
   * OGPメタデータを取得（既存の後方互換）
   * Redisキャッシュ → 内部APIの順に検索
   *
   * @param mediaId - メディアID
   * @returns OGPメタデータ、見つからない場合はnull
   */
  async getOgpMeta(mediaId: string): Promise<OgpMeta | null> {
    const cacheKey = `ogp:meta:${mediaId}`;

    try {
      // Redisキャッシュをチェック
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const meta = JSON.parse(cached) as OgpMeta;
        return meta;
      }

      // キャッシュミス: 内部APIを呼び出し
      const meta = await this.fetchFromInternalApi(mediaId);
      if (meta) {
        // Redisにキャッシュを保存
        await this.redis.setex(cacheKey, this.redisTtlSec, JSON.stringify(meta));
        return meta;
      }

      return null;
    } catch (error) {
      console.error('❌ [OgpMetaService] OGPメタデータ取得エラー:', error);
      throw error;
    }
  }

  /**
   * オンデマンドOGPメタデータを取得
   * Redisキャッシュ → 内部APIの順に検索
   *
   * @param mediaId - メディアID
   * @param variant - バリアント（standard | teaser）
   * @returns オンデマンドOGPメタデータ、見つからない場合はnull
   */
  async getOnDemandMeta(mediaId: string, variant: OnDemandVariant): Promise<OnDemandMeta | null> {
    const cacheKey = `ogp:ondemand:${mediaId}:${variant}`;

    try {
      // Redisキャッシュをチェック
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const meta = JSON.parse(cached) as OnDemandMeta;
        return meta;
      }

      // キャッシュミス: 内部APIを呼び出し
      const meta = await this.fetchOnDemandFromInternalApi(mediaId, variant);
      if (meta) {
        // Redisにキャッシュを保存（短めのTTLで）
        await this.redis.setex(cacheKey, this.redisTtlSec, JSON.stringify(meta));
        return meta;
      }

      return null;
    } catch (error) {
      console.error('❌ [OgpMetaService] オンデマンドOGPメタデータ取得エラー:', error);
      throw error;
    }
  }

  /**
   * オンデマンドOGPメタデータを両バリアント取得
   *
   * @param mediaId - メディアID
   * @returns オンデマンドOGPメタデータ（両バリアント）、見つからない場合はnull
   */
  async getOnDemandMetaWithVariants(mediaId: string): Promise<OnDemandMetaWithVariants | null> {
    const cacheKey = `ogp:ondemand:${mediaId}`;

    try {
      // Redisキャッシュをチェック
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const meta = JSON.parse(cached) as OnDemandMetaWithVariants;
        return meta;
      }

      // キャッシュミス: 内部APIを呼び出し
      const meta = await this.fetchOnDemandWithVariantsFromInternalApi(mediaId);
      if (meta) {
        // Redisにキャッシュを保存
        await this.redis.setex(cacheKey, this.redisTtlSec, JSON.stringify(meta));
        return meta;
      }

      return null;
    } catch (error) {
      console.error('❌ [OgpMetaService] オンデマンドOGPメタデータ取得エラー:', error);
      throw error;
    }
  }

  /**
   * 内部APIからOGPメタデータを取得（既存の後方互換）
   *
   * @param mediaId - メディアID
   * @returns OGPメタデータ、見つからない場合はnull
   * @throws 内部APIエラー（502を返すため）
   */
  private async fetchFromInternalApi(mediaId: string): Promise<OgpMeta | null> {
    const url = `${this.internalApiBaseUrl}/internal/ogp-meta/${mediaId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.internalApiToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // 404はnullを返す（502を避けるため）
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [OgpMetaService] 内部APIエラー: ${response.status} ${errorText}`);
        throw new Error(`Internal API error: ${response.status}`);
      }

      const data = (await response.json()) as InternalOgpMetaResponse;

      // 既存のOgpMetaが存在する場合はそれを返す
      if (data.bucket && data.ogpKey && data.salt) {
        return {
          bucket: data.bucket,
          ogpKey: data.ogpKey,
          salt: data.salt,
          contentHash: data.contentHash || '',
          contentType: data.contentType || '',
          ext: data.ext || '',
          variant: data.variant || '',
        };
      }

      // 既存のOgpMetaがない場合はnullを返す
      return null;
    } catch (error) {
      console.error('❌ [OgpMetaService] 内部API呼び出しエラー:', error);
      throw error;
    }
  }

  /**
   * 内部APIからオンデマンドOGPメタデータを取得（単一バリアント）
   *
   * @param mediaId - メディアID
   * @param variant - バリアント
   * @returns オンデマンドOGPメタデータ、見つからない場合はnull
   * @throws 内部APIエラー（502を返すため）
   */
  private async fetchOnDemandFromInternalApi(
    mediaId: string,
    variant: OnDemandVariant
  ): Promise<OnDemandMeta | null> {
    const meta = await this.fetchOnDemandWithVariantsFromInternalApi(mediaId);
    if (!meta) {
      return null;
    }
    return meta[variant];
  }

  /**
   * 内部APIからオンデマンドOGPメタデータを取得（両バリアント）
   *
   * @param mediaId - メディアID
   * @returns オンデマンドOGPメタデータ（両バリアント）、見つからない場合はnull
   * @throws 内部APIエラー（502を返すため）
   */
  private async fetchOnDemandWithVariantsFromInternalApi(
    mediaId: string
  ): Promise<OnDemandMetaWithVariants | null> {
    const url = `${this.internalApiBaseUrl}/internal/ogp-meta/${mediaId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.internalApiToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // 404はnullを返す（502を避けるため）
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [OgpMetaService] 内部APIエラー: ${response.status} ${errorText}`);
        throw new Error(`Internal API error: ${response.status}`);
      }

      const data = (await response.json()) as InternalOgpMetaResponse;
      return data.onDemand;
    } catch (error) {
      console.error('❌ [OgpMetaService] 内部API呼び出しエラー:', error);
      throw error;
    }
  }

  /**
   * キャッシュをクリア
   *
   * @param mediaId - メディアID
   */
  async clearCache(mediaId: string): Promise<void> {
    const cacheKey = `ogp:meta:${mediaId}`;
    await this.redis.del(cacheKey);

    // オンデマンドキャッシュもクリア
    const onDemandCacheKey = `ogp:ondemand:${mediaId}`;
    await this.redis.del(onDemandCacheKey);

    // バリアントごとのキャッシュもクリア
    await this.redis.del(`ogp:ondemand:${mediaId}:standard`);
    await this.redis.del(`ogp:ondemand:${mediaId}:teaser`);
  }
}

// シングルトンインスタンス
let ogpMetaService: OgpMetaService | null = null;

/**
 * シングルトンOGPメタデータサービスを取得
 */
export function getOgpMetaService(): OgpMetaService {
  if (!ogpMetaService) {
    ogpMetaService = new OgpMetaService();
  }
  return ogpMetaService;
}
