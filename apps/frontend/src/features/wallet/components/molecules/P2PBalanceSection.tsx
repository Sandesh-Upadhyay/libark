import { DollarSign, Lock, Wallet } from 'lucide-react';
import { useMyWalletQuery } from '@libark/graphql-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { StatsCard } from '@/components/atoms/stats-card';

export interface P2PBalanceSectionProps {
  className?: string;
}

export function P2PBalanceSection({ className = '' }: P2PBalanceSectionProps) {
  const { data, loading } = useMyWalletQuery();

  const wallet = data?.myWallet;
  const p2pBalance = wallet?.p2pBalanceUsd || 0;
  const p2pLocked = wallet?.salesBalanceUsd || 0;
  const availableBalance = p2pBalance - p2pLocked;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>P2P残高</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <StatsCard
          icon={DollarSign}
          label='利用可能残高'
          value={`$${availableBalance.toFixed(2)}`}
          loading={loading}
          variant='primary'
        />

        <div className='grid grid-cols-2 gap-4'>
          <StatsCard
            icon={Wallet}
            label='P2P総残高'
            value={`$${p2pBalance.toFixed(2)}`}
            loading={loading}
            size='sm'
          />

          <StatsCard
            icon={Lock}
            label='ロック中残高'
            value={`$${p2pLocked.toFixed(2)}`}
            loading={loading}
            variant='warning'
            size='sm'
          />
        </div>

        <p className='text-xs text-muted-foreground pt-2'>
          ※ ロック中残高は進行中の取引に使用されています
        </p>
      </CardContent>
    </Card>
  );
}
