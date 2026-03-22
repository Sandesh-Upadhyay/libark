/**
 * 🧹 Apollo Client メモリ管理とキャッシュクリア
 *
 * createApolloClient.tsから分離してメンテナンス性を向上
 */

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core';

/**
 * 🧹 Apollo Clientキャッシュクリア関数（メモリ最適化版）
 * 削除されたメディア参照などの古いキャッシュをクリア
 */
export async function clearApolloCache(client: ApolloClient<NormalizedCacheObject>) {
  if (!client) {
    console.warn('⚠️ Apollo Client が提供されていません');
    return;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Apollo Clientキャッシュクリア開始');
    }

    // ガベージコレクションを実行してから完全クリア
    client.cache.gc();
    await client.clearStore();

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Apollo Clientキャッシュクリア完了');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Apollo Clientキャッシュクリアエラー:', error);
    }
  }
}

/**
 * 🔄 Apollo Clientメモリ最適化関数（シンプル版）
 * 標準的なガベージコレクションのみ実行
 */
export function optimizeApolloMemory(client: ApolloClient<NormalizedCacheObject>) {
  if (!client) {
    console.warn('⚠️ Apollo Client が提供されていません');
    return;
  }

  try {
    // 標準的なガベージコレクションのみ実行
    const gcResult = client.cache.gc();

    if (process.env.NODE_ENV === 'development' && gcResult.length > 0) {
      console.log('🧹 Apollo Cache GC実行:', {
        removedEntries: gcResult.length,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Apollo メモリ最適化エラー:', error);
    }
  }
}

/**
 * 🎯 特定の投稿キャッシュを削除
 */
export function evictPostFromCache(client: ApolloClient<NormalizedCacheObject>, postId: string) {
  if (!client) {
    console.warn('⚠️ Apollo Client が提供されていません');
    return;
  }

  try {
    console.log(`🗑️ 投稿キャッシュ削除: ${postId}`);
    client.cache.evict({
      id: client.cache.identify({ __typename: 'Post', id: postId }),
    });
    client.cache.gc();
    console.log(`✅ 投稿キャッシュ削除完了: ${postId}`);
  } catch (error) {
    console.error(`❌ 投稿キャッシュ削除エラー: ${postId}`, error);
  }
}

/**
 * 🎯 特定のメディアキャッシュを削除
 */
export function evictMediaFromCache(client: ApolloClient<NormalizedCacheObject>, mediaId: string) {
  if (!client) {
    console.warn('⚠️ Apollo Client が提供されていません');
    return;
  }

  try {
    console.log(`🗑️ メディアキャッシュ削除: ${mediaId}`);
    client.cache.evict({
      id: client.cache.identify({ __typename: 'Media', id: mediaId }),
    });
    client.cache.gc();
    console.log(`✅ メディアキャッシュ削除完了: ${mediaId}`);
  } catch (error) {
    console.error(`❌ メディアキャッシュ削除エラー: ${mediaId}`, error);
  }
}

/**
 * 🔄 Apollo Clientリセット関数（テスト用）
 */
export function resetApolloClient(
  clientSetter: (client: ApolloClient<NormalizedCacheObject> | null) => void
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Apollo Clientをリセット');
  }
  clientSetter(null);
}
