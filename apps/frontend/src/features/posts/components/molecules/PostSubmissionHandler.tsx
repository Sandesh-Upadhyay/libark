/**
 * 🎯 投稿送信処理ハンドラー（責任分離版）
 *
 * 責任:
 * - 投稿送信処理の専用管理
 * - 統合バリデーション
 * - エラーハンドリング
 * - 送信状態の管理
 */

'use client';

import React, { useCallback } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/atoms';
import { usePosts } from '@/features/posts/hooks/usePosts';
import { cn } from '@/lib/utils';
import type { PostVisibility } from '@/lib/constants/visibility';

import { PostVisibilityDropdown } from './PostVisibilityDropdown';

// import type { PostCreateFormData } from '@/hooks/usePostFormState';

// 統一されたデザインシステム（LeftSidebar・PostTabNavigation基準）
const UNIFIED_SPACING_CLASSES = 'space-y-3';

export interface PostSubmissionData {
  content?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' | 'PAID';
  price?: number;
  mediaIds?: string[];
}

export interface PostSubmissionHandlerProps {
  /** 送信可能フラグ */
  canSubmit: boolean;
  /** 送信データ取得関数 */
  getSubmissionData: () => Promise<PostSubmissionData>;
  /** 送信完了時のコールバック */
  onSubmissionComplete?: () => void;
  /** 送信状態変更時のコールバック */
  onSubmissionStateChange?: (isSubmitting: boolean) => void;
  /** エラー状態変更時のコールバック */
  onErrorChange?: (error?: string) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** ローディング表示フラグ */
  loading?: boolean;
  /** 公開範囲選択関連のプロパティ */
  visibilityDropdown?: {
    visibility: PostVisibility;
    onVisibilityChange: (visibility: PostVisibility) => void;
    disabled: boolean;
  };
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 🎯 投稿送信処理ハンドラー（責任分離版）
 *
 * 特徴:
 * - 送信処理のみに特化
 * - 統合バリデーション
 * - エラーハンドリングの統合
 * - 状態変更の適切な通知
 * - アクセシビリティ対応
 */
export const PostSubmissionHandler: React.FC<PostSubmissionHandlerProps> = ({
  canSubmit,
  getSubmissionData,
  onSubmissionComplete,
  onSubmissionStateChange,
  onErrorChange,
  disabled = false,
  loading = false,
  visibilityDropdown,
  className,
}) => {
  const { createPost, creating } = usePosts();
  const [submitError, setSubmitError] = React.useState<string | undefined>();

  const isSubmitting = creating;

  // 送信状態の変更を通知
  React.useEffect(() => {
    onSubmissionStateChange?.(isSubmitting);
  }, [isSubmitting, onSubmissionStateChange]);

  // エラー状態の変更を通知
  React.useEffect(() => {
    onErrorChange?.(submitError);
  }, [submitError, onErrorChange]);

  // 送信処理
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || disabled || loading || isSubmitting) {
      return;
    }

    try {
      setSubmitError(undefined);
      onErrorChange?.(undefined);

      // 送信データを取得
      const submissionData = await getSubmissionData();

      // バリデーション
      if (
        !submissionData.content?.trim() &&
        (!submissionData.mediaIds || submissionData.mediaIds.length === 0)
      ) {
        const error = '投稿内容または画像を入力してください';
        setSubmitError(error);
        onErrorChange?.(error);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 投稿送信開始:', submissionData);
      }

      // 投稿送信（プリサインURL実装では即座に完了）
      await createPost({
        content: submissionData.content?.trim() || undefined,
        mediaIds:
          submissionData.mediaIds && submissionData.mediaIds.length > 0
            ? submissionData.mediaIds
            : undefined,
        visibility: submissionData.visibility || 'PUBLIC',
        // PAID 以外は price を undefined にする（GraphQL Float エラー防止）
        price: submissionData.visibility === 'PAID' ? submissionData.price : undefined,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 投稿作成完了');
      }

      // 成功トーストはApollo ClientのonCompletedで表示されるため、ここでは表示しない

      // 送信完了通知
      onSubmissionComplete?.();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 投稿送信エラー:', error);
      }

      const errorMessage = error instanceof Error ? error.message : '投稿の送信に失敗しました';

      setSubmitError(errorMessage);
      onErrorChange?.(errorMessage);
    }
  }, [
    canSubmit,
    disabled,
    loading,
    isSubmitting,
    getSubmissionData,
    createPost,
    onSubmissionComplete,
    onErrorChange,
  ]);

  // エラークリア
  const handleErrorClear = useCallback(() => {
    setSubmitError(undefined);
    onErrorChange?.(undefined);
  }, [onErrorChange]);

  const isButtonDisabled = !canSubmit || disabled || loading || isSubmitting;
  const isButtonLoading = loading || isSubmitting;

  return (
    <div className={cn(UNIFIED_SPACING_CLASSES, className)} data-testid='post-submission-handler'>
      {/* 送信エリア */}
      <div className='flex justify-end items-center gap-2'>
        {visibilityDropdown && (
          <PostVisibilityDropdown
            visibility={visibilityDropdown.visibility}
            onVisibilityChange={visibilityDropdown.onVisibilityChange}
            disabled={visibilityDropdown.disabled}
            align='end'
            side='top'
          />
        )}
        <Button
          type='button'
          variant='default'
          onClick={handleSubmit}
          disabled={isButtonDisabled || isButtonLoading}
          aria-label={isButtonLoading ? '投稿を送信中...' : '投稿を送信'}
          data-testid='post-submit-button'
        >
          {isButtonLoading ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
          ) : (
            <Send size={16} className='mr-2' />
          )}
          <span>{isButtonLoading ? '送信中...' : '投稿'}</span>
        </Button>
      </div>
    </div>
  );
};

/**
 * 🎯 投稿送信処理ハンドラーのメモ化版
 */
export const MemoizedPostSubmissionHandler = React.memo(PostSubmissionHandler);

// デフォルトエクスポート
export default MemoizedPostSubmissionHandler;
