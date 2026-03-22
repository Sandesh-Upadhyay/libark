/**
 * Redis接続マネージャー
 *
 * 統一されたRedis接続管理を提供
 */

import { Redis, type RedisOptions } from 'ioredis';

import type { RedisClientType, RedisConnectionConfig } from './types.js';
import { DEFAULT_REDIS_CONFIG, getRedisConfigFromUnified } from './constants.js';

/**
 * Redis接続マネージャークラス
 */
export class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private clients = new Map<string, Redis>();
  private config: RedisConnectionConfig;

  private constructor() {
    const redisConfig = getRedisConfigFromUnified();
    this.config = {
      host: redisConfig.host || DEFAULT_REDIS_CONFIG.HOST,
      port: redisConfig.port,
      password: redisConfig.password,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(
          times * DEFAULT_REDIS_CONFIG.RETRY_DELAY_BASE,
          DEFAULT_REDIS_CONFIG.RETRY_DELAY_MAX
        );
        return delay;
      },
    };
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  /**
   * BullMQ用のRedisクライアントを取得
   */
  public getBullMQClient(type: RedisClientType): Redis {
    const key = `bullmq-${type}`;

    if (this.clients.has(key)) {
      return this.clients.get(key)!;
    }

    const options: RedisOptions = {
      ...this.config,
      maxRetriesPerRequest: type === 'bclient' ? null : DEFAULT_REDIS_CONFIG.MAX_RETRIES,
    };

    const client = new Redis(options);
    this.setupClientEventHandlers(client, `BullMQ-${type}`);

    // bcllientは使い捨てなのでキャッシュしない
    if (type !== 'bclient') {
      this.clients.set(key, client);
    }

    return client;
  }

  /**
   * WebSocket PubSub用のRedisクライアントを取得
   */
  public getPubSubClient(): Redis {
    const key = 'pubsub';

    if (this.clients.has(key)) {
      return this.clients.get(key)!;
    }

    const client = new Redis(this.config);
    this.setupClientEventHandlers(client, 'PubSub');
    this.clients.set(key, client);

    return client;
  }

  /**
   * 通常のコマンド用Redisクライアントを取得
   */
  public getStandardClient(): Redis {
    const key = 'standard';

    if (this.clients.has(key)) {
      return this.clients.get(key)!;
    }

    const client = new Redis(this.config);
    this.setupClientEventHandlers(client, 'Standard');
    this.clients.set(key, client);

    return client;
  }

  /**
   * 新しいRedisクライアントを作成（使い捨て用）
   */
  public createClient(options?: Partial<RedisConnectionConfig>): Redis {
    const clientOptions: RedisOptions = {
      ...this.config,
      ...options,
    };

    const client = new Redis(clientOptions);
    this.setupClientEventHandlers(client, 'Temporary');

    return client;
  }

  /**
   * クライアントのイベントハンドラーを設定
   */
  private setupClientEventHandlers(client: Redis, type: string): void {
    client.on('error', err => {
      console.error(`Redis接続エラー (${type}):`, err);
    });

    // 開発環境でのみ詳細ログを出力
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_REDIS === 'true') {
      client.on('connect', () => {
        console.log(`Redis接続成功 (${type}): ${this.config.host}:${this.config.port}`);
      });

      client.on('ready', () => {
        console.log(`Redis準備完了 (${type})`);
      });

      client.on('close', () => {
        console.log(`Redis接続終了 (${type})`);
      });
    }
  }

  /**
   * 全ての接続を閉じる
   */
  public async closeAllConnections(): Promise<void> {
    const closePromises: Promise<string>[] = [];

    for (const [key, client] of this.clients) {
      console.log(`Redis接続を閉じています: ${key}`);
      try {
        const anyClient = client as unknown as {
          disconnect?: () => unknown;
          quit?: () => unknown;
          end?: (force?: boolean) => void;
        };
        if (typeof anyClient.disconnect === 'function') {
          // ioredis has disconnect(); some adapters may have only disconnect
          closePromises.push(
            Promise.resolve(anyClient.disconnect()).then(() => `disconnected:${key}`)
          );
        } else if (typeof anyClient.quit === 'function') {
          closePromises.push(Promise.resolve(anyClient.quit()).then(() => `quit:${key}`));
        } else {
          // それでもAPIが無い場合は手動でendイベントを促す
          closePromises.push(
            new Promise<string>(resolve => {
              try {
                anyClient?.end?.(true);
              } catch {
                // Ignore end errors
              }
              resolve(`ended:${key}`);
            })
          );
        }
      } catch (e) {
        console.warn(`Redis接続のクローズで例外 (${key}):`, e);
      }
    }

    if (closePromises.length > 0) {
      await Promise.all(closePromises);
      console.log('全てのRedis接続を閉じました');
    }

    this.clients.clear();
  }
}

/**
 * 標準のRedisクライアントを取得（シングルトン）
 */
export function getRedisClient(): Redis {
  return RedisConnectionManager.getInstance().getStandardClient();
}

/**
 * 新しいRedisクライアントを作成
 */
export function createRedisClient(options?: Partial<RedisConnectionConfig>): Redis {
  return RedisConnectionManager.getInstance().createClient(options);
}
