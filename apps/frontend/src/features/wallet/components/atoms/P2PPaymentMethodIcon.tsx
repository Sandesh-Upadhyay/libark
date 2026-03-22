export interface P2PPaymentMethodIconProps {
  method: string;
  className?: string;
}

const methodConfig: Record<string, { label: string; icon: string }> = {
  bank_transfer: { label: '銀行振込', icon: '🏦' },
  paypay: { label: 'PayPay', icon: '💳' },
  line_pay: { label: 'LINE Pay', icon: '💚' },
  merpay: { label: 'メルペイ', icon: '📱' },
  rakuten_pay: { label: '楽天ペイ', icon: '🛒' },
  au_pay: { label: 'au PAY', icon: '📲' },
  d_pay: { label: 'd払い', icon: '💰' },
};

export function P2PPaymentMethodIcon({ method, className = '' }: P2PPaymentMethodIconProps) {
  const config = methodConfig[method] || { label: method, icon: '💳' };

  return (
    <div className={`flex items-center space-x-2 ${className}`} title={config.label}>
      <span className='text-2xl'>{config.icon}</span>
      <span className='text-sm'>{config.label}</span>
    </div>
  );
}
