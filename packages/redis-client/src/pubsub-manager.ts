/**
 * Redis PubSub管理クラス
 *
 * WebSocket通知システム用の統一PubSub管理
 */

import { Redis } from 'ioredis';

import { RedisConnectionManager } from './redis-manager.js';
import type { PubSubNotificationData, PubSubMessageHandler } from './types.js';

/**
 * Redis PubSub管理クラス
 */
export class RedisPubSubManager {
  private static instance: RedisPubSubManager;
  private publisher: Redis;
  private subscriber: Redis;
  private messageHandlers = new Map<string, Set<PubSubMessageHandler>>();
  private subscribeInProgress = new Map<string, Promise<void>>();

  private constructor() {
    const manager = RedisConnectionManager.getInstance();
    this.publisher = manager.getStandardClient();
    this.subscriber = manager.getPubSubClient();
    this.setupSubscriber();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): RedisPubSubManager {
    if (!RedisPubSubManager.instance) {
      RedisPubSubManager.instance = new RedisPubSubManager();
    }
    return RedisPubSubManager.instance;
  }

  /**
   * 初期化メソッド（非同期処理用）
   */
  public async initialize(): Promise<void> {
    // 現在は特に非同期処理はないが、将来の拡張用
    console.log('✅ [RedisPubSub] 初期化完了');
  }

  /**
   * 購読者の設定
   */
  private setupSubscriber(): void {
    // 通常のメッセージ受信
    this.subscriber.on('message', (channel: string, message: string) => {
      try {
        console.log(`📨 [RedisPubSub] メッセージ受信: channel=${channel}`);
        const data = JSON.parse(message);
        this.handleMessage(channel, data);
      } catch (error) {
        console.error(`Redis メッセージ解析エラー: ${channel}`, error);
      }
    });

    // パターンマッチメッセージ受信
    this.subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
      try {
        console.log(
          `📨 [RedisPubSub] パターンメッセージ受信: pattern=${pattern}, channel=${channel}`
        );
        const data = JSON.parse(message);
        this.handleMessage(channel, data);
      } catch (error) {
        console.error(`Redis パターンメッセージ解析エラー: ${channel}`, error);
      }
    });

    // エラーハンドリング
    this.subscriber.on('error', error => {
      console.error('Redis PubSub エラー:', error);
    });

    // 購読成功/失敗のログ
    this.subscriber.on('subscribe', (channel: string, count: number) => {
      console.log(`✅ [RedisPubSub] 購読成功: channel=${channel}, count=${count}`);
    });

    this.subscriber.on('psubscribe', (pattern: string, count: number) => {
      console.log(`✅ [RedisPubSub] パターン購読成功: pattern=${pattern}, count=${count}`);
    });
  }

  /**
   * メッセージハンドラーを処理
   */
  private handleMessage(channel: string, data: PubSubNotificationData): void {
    const handlers = this.messageHandlers.get(channel);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`メッセージハンドラーエラー: ${channel}`, error);
        }
      });
    }
  }

  /**
   * チャンネルを購読（並行アクセス対応版）
   */
  public async subscribe(channel: string, handler: PubSubMessageHandler): Promise<void> {
    // 既存のハンドラーセットがある場合は追加のみ
    if (this.messageHandlers.has(channel)) {
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        handlers.add(handler);
        return;
      }
    }

    // 同じチャンネルの購読処理が進行中の場合は待機
    if (this.subscribeInProgress.has(channel)) {
      await this.subscribeInProgress.get(channel);
      // 購読完了後にハンドラーを追加
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        handlers.add(handler);
      } else {
        console.error(
          `❌ [RedisPubSub] チャンネル購読後にハンドラーセットが見つかりません: ${channel}`
        );
      }
      return;
    }

    // 新規購読処理
    const subscribePromise = this.performSubscribe(channel);
    this.subscribeInProgress.set(channel, subscribePromise);

    try {
      await subscribePromise;
      // 購読成功後にハンドラーを追加
      const handlers = this.messageHandlers.get(channel);
      if (handlers) {
        handlers.add(handler);
      } else {
        console.error(`❌ [RedisPubSub] 購読成功後にハンドラーセットが見つかりません: ${channel}`);
      }
    } catch (error) {
      console.error(`❌ [RedisPubSub] チャンネル購読エラー: ${channel}`, error);
      // エラー時はハンドラーセットを削除
      this.messageHandlers.delete(channel);
      throw error;
    } finally {
      // 購読処理完了
      this.subscribeInProgress.delete(channel);
    }
  }

  /**
   * 実際のRedis購読処理
   */
  private async performSubscribe(channel: string): Promise<void> {
    console.log(`📡 [RedisPubSub] チャンネル購読開始: ${channel}`);

    // ハンドラーセットを事前に作成
    this.messageHandlers.set(channel, new Set());

    try {
      await this.subscriber.subscribe(channel);
      console.log(`✅ [RedisPubSub] チャンネル購読完了: ${channel}`);
    } catch (error) {
      console.error(`❌ [RedisPubSub] Redis購読エラー: ${channel}`, error);
      // エラー時はハンドラーセットを削除
      this.messageHandlers.delete(channel);
      throw error;
    }
  }

  /**
   * パターンを購読（並行アクセス対応版）
   */
  public async psubscribe(pattern: string, handler: PubSubMessageHandler): Promise<void> {
    // 既存のハンドラーセットがある場合は追加のみ
    if (this.messageHandlers.has(pattern)) {
      const handlers = this.messageHandlers.get(pattern);
      if (handlers) {
        handlers.add(handler);
        return;
      }
    }

    // 同じパターンの購読処理が進行中の場合は待機
    if (this.subscribeInProgress.has(pattern)) {
      await this.subscribeInProgress.get(pattern);
      // 購読完了後にハンドラーを追加
      const handlers = this.messageHandlers.get(pattern);
      if (handlers) {
        handlers.add(handler);
      } else {
        console.error(
          `❌ [RedisPubSub] パターン購読後にハンドラーセットが見つかりません: ${pattern}`
        );
      }
      return;
    }

    // 新規購読処理
    const subscribePromise = this.performPSubscribe(pattern);
    this.subscribeInProgress.set(pattern, subscribePromise);

    try {
      await subscribePromise;
      // 購読成功後にハンドラーを追加
      const handlers = this.messageHandlers.get(pattern);
      if (handlers) {
        handlers.add(handler);
      } else {
        console.error(
          `❌ [RedisPubSub] パターン購読成功後にハンドラーセットが見つかりません: ${pattern}`
        );
      }
    } catch (error) {
      console.error(`❌ [RedisPubSub] パターン購読エラー: ${pattern}`, error);
      // エラー時はハンドラーセットを削除
      this.messageHandlers.delete(pattern);
      throw error;
    } finally {
      // 購読処理完了
      this.subscribeInProgress.delete(pattern);
    }
  }

  /**
   * 実際のRedisパターン購読処理
   */
  private async performPSubscribe(pattern: string): Promise<void> {
    console.log(`📡 [RedisPubSub] パターン購読開始: ${pattern}`);

    // ハンドラーセットを事前に作成
    this.messageHandlers.set(pattern, new Set());

    try {
      await this.subscriber.psubscribe(pattern);
      console.log(`✅ [RedisPubSub] パターン購読完了: ${pattern}`);
    } catch (error) {
      console.error(`❌ [RedisPubSub] Redisパターン購読エラー: ${pattern}`, error);
      // エラー時はハンドラーセットを削除
      this.messageHandlers.delete(pattern);
      throw error;
    }
  }

  /**
   * チャンネル購読を解除（安全性強化版）
   */
  public async unsubscribe(channel: string, handler?: PubSubMessageHandler): Promise<void> {
    const handlers = this.messageHandlers.get(channel);
    if (!handlers) {
      console.log(`🔍 [RedisPubSub] 購読解除: チャンネルが見つかりません: ${channel}`);
      return;
    }

    if (handler) {
      // 特定のハンドラーのみ削除
      handlers.delete(handler);
      if (handlers.size === 0) {
        console.log(`📴 [RedisPubSub] 全ハンドラー削除により購読解除: ${channel}`);
        this.messageHandlers.delete(channel);
        this.subscribeInProgress.delete(channel); // 進行中処理もクリア
        try {
          await this.subscriber.unsubscribe(channel);
        } catch (error) {
          console.error(`❌ [RedisPubSub] 購読解除エラー: ${channel}`, error);
        }
      }
    } else {
      // 全ハンドラーを削除
      console.log(`📴 [RedisPubSub] 全購読解除: ${channel}`);
      this.messageHandlers.delete(channel);
      this.subscribeInProgress.delete(channel); // 進行中処理もクリア
      try {
        await this.subscriber.unsubscribe(channel);
      } catch (error) {
        console.error(`❌ [RedisPubSub] 購読解除エラー: ${channel}`, error);
      }
    }
  }

  /**
   * メッセージを発行
   */
  public async publish(channel: string, data: PubSubNotificationData): Promise<number> {
    const message = JSON.stringify(data);
    console.log(`📤 [RedisPubSub] メッセージ発行: channel=${channel}`, data);
    return await this.publisher.publish(channel, message);
  }

  /**
   * GraphQL通知を発行（WebSocketからGraphQLサブスクリプションに移行）
   */
  public async publishGraphQLNotification(
    userId: string,
    data: PubSubNotificationData
  ): Promise<number> {
    // GraphQLサブスクリプション用のチャンネル
    const channel = `notification:${userId}`;
    return await this.publish(channel, data);
  }

  /**
   * メディア処理通知を発行
   */
  public async publishMediaNotification(
    mediaId: string,
    data: PubSubNotificationData
  ): Promise<number> {
    const channel = `media:${mediaId}`;
    return await this.publish(channel, data);
  }

  /**
   * 投稿処理通知を発行
   */
  public async publishPostNotification(
    postId: string,
    data: PubSubNotificationData
  ): Promise<number> {
    const channel = `post:${postId}`;
    return await this.publish(channel, data);
  }

  /**
   * 全ての購読を解除
   */
  public async unsubscribeAll(): Promise<void> {
    await this.subscriber.unsubscribe();
    await this.subscriber.punsubscribe();
    this.messageHandlers.clear();
    console.log('全ての購読を解除しました');
  }

  /**
   * GraphQLサブスクリプション用のAsyncIterator
   */
  public asyncIterator(channels: string[]): AsyncIterableIterator<PubSubNotificationData> {
    const asyncIteratorQueue: PubSubNotificationData[] = [];
    const pullQueue: Array<(value: IteratorResult<PubSubNotificationData>) => void> = [];
    let listening = true;

    const pushValue = (value: PubSubNotificationData) => {
      if (pullQueue.length !== 0) {
        pullQueue.shift()!({ value, done: false });
      } else {
        asyncIteratorQueue.push(value);
      }
    };

    const pullValue = (): Promise<IteratorResult<PubSubNotificationData>> => {
      return new Promise(resolve => {
        if (asyncIteratorQueue.length !== 0) {
          const value = asyncIteratorQueue.shift();
          if (value) {
            resolve({ value, done: false });
          }
        } else {
          pullQueue.push(resolve);
        }
      });
    };

    // チャンネルを購読
    channels.forEach(channel => {
      this.subscribe(channel, data => {
        if (listening) {
          pushValue(data);
        }
      });
    });

    const iterator: AsyncIterableIterator<PubSubNotificationData> = {
      next: pullValue,
      return: async () => {
        listening = false;
        // 購読を解除（並列処理）
        await Promise.all(channels.map(channel => this.unsubscribe(channel)));
        return { value: undefined, done: true };
      },
      throw: async (error: Error) => {
        listening = false;
        return { value: error, done: true };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }
}

/**
 * RedisPubSubManagerのファクトリー関数
 */
export async function createRedisPubSubManager(): Promise<RedisPubSubManager> {
  const manager = RedisPubSubManager.getInstance();
  await manager.initialize();
  return manager;
}
