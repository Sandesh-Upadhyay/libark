/**
 * 📱 QRコードコンポーネント（ブラウザ対応版）
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle } from 'lucide-react';

import { DESIGN_COLORS, DESIGN_SIZES } from '@/lib/constants/design-system';

export interface QRCodeProps {
  /** QRコードに埋め込むデータ */
  value: string;
  /** QRコードのサイズ（ピクセル） */
  size?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 前景色 */
  foregroundColor?: string;
  /** エラー訂正レベル */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** CSSクラス名 */
  className?: string;
  /** alt属性 */
  alt?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = DESIGN_SIZES.components.qrCode.medium,
  backgroundColor = DESIGN_COLORS.special.qrBackground,
  foregroundColor = DESIGN_COLORS.special.qrForeground,
  errorCorrectionLevel = 'M',
  className = '',
  alt = 'QR Code',
}) => {
  // バリデーション
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return (
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 ${className}`}
        style={{ width: size, height: size }}
      >
        <AlertCircle className='h-8 w-8 text-red-500 mb-2' />
        <span className='text-sm text-red-600 text-center'>Invalid QR code data</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-block border border-gray-200 rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={backgroundColor}
        fgColor={foregroundColor}
        level={errorCorrectionLevel}
        title={alt}
        className='w-full h-full'
      />
    </div>
  );
};
