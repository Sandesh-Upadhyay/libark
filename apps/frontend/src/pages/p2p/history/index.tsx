import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyP2PTradeRequestsQuery } from '@libark/graphql-client';
import type { P2PTradeStatus } from '@libark/graphql-client';

import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';

import { P2PTradeCard } from '../../../features/wallet/components/molecules/P2PTradeCard';

const STATUS_FILTERS: {
  value: P2PTradeStatus | 'all';
  label: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}[] = [
  { value: 'all', label: 'すべて' },
  { value: 'PENDING' as P2PTradeStatus, label: '待機中' },
  { value: 'MATCHED' as P2PTradeStatus, label: 'マッチ済み' },
  { value: 'PAYMENT_SENT' as P2PTradeStatus, label: '支払い済み', variant: 'warning' },
  { value: 'CONFIRMED' as P2PTradeStatus, label: '確認済み', variant: 'success' },
  { value: 'COMPLETED' as P2PTradeStatus, label: '完了', variant: 'success' },
  { value: 'CANCELLED' as P2PTradeStatus, label: 'キャンセル', variant: 'destructive' },
  { value: 'DISPUTED' as P2PTradeStatus, label: '紛争中', variant: 'destructive' },
];

export function P2PTradeHistoryPage() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<P2PTradeStatus | 'all'>('all');

  // ページネーション設定
  const ITEMS_PER_PAGE = 20;
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const currentCursor = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined;

  const { data, loading, error, refetch } = useMyP2PTradeRequestsQuery({
    variables: {
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      first: ITEMS_PER_PAGE,
      after: currentCursor,
    },
    fetchPolicy: 'network-only', // 最新状態を取得するため
  });

  const trades = data?.myP2PTradeRequests || [];
  const hasNextPage = trades.length === ITEMS_PER_PAGE;

  const handleNext = () => {
    if (trades.length > 0) {
      setCursorStack([...cursorStack, trades[trades.length - 1].id]);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setCursorStack(cursorStack.slice(0, -1));
    window.scrollTo(0, 0);
  };

  const handleStatusChange = (status: P2PTradeStatus | 'all') => {
    setSelectedStatus(status);
    setCursorStack([]); // フィルター変更時は1ページ目に戻る
  };

  const handleTradeClick = (tradeId: string) => {
    navigate(`/wallet/p2p/trade/${tradeId}`);
  };

  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='P2P取引履歴'>
        <Header title='取引履歴' subtitle='P2P取引の履歴を確認できます' />

        {/* ステータスフィルター */}
        <div className='mb-6'>
          <label className='block text-sm font-medium text-foreground mb-2'>
            ステータスフィルター
          </label>
          <div className='flex flex-wrap gap-2'>
            {STATUS_FILTERS.map(filter => (
              <Button
                key={filter.value}
                onClick={() => handleStatusChange(filter.value as P2PTradeStatus | 'all')}
                variant={selectedStatus === filter.value ? 'default' : 'outline'}
                size='sm'
                className={
                  selectedStatus === filter.value
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : ''
                }
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        {loading ? (
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='border border-border rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-6 w-16' />
                </div>
                <Skeleton className='h-4 w-full mb-2' />
                <Skeleton className='h-4 w-2/3' />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className='text-center py-8'>
            <p className='text-destructive mb-4'>エラーが発生しました</p>
            <Button
              variant='outline'
              onClick={() => {
                refetch();
                setCursorStack([]);
              }}
            >
              再読み込み
            </Button>
          </div>
        ) : trades.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-muted-foreground mb-4'>取引履歴がありません</p>
            {cursorStack.length > 0 ? (
              <Button onClick={handlePrev}>前のページに戻る</Button>
            ) : (
              <Button variant='default' onClick={() => navigate('/wallet/p2p')}>
                P2P取引を始める
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {trades.map(trade => (
              <P2PTradeCard
                key={trade.id}
                trade={trade}
                onClick={() => handleTradeClick(trade.id)}
              />
            ))}
          </div>
        )}

        {/* ページネーション */}
        <div className='mt-8 flex justify-between items-center'>
          <Button
            variant='outline'
            onClick={handlePrev}
            disabled={cursorStack.length === 0 || loading}
          >
            &larr; 前へ
          </Button>
          <span className='text-sm text-muted-foreground'>ページ {cursorStack.length + 1}</span>
          <Button variant='outline' onClick={handleNext} disabled={!hasNextPage || loading}>
            次へ &rarr;
          </Button>
        </div>
      </div>
    </PageLayoutTemplate>
  );
}

export default P2PTradeHistoryPage;
