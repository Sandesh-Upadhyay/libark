import { useP2PTradeRequestQuery, type P2PTradeInfoFragment } from '@libark/graphql-client';

export interface UseP2PTradeDetailResult {
  trade: P2PTradeInfoFragment | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useP2PTradeDetail(tradeId?: string): UseP2PTradeDetailResult {
  const { data, loading, error, refetch } = useP2PTradeRequestQuery({
    skip: !tradeId,
    variables: {
      tradeId: tradeId || '',
    },
  });

  return {
    trade: data?.p2pTradeRequest || null,
    loading,
    error,
    refetch,
  };
}
