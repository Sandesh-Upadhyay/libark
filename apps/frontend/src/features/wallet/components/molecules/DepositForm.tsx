/**
 * 🎯 入金フォームコンポーネント (Molecule)
 *
 * 責任:
 * - 入金金額の入力
 * - バリデーション
 * - フォーム送信処理
 */

import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/atoms';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { Input } from '@/components/atoms';
import { Label } from '@/components/atoms';
import type { AmountLimits } from '@/features/wallet/hooks';

import { DepositButton } from '../atoms/DepositButton';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

/**
 * 入金フォームのバリアント定義
 */
const depositFormVariants = cva('w-full', {
  variants: {
    variant: {
      default: '',
      compact: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface DepositFormProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'>,
    VariantProps<typeof depositFormVariants> {
  /** 最小入金額（USD換算） */
  minAmount?: number;
  /** 最大入金額（USD） */
  maxAmount?: number;
  /** 通貨コード */
  currency?: string;
  /** 最小額（暗号通貨単位） */
  minAmountCrypto?: number;
  /** 選択された暗号通貨 */
  selectedCurrency?: string;
  /** ローディング状態 */
  isLoading?: boolean;
  /** 制限額ローディング状態 */
  limitsLoading?: boolean;
  /** 入金送信時のコールバック */
  onSubmit?: (amount: number) => void | Promise<void>;
  /** フォームタイトル */
  title?: string;
  /** 説明文 */
  description?: string;
  /** 最大幅 */
  maxWidth?: string | number;
  /** 制限額エラー */
  limitsError?: string | null;
  /** 制限額情報 */
  limits?: AmountLimits | null;
}

/**
 * 🎯 入金フォームコンポーネント
 */
export const DepositForm = React.forwardRef<HTMLDivElement, DepositFormProps>(
  (
    {
      minAmount,
      maxAmount,
      currency = 'USD',
      minAmountCrypto: _minAmountCrypto,
      selectedCurrency,
      isLoading = false,
      limitsLoading = false,
      onSubmit,
      title = '入金',
      description: _description = '入金したい金額を入力してください',
      variant,
      size,
      className,
      maxWidth,
      style,
      limitsError,
      limits,
      ...props
    },
    ref
  ) => {
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string>('');

    // 金額のバリデーション
    const validateAmount = (value: string): string => {
      if (!value.trim()) {
        return '金額を入力してください';
      }

      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        return '有効な金額を入力してください';
      }

      // 制限額が設定されている場合のみバリデーション
      if (minAmount !== undefined && numValue < minAmount) {
        const recommendedAmount = Math.ceil(minAmount * 1.1 * 100) / 100; // 10%マージンを追加
        return `最小入金額は $${minAmount.toLocaleString()} です。推奨: $${recommendedAmount.toLocaleString()}`;
      }

      if (maxAmount !== undefined && numValue > maxAmount) {
        return `最大入金額は ${maxAmount.toLocaleString()} ${currency} です`;
      }

      return '';
    };

    // 制限額が変更された時にバリデーションを再実行
    useEffect(() => {
      if (amount.trim() && !limitsLoading) {
        const validationError = validateAmount(amount);
        setError(validationError);
      } else if (limitsLoading) {
        // 制限額取得中はエラーをクリア
        setError('');
      }
    }, [minAmount, maxAmount, amount, limitsLoading]);

    // 金額変更ハンドラー
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAmount(value);

      // リアルタイムバリデーション（制限額取得中は無効化）
      if (!limitsLoading) {
        if (value.trim()) {
          const validationError = validateAmount(value);
          setError(validationError);
        } else {
          setError('');
        }
      }
    };

    // フォーム送信ハンドラー
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // 制限額取得中は送信を無効化
      if (limitsLoading) {
        return;
      }

      const validationError = validateAmount(amount);
      if (validationError) {
        setError(validationError);
        return;
      }

      const numAmount = parseFloat(amount);

      try {
        await onSubmit?.(numAmount);
        // 成功時はフォームをリセット
        setAmount('');
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '入金処理に失敗しました');
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(depositFormVariants({ variant, size }), className)}
        style={{
          maxWidth: maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : 'none',
          ...style,
        }}
        {...props}
      >
        <CardContent className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* タイトル */}
            {title && (
              <div className='space-y-2'>
                <span className='text-lg font-semibold'>{title}</span>
              </div>
            )}

            {/* 金額入力 */}
            <div className='space-y-2'>
              <Label htmlFor='amount'>金額 ({currency})</Label>
              <div className='relative'>
                <Input
                  id='amount'
                  type='number'
                  placeholder={
                    minAmount !== undefined && maxAmount !== undefined
                      ? `$${minAmount.toFixed(2)} - $${maxAmount.toLocaleString()}`
                      : '金額を入力してください'
                  }
                  value={amount}
                  onChange={handleAmountChange}
                  min={minAmount || undefined}
                  max={maxAmount || undefined}
                  step='any'
                  disabled={isLoading}
                  className={cn('pr-16', error && 'border-destructive focus:border-destructive')}
                />
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <span className='text-sm text-muted-foreground'>{currency}</span>
                </div>
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className='flex items-center gap-2 text-destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <span className='text-sm text-destructive'>{error}</span>
                </div>
              )}

              {/* 制限額エラーメッセージ */}
              {limitsError && (
                <div className='flex items-center gap-2 text-orange-600'>
                  <AlertCircle className='h-4 w-4' />
                  <span className='text-sm text-orange-600'>
                    制限額の取得に失敗しました: {limitsError}
                  </span>
                </div>
              )}
            </div>

            {/* 金額範囲の表示 - 詳細版 */}
            {(minAmount !== undefined || maxAmount !== undefined) && !limitsLoading && (
              <div className='space-y-1'>
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>最小: ${minAmount?.toFixed(2) || '0'}</span>
                  <span>最大: ${maxAmount?.toLocaleString() || '0'}</span>
                </div>
                {limits?.exchangeRate && limits.exchangeRate !== 1 && (
                  <div className='flex justify-between text-xs text-muted-foreground/70'>
                    <span>
                      {limits.minAmountCrypto?.toFixed(8)} {selectedCurrency}
                    </span>
                    <span>
                      {limits.maxAmountCrypto?.toFixed(8)} {selectedCurrency}
                    </span>
                  </div>
                )}
                {limits?.exchangeRate && limits.exchangeRate !== 1 && (
                  <div className='text-center text-xs text-muted-foreground/50'>
                    1 {selectedCurrency} = ${limits.exchangeRate.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* 送信ボタン */}
            <DepositButton
              type='submit'
              fullWidth={true}
              isLoading={isLoading || limitsLoading}
              disabled={!!error || !amount.trim() || limitsLoading}
              variant='default'
              size='md'
            >
              {isLoading
                ? '処理中...'
                : limitsLoading
                  ? '読み込み中...'
                  : amount
                    ? `$${parseFloat(amount).toLocaleString()} を入金`
                    : '入金'}
            </DepositButton>
          </form>
        </CardContent>
      </Card>
    );
  }
);

DepositForm.displayName = 'DepositForm';

export { depositFormVariants };
