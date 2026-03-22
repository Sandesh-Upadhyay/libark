/**
 * ウォレット関連の型定義
 */

export interface WalletBalance {
  currency: string;
  amount: string;
  loading?: boolean;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface CurrenciesResponse {
  currencies: Currency[];
}

export interface DepositAddress {
  address: string;
  currency: string;
  network?: string;
}

export interface WithdrawalRequest {
  currency: string;
  amount: string;
  address: string;
  network?: string;
}

export interface TransactionHistory {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  currency: string;
  amount: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  txHash?: string;
}
