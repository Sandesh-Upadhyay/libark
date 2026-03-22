/**
 * 🪙 暗号通貨入金履歴ページ（NOWPayments）
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth } from '@libark/graphql-client';

import { Button, Badge, Card, CardContent } from '@/components/atoms';
import { CurrencyIcon } from '@/features/wallet/components/atoms/CurrencyIcon';

// 入金履歴の型定義（Prismaレスポンスに合わせて）
interface PaymentHistory {
  id: string;
  paymentId: string;
  orderId: string;
  paymentStatus: string;
  priceAmount: string; // Prismaから文字列として返される
  priceCurrency: string;
  payAmount: string; // Prismaから文字列として返される
  payCurrency: string;
  payAddress: string;
  payinExtraId?: string;
  createdAt: string;
  updatedAt: string;
}

// ステータスの表示設定
const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'waiting':
      return { label: '入金待ち', variant: 'secondary' as const, color: 'text-yellow-600' };
    case 'confirming':
      return { label: '確認中', variant: 'secondary' as const, color: 'text-blue-600' };
    case 'confirmed':
      return { label: '確認済み', variant: 'default' as const, color: 'text-green-600' };
    case 'finished':
      return { label: '完了', variant: 'default' as const, color: 'text-green-600' };
    case 'failed':
      return { label: '失敗', variant: 'destructive' as const, color: 'text-red-600' };
    case 'expired':
      return { label: '期限切れ', variant: 'destructive' as const, color: 'text-red-600' };
    default:
      return { label: status, variant: 'secondary' as const, color: 'text-gray-600' };
  }
};

export default function DepositHistoryPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 入金履歴を取得
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      // 認証チェック
      if (!isAuthenticated || !user) {
        setError('認証が必要です');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/nowpayments/payments/history', {
          method: 'GET',
          credentials: 'include', // Cookie認証を含める
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('認証が必要です');
          } else if (response.status === 403) {
            throw new Error('アクセス権限がありません');
          } else {
            throw new Error(`サーバーエラー: ${response.status}`);
          }
        }

        const result = await response.json();
        if (result.success) {
          setPayments(result.data || []);
        } else {
          throw new Error(result.error || 'データの取得に失敗しました');
        }
      } catch (err) {
        console.error('Failed to fetch payment history:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <p className='text-lg text-red-600 mb-4'>エラーが発生しました: {error}</p>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      {/* ヘッダー */}
      <div className='flex items-center gap-4 mb-8'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => navigate(-1)}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          戻る
        </Button>
        <div>
          <h1 className='text-2xl font-bold'>暗号通貨入金履歴</h1>
          <p className='text-sm text-muted-foreground'>
            NOWPayments経由の暗号通貨入金履歴を確認できます
          </p>
        </div>
      </div>

      {/* 入金履歴リスト */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className='text-center py-12'>
            <p className='text-lg text-muted-foreground'>暗号通貨入金履歴がありません</p>
            <Button className='mt-4' onClick={() => navigate('/wallet/deposit/crypto')}>
              新しい暗号通貨入金を作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-2'>
          {payments.map(payment => {
            const statusConfig = getStatusConfig(payment.paymentStatus);

            return (
              <Card
                key={payment.id}
                className='hover:shadow-md transition-shadow cursor-pointer'
                onClick={() => navigate(`/wallet/deposit/crypto/history/${payment.paymentId}`)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    {/* 左側：通貨アイコンと基本情報 */}
                    <div className='flex items-center space-x-3 min-w-0 flex-1'>
                      <div
                        role='img'
                        aria-label={`${payment.payCurrency} icon`}
                        className='flex items-center justify-center'
                      >
                        <CurrencyIcon
                          currency={payment.payCurrency as string}
                          size='sm'
                          iconOnly={true}
                        />
                      </div>
                      <div className='min-w-0 flex flex-col justify-center'>
                        <div className='font-medium leading-tight'>
                          {parseFloat(payment.payAmount).toFixed(8)} {payment.payCurrency}
                        </div>
                        <p className='text-sm text-muted-foreground text-left leading-tight'>
                          ${parseFloat(payment.priceAmount).toFixed(2)} USD
                        </p>
                      </div>
                    </div>

                    {/* 中央：ステータス */}
                    <div className='flex-1 flex justify-center'>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>

                    {/* 右側：日時と詳細ボタン */}
                    <div className='text-right min-w-0 flex-1'>
                      <p className='text-sm text-muted-foreground text-right'>
                        {new Date(payment.createdAt).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className='mt-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 px-2'
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/wallet/deposit/crypto/history/${payment.paymentId}`);
                          }}
                        >
                          <ExternalLink className='h-3 w-3 mr-1' />
                          詳細
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
