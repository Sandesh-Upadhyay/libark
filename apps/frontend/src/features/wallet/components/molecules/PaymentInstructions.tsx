/**
 * 🎯 送金指示表示コンポーネント (Molecule)
 *
 * 責任:
 * - QRコード付き送金先表示
 * - カウントダウンタイマー
 * - 送金完了確認
 * - アトミックデザイン原則の厳密な遵守
 *
 * 特徴:
 * - 最適化されたATOMコンポーネントの使用
 * - パフォーマンス最適化（メモ化）
 * - アクセシビリティ対応
 * - 型安全性
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import {} from '@/components/atoms';
import { Button, Badge } from '@/components/atoms';
import { Label } from '@/components/atoms';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { CurrencyIcon, type CurrencyType } from '../atoms/CurrencyIcon';

/**
 * 送金指示のバリアント定義（シンプル版）
 */
const paymentInstructionsVariants = cva('w-full space-y-4 transition-all duration-300', {
  variants: {
    variant: {
      default: '',
      compact: 'space-y-3',
      minimal: 'space-y-3',
    },
    status: {
      active: '',
      warning: 'animate-pulse',
      expired: 'opacity-60 pointer-events-none',
      completed: 'opacity-90',
    },
    layout: {
      default: '',
      centered: 'text-center',
      split: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    },
  },
  defaultVariants: {
    variant: 'default',
    status: 'active',
    layout: 'default',
  },
});

export interface PaymentInstructionsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof paymentInstructionsVariants> {
  /** 送金先アドレス */
  depositAddress: string;
  /** 通貨 */
  currency: string;
  /** ネットワーク */
  network: string;
  /** 送金額（暗号通貨） */
  cryptoAmount: number;
  /** USD換算額 */
  usdAmount: number;
  /** カウントダウン時間（秒） */
  countdownSeconds?: number;
  /** 送金完了確認コールバック */
  onPaymentComplete?: () => void;
  /** 送金完了確認の表示 */
  showCompletionButton?: boolean;
}

/**
 * 🎯 送金指示表示コンポーネント
 */
export const PaymentInstructions = React.forwardRef<HTMLDivElement, PaymentInstructionsProps>(
  (
    {
      depositAddress,
      currency,
      network,
      cryptoAmount,
      usdAmount,
      countdownSeconds = 300,
      onPaymentComplete,
      showCompletionButton = true,
      variant,
      status,
      layout,
      className,
      ...props
    },
    ref
  ) => {
    // カウントダウンタイマーの状態管理
    const [timeLeft, setTimeLeft] = useState(countdownSeconds);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // 残り時間の表示フォーマット
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // QRコード用の値を生成
    const qrCodeValue = useMemo(() => {
      // シンプルなURI形式を使用
      return `${currency.toLowerCase()}:${depositAddress}?amount=${cryptoAmount}`;
    }, [currency, depositAddress, cryptoAmount]);

    // カウントダウンタイマーの効果
    useEffect(() => {
      if (timeLeft <= 0) return;

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [timeLeft]);

    // 送金完了処理
    const handlePaymentComplete = useCallback(() => {
      if (showConfirmation) {
        onPaymentComplete?.();
      } else {
        setShowConfirmation(true);
      }
    }, [showConfirmation, onPaymentComplete]);

    // アドレスのコピー
    const copyAddress = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(depositAddress);
        toast.success('アドレスをコピーしました');
      } catch (error) {
        console.error('コピーエラー:', error);
        toast.error('コピーに失敗しました');
      }
    }, [depositAddress]);

    // 現在の状態を決定
    const currentStatus = useMemo(() => {
      if (timeLeft <= 0) return 'expired';
      if (timeLeft <= 60) return 'warning';
      return status || 'active';
    }, [timeLeft, status]);

    return (
      <div
        ref={ref}
        className={cn(
          paymentInstructionsVariants({ variant, status: currentStatus, layout }),
          className
        )}
        {...props}
      >
        {/* カウントダウンタイマー */}
        {countdownSeconds > 0 && (
          <div
            className={cn(
              'group relative transition-all duration-300 rounded-lg max-w-2xl mx-auto',
              variant === 'minimal'
                ? 'border p-3 bg-background'
                : 'border-2 border-blue-200 bg-blue-50 shadow-sm backdrop-blur-sm hover:border-border/80 hover:shadow-md'
            )}
          >
            <div className='p-4'>
              <div className='flex items-center justify-center gap-2 text-primary'>
                <Clock className='h-5 w-5' />
                <span className='text-lg font-bold'>{formatTime(timeLeft)}</span>
              </div>
              <span className='text-sm text-muted-foreground text-center mt-2 block'>
                制限時間内に送金を完了してください
              </span>
            </div>
          </div>
        )}

        {/* 送金先情報 */}
        <div
          className={cn(
            'group relative transition-all duration-300 rounded-lg max-w-2xl mx-auto',
            variant === 'minimal'
              ? 'border bg-background'
              : 'bg-card border border-border shadow-sm backdrop-blur-sm hover:border-border/80 hover:shadow-md'
          )}
        >
          <div className='p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <CurrencyIcon currency={currency as CurrencyType} size='xs' />
              <span className='text-sm font-medium'>送金先情報</span>
            </div>
            <div className='space-y-4'>
              {/* QRコード */}
              <div className='flex justify-center'>
                <div className='p-3 bg-white rounded-lg border'>
                  <QRCodeSVG
                    value={qrCodeValue}
                    size={160}
                    title={`${currency} Payment QR Code`}
                    className='h-auto max-w-full w-full'
                  />
                </div>
              </div>

              {/* アドレス */}
              <div className='space-y-2'>
                <Label>送金先アドレス</Label>
                <div className='p-3 bg-muted rounded-lg'>
                  <span className='text-sm font-mono break-all'>{depositAddress}</span>
                </div>
                <Button variant='outline' size='sm' onClick={copyAddress} className='w-full'>
                  <Copy className='h-4 w-4 mr-2' />
                  アドレスをコピー
                </Button>
              </div>

              {/* 送金情報 */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <span className='text-sm text-muted-foreground'>通貨</span>
                  <div className='flex items-center gap-1'>
                    <CurrencyIcon currency={currency as CurrencyType} size='xs' />
                    <span className='text-sm font-medium'>{currency}</span>
                  </div>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm text-muted-foreground'>ネットワーク</span>
                  <Badge variant='secondary' className='text-xs'>
                    {network}
                  </Badge>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm text-muted-foreground'>送金額</span>
                  <span className='text-sm font-medium'>
                    {cryptoAmount.toFixed(8)} {currency}
                  </span>
                </div>
                <div className='space-y-1'>
                  <span className='text-sm text-muted-foreground'>USD換算</span>
                  <span className='text-sm font-medium'>${usdAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        {variant !== 'minimal' && (
          <div
            className={cn(
              'group relative transition-all duration-300 rounded-lg max-w-2xl mx-auto',
              'border border-yellow-200 bg-yellow-50 shadow-sm backdrop-blur-sm hover:border-border/80 hover:shadow-md'
            )}
          >
            <div className='p-4'>
              <div className='flex items-start gap-3 text-yellow-700'>
                <AlertCircle className='h-4 w-4 mt-0.5 flex-shrink-0' />
                <div className='space-y-2 flex-1'>
                  <span className='text-sm font-medium text-yellow-800'>送金時の注意事項</span>
                  <div className='space-y-1'>
                    <span className='text-sm text-yellow-700'>• 正確な金額を送金してください</span>
                    <span className='text-sm text-yellow-700'>
                      • 指定されたネットワークを使用してください
                    </span>
                    <span className='text-sm text-yellow-700'>
                      • 制限時間内に送金を完了してください
                    </span>
                    <span className='text-sm text-yellow-700'>
                      • 送金後は下のボタンで完了を報告してください
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 送金完了ボタン */}
        {showCompletionButton && (
          <div className='space-y-2'>
            {showConfirmation ? (
              <div
                className={cn(
                  'group relative transition-all duration-300 rounded-lg max-w-2xl mx-auto',
                  variant === 'minimal'
                    ? 'border p-3 bg-background'
                    : 'border border-green-200 bg-green-50 shadow-sm backdrop-blur-sm hover:border-border/80 hover:shadow-md'
                )}
              >
                <div className='p-4'>
                  <div className='text-center space-y-3'>
                    <CheckCircle className='h-6 w-6 text-green-600 mx-auto' />
                    <span className='text-sm text-green-700'>送金を完了しましたか？</span>
                    <div className='flex gap-2'>
                      <Button size='sm' onClick={handlePaymentComplete} className='flex-1'>
                        はい、完了しました
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setShowConfirmation(false)}
                        className='flex-1'
                      >
                        いいえ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handlePaymentComplete}
                disabled={currentStatus === 'expired'}
                className='w-full'
              >
                <CheckCircle className='h-4 w-4 mr-2' />
                送金完了を報告
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

PaymentInstructions.displayName = 'PaymentInstructions';

export { paymentInstructionsVariants };
