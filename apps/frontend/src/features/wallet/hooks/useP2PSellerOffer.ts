import { useState, useCallback } from 'react';
import {
  useMyP2POffersQuery,
  useCreateP2POfferMutation,
  useUpdateP2POfferMutation,
} from '@libark/graphql-client';
import type {
  P2POfferInfoFragment,
  CreateP2POfferInput,
  UpdateP2POfferInput,
} from '@libark/graphql-client';

interface UseP2PSellerOfferOptions {
  enabled?: boolean;
  onCreateComplete?: (offer: P2POfferInfoFragment) => void;
  onUpdateComplete?: (offer: P2POfferInfoFragment) => void;
  onError?: (error: Error) => void;
}

export function useP2PSellerOffer(options: UseP2PSellerOfferOptions = {}) {
  const { enabled = true, onCreateComplete, onUpdateComplete, onError } = options;

  // ローディング状態
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // エラー状態
  const [error, setError] = useState<Error | null>(null);

  // クエリ
  const { data, loading, refetch } = useMyP2POffersQuery({
    skip: !enabled,
  });

  // ミューテーション
  const [createOfferMutation] = useCreateP2POfferMutation();
  const [updateOfferMutation] = useUpdateP2POfferMutation();

  // オファー作成
  const createOffer = useCallback(
    async (input: CreateP2POfferInput) => {
      setIsCreating(true);
      setError(null);

      try {
        const result = await createOfferMutation({
          variables: { input },
        });

        if (result.data?.createP2POffer) {
          onCreateComplete?.(result.data.createP2POffer);
          return result.data.createP2POffer;
        }

        throw new Error('オファーの作成に失敗しました');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('不明なエラーが発生しました');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createOfferMutation, onCreateComplete, onError]
  );

  // オファー更新
  const updateOffer = useCallback(
    async (input: UpdateP2POfferInput) => {
      setIsUpdating(true);
      setError(null);

      try {
        const result = await updateOfferMutation({
          variables: { input },
        });

        if (result.data?.updateP2POffer) {
          onUpdateComplete?.(result.data.updateP2POffer);
          return result.data.updateP2POffer;
        }

        throw new Error('オファーの更新に失敗しました');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('不明なエラーが発生しました');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [updateOfferMutation, onUpdateComplete, onError]
  );

  return {
    offer: data?.myP2POffers?.[0] || null,
    loading,
    error,
    refetch,
    isCreating,
    isUpdating,
    createOffer,
    updateOffer,
  };
}
