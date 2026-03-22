/**
 * 🎯 投稿作成コンテナ（責任分離版）
 *
 * 責任:
 * - 分離されたコンポーネントの統合
 * - 状態の調整と連携
 * - レイアウトの管理
 * - 全体的なフロー制御
 */

'use client';

import React, { useCallback, useRef } from 'react';
import { useAuth } from '@libark/graphql-client';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { UnifiedFormField, Form, Alert, AlertDescription, Button } from '@/components/atoms';
import { usePostFormState } from '@/features/posts/hooks/usePostFormState';
import { useProfileUpdateNotification } from '@/features/profile/hooks';

import type { PostImageUploadSectionRef } from '../molecules/PostImageUploadSection';
import type { PostSubmissionData } from '../molecules/PostSubmissionHandler';
import { PostImageUploadSection, PostSubmissionHandler } from '../molecules';

export interface PostCreatorContainerProps {
  /** 投稿作成完了時のコールバック */
  onPostCreated?: () => void;
  /** 追加のCSSクラス */
  className?: string;
  /** 画像アップロード機能の有効/無効 */
  canUploadImage?: boolean;
}

/**
 * 🎯 投稿作成コンテナ（責任分離版）
 *
 * 特徴:
 * - 責任分離された各コンポーネントの統合
 * - 状態管理の中央集権化
 * - 適切なデータフローの管理
 * - レイアウトの統一
 * - パフォーマンス最適化
 */
export const PostCreatorContainer: React.FC<PostCreatorContainerProps> = ({
  onPostCreated,
  className,
  canUploadImage = true,
}) => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const { state, actions, formMethods } = usePostFormState();
  const containerRef = useRef<HTMLDivElement>(null);

  // 画像アップロードセクションの参照
  const imageUploadRef = useRef<PostImageUploadSectionRef>(null);

  // プロフィール更新通知
  useProfileUpdateNotification();

  // 送信データ取得関数
  const getSubmissionData = useCallback(async (): Promise<PostSubmissionData> => {
    // フォームバリデーション
    if (!actions.validateForm()) {
      throw new Error('フォームの入力内容を確認してください');
    }

    const formData = actions.getFormData();
    let mediaIds: string[] = [];

    // 画像がある場合はアップロード
    if (state.hasImages && imageUploadRef.current) {
      try {
        // 開発環境でのみログ出力
        if (process.env.NODE_ENV === 'development') {
          console.log(`📤 画像アップロード開始 (${imageUploadRef.current.imageCount}枚)`);
        }
        mediaIds = await imageUploadRef.current.uploadImages();
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 画像アップロード完了:', mediaIds);
        }

        // アップロード成功の検証
        if (mediaIds.length === 0) {
          throw new Error('画像のアップロードに失敗しました：メディアIDが取得できませんでした');
        }

        if (mediaIds.length !== imageUploadRef.current.imageCount) {
          throw new Error(
            `画像のアップロードに失敗しました：${imageUploadRef.current.imageCount}枚中${mediaIds.length}枚のみ成功`
          );
        }
      } catch (uploadError) {
        // エラーは常にログ出力（本番環境でも重要）
        console.error('❌ 画像アップロードエラー:', uploadError);
        const errorMessage =
          uploadError instanceof Error ? uploadError.message : '画像のアップロードに失敗しました';
        throw new Error(errorMessage);
      }
    }

    return {
      content: formData.content,
      visibility: formData.visibility,
      price: formData.price,
      mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
    };
  }, [state.hasImages, actions]);

  // 送信完了ハンドラー
  const handleSubmissionComplete = useCallback(() => {
    // 開発環境でのみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 投稿作成完了');
    }

    // フォームリセット
    actions.resetForm();

    // 画像クリア
    if (imageUploadRef.current) {
      imageUploadRef.current.clearImages();
    }

    // 外部コールバック実行
    onPostCreated?.();
  }, [actions, onPostCreated]);

  // フォーム送信ハンドラー
  const handleFormSubmit = useCallback(
    (data: { content: string; visibility: string; files?: File[] }) => {
      // 送信処理は PostSubmissionHandler が担当
      console.log('Form data:', data);
    },
    []
  );

  // 認証チェック - 統一された認証状態管理を使用（Hooksは常に同順で実行するため、この位置に配置）
  if (isInitializing || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn('p-4 space-y-3', className)} data-testid='post-creator'>
      {/* フォーム */}
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(handleFormSubmit)} className='space-y-4'>
          {/* テキスト入力 */}
          <UnifiedFormField
            name='content'
            control={formMethods.control}
            label='投稿内容'
            type='textarea'
            placeholder='今何を考えていますか？'
            rows={4}
            maxLength={500}
            characterCount={{
              current: formMethods.watch('content')?.length || 0,
              max: 500,
            }}
            disabled={state.isSubmitting || state.isUploading}
            data-testid='post-content-input'
          />

          {/* 統合されたエラー表示 */}
          {(state.uploadError || state.submitError) && (
            <Alert variant='destructive' className='relative' data-testid='post-error-alert'>
              <AlertDescription className='pr-8'>
                {state.uploadError || state.submitError}
              </AlertDescription>
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-2 top-2 h-6 w-6 p-0'
                onClick={() => {
                  actions.setUploadError(undefined);
                  actions.setSubmitError(undefined);
                }}
              >
                <X className='h-4 w-4' />
              </Button>
            </Alert>
          )}

          {/* Paid投稿設定 - 常時レンダリングしてuncontrolled→controlled警告を回避 */}
          <div
            className={cn(
              'border border-dashed rounded-lg bg-card p-4 space-y-4 transition-opacity',
              state.visibility !== 'PAID' && 'hidden'
            )}
            aria-hidden={state.visibility !== 'PAID'}
          >
            <UnifiedFormField
              name='price'
              control={formMethods.control}
              label='価格（円）'
              type='number'
              placeholder='100'
              disabled={state.visibility !== 'PAID' || state.isSubmitting || state.isUploading}
              description='有料投稿では、購入者のみが実際の画像を閲覧できます。未購入者にはブラー画像が表示されます。'
            />
          </div>

          {/* 画像アップロードと投稿ボタンの統合 - 機能フラグで制御 */}
          <PostImageUploadSection
            ref={imageUploadRef}
            onImageStateChange={actions.setHasImages}
            onUploadStateChange={actions.setIsUploading}
            onErrorChange={actions.setUploadError}
            disabled={state.isSubmitting}
            showImageUpload={canUploadImage}
            rightAction={
              <div className='flex items-center gap-2'>
                <PostSubmissionHandler
                  canSubmit={state.canSubmit}
                  getSubmissionData={getSubmissionData}
                  onSubmissionComplete={handleSubmissionComplete}
                  onSubmissionStateChange={actions.setIsSubmitting}
                  onErrorChange={actions.setSubmitError}
                  disabled={state.isUploading}
                  loading={state.isSubmitting}
                  visibilityDropdown={{
                    visibility: state.visibility,
                    onVisibilityChange: actions.setVisibility,
                    disabled: state.isSubmitting || state.isUploading,
                  }}
                />
              </div>
            }
          />
        </form>
      </Form>
    </div>
  );
};

/**
 * 🎯 投稿作成コンテナのメモ化版
 */
export const MemoizedPostCreatorContainer = React.memo(PostCreatorContainer);

// デフォルトエクスポート
export default MemoizedPostCreatorContainer;
