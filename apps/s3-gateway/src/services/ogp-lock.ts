/**
 * 🔒 OGP生成ロックサービス
 *
 * Redisを使用した分散ロックとS3オブジェクトのポーリング機能を提供
 * 多重生成を防止するための仕組み
 */

import { getRedisClient } from '@libark/redis-client';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

/**
 * ロックオプション
 */
interface _LockOptions {
  /** ロックキー */
  key: string;
  /** TTL（秒） */
  ttlSec: number;
}

/**
 * S3ポーリングオプション
 */
interface WaitForObjectOptions {
  /** S3クライアント */
  s3Client: S3Client;
  /** バケット名 */
  bucket: string;
  /** オブジェクトキー */
  ogpKey: string;
  /** ポーリング間隔（ミリ秒） */
  intervalMs?: number;
  /** タイムアウト（ミリ秒） */
  timeoutMs?: number;
}

/**
 * OGP生成ロックサービス
 */
export class OgpLockService {
  private redis = getRedisClient();

  /**
   * 分布ロックを取得（SETNX + EX）
   *
   * @param key - ロックキー
   * @param ttlSec - TTL（秒）
   * @returns ロック取得に成功したらtrue、失敗したらfalse
   */
  async acquireLock(key: string, ttlSec: number): Promise<boolean> {
    try {
      // SETNX + EX を使用してアトミックにロックを取得
      const result = await this.redis.set(key, '1', 'EX', ttlSec, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('❌ [OgpLockService] ロック取得エラー:', error);
      return false;
    }
  }

  /**
   * ロックを解放
   *
   * @param key - ロックキー
   */
  async releaseLock(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('❌ [OgpLockService] ロック解放エラー:', error);
    }
  }

  /**
   * S3オブジェクトが存在するまで待機（ポーリング）
   *
   * @param options - ポーリングオプション
   * @returns オブジェクトが見つかったらtrue、タイムアウトしたらfalse
   */
  async waitForObject(options: WaitForObjectOptions): Promise<boolean> {
    const {
      s3Client,
      bucket,
      ogpKey,
      intervalMs = 200, // デフォルト: 200ms
      timeoutMs = 2500, // デフォルト: 2.5秒
    } = options;

    const startTime = Date.now();
    const endTime = startTime + timeoutMs;

    while (Date.now() < endTime) {
      try {
        const command = new HeadObjectCommand({
          Bucket: bucket,
          Key: ogpKey,
        });

        await s3Client.send(command);
        return true; // オブジェクトが見つかった
      } catch (error: any) {
        // NoSuchKeyエラーの場合は継続、それ以外は即時失敗
        if (error.name !== 'NoSuchKey' && error.$metadata?.httpStatusCode !== 404) {
          console.error('❌ [OgpLockService] S3 HeadObjectエラー:', error);
          return false;
        }
        // オブジェクトが見つからない場合は継続
      }

      // 次のポーリングまで待機
      if (Date.now() < endTime) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // タイムアウト
    return false;
  }

  /**
   * ロックキーを生成
   *
   * @param ogpKey - OGPキー
   * @returns ロックキー
   */
  generateLockKey(ogpKey: string): string {
    return `ogp:lock:${ogpKey}`;
  }
}

// シングルトンインスタンス
let ogpLockService: OgpLockService | null = null;

/**
 * シングルトンOGPロックサービスを取得
 */
export function getOgpLockService(): OgpLockService {
  if (!ogpLockService) {
    ogpLockService = new OgpLockService();
  }
  return ogpLockService;
}
