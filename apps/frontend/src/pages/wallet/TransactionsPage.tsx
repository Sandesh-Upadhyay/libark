/**
 * 🎯 取引履歴ページ
 *
 * 責任:
 * - ウォレットの取引履歴を独立したページとして表示
 * - フィルタリングと検索機能
 * - ウォレットナビゲーションとの統合
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Filter } from 'lucide-react';

import { Motion, Button } from '@/components/atoms';
import { SectionShell } from '@/components/molecules/SectionShell';
import { TransactionTable } from '@/features/wallet/components/molecules';
import type { TransactionItem } from '@/features/wallet/components/molecules/TransactionTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';
import { Input } from '@/components/atoms';
import { Label } from '@/components/atoms';
import { useWalletTransactions } from '@/features/wallet/hooks';

// ローカル取引アイテム型（TransactionTableのTransactionItemと互換性を持つ）
interface LocalTransactionItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PURCHASE' | 'SALE';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  description?: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
}

/**
 * 🎯 取引履歴ページコンポーネント
 */
const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 取引履歴データ
  const { transactions, loading } = useWalletTransactions();

  // フィルター状態
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 戻るボタン
  const handleBack = () => {
    navigate('/wallet');
  };

  // 取引詳細表示
  const handleTransactionClick = (transaction: TransactionItem | LocalTransactionItem) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('🔍 取引詳細:', transaction);
    }
    // TODO: 取引詳細モーダルまたはページを表示
  };

  // 表示用の取引データ（TransactionItem型に変換）
  const displayTransactions: TransactionItem[] =
    transactions && transactions.length > 0
      ? transactions.map(
          (tx: {
            id: string;
            type: string;
            amount: number;
            currency: string;
            status: string;
            createdAt: string;
            description?: string;
          }): TransactionItem => {
            const txType = tx.type.toLowerCase();
            if (txType === 'deposit') {
              return {
                id: tx.id,
                type: 'deposit',
                amount: tx.amount,
                currency: 'USD',
                description: tx.description || '',
                timestamp: new Date(tx.createdAt),
                status: tx.status.toLowerCase() as 'pending' | 'completed' | 'failed',
                method: 'crypto' as const,
                cryptoDetails: {
                  currency: 'BTC',
                  amount: 0,
                },
              };
            } else {
              return {
                id: tx.id,
                type: 'withdrawal',
                amount: tx.amount,
                currency: 'USD',
                description: tx.description || '',
                timestamp: new Date(tx.createdAt),
                status: tx.status.toLowerCase() as 'pending' | 'completed' | 'failed',
                method: 'crypto' as const,
                cryptoDetails: {
                  currency: 'BTC',
                  amount: 0,
                  address: '',
                },
              };
            }
          }
        )
      : [];

  // フィルタリング
  const filteredTransactions = displayTransactions.filter((transaction: TransactionItem) => {
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className='space-y-6'>
      {/* ヘッダーアクション */}
      <div className='flex justify-end'>
        <Button variant='outline' size='sm' onClick={handleBack} className='flex items-center'>
          <ArrowLeft className='h-4 w-4' />
          戻る
        </Button>
      </div>

      <Motion.div preset='slideUp' delay={0.1}>
        <SectionShell
          variant='settings'
          title={t('wallet.transactions.filter.title', { default: 'フィルター' })}
          description={t('wallet.transactions.filter.description', {
            default: '取引履歴を絞り込んで表示します',
          })}
          icon={Filter}
        >
          <div className='grid grid-cols-1 md:grid-cols-3'>
            {/* 取引タイプフィルター */}
            <div>
              <Label htmlFor='type-filter'>取引タイプ</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='すべて' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>すべて</SelectItem>
                  <SelectItem value='deposit'>入金</SelectItem>
                  <SelectItem value='withdrawal'>出金</SelectItem>
                  <SelectItem value='payment'>支払い</SelectItem>
                  <SelectItem value='receive'>受け取り</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ステータスフィルター */}
            <div>
              <Label htmlFor='status-filter'>ステータス</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='すべて' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>すべて</SelectItem>
                  <SelectItem value='pending'>処理中</SelectItem>
                  <SelectItem value='completed'>完了</SelectItem>
                  <SelectItem value='failed'>失敗</SelectItem>
                  <SelectItem value='cancelled'>キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 検索 */}
            <div>
              <Label htmlFor='search'>検索</Label>
              <Input
                id='search'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='取引ID、ハッシュ、ユーザー名で検索'
              />
            </div>
          </div>
        </SectionShell>
      </Motion.div>

      <Motion.div preset='slideUp' delay={0.2}>
        <SectionShell
          variant='settings'
          title={t('wallet.transactions.list.title', { default: '取引一覧' })}
          description={`${filteredTransactions.length}件の取引が見つかりました`}
          icon={History}
        >
          <TransactionTable
            transactions={filteredTransactions}
            initialPageSize={20}
            onTransactionClick={handleTransactionClick}
            isLoading={loading}
            emptyMessage='条件に一致する取引履歴がありません'
          />
        </SectionShell>
      </Motion.div>
    </div>
  );
};

export default TransactionsPage;
