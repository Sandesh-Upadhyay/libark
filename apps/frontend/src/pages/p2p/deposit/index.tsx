
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';

import { P2PDepositFlow } from '../../../features/wallet/components/organisms/P2PDepositFlow';

export function P2PDepositPage() {
  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='P2P入金'>
        <Header title='P2P入金' subtitle='法定通貨でウォレットに入金できます' />
        <P2PDepositFlow />
      </div>
    </PageLayoutTemplate>
  );
}

export default P2PDepositPage;
