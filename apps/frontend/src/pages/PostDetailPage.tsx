import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, type User } from '@libark/graphql-client';

import {} from '@/components/atoms';
import { Button } from '@/components/atoms';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules';
import { Alert, AlertTitle, AlertDescription, Motion } from '@/components/atoms';
// スタイルは直接Tailwindクラスを使用
import { usePosts, usePost } from '@/features/posts/hooks/usePosts';
import { PostDetail } from '@/features/posts/components/PostDetail';
import { CommentSection } from '@/features/posts/components/Comments/CommentSection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms';
// 型定義は削除（未使用のため）

const PostDetailPage: React.FC = () => {
  const { id: postId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth() as { user: User | null };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 新しい統一フックを使用
  const { post, loading: isLoading, error, refetch } = usePost(postId || '');
  const { toggleLike, deletePost, deleting } = usePosts();

  // いいね切り替え処理
  const handleToggleLike = useCallback(async () => {
    if (!post || !user) return;

    try {
      await toggleLike(post.id);
    } catch (err) {
      console.error('いいねの切り替えに失敗しました:', err);
    }
  }, [post, user, toggleLike]);

  // 投稿削除処理
  const handleDelete = useCallback(async () => {
    if (!post || !user || post.user?.id !== user.id) return;

    try {
      await deletePost(post.id);
      navigate('/home');
    } catch (err) {
      console.error('投稿の削除に失敗しました:', err);
    }
  }, [post, user, deletePost, navigate]);

  // コメント投稿処理
  const handleComment = useCallback(() => {
    // コメントセクションで処理されるため、ここでは何もしない
    refetch();
  }, [refetch]);

  // 投稿IDが無い場合
  if (!postId) {
    return (
      <div className='px-4 py-6'>
        <Alert variant='destructive'>
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            投稿IDが指定されていません。
            <Button
              variant='link'
              className='p-0 h-auto ml-2 text-destructive underline'
              onClick={() => navigate('/home')}
            >
              ホームに戻る
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ローディング中
  if (isLoading) {
    return (
      <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
        <div>
          {/* X風投稿詳細ヘッダー */}
          <Header
            title='投稿'
            showBackButton={true}
            onBackClick={() => navigate(-1)}
            backButtonLabel='戻る'
          />

          {/* ローディング表示 */}
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-muted-foreground'>読み込み中...</p>
            </div>
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  // エラー時
  if (error || !post) {
    return (
      <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
        <div>
          {/* X風投稿詳細ヘッダー */}
          <Header
            title='投稿'
            showBackButton={true}
            onBackClick={() => navigate(-1)}
            backButtonLabel='戻る'
          />

          {/* エラー表示 */}
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <p className='text-destructive mb-2'>投稿が見つかりません</p>
              <p className='text-muted-foreground'>
                指定された投稿は存在しないか、削除された可能性があります。
              </p>
            </div>
          </div>
        </div>
      </PageLayoutTemplate>
    );
  }

  return (
    <PageLayoutTemplate requireAuth={true} header={{ show: false }} isPostContent={true}>
      <div>
        {/* X風投稿詳細ヘッダー */}
        <Header
          title='投稿'
          showBackButton={true}
          onBackClick={() => navigate(-1)}
          backButtonLabel='戻る'
        />

        {/* 投稿詳細セクション */}
        <Motion.div preset='slideUp' delay={0.1}>
          <PostDetail
            post={post}
            currentUser={user}
            onToggleLike={handleToggleLike}
            onDelete={() => setShowDeleteDialog(true)}
            onComment={handleComment}
            variant='detail'
          />
        </Motion.div>

        {/* コメントセクション */}
        <Motion.div preset='slideUp' delay={0.2}>
          <CommentSection postId={postId} commentsCount={post?.commentsCount} currentUser={user} />
        </Motion.div>

        {/* 削除確認ダイアログ */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消すことができません。投稿は完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {deleting ? '削除中...' : '削除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayoutTemplate>
  );
};

export default PostDetailPage;
