/**
 * 🎯 コメントセクション統合コンポーネント (Feature-specific)
 *
 * コメント一覧とフォームを統合した責任分離実装
 * 投稿機能固有のコンポーネント
 */

'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

// フック類をインポート（移行済み）

import type { CommentSectionProps } from '@/features/posts/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/atoms';

import {
  useApolloGraphQLComments,
  useApolloGraphQLCreateComment,
  useApolloGraphQLDeleteComment,
} from '../../hooks/useApolloGraphQLComments';
import { useToggleCommentLike } from '../../hooks/useToggleCommentLike';

import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';


export const CommentSection = ({ postId, commentsCount, currentUser }: CommentSectionProps) => {
  // Comment関連のフックを使用
  const { data: comments, isLoading, error } = useApolloGraphQLComments(postId);
  const createCommentMutation = useApolloGraphQLCreateComment();
  const deleteCommentMutation = useApolloGraphQLDeleteComment();
  const { toggleCommentLike } = useToggleCommentLike();

  // コメント作成ハンドラー
  const handleCreateComment = async (data: { postId: string; content: string }) => {
    await createCommentMutation.mutateAsync(data);
  };

  // コメントいいねハンドラー
  const handleToggleLike = async (commentId: string) => {
    await toggleCommentLike({ variables: { commentId } });
  };

  // コメント削除ハンドラー
  const handleDeleteComment = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync(commentId);
  };

  return (
    <div className={cn('p-4')}>
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5 text-muted-foreground' />
          <h3 className='font-semibold text-lg text-foreground'>
            コメント {commentsCount ? `(${commentsCount})` : ''}
          </h3>
        </div>

        <CommentForm
          postId={postId}
          currentUser={currentUser}
          onSubmit={handleCreateComment}
          isSubmitting={createCommentMutation.isPending}
        />

        <Separator />

        <CommentList
          postId={postId}
          currentUser={currentUser}
          comments={comments}
          isLoading={isLoading}
          error={error}
          onToggleLike={handleToggleLike}
          onDelete={handleDeleteComment}
          isDeleting={deleteCommentMutation.isPending}
        />
      </div>
    </div>
  );
};

// 型定義は ../../types/comment.types からエクスポート
