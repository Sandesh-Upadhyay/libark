import { useMyP2PTradeRequestsQuery } from '@libark/graphql-client';
import type { P2PTradeStatus } from '@libark/graphql-client';

interface UseP2PTradesOptions {
  status?: P2PTradeStatus;
  first?: number;
  after?: string;
  enabled?: boolean;
}

export function useP2PTrades(options: UseP2PTradesOptions = {}) {
  const { status, first = 20, after, enabled = true } = options;

  const { data, loading, error, refetch } = useMyP2PTradeRequestsQuery({
    variables: { status, first, after },
    skip: !enabled,
  });

  return {
    trades: data?.myP2PTradeRequests || [],
    loading,
    error,
    refetch,
  };
}
