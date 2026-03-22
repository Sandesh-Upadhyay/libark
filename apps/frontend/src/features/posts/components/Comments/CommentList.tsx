/**
 * 🎯 コメント一覧表示コンポーネント (Organism)
 *
 * Apollo Client統一によるリアルタイム更新対応
 * 再利用可能な一覧表示コンポーネント
 */

'use client';

import React, { useCallback, useState } from 'react';
import { Loader, Heart } from 'lucide-react';

import { UserAvatar } from '@/components/molecules/UserAvatar';
import { TimeDisplay } from '@/components/molecules/TimeDisplay';
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { CommentListProps } from '@/features/posts/types';

import { MenuButton } from '../atoms/MenuButton';

// CommentListPropsは @/features/posts/types/comment.types からインポート済み

export const CommentList = ({
  postId: _postId,
  currentUser,
  comments = [],
  isLoading = false,
  error = null,
  onToggleLike,
  onDelete,
  isDeleting = false,
}: CommentListProps) => {
  const user = currentUser;

  // 削除確認ダイアログの状態管理
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // 削除確認ダイアログを開く
  const handleDeleteRequest = useCallback((commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  }, []);

  // 削除確認ダイアログをキャンセル
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setCommentToDelete(null);
  }, []);

  // 実際の削除処理
  const handleDeleteConfirm = useCallback(async () => {
    if (commentToDelete && onDelete) {
      try {
        await onDelete(commentToDelete);
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
      } catch (error) {
        console.error('コメント削除エラー:', error);
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
      }
    }
  }, [commentToDelete, onDelete]);

  // コメントいいねハンドラー
  const handleCommentLike = useCallback(
    async (commentId: string) => {
      // 認証チェック - 未認証の場合は早期リターン
      if (!user) {
        console.log('🔐 [CommentList] 未認証ユーザーのいいね試行');
        toast.warning('ログインが必要です');
        return;
      }

      if (onToggleLike) {
        console.log('✅ [CommentList] 認証済みユーザーのコメントいいね実行:', commentId);
        try {
          await onToggleLike(commentId);
        } catch (error) {
          console.error('コメントいいねエラー:', error);
        }
      }
    },
    [user, onToggleLike]
  );

  // インタラクティブクリックハンドラー
  const handleInteractiveClick = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  if (isLoading) {
    return (
      <div className='flex justify-center py-3'>
        <Loader className='h-5 w-5 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-3 text-destructive'>コメントの読み込みに失敗しました</div>
    );
  }

  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return <div className='text-center py-3 text-muted-foreground'>まだコメントがありません</div>;
  }

  return (
    <div>
      {comments.map((comment, _index: number) => (
        <div
          key={comment.id}
          className={cn(
            'transition-colors cursor-pointer p-4 border-b border-border last:border-b-0'
          )}
        >
          <div className='space-y-3'>
            {/* ユーザー情報エリア */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center min-w-0 flex-1'>
                {/* アバター */}
                <UserAvatar
                  username={comment.user.username}
                  displayName={comment.user.displayName ?? undefined}
                  profileImageId={comment.user.profileImageId || undefined}
                  size='sm'
                  interactive={false}
                  lazy={true}
                />

                {/* ユーザー情報テキスト */}
                <div className='flex-1 min-w-0 flex flex-col ml-3'>
                  {/* 表示名 */}
                  {comment.user.displayName && (
                    <span className='text-sm font-medium text-foreground leading-tight truncate'>
                      {comment.user.displayName}
                    </span>
                  )}

                  {/* ユーザー名 */}
                  <span className='text-xs text-muted-foreground leading-tight truncate'>
                    @{comment.user.username}
                  </span>
                </div>
              </div>

              {/* 時間表示 */}
              <div className='flex-shrink-0'>
                <TimeDisplay
                  date={comment.createdAt}
                  enableRealTimeUpdate={true}
                  onInteractiveClick={handleInteractiveClick}
                  size='sm'
                  align='end'
                  className='text-gray-500 dark:text-gray-400'
                />
              </div>
            </div>

            {/* コメント内容 */}
            <div>
              <p className='text-sm text-foreground whitespace-pre-wrap break-words'>
                {comment.content}
              </p>

              {/* アクションボタン */}
              <div className='flex items-center justify-between mt-3'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleCommentLike(comment.id)}
                    disabled={isDeleting}
                    className={cn(
                      'h-8 px-2 gap-1',
                      comment.isLikedByCurrentUser
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label={`いいね ${comment.likesCount || 0}件`}
                    aria-pressed={comment.isLikedByCurrentUser || false}
                  >
                    <Heart
                      className={cn('h-4 w-4', comment.isLikedByCurrentUser ? 'fill-current' : '')}
                    />
                    {(comment.likesCount || 0) > 0 && (
                      <span className='text-xs font-medium tabular-nums'>{comment.likesCount}</span>
                    )}
                  </Button>
                </div>

                {/* 削除メニューボタン（自分のコメントのみ） */}
                {user && user.id === comment.user.id && (
                  <MenuButton
                    onDelete={() => handleDeleteRequest(comment.id)}
                    onInteractiveClick={handleInteractiveClick}
                    className='flex-shrink-0'
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>コメントを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このコメントを削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// 型定義は @/features/posts/types/comment.types からエクスポート
