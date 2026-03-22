'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import type { Post } from '@libark/db';
import { useAuth } from '@libark/graphql-client';
// Card UIコンポーネントは統一デザインのため削除

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms';
import { usePosts } from '@/features/posts/hooks/usePosts';
import { useTimeline } from '@/features/posts/hooks/useTimeline';

import { PostListItem } from '../molecules/PostListItem';

// 統一されたデザインシステム（LeftSidebar・PostTabNavigation基準）
const UNIFIED_ITEM_CLASSES =
  'px-4 py-4 text-sm font-medium transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const UNIFIED_CONTAINER_CLASSES =
  'bg-background border border-border/30 rounded-lg overflow-hidden divide-y divide-border/30';

export interface PostListProps {
  userId?: string; // 特定のユーザーの投稿のみを表示する場合
  postType?: 'posts' | 'liked' | 'media'; // 投稿の種類
  timelineType?: 'FOLLOWING' | 'RECOMMENDED' | 'ALL'; // タイムラインの種類
  refreshTrigger?: number; // 親コンポーネントから再読み込みをトリガーするための値
  // 投稿作成機能を外部に提供するためのコールバック
  onCreatePostReady?: (
    createPost: (postData: { content?: string; visibility?: string; mediaIds?: string[] }) => void
  ) => void;
}

/**
 * 投稿リストコンポーネント
 *
 * シンプルで軽量な投稿一覧表示
 * ✅ 無限スクロール対応
 */
const PostListComponent: React.FC<PostListProps> = ({
  userId,
  postType = 'posts',
  timelineType = 'ALL',
  refreshTrigger: _refreshTrigger = 0,
}) => {
  // 削除確認ダイアログの状態管理

  // シンプルにUI即時反映: 非表示IDを保持
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());

  // 認証状態とユーザー情報を取得
  const { user } = useAuth();

  // タイムライン表示の場合はuseTimelineフックを使用
  const isTimelineMode = timelineType && !userId;

  // タイムライン管理フック（タイムライン表示時）
  const timelineResult = useTimeline({
    type: (timelineType as any) || 'ALL',
    limit: 20,
  });

  // 統一投稿管理フック（プロフィール表示時）
  const postsResult = usePosts({
    userId: userId,
    type: postType === 'posts' ? 'all' : postType,
    limit: 20,
  });

  // 使用するフックの結果を選択
  const {
    posts,
    loading: isLoading,
    loadingMore: isFetchingMore,
    error,
    hasNextPage,
    toggleLike,
    deletePost,
    loadMore,
  } = isTimelineMode ? timelineResult : postsResult;

  const isError = !!error;

  // いいね切り替え処理
  const handleToggleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch (err) {
      console.error('いいねの切り替えに失敗しました:', err);
    }
  };

  // 投稿削除処理
  const handleDeletePost = async (postId: string) => {
    // 先にUIから即時に消す（シンプル・軽量な楽観的UI）
    setHiddenPostIds(prev => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
    try {
      await deletePost(postId);
    } catch (err) {
      // 失敗時のみロールバック
      setHiddenPostIds(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      console.error('投稿の削除に失敗しました:', err);
    }
  };

  const handleDeleteRequest = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
      await handleDeletePost(postToDelete);
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  // さらに読み込み処理
  const handleLoadMore = async () => {
    try {
      await loadMore();
    } catch (err) {
      console.error('追加読み込みに失敗しました:', err);
    }
  };

  // 無限スクロール用のref
  const triggerRef = useRef<HTMLDivElement>(null);

  // シンプルな無限スクロール実装
  useEffect(() => {
    const element = triggerRef.current;
    if (!element || !hasNextPage || isLoading || isFetchingMore || isError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isLoading, isFetchingMore, isError, loadMore]);

  // 空状態の表示
  const getEmptyMessage = () => {
    switch (postType) {
      case 'liked':
        return {
          title: 'いいねした投稿がありません',
          description: '気に入った投稿にいいねしてみましょう！',
        };
      case 'media':
        return {
          title: 'メディア付き投稿がありません',
          description: '画像や動画付きの投稿がまだありません。',
        };
      default:
        return {
          title: '投稿がありません',
          description: 'まだ投稿がありません。最初の投稿を作成してみましょう！',
        };
    }
  };

  const { title, description } = getEmptyMessage();

  const EmptyState = (
    <div className='text-center py-12'>
      <div className='flex flex-col items-center gap-4 sm:gap-6'>
        <div className='p-4 sm:p-6 bg-muted rounded-full'>
          <MessageSquare className='h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground' />
        </div>
        <h3 className='text-xl sm:text-2xl font-bold text-foreground'>{title}</h3>
        <p className='text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed'>
          {description}
        </p>
      </div>
    </div>
  );

  // ローディング状態（ページレベルローディングとの重複を避けるため、軽量な表示に変更）
  if (isLoading && posts.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='flex flex-col items-center space-y-3'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          <p className='text-sm text-muted-foreground'>投稿を読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (isError && posts.length === 0) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          {error instanceof Error ? error.message : '投稿の取得に失敗しました'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='w-full max-w-[600px] mx-auto'>
      {posts.length === 0 && !isLoading ? (
        <div className={UNIFIED_CONTAINER_CLASSES}>
          <div className={UNIFIED_ITEM_CLASSES}>{EmptyState}</div>
        </div>
      ) : (
        <div className={UNIFIED_CONTAINER_CLASSES}>
          {posts
            .filter((p: Post) => !hiddenPostIds.has(p.id))
            .map((post: Post) => {
              const canDelete = user?.id === (post as any).user?.id;

              return (
                <div key={post.id}>
                  <PostListItem
                    post={post as any}
                    onDelete={canDelete ? () => handleDeleteRequest(post.id) : undefined}
                    onToggleLike={handleToggleLike}
                  />
                </div>
              );
            })}
        </div>
      )}

      {/* 無限スクロール制御 */}
      <div className='flex flex-col items-center space-y-4 py-4'>
        {isFetchingMore && (
          <div className='flex items-center space-x-2'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
            <span className='text-sm text-muted-foreground'>投稿を読み込み中...</span>
          </div>
        )}

        {!isFetchingMore && hasNextPage && (
          <button
            onClick={handleLoadMore}
            className='px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            さらに読み込む ({posts.length}件の投稿)
          </button>
        )}

        {!hasNextPage && posts.length > 0 && (
          <p className='text-sm text-muted-foreground'>
            すべての投稿を表示しました ({posts.length}件)
          </p>
        )}
      </div>

      {/* 無限スクロール検出用トリガー要素 */}
      <div
        ref={triggerRef}
        className='h-20 w-full flex items-center justify-center opacity-0 pointer-events-none'
        aria-hidden='true'
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投稿を削除</AlertDialogTitle>
            <AlertDialogDescription>
              この投稿を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// メモ化されたPostListコンポーネント
export const PostList = memo(
  PostListComponent,
  (prevProps, nextProps) =>
    prevProps.userId === nextProps.userId &&
    prevProps.postType === nextProps.postType &&
    prevProps.timelineType === nextProps.timelineType &&
    prevProps.refreshTrigger === nextProps.refreshTrigger
);

// displayNameを設定してデバッグを容易にする
PostList.displayName = 'PostList';

// 型定義は上部で export 済み
