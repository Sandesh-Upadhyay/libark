/**
 * 🎯 コメント作成フォームコンポーネント (Molecule)
 *
 * Apollo Client統一によるリアルタイム更新対応
 * 再利用可能なフォームコンポーネント
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';

import { UnifiedFormField, Form, Button } from '@/components/atoms';
import type { CommentFormProps } from '@/features/posts/types';

// コメント作成フォームのバリデーションスキーマ
const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(500, 'コメントは500文字以内で入力してください')
    .transform(val => val.trim()),
});

type CommentCreateFormData = z.infer<typeof commentCreateSchema>;

export const CommentForm = ({
  postId,
  currentUser,
  onSubmit,
  isSubmitting = false,
}: CommentFormProps) => {
  const user = currentUser;

  // React Hook Form設定
  const form = useForm<CommentCreateFormData>({
    resolver: zodResolver(commentCreateSchema),
    defaultValues: {
      content: '',
    },
  });

  const watchedContent = form.watch('content') || '';
  const canSubmit = watchedContent.trim().length > 0 && !isSubmitting;

  const handleFormSubmit = async (data: CommentCreateFormData) => {
    if (!user || !canSubmit) return;

    try {
      await onSubmit({
        postId,
        content: data.content,
      });

      // 成功時のリセット
      form.reset();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('コメント作成エラー:', error);
      }
      form.setError('content', {
        type: 'server',
        message: error instanceof Error ? error.message : 'コメントの作成に失敗しました',
      });
    }
  };

  if (!user) {
    return (
      <div className='text-center py-3 text-muted-foreground'>
        コメントするにはログインが必要です
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          aria-label='コメント投稿フォーム'
          className='space-y-4'
        >
          <UnifiedFormField
            name='content'
            control={form.control}
            label='コメント'
            type='textarea'
            placeholder='コメントを入力...'
            rows={3}
            maxLength={500}
            characterCount={{
              current: watchedContent.length,
              max: 500,
            }}
            disabled={isSubmitting}
            required
          />
          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={!canSubmit}
              aria-label={
                isSubmitting
                  ? 'コメントを送信中です'
                  : canSubmit
                    ? 'コメントを送信'
                    : 'コメント内容を入力してください'
              }
            >
              {isSubmitting ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  送信中...
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  コメント
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

// 型定義は @/features/posts/types/comment.types からエクスポート
