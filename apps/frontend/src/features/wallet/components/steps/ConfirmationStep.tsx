import type { P2PTradeInfoFragment } from '@libark/graphql-client';

import { Button } from '@/components/atoms/button';

import { P2PAmountDisplay } from '../atoms/P2PAmountDisplay';


export interface ConfirmationStepProps {
  trade: P2PTradeInfoFragment;
  onNewDeposit: () => void;
  onViewHistory: () => void;
  onGoToWallet: () => void;
}

export function ConfirmationStep({
  trade,
  onNewDeposit,
  onViewHistory,
  onGoToWallet,
}: ConfirmationStepProps) {
  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='text-6xl mb-4'>✅</div>
        <h2 className='text-2xl font-semibold mb-2'>🎉 入金が完了しました！</h2>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-3'>取引詳細</h3>
        <div className='border rounded-lg p-4 space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>取引ID</span>
            <span className='font-mono'>{trade.id.slice(0, 8)}...</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>ステータス</span>
            <span className='text-success font-medium'>✅ 完了</span>
          </div>
          <P2PAmountDisplay
            amountUsd={Number(trade.amountUsd)}
            fiatAmount={Number(trade.fiatAmount)}
            fiatCurrency={trade.fiatCurrency}
            exchangeRate={Number(trade.exchangeRate)}
          />
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>完了日時</span>
            <span>
              {trade.completedAt ? new Date(trade.completedAt).toLocaleString('ja-JP') : '-'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-3'>💰 P2P残高を確認</h3>
        <div className='border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>P2P残高</span>
            <span className='text-lg font-semibold'>${Number(trade.amountUsd).toFixed(2)} USD</span>
          </div>
          <Button onClick={onGoToWallet} className='mt-3 w-full'>
            ウォレット残高に移動 →
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        <Button onClick={onNewDeposit} variant='outline' size='lg'>
          新しい入金を開始
        </Button>
        <Button onClick={onViewHistory} variant='outline' size='lg'>
          取引履歴を見る
        </Button>
        <Button onClick={onGoToWallet} size='lg'>
          ウォレットへ
        </Button>
      </div>
    </div>
  );
}
