/**
 * 統一カバー画像設定コンポーネント
 * アバター設定コンポーネントと統合されたカバー画像管理
 */

import React, { useRef } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCover, useAuth } from '@libark/graphql-client';

import { Button, ImageDisplay } from '@/components/atoms';

interface CoverSettingsProps {
  className?: string;
}

// エイリアス
type _UnifiedCoverSettingsProps = CoverSettingsProps;

/**
 * 統一カバー画像設定コンポーネント
 *
 * 責任:
 * - カバー画像の表示・変更・削除
 * - ファイル選択とアップロード機能
 * - アップロード進捗の表示
 */
export function UnifiedCoverSettings({ className }: CoverSettingsProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 認証状態の取得
  const { user, isAuthenticated } = useAuth();

  // カバー画像操作フック
  const { isUploading, isDeleting, uploadProgress, uploadCover, deleteCover, error } = useCover({
    onUploadProgress: (progress: any) => {
      console.log(`カバー画像アップロード進捗: ${progress}%`);
    },
    onUploadComplete: (mediaId: any) => {
      toast.success(
        t('settings.profile.coverUploadSuccess', { default: 'カバー画像をアップロードしました' })
      );
      console.log('カバー画像アップロード完了:', mediaId);
    },
    onDeleteComplete: () => {
      toast.success(
        t('settings.profile.coverDeleteSuccess', { default: 'カバー画像を削除しました' })
      );
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'エラーが発生しました');
      console.error('カバー画像操作エラー:', error);
    },
  });

  // 処理中状態の判定
  const isProcessing = isUploading || isDeleting;

  /**
   * ファイル選択処理
   * バリデーションとアップロード
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 既存のエラーをクリア
    if (error) {
      // clearError(); // 関数が存在しないためコメントアウト
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      toast.error(
        t('settings.profile.invalidFileType', { default: '画像ファイルを選択してください' })
      );
      return;
    }

    // ファイルサイズチェック（10MB - カバー画像用制限）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        t('settings.profile.fileTooLarge', { default: 'ファイルサイズは10MB以下にしてください' })
      );
      return;
    }

    try {
      // 直接アップロード（カバー画像はクロッピング不要）
      await uploadCover(file);
    } catch (error) {
      console.error('カバー画像アップロードエラー:', error);
      // エラーはフック内で処理済み
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * カバー画像削除処理
   */
  const handleDeleteCover = async () => {
    if (!user || !isAuthenticated) return;

    try {
      await deleteCover();
    } catch (error) {
      console.error('カバー画像削除エラー:', error);
      // エラーはフック内で処理済み
    }
  };

  /**
   * ファイル選択ダイアログを開く
   */
  const openFileDialog = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  // 認証されていない場合は何も表示しない
  if (!user) {
    return null;
  }

  return (
    <div className={className}>
      {/* カバー画像表示エリア */}
      <div className='relative'>
        <div className='relative w-full h-32 sm:h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-primary/10'>
          <ImageDisplay
            src={user && isAuthenticated ? user.coverImageId || '' : ''}
            alt={`${user && isAuthenticated ? user.displayName || user.username : 'ユーザー'}のカバー画像`}
            className='w-full h-full object-cover'
            priority={true}
            fallbackConfig={{
              type: 'cover',
              displayName: user?.displayName,
              username: user?.username,
            }}
            showLoading={false}
            noWrapper={true}
          />

          {/* アップロード進捗表示 */}
          {isUploading && uploadProgress !== undefined && (
            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
              <div className='text-white text-center'>
                <div className='text-lg font-medium mb-2'>{Math.round(uploadProgress)}%</div>
                <div className='w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-white transition-all duration-300'
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className='flex gap-2 mt-4'>
          <Button
            onClick={openFileDialog}
            disabled={isProcessing}
            variant='outline'
            size='sm'
            className='flex items-center justify-center'
          >
            {isUploading ? (
              <Upload className='w-4 h-4 animate-spin mr-2' />
            ) : (
              <Camera className='w-4 h-4 mr-2' />
            )}
            <span>
              {isUploading
                ? t('settings.profile.uploading', { default: 'アップロード中...' })
                : user?.coverImageId
                  ? t('settings.profile.changeCover', { default: 'カバー画像を変更' })
                  : t('settings.profile.uploadCover', { default: 'カバー画像をアップロード' })}
            </span>
          </Button>

          {user && isAuthenticated && user.coverImageId && (
            <Button
              onClick={handleDeleteCover}
              disabled={isProcessing}
              variant='outline'
              size='sm'
              className='flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50'
            >
              {isDeleting ? (
                <Upload className='w-4 h-4 animate-spin mr-2' />
              ) : (
                <Trash2 className='w-4 h-4 mr-2' />
              )}
              <span>
                {isDeleting
                  ? t('settings.profile.deleting', { default: '削除中...' })
                  : t('settings.profile.deleteCover', { default: 'カバー画像を削除' })}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileSelect}
        className='hidden'
      />
    </div>
  );
}
