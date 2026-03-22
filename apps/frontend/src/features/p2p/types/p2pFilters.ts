import type { P2PPaymentMethodType } from '@libark/graphql-client';

/**
 * P2Pフィルターの状態定義
 */
export type P2PFilters = {
  fiatCurrency: string;
  paymentMethod: P2PPaymentMethodType | 'all';
  amountUsd?: number; // 指定した金額を取引できるオファーを探す（指摘に基づき統一）
  sortBy: 'rate' | 'minAmount' | 'maxAmount';
  sortOrder: 'asc' | 'desc';
};

/**
 * フィルターの初期値
 */
export const DEFAULT_FILTERS: P2PFilters = {
  fiatCurrency: 'JPY',
  paymentMethod: 'all',
  amountUsd: undefined,
  sortBy: 'rate',
  sortOrder: 'asc',
};

/**
 * URLパラメータとのマッピングキー
 */
export const PARAM_KEYS = {
  fiatCurrency: 'currency',
  paymentMethod: 'payment',
  amountUsd: 'amount', // 指摘に基づき min/max ではなく amount に寄せる
  sortBy: 'sort',
  sortOrder: 'order',
} as const;

/**
 * 利用可能なソートフィールド
 */
export const SORT_BY_OPTIONS = ['rate', 'minAmount', 'maxAmount'] as const;
