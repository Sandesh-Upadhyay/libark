/**
 * 🎯 Wallet Atoms - ウォレット関連アトミックコンポーネント
 *
 * 責任:
 * - ウォレット機能の基本的なUIコンポーネント
 * - 通貨表示、残高表示、取引アイテム等
 * - アトミックデザインに準拠した最小単位のコンポーネント
 */

// 通貨関連
export { CurrencyIcon, currencyIconVariants } from './CurrencyIcon';
export type { CurrencyIconProps, CurrencyType } from './CurrencyIcon';

// 残高表示
export { WalletBalance, walletBalanceVariants } from './WalletBalance';
export type { WalletBalanceProps } from './WalletBalance';

export { WalletMenuBalance, walletMenuBalanceVariants } from './WalletMenuBalance';
export type { WalletMenuBalanceProps } from './WalletMenuBalance';

// 取引関連
export { TransactionItem, transactionItemVariants } from './TransactionItem';
export type { TransactionItemProps } from './TransactionItem';

export { TransactionTypeIcon } from './TransactionTypeIcon';
export type { TransactionTypeIconProps, TransactionType } from './TransactionTypeIcon';

export { TransactionAmount } from './TransactionAmount';
export type { TransactionAmountProps } from './TransactionAmount';

export { TransactionStatus } from './TransactionStatus';
export type {
  TransactionStatusProps,
  TransactionStatus as TransactionStatusType,
} from './TransactionStatus';

export { TransactionDateTime } from './TransactionDateTime';
export type { TransactionDateTimeProps } from './TransactionDateTime';

export { TransactionMethod } from './TransactionMethod';
export type {
  TransactionMethodProps,
  TransactionMethod as TransactionMethodType,
} from './TransactionMethod';

// P2P関連
export { P2PStatusBadge } from './P2PStatusBadge';
export type { P2PStatusBadgeProps } from './P2PStatusBadge';

export { P2PAmountDisplay } from './P2PAmountDisplay';
export type { P2PAmountDisplayProps } from './P2PAmountDisplay';

export { P2PCountdownTimer } from './P2PCountdownTimer';
export type { P2PCountdownTimerProps } from './P2PCountdownTimer';

export { P2PPaymentMethodIcon } from './P2PPaymentMethodIcon';
export type { P2PPaymentMethodIconProps } from './P2PPaymentMethodIcon';

// ボタン
export { DepositButton } from './DepositButton';
export type { DepositButtonProps } from './DepositButton';
