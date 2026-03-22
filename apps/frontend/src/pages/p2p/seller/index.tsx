
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { toast } from '@/lib/toast';

import { P2PSellerOfferForm } from '../../../features/wallet/components/organisms/P2PSellerOfferForm';

export function P2PSellerOfferPage() {
  const handleComplete = () => {
    toast.success('オファーを保存しました');
  };

  const handleError = (error: Error) => {
    toast.error(error.message);
  };

  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='P2Pオファー管理'>
        <Header title='オファー管理' subtitle='P2Pオファーを作成・管理できます' />
        <P2PSellerOfferForm onComplete={handleComplete} onError={handleError} />
      </div>
    </PageLayoutTemplate>
  );
}

export default P2PSellerOfferPage;
