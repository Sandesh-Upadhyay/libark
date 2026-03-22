/**
 * 🎯 Apollo Client キャッシュポリシー定義
 *
 * createApolloClient.tsから分離してメンテナンス性を向上
 */

import type { TypePolicies, Reference } from '@apollo/client/core';
import { LogCategory, unifiedLoggerHelpers as logger } from '@libark/core-shared';

/**
 * 🔑 統一されたTypePolicies設定
 */
export function createTypePolicies(): TypePolicies {
  return {
    Query: {
      fields: {
        // 🔑 me クエリの最適化（シンプル版）
        me: {
          keyArgs: false,
          merge: (existing, incoming) => incoming || existing,
        },

        // 🔑 mySettings クエリの完全シングルトン化
        mySettings: {
          keyArgs: false,
          merge: (existing, incoming) => {
            logger.debug(LogCategory.APOLLO, 'mySettingsクエリキャッシュマージ', {
              hasExisting: !!existing,
              hasIncoming: !!incoming,
              incomingUserId: incoming?.userId,
            });
            return incoming;
          },
          read: existing => {
            if (existing) {
              logger.debug(LogCategory.APOLLO, 'mySettingsクエリキャッシュ読み取り', {
                userId: existing.userId,
                theme: existing.theme,
              });
            }
            return existing;
          },
        },

        // 🔄 投稿のカーソルベースページネーション
        posts: {
          keyArgs: ['userId', 'visibility'],
          merge(existing, incoming, { args }) {
            if (!existing || !existing.edges) {
              return incoming;
            }

            if (args?.after) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            }

            // 手動追加された投稿を保持
            const incomingIds = new Set(
              incoming.edges.map((edge: { node: { id: string } }) => edge.node.id)
            );
            const manuallyAddedPosts = existing.edges.filter(
              (edge: { node: { id: string } }) => !incomingIds.has(edge.node.id)
            );

            return {
              ...incoming,
              edges: [...manuallyAddedPosts, ...incoming.edges],
            };
          },
        },

        // 🔄 タイムラインのカーソルベースページネーション
        timeline: {
          keyArgs: ['type'],
          merge(existing, incoming, { args }) {
            if (!existing || !existing.edges) {
              return incoming;
            }

            if (args?.after) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            }

            // 手動追加された投稿を保持
            const incomingIds = new Set(
              incoming.edges.map((edge: { node: { id: string } }) => edge.node.id)
            );
            const manuallyAddedPosts = existing.edges.filter(
              (edge: { node: { id: string } }) => !incomingIds.has(edge.node.id)
            );

            return {
              ...incoming,
              edges: [...manuallyAddedPosts, ...incoming.edges],
            };
          },
        },

        // � 通知のページネーション
        notifications: {
          keyArgs: ['isRead', 'type'],
          merge(existing, incoming, { args, readField }) {
            if (!existing || !args?.after) {
              return incoming;
            }

            const safeExisting = Array.isArray(existing) ? existing : [];
            const safeIncoming = Array.isArray(incoming) ? incoming : [];

            const existingIds = new Set(
              safeExisting
                .filter(ref => ref && typeof ref === 'object')
                .map((ref: Reference) => {
                  try {
                    return readField('id', ref);
                  } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                      console.warn('⚠️ [Apollo] readField エラー:', error, ref);
                    }
                    return null;
                  }
                })
                .filter(id => id != null)
            );

            const uniqueIncoming = safeIncoming
              .filter(ref => ref && typeof ref === 'object')
              .filter((ref: Reference) => {
                try {
                  const refId = readField('id', ref);
                  return refId != null && !existingIds.has(refId);
                } catch (error) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ [Apollo] readField エラー:', error, ref);
                  }
                  return false;
                }
              });

            return [...safeExisting, ...uniqueIncoming];
          },
        },

        // 💬 コメントのキャッシュ
        comments: {
          keyArgs: ['postId'],
          merge(existing = [], incoming, { args }) {
            console.log('🔄 [Apollo] コメントキャッシュマージ:', {
              postId: args?.postId,
              existingCount: existing.length,
              incomingCount: incoming?.length || 0,
            });

            if (!existing || existing.length === 0) {
              return incoming;
            }

            const incomingIds = new Set(
              incoming?.map((comment: { id: string }) => comment.id) || []
            );
            const manuallyAddedComments = existing.filter(
              (comment: { id: string }) => !incomingIds.has(comment.id)
            );

            return [...(incoming || []), ...manuallyAddedComments];
          },
        },
      },
    },

    User: {
      keyFields: ['id'],
      merge: (existing, incoming, { mergeObjects }) => {
        return mergeObjects(existing, incoming);
      },
      fields: {
        posts: {
          merge: (_, incoming) => incoming,
        },
        profileImageId: {
          merge: (_, incoming) => incoming,
        },
        coverImageId: {
          merge: (_, incoming) => incoming,
        },
        updatedAt: {
          merge: (_, incoming) => incoming,
        },
      },
    },

    Media: {
      keyFields: ['id'],
      fields: {
        url: { merge: true },
        thumbnailUrl: { merge: true },
        variants: {
          merge: (existing, incoming) => incoming || existing || [],
        },
        s3Key: { merge: true },
        fileSize: { merge: true },
        width: { merge: true },
        height: { merge: true },
      },
    },

    Mutation: {
      fields: {
        generatePresignedDownload: {
          keyArgs: ['s3Key'],
          merge(existing, incoming) {
            if (incoming?.expiresAt) {
              const now = Date.now();
              const expiresAt = new Date(incoming.expiresAt).getTime();
              const margin = 5 * 60 * 1000; // 5分マージン

              if (expiresAt - margin > now) {
                return incoming;
              }
            }
            return incoming || existing;
          },
        },
      },
    },

    Post: {
      keyFields: ['id'],
      fields: {
        likesCount: { merge: true },
        commentsCount: { merge: true },
        isLikedByCurrentUser: { merge: true },
      },
      merge: (existing, incoming, { mergeObjects }) => {
        return mergeObjects(existing, incoming);
      },
    },

    Notification: {
      keyFields: ['id'],
    },
  };
}
