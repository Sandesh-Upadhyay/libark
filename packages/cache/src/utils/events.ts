/**
 * 📡 キャッシュイベント管理
 */

import { EventEmitter } from 'events';

import type { CacheEvent } from '../types.js';

/**
 * キャッシュイベントエミッター
 */
export class CacheEventEmitter extends EventEmitter {
  constructor() {
    super();

    // デフォルトのリスナー数制限を増加
    this.setMaxListeners(100);
  }

  /**
   * キャッシュイベントの発行
   */
  emitCacheEvent(event: CacheEvent): void {
    this.emit(event.type, event);
    this.emit('*', event); // 全イベント用
  }

  /**
   * ヒットイベントのリスナー登録
   */
  onHit(listener: (event: CacheEvent) => void): this {
    return this.on('hit', listener);
  }

  /**
   * ミスイベントのリスナー登録
   */
  onMiss(listener: (event: CacheEvent) => void): this {
    return this.on('miss', listener);
  }

  /**
   * 設定イベントのリスナー登録
   */
  onSet(listener: (event: CacheEvent) => void): this {
    return this.on('set', listener);
  }

  /**
   * 削除イベントのリスナー登録
   */
  onDelete(listener: (event: CacheEvent) => void): this {
    return this.on('delete', listener);
  }

  /**
   * クリアイベントのリスナー登録
   */
  onClear(listener: (event: CacheEvent) => void): this {
    return this.on('clear', listener);
  }

  /**
   * エラーイベントのリスナー登録
   */
  onError(listener: (event: CacheEvent) => void): this {
    return this.on('error', listener);
  }

  /**
   * 全イベントのリスナー登録
   */
  onAny(listener: (event: CacheEvent) => void): this {
    return this.on('*', listener);
  }

  /**
   * パフォーマンス監視用リスナー
   */
  onPerformance(threshold: number, listener: (event: CacheEvent) => void): this {
    return this.onAny(event => {
      if (event.metadata?.duration && event.metadata.duration > threshold) {
        listener(event);
      }
    });
  }

  /**
   * 統計情報の収集
   */
  collectStats(duration: number = 60000): Promise<CacheEventStats> {
    return new Promise(resolve => {
      const stats: CacheEventStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalEvents: 0,
        averageResponseTime: 0,
        startTime: Date.now(),
        endTime: 0,
      };

      const responseTimes: number[] = [];

      const listener = (event: CacheEvent) => {
        stats.totalEvents++;

        switch (event.type) {
          case 'hit':
            stats.hits++;
            break;
          case 'miss':
            stats.misses++;
            break;
          case 'set':
            stats.sets++;
            break;
          case 'delete':
            stats.deletes++;
            break;
          case 'error':
            stats.errors++;
            break;
        }

        if (event.metadata?.duration) {
          responseTimes.push(event.metadata.duration);
        }
      };

      this.onAny(listener);

      setTimeout(() => {
        this.removeListener('*', listener);

        stats.endTime = Date.now();
        stats.averageResponseTime =
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        resolve(stats);
      }, duration);
    });
  }
}

/**
 * イベント統計情報
 */
export interface CacheEventStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalEvents: number;
  averageResponseTime: number;
  startTime: number;
  endTime: number;
}

/**
 * デフォルトイベントエミッターのシングルトン
 */
let defaultEventEmitter: CacheEventEmitter | null = null;

/**
 * デフォルトイベントエミッターの取得
 */
export function getDefaultEventEmitter(): CacheEventEmitter {
  if (!defaultEventEmitter) {
    defaultEventEmitter = new CacheEventEmitter();
  }
  return defaultEventEmitter;
}

/**
 * イベントエミッターのリセット（テスト用）
 */
export function resetDefaultEventEmitter(): void {
  if (defaultEventEmitter) {
    defaultEventEmitter.removeAllListeners();
  }
  defaultEventEmitter = null;
}
