'use client';

import React, { useCallback, useMemo } from 'react';
import type { UserInfoFragment } from '@libark/graphql-client';


import { cn } from '@/lib/utils';
import { getComponentZIndexClass } from '@/lib/constants/z-index';

import { LikeButton, CommentButton, MenuButton } from '../atoms';

interface PostActionsProps {
  /** 投稿ID */
  postId: string;
  /** 投稿者情報（メニュー表示判定用） */
  postUser?: {
    id: string;
  };
  /** いいね数（GraphQLから直接取得） */
  likesCount?: number;
  /** コメント数（GraphQLから直接取得） */
  commentsCount?: number;
  /** 現在のユーザーがいいねしているかどうか */
  isLikedByCurrentUser?: boolean | null;
  /** 現在の認証ユーザー情報（上位コンポーネントから渡される） */
  currentUser?: UserInfoFragment | null;
  /** いいねトグルハンドラー */
  onToggleLike?: (postId: string) => void;
  /** コメントクリックハンドラー */
  onComment?: (postId: string) => void;
  /** 削除ハンドラー */
  onDelete?: () => void;
  /** インタラクティブ要素のクリック防止ハンドラー */
  onInteractiveClick?: (e: React.MouseEvent) => void;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * PostActions - 投稿アクションコンポーネント (Molecule)
 *
 * 責任:
 * - いいねボタンの表示と機能
 * - コメントボタンの表示と機能
 * - アクション数の表示
 * - 認証状態の管理（Propsで受け取り）
 *
 * 特徴:
 * - 認証チェック付きいいね機能
 * - ActionButtonによる統一スタイル
 * - アクセシビリティ対応
 * - レスポンシブデザイン
 * - 🎯 認証状態はPropsで受け取り、重複クエリを防止
 */
export const PostActions: React.FC<PostActionsProps> = ({
  postId,
  postUser,
  likesCount,
  commentsCount,
  isLikedByCurrentUser,
  currentUser,
  onToggleLike,
  onComment,
  onDelete,
  onInteractiveClick,
  className,
}) => {
  // 認証状態はPropsから取得（重複クエリを防止）
  const user = currentUser;

  // 投稿者が現在のユーザーかどうか
  const isOwnPost = useMemo(() => {
    return user && postUser && user.id === postUser.id;
  }, [user, postUser]);

  // インタラクティブクリック防止ハンドラー
  const handleInteractiveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onInteractiveClick) {
        onInteractiveClick(e);
      }
    },
    [onInteractiveClick]
  );

  // 削除ボタンのクリックハンドラー
  const handleDeleteClick = useCallback(() => {
    console.log('🗑️ PostActions: 削除ボタンがクリックされました');
    if (onDelete) {
      console.log('🗑️ PostActions: onDeleteを呼び出します');
      onDelete();
    } else {
      console.log('❌ PostActions: onDeleteが未定義です');
    }
  }, [onDelete]);

  // いいね状態の計算（Propsから直接取得）
  const isLiked = useMemo(() => {
    return isLikedByCurrentUser ?? false;
  }, [isLikedByCurrentUser]);

  return (
    <div
      onClick={handleInteractiveClick}
      className={cn('flex items-center justify-between w-full', className)}
    >
      <div className='flex items-center gap-2'>
        {/* いいねボタン - 機能フラグで自動制御 */}
        <LikeButton
          postId={postId}
          likesCount={likesCount ?? 0}
          isLiked={isLiked}
          onToggleLike={onToggleLike}
          onInteractiveClick={handleInteractiveClick}
        />

        {/* コメントボタン */}
        <CommentButton
          postId={postId}
          commentsCount={commentsCount ?? 0}
          onComment={onComment}
          onInteractiveClick={handleInteractiveClick}
        />
      </div>

      {/* 右側メニューエリア */}
      <div className={`flex items-center relative ${getComponentZIndexClass('UserMenu')}`}>
        {isOwnPost && onDelete && (
          <MenuButton onDelete={handleDeleteClick} onInteractiveClick={handleInteractiveClick} />
        )}
      </div>
    </div>
  );
};

export type { PostActionsProps };
