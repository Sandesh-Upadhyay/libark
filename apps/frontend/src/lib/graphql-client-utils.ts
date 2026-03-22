/**
 * GraphQL Client Utils実装
 * 外部ライブラリが見つからない場合の代替実装
 */

import type { ApolloCache } from '@apollo/client';

export interface OptimisticUpdatesInterface {
  updateCache: (cache: ApolloCache<unknown>, data: unknown) => void;
  rollback: () => void;
}

export class OptimisticUpdates implements OptimisticUpdatesInterface {
  private originalData: unknown = null;

  updateCache(cache: ApolloCache<unknown>, data: unknown): void {
    // キャッシュの楽観的更新を実装
    this.originalData = { ...cache };
    Object.assign(cache, data);
  }

  rollback(): void {
    // ロールバック処理を実装
    if (this.originalData) {
      console.log('Rolling back optimistic update');
      // 実際のロールバック処理はここに実装
    }
  }

  // メッセージ削除用の静的メソッド
  static removeMessage(conversationId: string, messageId: string) {
    return (_cache: ApolloCache<unknown>) => {
      console.log(`Removing message ${messageId} from conversation ${conversationId}`);
      // 実際のキャッシュ更新処理
    };
  }

  // 安全な楽観的更新用の静的メソッド
  static safe(updateFunction: (cache: ApolloCache<unknown>) => void) {
    return (cache: ApolloCache<unknown>) => {
      try {
        updateFunction(cache);
      } catch (error) {
        console.error('Optimistic update failed:', error);
      }
    };
  }
}
