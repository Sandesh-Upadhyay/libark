'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Loader2, RotateCcw, Check, X } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/atoms';
import { cn } from '@/lib/utils';
import 'react-image-crop/dist/ReactCrop.css';

export type CropType = 'avatar' | 'cover';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  cropType: CropType;
  className?: string;
}

// タイプ別設定
const CROP_CONFIGS = {
  avatar: {
    aspectRatio: 1,
    minWidth: 100,
    minHeight: 100,
    outputWidth: 400,
    outputHeight: 400,
    maxWidth: 'max-w-2xl',
    title: 'プロフィール画像をクロップ',
    description:
      '画像をドラッグして位置を調整し、角をドラッグしてサイズを変更できます。正方形のアスペクト比が自動的に維持されます。',
    initialCropWidth: 80,
    buttonText: '適用',
  },
  cover: {
    aspectRatio: 16 / 9,
    minWidth: 200,
    minHeight: 112,
    outputWidth: 1200,
    outputHeight: 675,
    maxWidth: 'max-w-3xl',
    title: 'カバー画像をクロップ',
    description:
      '画像をドラッグして位置を調整し、角をドラッグしてサイズを変更できます。16:9のアスペクト比が自動的に維持されます。',
    initialCropWidth: 90,
    buttonText: '完了',
  },
} as const;

/**
 * 統合画像クロッピングコンポーネント
 *
 * アバターとカバー画像の両方に対応した汎用クロップコンポーネント
 */
export const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  cropType,
  className,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const config = CROP_CONFIGS[cropType];

  // 画像読み込み完了時の処理
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      if (cropType === 'avatar') {
        // アバター: シンプルな1:1クロップ
        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: config.initialCropWidth,
            },
            config.aspectRatio,
            width,
            height
          ),
          width,
          height
        );
        setCrop(crop);
      } else {
        // カバー: 16:9に最適化されたクロップ
        const aspectRatio = config.aspectRatio;
        const imageAspectRatio = width / height;

        let cropWidth: number;
        let cropHeight: number;

        if (imageAspectRatio > aspectRatio) {
          cropHeight = config.initialCropWidth;
          cropWidth = (cropHeight * aspectRatio * height) / width;
        } else {
          cropWidth = config.initialCropWidth;
          cropHeight = (cropWidth * width) / (aspectRatio * height);
        }

        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: Math.min(cropWidth, config.initialCropWidth),
              height: Math.min(cropHeight, config.initialCropWidth),
            },
            aspectRatio,
            width,
            height
          ),
          width,
          height
        );
        setCrop(crop);
      }
    },
    [cropType, config]
  );

  // クロップ領域をリセット
  const resetCrop = useCallback(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;

      if (cropType === 'avatar') {
        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: config.initialCropWidth,
            },
            config.aspectRatio,
            width,
            height
          ),
          width,
          height
        );
        setCrop(crop);
      } else {
        const aspectRatio = config.aspectRatio;
        const imageAspectRatio = width / height;

        let cropWidth: number;
        let cropHeight: number;

        if (imageAspectRatio > aspectRatio) {
          cropHeight = config.initialCropWidth;
          cropWidth = (cropHeight * aspectRatio * height) / width;
        } else {
          cropWidth = config.initialCropWidth;
          cropHeight = (cropWidth * width) / (aspectRatio * height);
        }

        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: Math.min(cropWidth, config.initialCropWidth),
              height: Math.min(cropHeight, config.initialCropWidth),
            },
            aspectRatio,
            width,
            height
          ),
          width,
          height
        );
        setCrop(crop);
      }
    }
  }, [cropType, config]);

  // クロップされた画像を生成
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // 実際の画像サイズと表示サイズの比率を計算
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // 実際の画像座標に変換
      const sourceX = completedCrop.x * scaleX;
      const sourceY = completedCrop.y * scaleY;
      const sourceWidth = completedCrop.width * scaleX;
      const sourceHeight = completedCrop.height * scaleY;

      // キャンバスサイズを設定
      canvas.width = config.outputWidth;
      canvas.height = config.outputHeight;

      // 高品質設定
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // クロップ領域を描画
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        config.outputWidth,
        config.outputHeight
      );

      // Blobとして出力
      canvas.toBlob(
        blob => {
          if (blob) {
            onCropComplete(blob);
            onClose();
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('クロップ処理エラー:', error);
      setIsProcessing(false);
    }
  }, [completedCrop, onCropComplete, onClose, config]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn('max-w-4xl w-full max-h-[90vh] overflow-y-auto', 'flex flex-col', className)}
      >
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 flex-1 min-h-0'>
          {/* クロッピング領域 */}
          <div className='flex justify-center items-center min-h-0'>
            <div className={cn('w-full', config.maxWidth)}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={c => setCompletedCrop(c)}
                aspect={config.aspectRatio}
                minWidth={config.minWidth}
                minHeight={config.minHeight}
                className='max-w-full'
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt='クロップ対象画像'
                  onLoad={onImageLoad}
                  className='max-w-full max-h-[50vh] object-contain'
                />
              </ReactCrop>
            </div>
          </div>

          {/* プレビューキャンバス（非表示） */}
          <canvas ref={canvasRef} className='hidden' />

          {/* コントロールボタン */}
          <div className='flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 flex-shrink-0'>
            <Button
              variant='outline'
              onClick={resetCrop}
              className='flex items-center gap-2 w-full sm:w-auto'
            >
              <RotateCcw className='h-4 w-4' />
              リセット
            </Button>

            <div className='flex gap-2 w-full sm:w-auto'>
              <Button
                variant='outline'
                onClick={onClose}
                disabled={isProcessing}
                className='flex-1 sm:flex-none'
              >
                <X className='h-4 w-4 mr-2' />
                キャンセル
              </Button>

              <Button
                onClick={generateCroppedImage}
                disabled={!completedCrop || isProcessing}
                className='flex items-center gap-2 flex-1 sm:flex-none'
              >
                {isProcessing ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Check className='h-4 w-4' />
                )}
                {isProcessing ? '処理中...' : config.buttonText}
              </Button>
            </div>
          </div>

          {/* 使用方法のヒント（アバターのみ） */}
          {cropType === 'avatar' && (
            <div className='text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg flex-shrink-0'>
              <p className='font-medium mb-1'>使用方法:</p>
              <ul className='space-y-1 text-xs'>
                <li>• ドラッグしてクロップ領域を移動できます</li>
                <li>• 角をドラッグしてサイズを調整できます</li>
                <li>• 正方形のアスペクト比が自動的に維持されます</li>
                <li>• リセットボタンで初期状態に戻せます</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
