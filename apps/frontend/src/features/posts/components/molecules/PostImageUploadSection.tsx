/**
 * 🎯 投稿画像アップロードセクション（責任分離版）
 *
 * 責任:
 * - 画像選択とアップロードの専用管理
 * - プレビュー表示の管理
 * - アップロード状態の表示
 * - エラーハンドリング
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useUploadMedia } from '@libark/graphql-client';
import { MediaType as GraphQLMediaType } from '@libark/graphql-client/generated/graphql';
import { toast } from 'sonner';
import { ImagePlus, Loader } from 'lucide-react';


import { Button } from '@/components/atoms';
// import { useImageUploadErrorHandler } from '@/hooks/useUnifiedErrorHandler';
import { getMediaConfig } from '@/config/media-config';
import { cn } from '@/lib/utils';

import { PostCreatorImageGrid } from './PostCreatorImageGrid';

// 統一されたデザインシステム（LeftSidebar・PostTabNavigation基準）
const UNIFIED_SPACING_CLASSES = 'space-y-3';

export interface PostImageUploadSectionProps {
  /** 画像状態変更時のコールバック */
  onImageStateChange?: (hasImages: boolean) => void;
  /** アップロード状態変更時のコールバック */
  onUploadStateChange?: (isUploading: boolean) => void;
  /** エラー状態変更時のコールバック */
  onErrorChange?: (error?: string) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** 追加のCSSクラス */
  className?: string;
  /** 右側に表示するアクション要素 */
  rightAction?: React.ReactNode;
  /** 画像アップロードボタンの表示・非表示 */
  showImageUpload?: boolean;
}

export interface PostImageUploadSectionRef {
  uploadImages: () => Promise<string[]>;
  clearImages: () => void;
  hasImages: boolean;
  imageCount: number;
}

/**
 * 🎯 投稿画像アップロードセクション（責任分離版）
 *
 * 特徴:
 * - 画像アップロードのみに特化
 * - 状態変更の適切な通知
 * - エラーハンドリングの統合
 * - アクセシビリティ対応
 * - パフォーマンス最適化
 */
export const PostImageUploadSection = React.forwardRef<
  PostImageUploadSectionRef,
  PostImageUploadSectionProps
>(
  (
    {
      onImageStateChange,
      onUploadStateChange,
      onErrorChange,
      disabled = false,
      className,
      rightAction,
      showImageUpload = true,
    },
    ref
  ) => {
    // 統一設定を取得
    const mediaConfig = getMediaConfig('POST');

    // プロキシアップロード画像アップロードフック（責任分離対応）
    const {
      uploadUnifiedMedia,
      isUploading,
      error: uploadError,
    } = useUploadMedia({
      mediaType: GraphQLMediaType.Post,
      maxFileSize: mediaConfig.maxFileSize,
      allowedTypes: [...mediaConfig.allowedTypes],
      onProgress: (progress: any) => {
        console.log('📊 アップロード進捗:', progress);
      },
      onSuccess: (result: unknown) => {
        console.log('✅ 投稿画像アップロード成功:', (result as any).mediaId);
        // 成功時の処理は executeUpload 関数内で処理される
      },
      onError: (error: unknown) => {
        console.error('❌ 投稿画像アップロードエラー:', error);

        // 機能無効エラーの特別ハンドリング
        if (
          typeof error === 'string' &&
          error.includes('画像アップロード機能は現在無効になっています')
        ) {
          toast.error('画像アップロード機能は現在無効になっています');
        }
      },
    });

    // ローカル状態管理
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // ファイル入力用のref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 画像選択処理
    const handleImageSelect = useCallback(
      (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const errors: string[] = [];
        const validFiles: File[] = [];

        // 既存画像数と新規画像数の合計チェック
        const totalImages = selectedImages.length + fileArray.length;
        if (totalImages > mediaConfig.maxFiles) {
          const allowedCount = mediaConfig.maxFiles - selectedImages.length;
          onErrorChange?.(
            `画像は最大${mediaConfig.maxFiles}枚まで選択できます。あと${allowedCount}枚選択可能です。`
          );
          return;
        }

        // 各ファイルを検証
        fileArray.forEach(file => {
          // ファイルサイズチェック
          if (file.size > mediaConfig.maxFileSize) {
            errors.push(
              `${file.name}: ファイルサイズが大きすぎます（最大: ${(mediaConfig.maxFileSize / 1024 / 1024).toFixed(1)}MB）`
            );
            return;
          }
          // ファイルタイプチェック
          if (
            !mediaConfig.allowedTypes.includes(
              file.type as 'image/jpeg' | 'image/png' | 'image/webp'
            )
          ) {
            errors.push(`${file.name}: 対応していないファイル形式です`);
            return;
          }
          validFiles.push(file);
        });

        // エラーがある場合はユーザーに通知
        if (errors.length > 0) {
          onErrorChange?.(errors.join('\n'));
          return;
        }

        // 既存画像に新規画像を追加
        setSelectedImages(prev => [...prev, ...validFiles]);

        // プレビュー生成（既存プレビューに追加）
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      },
      [mediaConfig, selectedImages.length, onErrorChange]
    );

    // 画像削除処理
    const handleImageRemove = useCallback((index: number) => {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => {
        // メモリリーク防止
        if (prev[index]) URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    }, []);

    // 画像アップロード処理
    const _handleImageUpload = useCallback(async () => {
      if (selectedImages.length === 0) return;

      try {
        for (const file of selectedImages) {
          await uploadUnifiedMedia(file);
        }

        // アップロード成功後、選択をクリア
        setSelectedImages([]);
        setImagePreviews(prev => {
          prev.forEach(url => URL.revokeObjectURL(url));
          return [];
        });
      } catch (error) {
        console.error('画像アップロードエラー:', error);
      }
    }, [selectedImages, uploadUnifiedMedia]);

    // 画像状態の変更を通知
    React.useEffect(() => {
      onImageStateChange?.(selectedImages.length > 0);
    }, [selectedImages.length, onImageStateChange]);

    // アップロード状態の変更を通知
    React.useEffect(() => {
      onUploadStateChange?.(isUploading);
    }, [isUploading, onUploadStateChange]);

    // エラー状態の変更を通知
    React.useEffect(() => {
      onErrorChange?.(uploadError || undefined);
    }, [uploadError, onErrorChange]);

    // エラークリアハンドラー
    const handleErrorClear = useCallback(() => {
      // TODO: エラークリア実装
      onErrorChange?.(undefined);
    }, [onErrorChange]);

    // アップロード実行（外部から呼び出し可能）
    const executeUpload = useCallback(async (): Promise<string[]> => {
      if (selectedImages.length === 0) {
        return [];
      }

      try {
        const mediaIds: string[] = [];
        for (const file of selectedImages) {
          const result = await uploadUnifiedMedia(file);
          mediaIds.push(result.mediaId);
        }
        return mediaIds;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '画像のアップロードに失敗しました';
        onErrorChange?.(errorMessage);
        throw error;
      }
    }, [selectedImages, uploadUnifiedMedia, onErrorChange]);

    // 画像クリア処理
    const clearImages = useCallback(() => {
      setSelectedImages([]);
      setImagePreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
    }, []);

    // 外部からアクセス可能なメソッドを公開
    React.useImperativeHandle(
      ref,
      () => ({
        uploadImages: executeUpload,
        clearImages,
        hasImages: selectedImages.length > 0,
        imageCount: selectedImages.length,
      }),
      [executeUpload, clearImages, selectedImages.length]
    );

    return (
      <div
        className={cn(UNIFIED_SPACING_CLASSES, className)}
        data-testid='post-image-upload-section'
      >
        {/* 画像プレビューグリッド */}
        {selectedImages.length > 0 && (
          <PostCreatorImageGrid
            sources={imagePreviews.map((preview, index) => ({
              id: `preview-${index}`,
              type: 'simple-blob' as const,
              url: preview,
              file: selectedImages[index],
              index,
            }))}
            onRemove={(index: number) => {
              handleImageRemove(index);
            }}
            onReorder={() => {
              // 統一アップロードシステムでは並び替えは未実装
              console.log('画像の並び替えは現在サポートされていません');
            }}
          />
        )}

        {/* アクションバー：画像アップロードボタンと右側アクション */}
        <div className='flex items-center justify-between' data-testid='post-image-upload-actions'>
          {/* 左側：画像アップロードボタンと画像数表示 - 機能フラグで制御 */}
          <div className='flex items-center gap-2'>
            {showImageUpload && (
              <div className='flex items-center gap-1.5 sm:gap-2'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept={mediaConfig.allowedTypes?.join(',') || 'image/*'}
                  multiple
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const files = event.target.files;
                    handleImageSelect(files);
                  }}
                  className='hidden'
                  disabled={
                    disabled || isUploading || selectedImages.length >= mediaConfig.maxFiles
                  }
                  data-testid='image-file-input'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  type='button'
                  onClick={() => {
                    if (fileInputRef?.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={
                    disabled || isUploading || selectedImages.length >= mediaConfig.maxFiles
                  }
                  className={cn('h-9 w-9', selectedImages.length > 0 && 'bg-accent')}
                  aria-label={`画像を選択 (${selectedImages.length}/${mediaConfig.maxFiles}枚選択済み)`}
                  data-testid='image-upload-button'
                >
                  <ImagePlus className='w-4 h-4 sm:w-5 sm:h-5' />
                </Button>
                {selectedImages.length > 0 && (
                  <span
                    className='text-xs sm:text-sm text-muted-foreground font-medium'
                    data-testid='image-count'
                  >
                    {selectedImages.length}/{mediaConfig.maxFiles}
                  </span>
                )}
                {isUploading && (
                  <Loader
                    className='w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary'
                    data-testid='image-upload-loading'
                  />
                )}
              </div>
            )}
          </div>

          {/* 右側：外部から渡されたアクション */}
          {rightAction && <div className='flex items-center'>{rightAction}</div>}
        </div>
      </div>
    );
  }
);

PostImageUploadSection.displayName = 'PostImageUploadSection';

/**
 * 🎯 投稿画像アップロードセクションのメモ化版
 */
export const MemoizedPostImageUploadSection = React.memo(PostImageUploadSection);

// デフォルトエクスポート
export default MemoizedPostImageUploadSection;
