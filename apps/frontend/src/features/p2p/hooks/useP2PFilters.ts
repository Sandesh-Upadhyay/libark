import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { P2PPaymentMethodType } from '@libark/graphql-client';

import { DEFAULT_FILTERS, PARAM_KEYS, SORT_BY_OPTIONS } from '@/features/p2p/types';
import type { P2PFilters } from '@/features/p2p/types';

import { PAYMENT_METHOD_LABELS } from '../constants/p2pConstants';

/**
 * P2PフィルターとURLパラメータを同期するフック
 */
export function useP2PFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URLパラメータからフィルター状態を復元（サニタイズ含む）
  const filters = useMemo((): P2PFilters => {
    const currency = searchParams.get(PARAM_KEYS.fiatCurrency) || DEFAULT_FILTERS.fiatCurrency;
    const payment = searchParams.get(PARAM_KEYS.paymentMethod) as P2PPaymentMethodType | 'all';
    const amount = searchParams.get(PARAM_KEYS.amountUsd);
    const sort = searchParams.get(PARAM_KEYS.sortBy) as P2PFilters['sortBy'];
    const order = searchParams.get(PARAM_KEYS.sortOrder) as P2PFilters['sortOrder'];

    return {
      fiatCurrency: currency,
      paymentMethod:
        Object.keys(PAYMENT_METHOD_LABELS).includes(payment) || payment === 'all'
          ? payment
          : DEFAULT_FILTERS.paymentMethod,
      amountUsd: amount ? Number(amount) : undefined,
      sortBy: SORT_BY_OPTIONS.includes(sort) ? sort : DEFAULT_FILTERS.sortBy,
      sortOrder: order === 'asc' || order === 'desc' ? order : DEFAULT_FILTERS.sortOrder,
    };
  }, [searchParams]);

  // フィルター更新関数（即時反映用）
  const updateFilters = useCallback(
    (newFilters: Partial<P2PFilters>) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          const merged = { ...filters, ...newFilters };

          Object.entries(PARAM_KEYS).forEach(([key, paramName]) => {
            const value = merged[key as keyof P2PFilters];
            // デフォルト値または 'all' の場合はパラメータを削除してURLをスリムに保つ
            if (
              value === undefined ||
              value === 'all' ||
              value === DEFAULT_FILTERS[key as keyof P2PFilters]
            ) {
              next.delete(paramName);
            } else {
              next.set(paramName, String(value));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [filters, setSearchParams]
  );

  // デバウンス用の一時状態（金額入力など）
  const [draftAmount, setDraftAmount] = useState<string>(filters.amountUsd?.toString() || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // URLが変わったらドラフトを同期
  useEffect(() => {
    setDraftAmount(filters.amountUsd?.toString() || '');
  }, [filters.amountUsd]);

  // 金額のデバウンス更新
  const updateAmountDebounced = useCallback(
    (value: string) => {
      setDraftAmount(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const numValue = value === '' ? undefined : Number(value);
        if (numValue !== filters.amountUsd) {
          updateFilters({ amountUsd: numValue });
        }
      }, 300);
    },
    [filters.amountUsd, updateFilters]
  );

  // すべてクリア
  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    filters,
    setFilters: updateFilters, // 名前をより意図の明確なものに変更
    draftAmount,
    updateAmountDebounced,
    clearFilters,
  };
}
