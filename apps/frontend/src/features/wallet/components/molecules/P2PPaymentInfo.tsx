import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import type { P2PTradeInfoFragment } from '@libark/graphql-client';

import { Button } from '@/components/atoms/button';
import { toast } from '@/lib/toast';

import { P2PPaymentMethodIcon } from '../atoms/P2PPaymentMethodIcon';

export interface P2PPaymentInfoProps {
  trade: P2PTradeInfoFragment;
  className?: string;
}

interface PaymentDetails {
  bankName?: string;
  branchName?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  paypayId?: string;
  paypalEmail?: string;
  wiseEmail?: string;
  linePayId?: string;
  rakutenPayId?: string;
  instructions?: string;
}

/**
 * コピー可能なフィールドコンポーネント
 */
function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label}をコピーしました`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  }, [value, label]);

  return (
    <div className='flex items-center justify-between py-2'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <div className='flex items-center gap-2'>
        <span className='font-medium'>{value}</span>
        <Button variant='ghost' size='sm' onClick={handleCopy} className='h-7 w-7 p-0'>
          {copied ? (
            <Check className='h-4 w-4 text-green-500' />
          ) : (
            <Copy className='h-4 w-4 text-muted-foreground' />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * 支払い方法ラベルを取得
 */
function _getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return '銀行振込';

  const labels: Record<string, string> = {
    BANK_TRANSFER: '銀行振込',
    PAYPAY: 'PayPay',
    PAYPAL: 'PayPal',
    WISE: 'Wise',
    LINE_PAY: 'LINE Pay',
    RAKUTEN_PAY: '楽天ペイ',
  };
  return labels[method] || method;
}

/**
 * paymentDetailsをパースする
 */
function parsePaymentDetails(paymentDetailsJson: string | null | undefined): PaymentDetails | null {
  if (!paymentDetailsJson) return null;

  try {
    return JSON.parse(paymentDetailsJson);
  } catch {
    return null;
  }
}

export function P2PPaymentInfo({ trade, className = '' }: P2PPaymentInfoProps) {
  const paymentDetails = parsePaymentDetails(trade.paymentDetails);
  const paymentMethod = trade.paymentMethod || 'BANK_TRANSFER';

  // 支払い情報がない場合
  if (!paymentDetails) {
    return (
      <div className={`border border-border rounded-lg p-4 ${className}`}>
        <div className='flex items-center gap-2 mb-4'>
          <P2PPaymentMethodIcon method={paymentMethod} />
          <h3 className='text-lg font-semibold'>💳 支払い先情報</h3>
        </div>
        <p className='text-muted-foreground text-sm'>
          売り手が取引を承認すると支払い情報が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-lg p-4 ${className}`}>
      <div className='flex items-center gap-2 mb-4'>
        <P2PPaymentMethodIcon method={paymentMethod} />
        <h3 className='text-lg font-semibold'>💳 支払い先情報</h3>
      </div>

      <div className='divide-y divide-border'>
        {/* 銀行振込の場合 */}
        {paymentMethod === 'BANK_TRANSFER' && (
          <>
            {paymentDetails.bankName && (
              <CopyableField label='銀行名' value={paymentDetails.bankName} />
            )}
            {paymentDetails.branchName && (
              <CopyableField label='支店名' value={paymentDetails.branchName} />
            )}
            {paymentDetails.accountType && (
              <div className='flex items-center justify-between py-2'>
                <span className='text-sm text-muted-foreground'>口座種別</span>
                <span className='font-medium'>{paymentDetails.accountType}</span>
              </div>
            )}
            {paymentDetails.accountNumber && (
              <CopyableField label='口座番号' value={paymentDetails.accountNumber} />
            )}
            {paymentDetails.accountHolder && (
              <CopyableField label='口座名義' value={paymentDetails.accountHolder} />
            )}
          </>
        )}

        {/* PayPayの場合 */}
        {paymentMethod === 'PAYPAY' && paymentDetails.paypayId && (
          <CopyableField label='PayPay ID' value={paymentDetails.paypayId} />
        )}

        {/* PayPalの場合 */}
        {paymentMethod === 'PAYPAL' && paymentDetails.paypalEmail && (
          <CopyableField label='PayPal メール' value={paymentDetails.paypalEmail} />
        )}

        {/* Wiseの場合 */}
        {paymentMethod === 'WISE' && paymentDetails.wiseEmail && (
          <CopyableField label='Wise メール' value={paymentDetails.wiseEmail} />
        )}

        {/* LINE Payの場合 */}
        {paymentMethod === 'LINE_PAY' && paymentDetails.linePayId && (
          <CopyableField label='LINE Pay ID' value={paymentDetails.linePayId} />
        )}

        {/* 楽天ペイの場合 */}
        {paymentMethod === 'RAKUTEN_PAY' && paymentDetails.rakutenPayId && (
          <CopyableField label='楽天ペイ ID' value={paymentDetails.rakutenPayId} />
        )}
      </div>

      {/* 追加の指示 */}
      {paymentDetails.instructions && (
        <div className='mt-4 p-3 bg-muted rounded-md'>
          <p className='text-sm font-medium mb-1'>売り手からの指示:</p>
          <p className='text-sm text-muted-foreground'>{paymentDetails.instructions}</p>
        </div>
      )}

      {/* 取引IDを含める注意 */}
      <div className='mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md'>
        <p className='text-sm text-amber-700 dark:text-amber-400'>
          ⚠️ 振込人名義に取引ID（
          <code className='font-mono text-xs bg-amber-500/10 px-1 rounded'>
            {trade.id.slice(0, 8)}
          </code>
          ）を含めてください
        </p>
      </div>
    </div>
  );
}
