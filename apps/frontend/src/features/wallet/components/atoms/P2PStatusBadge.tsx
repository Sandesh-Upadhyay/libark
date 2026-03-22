import type { P2PTradeStatus } from '@libark/graphql-client';

export interface P2PStatusBadgeProps {
  status: P2PTradeStatus;
  className?: string;
}

const statusConfig: Record<P2PTradeStatus, { label: string; color: string }> = {
  PENDING: { label: '待機中', color: 'bg-gray-100 text-gray-800' },
  MATCHED: { label: 'マッチ済み', color: 'bg-blue-100 text-blue-800' },
  PAYMENT_SENT: { label: '支払い済み', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: '確認済み', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: '完了', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'キャンセル', color: 'bg-red-100 text-red-800' },
  DISPUTED: { label: '紛争中', color: 'bg-orange-100 text-orange-800' },
};

export function P2PStatusBadge({ status, className = '' }: P2PStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
