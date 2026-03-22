'use client';

/**
 * PostListItem - シンプルな投稿リストアイテムコンポーネント (Molecule)
 *
 * 設計原則:
 * - Apollo GraphQLとの統合
 * - 必要最低限の機能に集約
 * - パフォーマンス最適化
 * - Shadcn UIコンポーネント活用
 * - 冗長な処理の統廃合
 *
 * 特徴:
 * - PostInfoFragmentを使用した型安全な実装
 * - React.memoによる最適化
 * - シンプルなイベントハンドリング
 * - アトミックデザイン原則に基づく構成
 * - Apollo Clientキャッシュ最適化対応
 *
 * Apollo Clientキャッシュ戦略:
 * - PostInfoFragmentによる統一されたキャッシュキー
 * - cache-firstポリシーによる高速表示
 * - 楽観的更新によるUX向上
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostInfoFragment, UserInfoFragment } from '@libark/graphql-client';
import { useAuth } from '@libark/graphql-client';
// Card UIコンポーネントは統一デザインのため削除
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';


import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms';
import { UserAvatar } from '@/components/molecules/UserAvatar';

import { PostActions } from './PostActions';
import { PostImageDisplay } from './PostImageDisplay';

// 統一されたデザインシステム（LeftSidebar・PostTabNavigation基準）
const UNIFIED_ITEM_CLASSES =
  'px-4 py-4 text-sm font-medium transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

// GraphQL生成型を使用した型安全な投稿型定義
export type PostListItemData = PostInfoFragment;

interface PostListItemProps {
  /** 投稿データ（PostInfoFragment） */
  post: PostListItemData;
  /** 現在の認証ユーザー情報（GraphQL生成型UserInfoFragment使用） */
  currentUser?: UserInfoFragment | null;
  /** いいねトグル処理 */
  onToggleLike?: (postId: string) => void;
  /** 削除処理 */
  onDelete?: (postId: string) => void;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * シンプルな投稿リストアイテムコンポーネント
 *
 * ✅ GraphQL生成型を使用した型安全な実装
 * ✅ 必要最低限の機能に集約（軽量化済み）
 * ✅ パフォーマンス最適化済み
 * ✅ Shadcn UIコンポーネント活用
 * ✅ 不要な機能削除済み（画像モーダル、詳細ログ、複雑なイベントハンドリング）
 * ✅ シンプルなクリック操作のみ
 */
const PostListItemComponent: React.FC<PostListItemProps> = ({
  post,
  currentUser: propCurrentUser,
  onToggleLike,
  onDelete,
  className,
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // propsで渡されたcurrentUserを優先、なければuseAuthから取得
  const currentUser = propCurrentUser || authUser;

  // 投稿詳細ページへの遷移
  const handlePostClick = useCallback(() => {
    navigate(`/posts/${post.id}`);
  }, [post.id, navigate]);

  // ユーザープロフィールページへの遷移
  const handleUserClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/profile/${post.user.username}`);
    },
    [post.user.username, navigate]
  );

  // 自分の投稿かどうかの判定
  const isOwnPost = currentUser?.id === post.user.id;

  // 投稿時間のフォーマット
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <article
      className={cn(UNIFIED_ITEM_CLASSES, 'cursor-pointer space-y-3', className)}
      onClick={handlePostClick}
      data-testid="post-item"
      data-post-id={post.id}
    >
      {/* ユーザー情報ヘッダー */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <UserAvatar
            username={post.user.username}
            displayName={post.user.displayName || undefined}
            profileImageId={post.user.profileImageId || undefined}
            size='md'
            interactive={true}
            className='cursor-pointer'
            onClick={() => handleUserClick({} as any)}
          />
          <div className='flex flex-col'>
            <button
              className='text-sm font-medium hover:underline text-left'
              onClick={handleUserClick}
            >
              {post.user.displayName || post.user.username}
            </button>
            <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
              <span>@{post.user.username}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              {post.visibility === 'PAID' && (
                <>
                  <span>•</span>
                  <Badge variant='secondary' className='text-xs'>
                    有料
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 投稿内容 */}
      {post.content && <div className='text-sm leading-relaxed' data-post-content={post.content}>{post.content}</div>}

      {/* 画像表示（PostImageDisplay使用） */}
      <PostImageDisplay
        post={post}
        onImageClick={handlePostClick}
        onInteractiveClick={handlePostClick}
      />

      {/* アクションボタン */}
      <div className='flex items-center justify-between pt-2'>
        {/* 投稿アクション - 統一されたコンポーネントを使用 */}
        <PostActions
          postId={post.id}
          postUser={post.user}
          likesCount={post.likesCount}
          commentsCount={post.commentsCount}
          isLikedByCurrentUser={post.isLikedByCurrentUser}
          currentUser={currentUser}
          onToggleLike={onToggleLike}
          onComment={postId => navigate(`/posts/${postId}`)}
          onDelete={isOwnPost ? () => onDelete?.(post.id) : undefined}
        />
      </div>
    </article>
  );
};

/**
 * React.memoによる最適化（シンプル版）
 *
 * 重要なプロパティのみを比較して不要な再レンダリングを防止
 */
export const PostListItem = React.memo(PostListItemComponent, (prevProps, nextProps) => {
  // 投稿IDが異なる場合は再レンダリング
  if (prevProps.post.id !== nextProps.post.id) return false;

  // いいね関連の変更は必ず再レンダリング
  if (prevProps.post.likesCount !== nextProps.post.likesCount) return false;
  if (prevProps.post.isLikedByCurrentUser !== nextProps.post.isLikedByCurrentUser) return false;

  // コメント数の変更は再レンダリング
  if (prevProps.post.commentsCount !== nextProps.post.commentsCount) return false;

  // コンテンツの変更は再レンダリング
  if (prevProps.post.content !== nextProps.post.content) return false;

  // その他の重要な変更
  if (prevProps.currentUser?.id !== nextProps.currentUser?.id) return false;
  if (prevProps.onToggleLike !== nextProps.onToggleLike) return false;

  // すべての比較をパスした場合は再レンダリングをスキップ
  return true;
});

PostListItem.displayName = 'PostListItem';
