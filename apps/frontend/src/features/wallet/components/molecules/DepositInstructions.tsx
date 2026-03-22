/**
 * 🎯 入金指示表示コンポーネント (Molecule)
 *
 * 責任:
 * - 入金先アドレスの表示
 * - 送金情報の表示
 * - 期限表示とタイマー
 * - 注意事項の表示
 */

import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Copy, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms';
import { Button, Badge } from '@/components/atoms';

import { CurrencyIcon } from '../atoms/CurrencyIcon';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

/**
 * 入金指示のバリアント定義
 */
const depositInstructionsVariants = cva('w-full space-y-4', {
  variants: {
    variant: {
      default: '',
      compact: 'space-y-3',
    },
    status: {
      active: '',
      warning: '',
      expired: 'opacity-60',
    },
  },
  defaultVariants: {
    variant: 'default',
    status: 'active',
  },
});

export interface DepositInstructionsProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof depositInstructionsVariants> {
  /** 入金先アドレス */
  depositAddress: string;
  /** 通貨 */
  currency: string;
  /** ネットワーク */
  network: string;
  /** 送金額（暗号通貨） */
  cryptoAmount: number;
  /** USD換算額 */
  usdAmount: number;
  /** 期限（Unix timestamp） */
  expiresAt?: number;
  /** 追加の注意事項 */
  additionalNotes?: string[];
}

/**
 * 🎯 入金指示表示コンポーネント
 */
export const DepositInstructions = React.forwardRef<HTMLDivElement, DepositInstructionsProps>(
  (
    {
      depositAddress,
      currency,
      network,
      cryptoAmount,
      usdAmount,
      expiresAt,
      additionalNotes = [],
      variant,
      status: _status,
      className,
      ...props
    },
    ref
  ) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // タイマー処理
    useEffect(() => {
      if (!expiresAt) return;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [expiresAt]);

    // 時間フォーマット
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // アドレスコピー
    const copyAddress = () => {
      navigator.clipboard.writeText(depositAddress);
      toast.success('アドレスをコピーしました');
    };

    // ステータス判定
    const currentStatus =
      timeLeft === 0 && expiresAt ? 'expired' : timeLeft < 3600 && expiresAt ? 'warning' : 'active';

    return (
      <div
        ref={ref}
        className={cn(depositInstructionsVariants({ variant, status: currentStatus }), className)}
        {...props}
      >
        {/* 期限表示 */}
        {expiresAt && (
          <Card
            className={cn(
              'border-2',
              currentStatus === 'expired'
                ? 'border-red-200 bg-red-50'
                : currentStatus === 'warning'
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-blue-200 bg-blue-50'
            )}
          >
            <CardContent className='p-4'>
              <div
                className={cn(
                  'flex items-center gap-2',
                  currentStatus === 'expired'
                    ? 'text-red-700'
                    : currentStatus === 'warning'
                      ? 'text-orange-700'
                      : 'text-blue-700'
                )}
              >
                <Clock className='h-4 w-4' />
                <span className='text-sm font-medium'>
                  {currentStatus === 'expired' ? '期限切れ' : `残り時間: ${formatTime(timeLeft)}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 送金先アドレス */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {' '}
              <CurrencyIcon currency={currency} size='xs' />
              送金先アドレス
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='p-3 bg-muted rounded-lg'>
              <span className='text-xs font-mono break-all'>{depositAddress}</span>
            </div>
            <Button variant='outline' size='sm' onClick={copyAddress} className='w-full'>
              <Copy className='h-4 w-4 mr-2' />
              アドレスをコピー
            </Button>
          </CardContent>
        </Card>

        {/* 送金情報 */}
        <Card>
          <CardContent className='pt-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>通貨:</span>
              <div className='flex items-center gap-1'>
                <CurrencyIcon currency={currency} size='xs' />
                <span className='font-medium'>{currency}</span>
              </div>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>ネットワーク:</span>
              <Badge variant='secondary' className='text-xs'>
                {network}
              </Badge>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>送金額:</span>
              <span className='font-medium'>
                {cryptoAmount.toFixed(8)} {currency}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>USD換算:</span>
              <span className='font-medium'>${usdAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 注意事項 */}
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-2 text-yellow-700'>
              <AlertCircle className='h-4 w-4 mt-0.5 flex-shrink-0' />
              <div className='text-xs space-y-1'>
                <p>• 正確な金額を送金してください</p>
                <p>• 指定されたネットワークを使用してください</p>
                <p>• 期限内に送金を完了してください</p>
                {additionalNotes.map((note, index) => (
                  <p key={index}>• {note}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

DepositInstructions.displayName = 'DepositInstructions';

export { depositInstructionsVariants };
