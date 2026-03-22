import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { DEFAULT_FILTERS, PARAM_KEYS } from '@/features/p2p/types';

import { useP2PFilters } from '../useP2PFilters';


// Wrapper component to provide routing context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useP2PFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('初期状態は DEFAULT_FILTERS と一致すること', () => {
    const { result } = renderHook(() => useP2PFilters(), { wrapper });

    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    expect(result.current.draftAmount).toBe('');
  });

  it('URLパラメータから初期値を復元できること', () => {
    const initialEntries = [`/p2p?${PARAM_KEYS.fiatCurrency}=USD&${PARAM_KEYS.paymentMethod}=BANK_TRANSFER&${PARAM_KEYS.amountUsd}=100&${PARAM_KEYS.sortBy}=minAmount&${PARAM_KEYS.sortOrder}=desc`];

    const { result } = renderHook(() => useP2PFilters(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      )
    });

    expect(result.current.filters).toEqual({
      fiatCurrency: 'USD',
      paymentMethod: 'BANK_TRANSFER',
      amountUsd: 100,
      sortBy: 'minAmount',
      sortOrder: 'desc',
    });
    expect(result.current.draftAmount).toBe('100');
  });

  it('setFilters でフィルターを更新し、URLが反映されること', () => {
    const { result } = renderHook(() => useP2PFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ fiatCurrency: 'EUR', paymentMethod: 'PAYPAL' });
    });

    expect(result.current.filters.fiatCurrency).toBe('EUR');
    expect(result.current.filters.paymentMethod).toBe('PAYPAL');
    // URLの検証は MemoryRouter 内の searchParams が変わっていることで間接的に filters が変わることで確認
  });

  it('updateAmountDebounced でデバウンス処理が行われること', () => {
    const { result } = renderHook(() => useP2PFilters(), { wrapper });

    act(() => {
      result.current.updateAmountDebounced('500');
    });

    // ドラフトは即座に更新される
    expect(result.current.draftAmount).toBe('500');
    // 実体はまだ更新されない
    expect(result.current.filters.amountUsd).toBeUndefined();

    // 200ms 経過（300ms未満）
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.filters.amountUsd).toBeUndefined();

    // さらに 150ms 経過（合計350ms）
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.filters.amountUsd).toBe(500);
  });

  it('連続して呼び出された場合、前のタイマーがクリアされること', () => {
    const { result } = renderHook(() => useP2PFilters(), { wrapper });

    act(() => {
      result.current.updateAmountDebounced('100');
    });

    // 100ms後に別の値を入力
    act(() => {
      vi.advanceTimersByTime(100);
      result.current.updateAmountDebounced('200');
    });

    // 最初から300ms経過（2回目の入力から200ms） -> まだ反映されないはず
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.filters.amountUsd).toBeUndefined();

    // 2回目の入力から300ms経過 -> 反映される（値は200）
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.filters.amountUsd).toBe(200);
  });

  it('clearFilters でフィルターが初期化されること', () => {
    const initialEntries = [`/p2p?${PARAM_KEYS.fiatCurrency}=USD&${PARAM_KEYS.amountUsd}=100`];
    const { result } = renderHook(() => useP2PFilters(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      )
    });

    expect(result.current.filters.fiatCurrency).toBe('USD');

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  it('不正なパラメータ値は DEFAULT_FILTERS の値にフォールバックすること', () => {
    const initialEntries = [`/p2p?${PARAM_KEYS.sortBy}=invalid_sort&${PARAM_KEYS.sortOrder}=invalid_order`];
    const { result } = renderHook(() => useP2PFilters(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      )
    });

    expect(result.current.filters.sortBy).toBe(DEFAULT_FILTERS.sortBy);
    expect(result.current.filters.sortOrder).toBe(DEFAULT_FILTERS.sortOrder);
  });
});
