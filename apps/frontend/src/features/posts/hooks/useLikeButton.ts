'use client';

import React, { useCallback } from 'react';
import { useAuth } from '@libark/graphql-client';
import { toast } from 'sonner';

/**
 * いいねボタンの共通ロジックフック
 *
 * PostListItemとPostActionsで重複していたロジックを統一
 * - 認証チェック
 * - ログ出力
 * - エラーハンドリング
 * - トースト表示
 */
export const useLikeButton = () => {
  const { user } = useAuth();

  /**
   * いいねボタンのクリックハンドラー
   *
   * @param postId - 投稿ID
   * @param onToggleLike - いいねトグル関数
   * @param componentName - ログ用のコンポーネント名
   */
  const handleLikeClick = useCallback(
    async (
      postId: string,
      onToggleLike?: (postId: string) => void,
      componentName = 'LikeButton'
    ) => {
      // 🔍 デバッグログ
      console.log(`🔍 [${componentName}] いいねクリック:`, {
        postId,
        user: user ? { id: user.id, username: user.username } : null,
        hasOnToggleLike: !!onToggleLike,
      });

      // 認証チェック - 未認証の場合は早期リターン
      if (!user) {
        console.log(`🔐 [${componentName}] 未認証ユーザーのいいね試行`);
        toast.warning('ログインが必要です');
        return; // 早期リターンでmutation実行を防ぐ
      }

      // 認証済みの場合のみmutation実行
      console.log(`✅ [${componentName}] 認証済みユーザーのいいね実行:`, postId);
      if (onToggleLike) {
        try {
          // 🔍 重要: onToggleLikeはPromiseを返すためawaitする
          await onToggleLike(postId);
          console.log(`✅ [${componentName}] いいね成功:`, postId);
        } catch (error: unknown) {
          // バックエンドからの機能無効エラーをハンドリング
          if (
            (
              error as { graphQLErrors?: Array<{ extensions?: { code?: string } }> }
            )?.graphQLErrors?.some(e => e.extensions?.code === 'FEATURE_DISABLED')
          ) {
            toast.error('いいね機能は現在無効になっています');
          } else {
            toast.error('いいねの処理に失敗しました');
          }
          console.error(`❌ [${componentName}] いいねエラー:`, error);
        }
      } else {
        console.warn(`⚠️ [${componentName}] onToggleLikeが未定義です`);
      }
    },
    [user]
  );

  /**
   * イベント付きいいねハンドラー（PostListItem用）
   *
   * @param e - マウスイベント
   * @param postId - 投稿ID
   * @param onToggleLike - いいねトグル関数
   * @param componentName - ログ用のコンポーネント名
   */
  const handleLikeClickWithEvent = useCallback(
    async (
      e: React.MouseEvent,
      postId: string,
      onToggleLike?: (postId: string) => void,
      componentName = 'LikeButton'
    ) => {
      e.stopPropagation();
      await handleLikeClick(postId, onToggleLike, componentName);
    },
    [handleLikeClick]
  );

  return {
    user,
    handleLikeClick,
    handleLikeClickWithEvent,
  };
};
