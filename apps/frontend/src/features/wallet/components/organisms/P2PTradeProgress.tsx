import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, Copy, Check } from 'lucide-react';
import type { P2PTradeInfoFragment } from '@libark/graphql-client';

import { Button } from '@/components/atoms/button';
import { toast } from '@/lib/toast';

import { P2PStatusBadge } from '../atoms/P2PStatusBadge';
import { P2PTradeTimeline } from '../molecules/P2PTradeTimeline';

export interface P2PTradeProgressProps {
  trade: P2PTradeInfoFragment;
  className?: string;
  onExpire?: () => void;
  onDispute?: () => void;
}

/**
 * 残り時間を計算
 */
function calculateTimeRemaining(expiresAt: string): {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
} {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes, seconds, isExpired: false, totalSeconds };
}

/**
 * カウントダウンタイマーコンポーネント
 */
function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeRemaining.isExpired) {
    return (
      <div className='flex items-center gap-2 text-destructive'>
        <AlertTriangle className='h-4 w-4' />
        <span className='font-medium'>期限切れ</span>
      </div>
    );
  }

  const isUrgent = timeRemaining.totalSeconds < 300; // 5分以内

  return (
    <div
      className={`flex items-center gap-2 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      <Clock className={`h-4 w-4 ${isUrgent ? 'animate-pulse' : ''}`} />
      <span className='font-mono font-medium'>
        {String(timeRemaining.minutes).padStart(2, '0')}:
        {String(timeRemaining.seconds).padStart(2, '0')}
      </span>
      {isUrgent && <span className='text-xs'>残りわずか</span>}
    </div>
  );
}

/**
 * コピーボタンコンポーネント
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label}をコピーしました`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  }, [value, label]);

  return (
    <Button variant='ghost' size='sm' onClick={handleCopy} className='h-6 w-6 p-0'>
      {copied ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
    </Button>
  );
}

export function P2PTradeProgress({
  trade,
  className = '',
  onExpire,
  onDispute,
}: P2PTradeProgressProps) {
  const showTimer = ['PENDING', 'MATCHED', 'PAYMENT_SENT'].includes(trade.status);
  const canDispute = trade.status === 'PAYMENT_SENT';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>取引進行状況</h2>
        <div className='flex items-center gap-4'>
          {showTimer && <CountdownTimer expiresAt={trade.expiresAt} onExpire={onExpire} />}
          <P2PStatusBadge status={trade.status} />
        </div>
      </div>

      {/* 取引情報カード */}
      <div className='bg-card border border-border rounded-lg p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>取引ID</span>
          <div className='flex items-center gap-2'>
            <span className='font-mono text-sm'>{trade.id.slice(0, 8)}...</span>
            <CopyButton value={trade.id} label='取引ID' />
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>金額（USD）</span>
          <span className='font-semibold'>${Number(trade.amountUsd).toFixed(2)}</span>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>金額（{trade.fiatCurrency}）</span>
          <span className='font-semibold'>
            {trade.fiatCurrency === 'JPY' ? '¥' : trade.fiatCurrency === 'EUR' ? '€' : '$'}
            {Number(trade.fiatAmount).toLocaleString()}
          </span>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>為替レート</span>
          <span className='text-sm'>
            1 USD = {Number(trade.exchangeRate).toFixed(2)} {trade.fiatCurrency}
          </span>
        </div>

        {trade.paymentMethod && (
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>支払い方法</span>
            <span className='text-sm'>{getPaymentMethodLabel(trade.paymentMethod)}</span>
          </div>
        )}
      </div>

      {/* タイムライン */}
      <P2PTradeTimeline trade={trade} />

      {/* 紛争ボタン */}
      {canDispute && onDispute && (
        <div className='pt-4 border-t border-border'>
          <Button variant='destructive' size='sm' onClick={onDispute} className='w-full'>
            <AlertTriangle className='h-4 w-4 mr-2' />
            問題を報告する（紛争を開始）
          </Button>
          <p className='text-xs text-muted-foreground mt-2 text-center'>
            支払いを行ったにもかかわらず確認されない場合にご利用ください
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 支払い方法のラベルを取得
 */
function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    BANK_TRANSFER: '銀行振込',
    PAYPAY: 'PayPay',
    PAYPAL: 'PayPal',
    WISE: 'Wise',
    LINE_PAY: 'LINE Pay',
    RAKUTEN_PAY: '楽天ペイ',
  };
  return labels[method] || method;
}
