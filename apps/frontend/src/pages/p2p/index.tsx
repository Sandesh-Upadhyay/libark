import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { P2POfferInfoFragment } from '@libark/graphql-client';

import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { Button } from '@/components/atoms/button';
import { P2POfferTable } from '@/features/p2p/components/organisms/P2POfferTable';
import { P2PBuyDrawer } from '@/features/wallet/components/organisms/P2PBuyDrawer';

export function P2PMainPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<P2POfferInfoFragment | null>(null);

  const handleBuyClick = (offer: P2POfferInfoFragment) => {
    setSelectedOffer(offer);
    setIsDrawerOpen(true);
  };

  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='P2P取引' className='container mx-auto px-4 py-8'>
        {/* ヘッダー */}
        <Header title='P2P取引' subtitle='法定通貨でウォレットに入金できます' />

        {/* オファーテーブル */}
        <P2POfferTable onBuyClick={handleBuyClick} />

        {/* 売り手向けリンクセクション */}
        <div className='mt-8 pt-6 border-t border-border'>
          <h3 className='text-sm font-medium text-muted-foreground mb-3'>売り手として参加する</h3>
          <div className='flex flex-wrap gap-3'>
            <Button asChild variant='outline' size='sm'>
              <Link to='/wallet/p2p/seller/dashboard'>📊 売り手ダッシュボード</Link>
            </Button>
            <Button asChild variant='outline' size='sm'>
              <Link to='/wallet/p2p/seller'>💼 売り手オファー設定</Link>
            </Button>
            <Button asChild variant='outline' size='sm'>
              <Link to='/wallet/p2p/history'>📋 取引履歴</Link>
            </Button>
          </div>
        </div>

        {/* 購入ドロワー */}
        <P2PBuyDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          offer={selectedOffer}
        />
      </div>
    </PageLayoutTemplate>
  );
}

export default P2PMainPage;
