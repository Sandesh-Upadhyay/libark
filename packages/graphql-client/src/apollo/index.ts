/**
 * 🎯 Apollo Client 統一エクスポート（シンプル化版）
 *
 * 分離された各機能を統合し、シングルトンパターンでクライアントを管理
 */

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core';

import { createApolloClient } from './createApolloClient.js';

// 再エクスポート
export * from './createApolloClient.js';
export * from './typePolicies.js';
export * from './errorHandlers.js';
export * from './websocketLink.js';
export * from './memory.js';

type LibarkApolloClient = ApolloClient<NormalizedCacheObject>;

// Apollo Clientインスタンス（遅延初期化）
let apolloClientInstance: LibarkApolloClient | null = null;

/**
 * 🚀 Apollo Client取得関数（安全な初期化）
 *
 * シングルトンパターンでクライアントインスタンスを管理
 */
export function getApolloClient(): LibarkApolloClient | null {
  // SSR環境では常にnullを返す
  if (typeof window === 'undefined') {
    return null;
  }

  // 既存のインスタンスがある場合はそれを返す
  if (apolloClientInstance) {
    return apolloClientInstance;
  }

  try {
    apolloClientInstance = createApolloClient();

    if (!apolloClientInstance) {
      throw new Error('createApolloClient()がnullを返しました');
    }

    return apolloClientInstance;
  } catch (error) {
    console.error('❌ Apollo Client作成エラー:', error);

    // エラー時はnullを返す
    apolloClientInstance = null;
    return null;
  }
}

/**
 * 🔄 Apollo Clientリセット関数（テスト環境やエラー回復時に使用）
 */
export function resetApolloClient() {
  if (apolloClientInstance) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Apollo Clientをリセット');
    }
    apolloClientInstance = null;
  }
}

/**
 * 後方互換性のためのエクスポート（安全な初期化）
 */
export const apolloClient: LibarkApolloClient | null =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return getApolloClient();
        } catch (error) {
          console.error('❌ apolloClient初期化エラー:', error);
          return null;
        }
      })()
    : null;

export default apolloClient;
