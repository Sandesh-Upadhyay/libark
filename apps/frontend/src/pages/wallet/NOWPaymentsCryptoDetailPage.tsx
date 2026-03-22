/**
 * 🪙 暗号通貨入金詳細ページ（NOWPayments）
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { ArrowLeft, Copy, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@libark/graphql-client';

import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/atoms';
import { CurrencyIcon } from '@/features/wallet/components/atoms/CurrencyIcon';

// 入金詳細の型定義（履歴と同じ）
interface PaymentDetail {
  id: string;
  paymentId: string;
  orderId: string;
  purchaseId: string;
  paymentStatus: string;
  priceAmount: string;
  priceCurrency: string;
  payAmount: string;
  payCurrency: string;
  payAddress: string;
  payinExtraId?: string;
  orderDescription?: string;
  createdAt: string;
  updatedAt: string;
  // 追加情報
  actuallyPaid?: string;
  outcomeAmount?: string;
  outcomeCurrency?: string;
  nowpaymentsCreatedAt?: string;
  nowpaymentsUpdatedAt?: string;
}

// ステータス設定
const getStatusConfig = (status: string) => {
  switch (status.toUpperCase()) {
    case 'FINISHED':
      return {
        variant: 'default' as const,
        label: '完了',
        icon: CheckCircle,
        color: 'text-green-600',
      };
    case 'WAITING':
      return {
        variant: 'secondary' as const,
        label: '入金待ち',
        icon: Clock,
        color: 'text-yellow-600',
      };
    case 'CONFIRMING':
      return {
        variant: 'outline' as const,
        label: '確認中',
        icon: AlertCircle,
        color: 'text-blue-600',
      };
    case 'PARTIALLY_PAID':
      return {
        variant: 'outline' as const,
        label: '一部受取',
        icon: AlertCircle,
        color: 'text-orange-600',
      };
    default:
      return {
        variant: 'destructive' as const,
        label: 'エラー',
        icon: XCircle,
        color: 'text-red-600',
      };
  }
};

export default function NOWPaymentsCryptoDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 決済詳細を取得
  useEffect(() => {
    const fetchPaymentDetail = async () => {
      if (!isAuthenticated || !user || !paymentId) {
        setError('認証が必要です');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/nowpayments/payments/${paymentId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('決済が見つかりません');
          } else if (response.status === 401) {
            throw new Error('認証が必要です');
          } else if (response.status === 403) {
            throw new Error('アクセス権限がありません');
          } else {
            throw new Error(`サーバーエラー: ${response.status}`);
          }
        }

        const result = await response.json();
        if (result.success) {
          setPayment(result.data);
        } else {
          throw new Error(result.error || 'データの取得に失敗しました');
        }
      } catch (err) {
        console.error('Failed to fetch payment detail:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetail();
  }, [isAuthenticated, user, paymentId]);

  // コピー機能
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}をコピーしました`);
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <div className='text-lg'>読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='text-center py-12'>
            <div className='text-lg text-muted-foreground'>{error}</div>
            <Button className='mt-4' onClick={() => navigate('/wallet/deposit/crypto/history')}>
              履歴に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='text-center py-12'>
            <div className='text-lg text-muted-foreground'>決済情報が見つかりません</div>
            <Button className='mt-4' onClick={() => navigate('/wallet/deposit/crypto/history')}>
              履歴に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.paymentStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      {/* ヘッダー */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/wallet/deposit/crypto/history')}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            履歴に戻る
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>暗号通貨入金詳細</h1>
            <p className='text-sm text-muted-foreground'>Payment ID: {payment.paymentId}</p>
          </div>
        </div>
      </div>

      {/* メイン情報カード */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <CurrencyIcon currency={payment.payCurrency as string} size='lg' iconOnly={true} />
              <div>
                <CardTitle className='text-2xl'>
                  {parseFloat(payment.payAmount).toFixed(8)} {payment.payCurrency}
                </CardTitle>
                <p className='text-lg text-muted-foreground'>
                  ${parseFloat(payment.priceAmount).toFixed(2)} USD
                </p>
              </div>
            </div>
            <div className='text-right'>
              <div className='flex items-center space-x-2 mb-2'>
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                <Badge variant={statusConfig.variant} className='text-sm'>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {new Date(payment.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 送金情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>送金情報</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 送金先アドレス */}
          <div>
            <div className='text-sm text-muted-foreground mb-2'>送金先アドレス</div>
            <div className='flex items-center gap-2 p-3 bg-muted rounded-lg text-sm font-mono'>
              <span className='flex-1 break-all'>{payment.payAddress}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(payment.payAddress, 'アドレス')}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* メモ・タグ（ある場合のみ） */}
          {payment.payinExtraId && (
            <div>
              <p className='text-sm text-muted-foreground mb-2'>メモ・タグ（必須）</p>
              <div className='flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm font-mono'>
                <span className='flex-1 break-all font-bold text-yellow-800 dark:text-yellow-200'>
                  {payment.payinExtraId}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(payment.payinExtraId!, 'メモ')}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                ⚠️ {payment.payCurrency}の送金時は必ずこのメモ・タグを含めてください
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 詳細情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>詳細情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>注文ID</p>
              <p className='text-sm font-mono'>{payment.orderId}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Purchase ID</p>
              <p className='text-sm font-mono'>{payment.purchaseId}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Payment ID</p>
              <p className='text-sm font-mono'>{payment.paymentId}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>作成日時</p>
              <p className='text-sm'>{new Date(payment.createdAt).toLocaleString('ja-JP')}</p>
            </div>
            {payment.orderDescription && (
              <div className='md:col-span-2'>
                <p className='text-sm text-muted-foreground'>説明</p>
                <p className='text-sm'>{payment.orderDescription}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
