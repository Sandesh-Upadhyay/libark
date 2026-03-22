/**
 * 🛠️ Apollo Client エラーハンドリング
 *
 * createApolloClient.tsから分離してメンテナンス性を向上
 */

import type { ErrorResponse } from '@apollo/client/link/error';

/**
 * 🔐 認証エラーのハンドリング
 */
function handleAuthenticationError(code: string) {
  if (code === 'UNAUTHENTICATED') {
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 [GraphQL] 認証エラー検出 - Cookie認証では自動処理');
        console.log('ℹ️ [GraphQL] Cookie認証エラー処理完了');
      }
      // Cookie認証では、サーバーが自動的にCookieを無効化するため
      // クライアント側での明示的な削除は不要
      // Zustandストアの状態は次回のクエリで自動的に更新される
    }
  }
}

/**
 * 🗂️ メディア関連エラーのハンドリング
 */
function handleMediaNotFoundError(message: string, path: readonly (string | number)[] | undefined) {
  if (message === 'メディアが見つかりません' || message.includes('NOT_FOUND')) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ メディア参照エラー検出 - キャッシュクリアを推奨');
      console.log(
        '💡 解決方法: ブラウザを更新するか、開発者ツールでキャッシュをクリアしてください'
      );

      // パスからメディア関連エラーかチェック
      if (path && Array.isArray(path) && path.includes('media')) {
        console.log('🗑️ メディア関連エラー - Apollo Clientキャッシュ部分クリア実行');

        // 軽量なキャッシュクリア（呼び出し元でclient参照を渡す形に変更）
        console.log('💡 メディア関連エラー検出 - 呼び出し元でキャッシュクリアを実行してください');

        // グローバルイベントでキャッシュクリアを通知（循環依存回避）
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('apollo-cache-gc-request', {
              detail: { reason: 'media-not-found', path },
            })
          );
        }
      }
    }
  }
}

/**
 * 💬 メッセージ関連エラーのハンドリング
 */
function handleMessagePermissionError(
  message: string,
  path: readonly (string | number)[] | undefined
) {
  // メッセージ関連の権限エラーを静かに処理
  if (
    (message.includes('会話にアクセスする権限がありません') ||
      message.includes('会話が見つからないか、アクセス権限がありません')) &&
    path &&
    Array.isArray(path) &&
    (path.includes('conversation') || path.includes('messageAdded'))
  ) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🔐 メッセージ権限エラー検出 - 自動処理中');
    }
    // メッセージ関連の権限エラーは各コンポーネントで適切に処理されるため、
    // ここでは静かに処理する
    return true; // 処理済みを示す
  }
  return false;
}

/**
 * 🚨 GraphQLエラーのメインハンドラー
 */
export function handleGraphQLErrors(errorResponse: ErrorResponse) {
  const { graphQLErrors, networkError, operation, forward } = errorResponse;

  // 未使用変数を明示的に無視
  void operation;
  void forward;

  // GraphQLエラーの処理
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      // メッセージ関連の権限エラーを先に処理（静かに処理）
      const isMessagePermissionError = handleMessagePermissionError(message, path);

      // メッセージ権限エラーの場合は詳細ログを抑制
      if (!isMessagePermissionError && process.env.NODE_ENV === 'development') {
        console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`);
      }

      // 認証エラー処理
      if (extensions?.code && typeof extensions.code === 'string') {
        handleAuthenticationError(extensions.code);
      }

      // メディア関連エラー処理
      handleMediaNotFoundError(message, path);
    });
  }

  // ネットワークエラーの処理
  if (networkError) {
    handleNetworkError(networkError);
  }
}

/**
 * 🌐 ネットワークエラーのハンドリング
 */
function handleNetworkError(error: Error | null) {
  if (!error) return;

  // 本番環境では簡潔なログ、開発環境では詳細ログ
  if (process.env.NODE_ENV === 'development') {
    console.error(`Network error: ${error.message}`);
    console.error('Network error details:', error);
  } else {
    console.error('Network error occurred');
  }
}
