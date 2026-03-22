/**
 * 📋 NOWPayments決済履歴コンポーネント
 */

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/atoms';

import { TransactionTable } from './TransactionTable';


// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

interface PaymentHistoryItem {
  id: string;
  paymentId: string;
  orderId: string;
  paymentStatus: string;
  priceAmount: number;
  priceCurrency: string;
  payAmount: number;
  payCurrency: string;
  actuallyPaid?: number;
  payAddress: string;
  testCase?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentHistoryProps {
  userId?: string;
  refreshTrigger?: number;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  userId = '00000000-0000-0000-0000-000000000000',
  refreshTrigger = 0,
}) => {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  // PaymentHistoryItemをTransactionItemに変換
  const convertToTransactionItems = (payments: any[]) => {
    return payments.map(payment => ({
      id: payment.id,
      type: 'deposit' as const,
      amount: payment.priceAmount,
      currency: payment.priceCurrency,
      cryptoAmount: payment.payAmount,
      cryptoCurrency: payment.payCurrency,
      status: payment.paymentStatus as 'pending' | 'completed' | 'failed' | 'cancelled',
      timestamp: payment.createdAt,
      description: `NOWPayments決済 - ${payment.paymentId}`,
      address: payment.payAddress,
      transactionHash: payment.paymentId,
      network: payment.payCurrency,
      fee: 0,
      feeCurrency: payment.payCurrency,
    }));
  };

  // 決済履歴を取得
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nowpayments/payments?userId=${userId}&limit=10&offset=0`, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const result = await response.json();

      if (result.success) {
        setPayments(result.data.payments || []);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込みとリフレッシュ
  useEffect(() => {
    fetchPayments();
  }, [userId, refreshTrigger]);

  // 決済状態のアイコンを取得
  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
      case 'confirming':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'finished':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'failed':
      case 'expired':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'partially_paid':
        return <AlertCircle className='h-4 w-4 text-orange-500' />;
      default:
        return <Clock className='h-4 w-4 text-gray-500' />;
    }
  };

  // 決済状態のテキストを取得
  const _getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return '支払い待ち';
      case 'confirming':
        return '確認中';
      case 'finished':
        return '完了';
      case 'failed':
        return '失敗';
      case 'expired':
        return '期限切れ';
      case 'partially_paid':
        return '一部支払い';
      default:
        return '不明';
    }
  };

  // 決済状態の色を取得
  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
      case 'confirming':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'finished':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'failed':
      case 'expired':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'partially_paid':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  // アドレスコピー
  const _handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('アドレスをコピーしました');
  };

  // QRコード表示切り替え
  const _toggleQRCode = (paymentId: string) => {
    setExpandedQR(expandedQR === paymentId ? null : paymentId);
  };

  // 決済状態を手動更新
  const _handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/nowpayments/payment/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          status: newStatus,
          actuallyPaid: newStatus === 'finished' ? 0.00025 : undefined,
        }),
      });

      if (response.ok) {
        toast.success(`決済状態を${newStatus}に更新しました`);
        fetchPayments(); // 履歴を再取得
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast.error('決済状態の更新に失敗しました');
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>決済履歴</h3>
        <div className='flex justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>決済履歴</h3>
        <div className='text-center py-8'>
          <XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <div className='text-muted-foreground'>{error}</div>
          <Button variant='outline' size='sm' onClick={fetchPayments} className='mt-4'>
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold'>決済履歴</h3>
        <Button variant='outline' size='sm' onClick={fetchPayments} disabled={loading}>
          更新
        </Button>
      </div>

      <TransactionTable
        transactions={convertToTransactionItems(payments) as any}
        onTransactionClick={transaction => {
          // 決済詳細表示やQRコード表示などの処理
          console.log('Transaction clicked:', transaction);
        }}
        isLoading={loading}
        error={error}
        emptyMessage='決済履歴がありません'
      />
    </div>
  );
};

export default PaymentHistory;
