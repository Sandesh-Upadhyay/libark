import { Link } from 'react-router-dom';
import { useMyP2PTradeRequestsQuery, useMyP2POffersQuery } from '@libark/graphql-client';

import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { P2PBalanceSection } from '@/features/wallet/components/molecules/P2PBalanceSection';
import { P2PTradeCard } from '@/features/wallet/components/molecules/P2PTradeCard';
import { P2POfferCard } from '@/features/p2p/components/molecules/P2POfferCard';

export function P2PSellerDashboardPage() {
  const { data: offerData, loading: offerLoading } = useMyP2POffersQuery();

  const { data: tradesData, loading: tradesLoading } = useMyP2PTradeRequestsQuery({
    variables: {
      first: 10,
    },
  });

  const activeTrades =
    tradesData?.myP2PTradeRequests.filter(trade =>
      ['PENDING', 'MATCHED', 'PAYMENT_SENT'].includes(trade.status)
    ) || [];

  const myOffer = offerData?.myP2POffers?.[0];

  const handleTradeClick = (tradeId: string) => {
    window.location.href = `/wallet/p2p/trade/${tradeId}`;
  };

  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='売り手ダッシュボード' className='container mx-auto px-4 py-8'>
        <Header title='売り手ダッシュボード' subtitle='P2P取引の管理と残高確認' />

        <div className='mt-6'>
          <P2PBalanceSection />
        </div>

        <div className='mt-8'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>アクティブオファー</CardTitle>
                <Button asChild variant='outline' size='sm'>
                  <Link to='/wallet/p2p/seller'>管理</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {offerLoading ? (
                <div className='text-center py-8 text-muted-foreground'>読み込み中...</div>
              ) : myOffer ? (
                <P2POfferCard offer={myOffer} fiatCurrency={myOffer.fiatCurrency} />
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  <p className='mb-4'>オファーがまだありません</p>
                  <Button asChild>
                    <Link to='/wallet/p2p/seller'>オファーを作成</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='mt-8'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>進行中の取引</CardTitle>
                <Button asChild variant='outline' size='sm'>
                  <Link to='/wallet/p2p/history'>履歴</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className='text-center py-8 text-muted-foreground'>読み込み中...</div>
              ) : activeTrades.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  進行中の取引はありません
                </div>
              ) : (
                <div className='space-y-4'>
                  {activeTrades.map(trade => (
                    <P2PTradeCard
                      key={trade.id}
                      trade={trade}
                      onClick={() => handleTradeClick(trade.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='mt-8 pt-6 border-t border-border'>
          <div className='flex flex-wrap gap-3'>
            <Button asChild variant='outline' size='sm'>
              <Link to='/wallet/p2p/seller'>💼 オファー管理</Link>
            </Button>
            <Button asChild variant='outline' size='sm'>
              <Link to='/wallet/p2p/history'>📋 取引履歴</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageLayoutTemplate>
  );
}

export default P2PSellerDashboardPage;
