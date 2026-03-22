'use client';

import React, { useState, useCallback } from 'react';
import type { PostInfoFragment, User } from '@libark/graphql-client';
import { useNavigate } from 'react-router-dom';


import { SimpleImageModal, Motion } from '@/components/atoms';
import { cn } from '@/lib/utils';

import { PostHeader, PostContent, PostActions, PostImageDisplay } from '../molecules';

// GraphQL生成型を使用した型安全な投稿型定義
export type PostDetailData = PostInfoFragment;

interface PostDetailProps {
  post: PostDetailData;
  /** 現在の認証ユーザー情報（上位コンポーネントから渡される） */
  currentUser?: User | null;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onToggleLike?: (postId: string) => void;
  /** Post詳細ページ専用のスタイリング */
  variant?: 'default' | 'detail';
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * PostDetail - 投稿詳細表示コンポーネント (Organism)
 *
 * 責任:
 * - 投稿の詳細表示（PostCardの拡張版）
 * - Post詳細ページでの使用に最適化
 * - 既存のMoleculeコンポーネントの組み合わせ
 * - 画像モーダル表示の管理
 *
 * 特徴:
 * - PostCardと同じMoleculeコンポーネントを使用
 * - Post詳細ページ専用のレイアウト調整
 * - クリック時の詳細ページ遷移なし
 * - 拡張されたコンテンツ表示
 * - アトミックデザイン準拠
 */
const PostDetailComponent: React.FC<PostDetailProps> = ({
  post,
  currentUser,
  onComment,
  onDelete,
  onToggleLike,
  variant = 'default',
  className,
}) => {
  const navigate = useNavigate();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 画像IDリストを生成
  const mediaIds = post.media?.map(media => media.id) || [];

  // ユーザープロフィールクリックハンドラー
  const handleUserClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/profile/${post.user.username}`);
    },
    [navigate, post.user.username]
  );

  // 削除ハンドラー
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(post.id);
    }
  }, [onDelete, post.id]);

  // コメントハンドラー
  const handleComment = useCallback(() => {
    if (onComment) {
      onComment(post.id);
    }
  }, [onComment, post.id]);

  // 画像クリックハンドラー
  const handleImageClick = useCallback(
    (index: number, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // クリックされた画像のインデックスを設定してモーダルを開く
      if (post.media && post.media.length > index) {
        setSelectedImageIndex(index);
        setIsImageModalOpen(true);
      }
    },
    [post.media]
  );

  // インタラクティブ要素のクリック防止（Post詳細では不要だが一貫性のため）
  const handleInteractiveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Motion.div preset='fade'>
      <article
        role='article'
        aria-label={`${post.user.username}の投稿詳細`}
        className={cn('bg-card p-4', className)}
      >
        <div className='space-y-3'>
          {/* 投稿ヘッダー */}
          <PostHeader
            user={post.user}
            createdAt={post.createdAt}
            visibility={post.visibility}
            onUserClick={handleUserClick}
            onInteractiveClick={handleInteractiveClick}
            enableRealTimeUpdate={true}
          />

          {/* 投稿内容 */}
          <PostContent
            content={post.content}
            onInteractiveClick={handleInteractiveClick}
            // Post詳細では切り詰めを無効化
            truncateLength={variant === 'detail' ? Number.MAX_SAFE_INTEGER : 280}
          />

          {/* 画像表示 */}
          <PostImageDisplay
            post={post}
            onImageClick={handleImageClick}
            onInteractiveClick={handleInteractiveClick}
          />

          {/* アクションボタン */}
          <PostActions
            postId={post.id}
            postUser={post.user}
            likesCount={post.likesCount}
            commentsCount={post.commentsCount}
            isLikedByCurrentUser={post.isLikedByCurrentUser}
            currentUser={currentUser}
            onToggleLike={onToggleLike}
            onComment={handleComment}
            onDelete={handleDelete}
            onInteractiveClick={handleInteractiveClick}
          />
        </div>
      </article>

      {/* 画像モーダル */}
      {mediaIds.length > 0 && (
        <SimpleImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          mediaIds={mediaIds}
          initialIndex={selectedImageIndex}
          altPrefix={`${post.user.username}の投稿画像`}
        />
      )}
    </Motion.div>
  );
};

// React.memoで最適化
export const PostDetail = React.memo(PostDetailComponent);

export type { PostDetailProps };
