import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { Header } from '@/components/molecules/Header';
import { P2PSettingsForm } from '@/features/p2p/components/organisms/P2PSettingsForm';

export default function P2PSettingsPage() {
  return (
    <PageLayoutTemplate header={{ show: false }} requireAuth={true}>
      <div role='main' aria-label='P2P設定'>
        <Header title='P2P設定' />
        <div className='max-w-2xl mx-auto py-6 px-4'>
          <P2PSettingsForm />
        </div>
      </div>
    </PageLayoutTemplate>
  );
}
