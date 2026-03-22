import type { P2PTradeInfoFragment } from '@libark/graphql-client';

export interface P2PTradeTimelineProps {
  trade: P2PTradeInfoFragment;
  className?: string;
}

interface TimelineEvent {
  status: string;
  label: string;
  timestamp: Date;
  completed: boolean;
  current: boolean;
}

export function P2PTradeTimeline({ trade, className = '' }: P2PTradeTimelineProps) {
  const events: TimelineEvent[] = [
    {
      status: 'PENDING',
      label: '取引作成',
      timestamp: new Date(trade.createdAt),
      completed: true,
      current: trade.status === 'PENDING',
    },
    {
      status: 'MATCHED',
      label: 'オファー承認',
      timestamp: trade.updatedAt ? new Date(trade.updatedAt) : new Date(trade.createdAt),
      completed: ['MATCHED', 'PAYMENT_SENT', 'CONFIRMED', 'COMPLETED'].includes(trade.status),
      current: trade.status === 'MATCHED',
    },
    {
      status: 'PAYMENT_SENT',
      label: '支払い確認待ち',
      timestamp: new Date(trade.createdAt),
      completed: ['CONFIRMED', 'COMPLETED'].includes(trade.status),
      current: trade.status === 'PAYMENT_SENT',
    },
    {
      status: 'CONFIRMED',
      label: '入金完了',
      timestamp: trade.completedAt ? new Date(trade.completedAt) : new Date(trade.createdAt),
      completed: trade.status === 'COMPLETED',
      current: trade.status === 'CONFIRMED',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {events.map((event, index) => (
        <div key={index} className='flex items-start space-x-4'>
          <div className='flex flex-col items-center'>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                event.completed
                  ? 'bg-green-500 border-green-500'
                  : event.current
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-gray-200 border-gray-300'
              }`}
            />
            {index < events.length - 1 && (
              <div className={`w-0.5 h-16 ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
          <div className='flex-1 pb-4'>
            <div className='font-medium'>{event.label}</div>
            <div className='text-sm text-gray-600'>{event.timestamp.toLocaleString('ja-JP')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
