import { useEffect } from 'react';
import { useP2PTradeUpdatedSubscription } from '@libark/graphql-client';
import type { P2PTradeInfoFragment } from '@libark/graphql-client';

interface UseP2PSubscriptionOptions {
  userId: string;
  onTradeUpdate?: (trade: P2PTradeInfoFragment) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useP2PSubscription(options: UseP2PSubscriptionOptions) {
  const { userId, onTradeUpdate, onError, enabled = true } = options;

  // サブスクリプション
  const { data, error } = useP2PTradeUpdatedSubscription({
    variables: { userId },
    skip: !enabled,
  });

  // トレード更新時のコールバック
  useEffect(() => {
    if (data?.p2pTradeUpdated) {
      onTradeUpdate?.(data.p2pTradeUpdated);
    }
  }, [data, onTradeUpdate]);

  // エラーハンドリング
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  return {
    trade: data?.p2pTradeUpdated || null,
    error,
  };
}
