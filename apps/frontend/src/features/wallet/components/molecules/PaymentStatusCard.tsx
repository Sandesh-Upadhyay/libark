'use client';

import { Copy, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/atoms';

// NOWPayments決済ステータス
type PaymentStatus =
  | 'WAITING'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'SENDING'
  | 'PARTIALLY_PAID'
  | 'FINISHED'
  | 'FAILED'
  | 'REFUNDED'
  | 'EXPIRED';

interface PaymentInfo {
  id: string;
  paymentId: string;
  orderId: string;
  paymentStatus: PaymentStatus;
  paymentType: 'CRYPTO2CRYPTO' | 'FIAT2CRYPTO';

  // 価格情報
  priceAmount: number;
  priceCurrency: string;
  payAmount: number;
  payCurrency: string;
  actuallyPaid?: number;

  // アドレス情報
  payAddress: string;
  payinExtraId?: string;
  payoutAddress?: string;

  // 結果情報
  outcomeAmount?: number;
  outcomeCurrency?: string;

  // メタ情報
  fixedRate: boolean;
  feePaidByUser: boolean;
  orderDescription?: string;

  // タイムスタンプ
  createdAt: string;
  updatedAt: string;
  nowpaymentsCreatedAt?: string;
  nowpaymentsUpdatedAt?: string;
}

interface PaymentStatusCardProps {
  payment: PaymentInfo;
  showAdminInfo?: boolean; // 管理者向け詳細情報を表示するか
}

// ステータス別の表示設定
const statusConfig = {
  WAITING: {
    label: '支払い待ち',
    color: 'bg-warning/10 text-warning-foreground',
    icon: Clock,
    description: '暗号通貨の送金をお待ちしています',
  },
  CONFIRMING: {
    label: '確認中',
    color: 'bg-info/10 text-info-foreground',
    icon: AlertCircle,
    description: 'ブロックチェーンで確認中です',
  },
  CONFIRMED: {
    label: '確認済み',
    color: 'bg-success/10 text-success-foreground',
    icon: CheckCircle,
    description: '支払いが確認されました',
  },
  SENDING: {
    label: '送金中',
    color: 'bg-info/10 text-info-foreground',
    icon: AlertCircle,
    description: '送金処理中です',
  },
  PARTIALLY_PAID: {
    label: '一部支払い済み',
    color: 'bg-warning/10 text-warning-foreground',
    icon: AlertCircle,
    description: '不足分の支払いが必要です',
  },
  FINISHED: {
    label: '完了',
    color: 'bg-success/10 text-success-foreground',
    icon: CheckCircle,
    description: '決済が完了しました',
  },
  FAILED: {
    label: '失敗',
    color: 'bg-destructive/10 text-destructive-foreground',
    icon: XCircle,
    description: '決済に失敗しました',
  },
  REFUNDED: {
    label: '返金済み',
    color: 'bg-muted text-muted-foreground',
    icon: AlertCircle,
    description: '返金処理が完了しました',
  },
  EXPIRED: {
    label: '期限切れ',
    color: 'bg-muted text-muted-foreground',
    icon: XCircle,
    description: '決済期限が切れました',
  },
};

export function PaymentStatusCard({ payment, showAdminInfo = false }: PaymentStatusCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const status = statusConfig[payment.paymentStatus];
  const StatusIcon = status.icon;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(8)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>決済情報</CardTitle>
          <Badge className={status.color}>
            <StatusIcon className='w-4 h-4 mr-1' />
            {status.label}
          </Badge>
        </div>
        <p className='text-sm text-muted-foreground'>{status.description}</p>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* 基本情報 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>注文ID</label>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-sm'>{payment.orderId}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(payment.orderId, 'orderId')}
              >
                <Copy className='w-4 h-4' />
              </Button>
            </div>
          </div>

          <div>
            <label className='text-sm font-medium text-muted-foreground'>決済ID</label>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-sm'>{payment.paymentId}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(payment.paymentId, 'paymentId')}
              >
                <Copy className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* 金額情報 */}
        <div className='space-y-3'>
          <h4 className='font-medium'>金額情報</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm text-muted-foreground'>注文金額</label>
              <p className='font-medium'>
                {formatAmount(payment.priceAmount, payment.priceCurrency)}
              </p>
            </div>
            <div>
              <label className='text-sm text-muted-foreground'>支払い予定額</label>
              <p className='font-medium'>{formatAmount(payment.payAmount, payment.payCurrency)}</p>
            </div>
            {payment.actuallyPaid && (
              <div>
                <label className='text-sm text-muted-foreground'>実際の支払い額</label>
                <p className='font-medium'>
                  {formatAmount(payment.actuallyPaid, payment.payCurrency)}
                </p>
              </div>
            )}
            {payment.outcomeAmount && (
              <div>
                <label className='text-sm text-muted-foreground'>受取額</label>
                <p className='font-medium'>
                  {formatAmount(payment.outcomeAmount, payment.outcomeCurrency!)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 支払いアドレス */}
        <div className='space-y-3'>
          <h4 className='font-medium'>支払い先情報</h4>
          <div>
            <label className='text-sm text-muted-foreground'>支払いアドレス</label>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-sm break-all'>{payment.payAddress}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(payment.payAddress, 'address')}
              >
                <Copy className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {payment.payinExtraId && (
            <div>
              <label className='text-sm text-muted-foreground'>Extra ID (メモ)</label>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-sm'>{payment.payinExtraId}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(payment.payinExtraId!, 'extraId')}
                >
                  <Copy className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 管理者向け詳細情報 */}
        {showAdminInfo && (
          <div className='space-y-3 border-t pt-4'>
            <h4 className='font-medium'>管理者情報</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <label className='text-muted-foreground'>決済タイプ</label>
                <p>{payment.paymentType}</p>
              </div>
              <div>
                <label className='text-muted-foreground'>固定レート</label>
                <p>{payment.fixedRate ? 'はい' : 'いいえ'}</p>
              </div>
              <div>
                <label className='text-muted-foreground'>手数料負担</label>
                <p>{payment.feePaidByUser ? 'ユーザー' : 'マーチャント'}</p>
              </div>
              {payment.payoutAddress && (
                <div>
                  <label className='text-muted-foreground'>出金先アドレス</label>
                  <p className='font-mono break-all'>{payment.payoutAddress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* タイムスタンプ */}
        <div className='space-y-2 text-sm text-muted-foreground border-t pt-4'>
          <div className='flex justify-between'>
            <span>作成日時:</span>
            <span>{formatDate(payment.createdAt)}</span>
          </div>
          <div className='flex justify-between'>
            <span>更新日時:</span>
            <span>{formatDate(payment.updatedAt)}</span>
          </div>
        </div>

        {/* コピー成功メッセージ */}
        {copied && (
          <div className='text-sm text-green-600 text-center'>
            {copied === 'orderId' && '注文IDをコピーしました'}
            {copied === 'paymentId' && '決済IDをコピーしました'}
            {copied === 'address' && 'アドレスをコピーしました'}
            {copied === 'extraId' && 'Extra IDをコピーしました'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
