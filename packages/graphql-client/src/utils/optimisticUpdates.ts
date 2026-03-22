/**
 * 🎯 統一楽観的更新ユーティリティ
 *
 * 全ての楽観的更新処理を統一されたパターンで実装するためのユーティリティ関数群
 */

import type { ApolloCache } from '@apollo/client/core';

/**
 * 共通のキャッシュ更新関数型
 */
export type CacheUpdateFunction = (cache: ApolloCache<unknown>) => void;

/**
 * GraphQLエッジの型
 */
interface Edge<T> {
  __typename?: string;
  cursor: string;
  node: T;
}

/**
 * GraphQL接続の型
 */
interface Connection<T> {
  __typename?: string;
  edges: Edge<T>[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
  totalCount: number;
}

/**
 * メッセージ接続の型
 */
interface MessageConnection extends Connection<{ id: string; [key: string]: unknown }> {}

/**
 * コメントの型
 */
interface Comment {
  id: string;
  [key: string]: unknown;
}

/**
 * 投稿接続の型
 */
interface PostConnection extends Connection<{ id: string; [key: string]: unknown }> {}

/**
 * 投稿エッジの型
 */
interface PostEdge extends Edge<{ id: string; [key: string]: unknown }> {}

/**
 * リスト操作の種類
 */
export type ListOperation = 'ADD' | 'REMOVE' | 'UPDATE';

/**
 * リスト更新のオプション
 */
export interface ListUpdateOptions {
  /** 操作の種類 */
  operation: ListOperation;
  /** 対象のアイテムID */
  itemId: string;
  /** 新しいアイテム（ADD/UPDATE時） */
  newItem?: unknown;
  /** リストの先頭に追加するか（ADD時） */
  prepend?: boolean;
}

/**
 * カウント更新のオプション
 */
export interface CountUpdateOptions {
  /** カウントの変更量（+1, -1など） */
  delta: number;
  /** 最小値（デフォルト: 0） */
  min?: number;
}

/**
 * 🔄 メッセージリストから削除（統一パターン）
 */
export function createRemoveFromMessageList(
  conversationId: string,
  messageId: string
): CacheUpdateFunction {
  return (_cache) => {
    _cache.modify({
      id: _cache.identify({ __typename: 'Conversation', id: conversationId }),
      fields: {
        messages(existingMessages) {
          if (!existingMessages?.edges) return existingMessages;

          return {
            ...existingMessages,
            edges: existingMessages.edges.filter((edge: { node: { id: string } }) => edge.node.id !== messageId),
            totalCount: Math.max(0, (existingMessages.totalCount || 0) - 1),
          };
        },
      },
    });
  };
}

/**
 * 🔄 コメントリストから削除（統一パターン）
 */
export function createRemoveFromCommentList(
  commentId: string,
  postId?: string
): CacheUpdateFunction {
  return cache => {
    // コメントリストから削除
    cache.modify({
      fields: {
        comments(existingComments = []) {
          return [...existingComments].filter(comment => comment.id !== commentId);
        },
      },
    });

    // 投稿のコメント数を更新（postIdが分かる場合）
    if (postId) {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          commentsCount(existingCount: number = 0) {
            return Math.max(0, existingCount - 1);
          },
        },
      });
    }
  };
}

/**
 * 🔄 コメントリストに追加（統一パターン）
 */
export function createAddToCommentList(
  newComment: { id: string; [key: string]: unknown },
  postId: string
): CacheUpdateFunction {
  return cache => {
    // コメントリストに追加
    cache.modify({
      fields: {
        comments(existingComments) {
          return [newComment, ...existingComments];
        },
      },
    });

    // 投稿のコメント数を更新
    cache.modify({
      id: cache.identify({ __typename: 'Post', id: postId }),
      fields: {
        commentsCount(existingCount: number = 0) {
          return existingCount + 1;
        },
      },
    });
  };
}

/**
 * 🔄 投稿フィールドを更新（統一パターン）
 */
export function createUpdatePostFields(
  postId: string,
  updates: Record<string, unknown>
): CacheUpdateFunction {
  return cache => {
    const fields: Record<string, () => unknown> = {};

    Object.entries(updates).forEach(([key, value]) => {
      fields[key] = () => value;
    });

    cache.modify({
      id: cache.identify({ __typename: 'Post', id: postId }),
      fields,
    });
  };
}

/**
 * 🔄 投稿リストを更新（統一パターン）
 */
export function createUpdatePostInList(
  postId: string,
  updates: Record<string, unknown>
): CacheUpdateFunction {
  return cache => {
    // 投稿オブジェクト自体を更新
    const postFields: Record<string, () => unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      postFields[key] = () => value;
    });

    cache.modify({
      id: cache.identify({ __typename: 'Post', id: postId }),
      fields: postFields,
    });

    // 投稿リストも更新（必要に応じて）
    cache.modify({
      fields: {
        posts(existingPosts) {
          if (!existingPosts?.edges) return existingPosts;

          const updatedEdges = existingPosts.edges.map(
            (edge: { node: { id: string; [key: string]: unknown } }) => {
              if (edge.node.id === postId) {
                return {
                  ...edge,
                  node: {
                    ...edge.node,
                    ...updates,
                  },
                };
              }
              return edge;
            }
          );

          return {
            ...existingPosts,
            edges: updatedEdges,
          };
        },
      },
    });
  };
}

/**
 * 🔄 複数のキャッシュ更新を組み合わせ（統一パターン）
 */
export function combineUpdates(...updates: CacheUpdateFunction[]): CacheUpdateFunction {
  return cache => {
    updates.forEach(update => update(cache));
  };
}

/**
 * 🔄 安全なキャッシュ更新実行（統一パターン）
 */
export function safeUpdateCache(
  cache: ApolloCache<unknown>,
  updateFn: CacheUpdateFunction,
  errorContext?: string
): void {
  try {
    updateFn(cache);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ キャッシュ更新エラー${errorContext ? ` (${errorContext})` : ''}:`, error);
    }
  }
}

/**
 * 🔄 投稿リストに追加（統一パターン）
 */
export function createAddToPostList(newPost: {
  id: string;
  [key: string]: unknown;
}): CacheUpdateFunction {
  return cache => {
    // 投稿リストに追加
    cache.modify({
      fields: {
        posts(existingPosts) {
          if (!existingPosts?.edges) {
            return {
              edges: [{ __typename: 'PostEdge', cursor: newPost.id, node: newPost }],
              pageInfo: { hasNextPage: false, endCursor: newPost.id },
              totalCount: 1,
            };
          }

          return {
            ...existingPosts,
            edges: [
              { __typename: 'PostEdge', cursor: newPost.id, node: newPost },
              ...existingPosts.edges,
            ],
            totalCount: (existingPosts.totalCount || 0) + 1,
          };
        },
      },
    });
  };
}

/**
 * 🔄 投稿リストから削除（統一パターン）
 */
export function createRemoveFromPostList(postId: string): CacheUpdateFunction {
  return cache => {
    // 投稿リストから削除
    cache.modify({
      fields: {
        posts(existingPosts) {
          if (!existingPosts?.edges) return existingPosts;

          return {
            ...existingPosts,
            edges: existingPosts.edges.filter((edge: { node: { id: string } }) => edge.node.id !== postId),
            totalCount: Math.max(0, (existingPosts.totalCount || 0) - 1),
          };
        },
      },
    });

    // 投稿オブジェクト自体も削除
    cache.evict({
      id: cache.identify({ __typename: 'Post', id: postId }),
    });
    cache.gc();
  };
}

/**
 * 🔄 ユーザーフィールドを更新（統一パターン）
 */
export function createUpdateUserFields(
  userId: string,
  updates: Record<string, unknown>
): CacheUpdateFunction {
  return cache => {
    const fields: Record<string, () => unknown> = {};

    Object.entries(updates).forEach(([key, value]) => {
      fields[key] = () => value;
    });

    cache.modify({
      id: cache.identify({ __typename: 'User', id: userId }),
      fields,
    });
  };
}

/**
 * 🔄 メッセージリストに追加（統一パターン）
 */
export function createAddToMessageList(
  conversationId: string,
  newMessage: { id: string; [key: string]: unknown }
): CacheUpdateFunction {
  return cache => {
    cache.modify({
      id: cache.identify({ __typename: 'Conversation', id: conversationId }),
      fields: {
        messages(existingMessagesRef) {
          if (!existingMessagesRef?.edges) {
            return {
              edges: [{ __typename: 'MessageEdge', cursor: newMessage.id, node: newMessage }],
              pageInfo: { hasNextPage: false, endCursor: newMessage.id },
              totalCount: 1,
            };
          }

          return {
            ...existingMessagesRef,
            edges: [
              { __typename: 'MessageEdge', cursor: newMessage.id, node: newMessage },
              ...existingMessagesRef.edges,
            ],
            totalCount: (existingMessagesRef.totalCount || 0) + 1,
          };
        },
      },
    });
  };
}

/**
 * 🔄 会話リストを更新（統一パターン）
 */
export function createUpdateConversationList(updatedConversation: {
  id: string;
  [key: string]: unknown;
}): CacheUpdateFunction {
  return cache => {
    cache.modify({
      fields: {
        conversations(existingConversations) {
          if (!existingConversations?.edges) {
            return {
              edges: [
                {
                  __typename: 'ConversationEdge',
                  cursor: updatedConversation.id,
                  node: updatedConversation,
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: updatedConversation.id },
              totalCount: 1,
            };
          }

          const existingEdges = existingConversations.edges || [];
          const conversationIndex = existingEdges.findIndex(
            (edge: { node: { id: string } }) => edge.node.id === updatedConversation.id
          );

          let updatedEdges;
          if (conversationIndex >= 0) {
            // 既存の会話を更新
            updatedEdges = [...existingEdges];
            updatedEdges[conversationIndex] = {
              ...updatedEdges[conversationIndex],
              node: updatedConversation,
            };
          } else {
            // 新しい会話を先頭に追加
            updatedEdges = [
              {
                __typename: 'ConversationEdge',
                cursor: updatedConversation.id,
                node: updatedConversation,
              },
              ...existingEdges,
            ];
          }

          return {
            ...existingConversations,
            edges: updatedEdges,
            totalCount:
              conversationIndex >= 0
                ? existingConversations.totalCount
                : (existingConversations.totalCount || 0) + 1,
          };
        },
      },
    });
  };
}

/**
 * 🎯 楽観的更新のファクトリー関数
 */
export const OptimisticUpdates = {
  /** メッセージ削除 */
  removeMessage: createRemoveFromMessageList,

  /** メッセージ追加 */
  addMessage: createAddToMessageList,

  /** コメント削除 */
  removeComment: createRemoveFromCommentList,

  /** コメント追加 */
  addComment: createAddToCommentList,

  /** 投稿追加 */
  addPost: createAddToPostList,

  /** 投稿削除 */
  removePost: createRemoveFromPostList,

  /** 投稿フィールド更新 */
  updatePost: createUpdatePostFields,

  /** 投稿リスト内更新 */
  updatePostInList: createUpdatePostInList,

  /** ユーザーフィールド更新 */
  updateUser: createUpdateUserFields,

  /** 会話リスト更新 */
  updateConversationList: createUpdateConversationList,

  /** 複数更新の組み合わせ */
  combine: combineUpdates,

  /** 安全な実行 */
  safe: safeUpdateCache,
} as const;
