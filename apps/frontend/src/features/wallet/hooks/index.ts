/**
 * ウォレット機能フック集約エクスポート
 *
 * ウォレット機能で使用されるカスタムフックを統一管理
 */

// ウォレット基本機能
export {
  useWallet,
  useWalletTransactions,
  useUserWallets,
  useDepositRequests,
  useWithdrawalRequests,
  useExchangeRate,
  useSupportedCurrencies,
  useCreateDepositRequest,
  useCreateWithdrawalRequest,
  useGrantPermission,
  useTransferBalance,
  type WalletData,
  type WalletTransaction,
  type UserWallet,
  type DepositRequest,
  type WithdrawalRequest,
  type Permission,
  type UserPermission,
} from './useWallet';

// 暗号通貨入金フロー
export {
  useCryptoDepositFlow,
  type DepositStep,
  type PaymentData,
  type AmountLimits,
  type UseCryptoDepositFlowResult,
} from './useCryptoDepositFlow';

// 取引データ変換
export { useTransactionConverter, logTransactionConversion } from './useTransactionConverter';

// P2P取引機能
export { useP2PTrades } from './useP2PTrades';

export { useP2PSellerOffer } from './useP2PSellerOffer';

export { useP2PSubscription } from './useP2PSubscription';
