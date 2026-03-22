/**
 * 🪙 暗号通貨出金履歴ページ
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Textコンポーネントは削除済み - 直接Tailwindクラスを使用
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, type User } from '@libark/graphql-client';

import { Button, Badge, Card, CardContent } from '@/components/atoms';
import { CurrencyIcon } from '@/features/wallet/components/atoms/CurrencyIcon';

// 出金履歴の型定義
interface WithdrawalHistory {
  id: string;
  userId: string;
  currency: string;
  amount: number;
  amountUsd: number;
  destinationAddress: string;
  memo?: string;
  network: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ステータス設定を取得する関数
const getStatusConfig = (status: WithdrawalHistory['status']) => {
  switch (status) {
    case 'COMPLETED':
      return {
        variant: 'default' as const,
        label: '完了',
      };
    case 'PENDING':
      return {
        variant: 'secondary' as const,
        label: '処理中',
      };
    case 'FAILED':
      return {
        variant: 'destructive' as const,
        label: '失敗',
      };
    case 'CANCELLED':
      return {
        variant: 'outline' as const,
        label: 'キャンセル',
      };
    default:
      return {
        variant: 'outline' as const,
        label: '不明',
      };
  }
};

export default function WithdrawalHistoryPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth() as { user: User | null; isAuthenticated: boolean };
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 出金履歴を取得
  useEffect(() => {
    const fetchWithdrawalHistory = async () => {
      // 認証チェック
      if (!isAuthenticated || !user) {
        setError('認証が必要です');
        setLoading(false);
        return;
      }

      try {
        // TODO: 実際のAPIエンドポイントに置き換える
        // const response = await fetch('/api/wallet/withdrawals', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });

        // モックデータ（開発用）
        const mockWithdrawals: WithdrawalHistory[] = [
          {
            id: '1',
            userId: user?.id || 'unknown',
            currency: 'BTC',
            amount: 0.001,
            amountUsd: 45.5,
            destinationAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            network: 'mainnet',
            status: 'COMPLETED',
            processedAt: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: '2',
            userId: user?.id || 'unknown',
            currency: 'ETH',
            amount: 0.05,
            amountUsd: 120.0,
            destinationAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
            network: 'mainnet',
            status: 'PENDING',
            createdAt: '2024-01-14T15:20:00Z',
            updatedAt: '2024-01-14T15:20:00Z',
          },
          {
            id: '3',
            userId: user?.id || 'unknown',
            currency: 'USDT',
            amount: 100.0,
            amountUsd: 100.0,
            destinationAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
            network: 'TRC20',
            status: 'FAILED',
            errorMessage: 'Insufficient balance',
            createdAt: '2024-01-13T09:15:00Z',
            updatedAt: '2024-01-13T09:20:00Z',
          },
        ];

        setWithdrawals(mockWithdrawals);
      } catch (err) {
        console.error('出金履歴の取得に失敗しました:', err);
        setError('出金履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalHistory();
  }, [isAuthenticated, user]);

  // アドレスをクリップボードにコピー
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('アドレスをコピーしました');
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
        <div className='text-center'>
          <div className='text-lg text-red-600 mb-4'>エラーが発生しました: {error}</div>
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
          <div className='text-2xl font-bold'>暗号通貨出金履歴</div>
          <div className='text-sm text-muted-foreground'>暗号通貨出金履歴を確認できます</div>
        </div>
      </div>

      {/* 出金履歴リスト */}
      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className='text-center py-12'>
            <p className='text-lg text-muted-foreground'>暗号通貨出金履歴がありません</p>
            <Button className='mt-4' onClick={() => navigate('/wallet/deposit/crypto')}>
              新しい暗号通貨出金を作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-2'>
          {withdrawals.map(withdrawal => {
            const statusConfig = getStatusConfig(withdrawal.status);

            return (
              <Card
                key={withdrawal.id}
                className='hover:shadow-md transition-shadow cursor-pointer'
                onClick={() => navigate(`/wallet/withdraw/crypto/history/${withdrawal.id}`)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    {/* 左側：通貨アイコンと基本情報 */}
                    <div className='flex items-center space-x-3 min-w-0 flex-1'>
                      <div
                        role='img'
                        aria-label={`${withdrawal.currency} icon`}
                        className='flex items-center justify-center'
                      >
                        <CurrencyIcon
                          currency={withdrawal.currency as string}
                          size='sm'
                          iconOnly={true}
                        />
                      </div>
                      <div className='min-w-0 flex flex-col justify-center'>
                        <div className='font-medium leading-tight'>
                          {withdrawal.amount.toFixed(8)} {withdrawal.currency}
                        </div>
                        <p className='text-sm text-muted-foreground text-left leading-tight'>
                          ${withdrawal.amountUsd.toFixed(2)} USD
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
                        {new Date(withdrawal.createdAt).toLocaleDateString('ja-JP', {
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
                            navigate(`/wallet/withdraw/crypto/history/${withdrawal.id}`);
                          }}
                        >
                          <ExternalLink className='h-3 w-3 mr-1' />
                          詳細
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 送金先アドレス（省略表示） */}
                  <div className='mt-3 pt-3 border-t'>
                    <div className='flex items-center justify-between'>
                      <div className='text-xs text-muted-foreground'>
                        送金先: {withdrawal.destinationAddress.slice(0, 10)}...
                        {withdrawal.destinationAddress.slice(-10)}
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 px-2'
                        onClick={e => {
                          e.stopPropagation();
                          copyToClipboard(withdrawal.destinationAddress);
                        }}
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
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
