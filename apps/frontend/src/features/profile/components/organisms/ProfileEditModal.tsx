/**
 * 🎯 プロフィール編集モーダル (Organism)
 *
 * 責任:
 * - プロフィール画像・カバー画像のアップロード
 * - 基本情報（表示名、自己紹介）の編集
 * - Xライクなシンプルデザイン
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { UpdateProfileDocument, type UserInfoFragment } from '@libark/graphql-client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  ImageDisplay,
} from '@/components/atoms';

import { useProfileImageUpload } from '../../hooks/useProfileImageUpload';

import { ImageCropper, type CropType } from './ImageCropper';

export interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  user: UserInfoFragment;
  onSuccess?: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // クロップモーダル状態
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropType, setCropType] = useState<CropType>('avatar');

  // プレビュー画像状態（Blobで保持）
  const [previewAvatarBlob, setPreviewAvatarBlob] = useState<Blob | null>(null);
  const [previewCoverBlob, setPreviewCoverBlob] = useState<Blob | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);

  const {
    uploadProfileImage,
    uploadCoverImage,
    isUploading: isImageUploading,
  } = useProfileImageUpload();
  const [updateProfile] = useMutation(UpdateProfileDocument);

  // プレビューURLのクリーンアップ
  const cleanupPreviewUrls = () => {
    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl);
      setPreviewAvatarUrl(null);
    }
    if (previewCoverUrl) {
      URL.revokeObjectURL(previewCoverUrl);
      setPreviewCoverUrl(null);
    }
    setPreviewAvatarBlob(null);
    setPreviewCoverBlob(null);
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされる時にプレビューURLをクリーンアップ
      cleanupPreviewUrls();
    };
  }, []);

  // モーダルが閉じられる時のクリーンアップ
  useEffect(() => {
    if (!open) {
      cleanupPreviewUrls();
    }
  }, [open]);

  const canSave =
    displayName.trim().length > 0 &&
    (displayName !== user.displayName ||
      bio !== user.bio ||
      previewAvatarBlob !== null ||
      previewCoverBlob !== null);

  const handleSubmit = async () => {
    if (!canSave || isUpdating) return;

    setIsUpdating(true);
    try {
      // 1. 画像のアップロード（並行処理）
      const uploadPromises: Promise<{ id: string }>[] = [];

      if (previewAvatarBlob) {
        const avatarFile = new File([previewAvatarBlob], 'avatar.jpg', { type: 'image/jpeg' });
        uploadPromises.push(uploadProfileImage(avatarFile) as any);
      }

      if (previewCoverBlob) {
        const coverFile = new File([previewCoverBlob], 'cover.jpg', { type: 'image/jpeg' });
        uploadPromises.push(uploadCoverImage(coverFile) as any);
      }

      // 2. プロフィール情報の更新
      const profileUpdatePromise = updateProfile({
        variables: {
          input: {
            displayName: displayName.trim(),
            bio: bio.trim() || null,
          },
        },
      });

      // 3. すべての更新を並行実行
      await Promise.all([...uploadPromises, profileUpdatePromise]);

      toast.success('プロフィールを更新しました');

      // プレビュー状態をクリア
      cleanupPreviewUrls();

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 画像ファイル選択処理
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, type: CropType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルをData URLに変換してクロップモーダルで表示
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        setCropImageSrc(e.target.result as string);
        setCropType(type);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // inputをリセット
    event.target.value = '';
  };

  // クロップ完了処理（プレビューのみ、実際のアップロードは保存時）
  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // 既存のプレビューURLをクリーンアップ
      if (cropType === 'avatar' && previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
      }
      if (cropType === 'cover' && previewCoverUrl) {
        URL.revokeObjectURL(previewCoverUrl);
      }

      // 新しいプレビューURLを作成
      const previewUrl = URL.createObjectURL(croppedBlob);

      if (cropType === 'avatar') {
        setPreviewAvatarBlob(croppedBlob);
        setPreviewAvatarUrl(previewUrl);
      } else {
        setPreviewCoverBlob(croppedBlob);
        setPreviewCoverUrl(previewUrl);
      }

      // クロップモーダルを閉じる
      setCropModalOpen(false);

      console.log(`${cropType} プレビュー設定完了`);
    } catch (error) {
      console.error('プレビュー設定エラー:', error);
      toast.error('画像のプレビュー設定に失敗しました');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle>プロフィールを編集</DialogTitle>
          <DialogDescription>
            プロフィール画像、カバー画像、表示名、自己紹介を編集できます
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 flex-1 min-h-0'>
          {/* カバー画像とプロフィール画像のコンテナ */}
          <div className='relative'>
            {/* カバー画像 - アスペクト比3:1 */}
            <div className='relative w-full bg-slate-700' style={{ paddingBottom: '33.33%' }}>
              <div className='absolute inset-0'>
                {previewCoverUrl ? (
                  <img
                    src={previewCoverUrl}
                    alt='カバー画像プレビュー'
                    className='w-full h-full object-cover'
                  />
                ) : user.coverImageId ? (
                  <ImageDisplay
                    src={user.coverImageId}
                    alt='カバー画像'
                    className='w-full h-full'
                    objectFit='cover'
                    noWrapper
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-to-br from-slate-600 to-slate-700' />
                )}
              </div>

              {/* カバー画像編集ボタン */}
              <label className='absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer'>
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  onChange={e => handleImageSelect(e, 'cover')}
                  className='hidden'
                  disabled={isImageUploading}
                />
                <Camera className='w-4 h-4' />
              </label>
            </div>

            {/* プロフィール画像（カバー画像に重なる） */}
            <div className='absolute -bottom-16 left-4'>
              <div className='relative w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden'>
                {previewAvatarUrl ? (
                  <img
                    src={previewAvatarUrl}
                    alt='プロフィール画像プレビュー'
                    className='w-full h-full object-cover'
                  />
                ) : user.profileImageId ? (
                  <ImageDisplay
                    src={user.profileImageId}
                    alt='プロフィール画像'
                    className='w-full h-full'
                    objectFit='cover'
                    noWrapper
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center'>
                    <span className='text-2xl font-bold text-primary'>
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* プロフィール画像アップロードボタン */}
                <label className='absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 opacity-0 hover:opacity-100 transition-opacity'>
                  <input
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    onChange={e => handleImageSelect(e, 'avatar')}
                    className='hidden'
                    disabled={isImageUploading}
                  />
                  <Camera className='w-6 h-6 text-white' />
                </label>
              </div>
            </div>
          </div>

          {/* フォーム */}
          <div className='px-4 pt-20 pb-6'>
            <div className='space-y-6'>
              {/* 表示名 */}
              <div>
                <label className='block text-sm font-medium mb-2'>名前</label>
                <input
                  type='text'
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={50}
                  className='w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary'
                />
                <div className='text-xs text-muted-foreground mt-1'>{displayName.length}/50</div>
              </div>

              {/* 自己紹介 */}
              <div>
                <label className='block text-sm font-medium mb-2'>自己紹介</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={160}
                  rows={4}
                  className='w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none'
                  placeholder='自己紹介を入力してください'
                />
                <div className='text-xs text-muted-foreground mt-1'>{bio.length}/160</div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className='flex justify-end gap-2 pt-4 flex-shrink-0'>
            <Button variant='outline' onClick={onClose} disabled={isUpdating}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={!canSave || isUpdating}>
              {isUpdating ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* 画像クロップモーダル */}
      <ImageCropper
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={cropImageSrc}
        cropType={cropType}
        onCropComplete={handleCropComplete}
      />
    </Dialog>
  );
};
