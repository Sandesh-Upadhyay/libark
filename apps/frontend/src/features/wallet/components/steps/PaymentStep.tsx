import type { P2PTradeInfoFragment } from '@libark/graphql-client';

import { Button } from '@/components/atoms/button';

import { P2PCountdownTimer } from '../atoms/P2PCountdownTimer';
import { P2PAmountDisplay } from '../atoms/P2PAmountDisplay';
import { P2PPaymentInfo } from '../molecules/P2PPaymentInfo';

export interface PaymentStepProps {
  trade: P2PTradeInfoFragment;
  onPaymentComplete: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PaymentStep({
  trade,
  onPaymentComplete,
  onCancel,
  isLoading = false,
}: PaymentStepProps) {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold mb-2'>支払いを行ってください</h2>
        <P2PCountdownTimer expiresAt={trade.expiresAt} onComplete={() => onCancel()} />
      </div>

      <div>
        <h3 className='text-lg font-medium mb-3'>取引情報</h3>
        <div className='border rounded-lg p-4'>
          <div className='text-sm text-muted-foreground mb-1'>取引ID</div>
          <div className='font-mono text-sm mb-3'>{trade.id}</div>
          <P2PAmountDisplay
            amountUsd={Number(trade.amountUsd)}
            fiatAmount={Number(trade.fiatAmount)}
            fiatCurrency={trade.fiatCurrency}
            exchangeRate={Number(trade.exchangeRate)}
          />
        </div>
      </div>

      <P2PPaymentInfo trade={trade} />

      <div className='p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md'>
        <h4 className='font-medium text-yellow-700 mb-2'>📌 重要な注意事項</h4>
        <ul className='list-disc list-inside text-sm text-yellow-700 space-y-1'>
          <li>金額は正確に入力してください</li>
          <li>支払い後、必ず「支払い完了」を押してください</li>
          <li>30分以内に支払いが確認されない場合、取引はキャンセルされます</li>
        </ul>
      </div>

      <div className='flex justify-between'>
        <Button
          onClick={onCancel}
          variant='outline'
          size='lg'
          className='border-destructive text-destructive hover:bg-destructive/10'
        >
          取引をキャンセル
        </Button>
        <Button
          onClick={onPaymentComplete}
          disabled={isLoading}
          loading={isLoading}
          size='lg'
          className='bg-success text-success-foreground hover:bg-success/90'
        >
          ✅ 支払いを完了しました
        </Button>
      </div>
    </div>
  );
}
