/**
 * 🎯 Transaction History Table Component (Molecule)
 *
 * Responsibilities:
 * - Displaying a feature-rich table using @tanstack/react-table
 * - Sorting, filtering, and pagination functionalities
 * - Icons and styling corresponding to transaction types
 * - Color-coding and formatting of amounts
 * - Displaying detailed information for peer-to-peer transfers, content purchases, etc.
 */
import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
  type HeaderGroup,
  type Header,
  type Cell,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Send,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms';
import { Button } from '@/components/atoms';
import { UserAvatar } from '@/components/molecules/UserAvatar';

import { CurrencyIcon } from '../atoms';

// Textコンポーネントは削除済み - 直接Tailwindクラスを使用

// 🎯 統一されたテーブルセルスタイル定義
const TABLE_CELL_STYLES = {
  // 共通コンテナ
  container: 'flex items-center justify-center transition-colors duration-200 gap-1.5 flex-col',
  // テキストスタイル - 完全統一
  primaryText: 'text-sm font-medium text-foreground',
  secondaryText: 'text-xs font-medium text-muted-foreground',
  // ヘッダー
  header: 'text-center text-xs font-medium text-muted-foreground',
  // アイコンサイズ
  iconSize: 'h-4 w-4',
} as const;

// 取引タイプ（4パターン）
export type TransactionType =
  | 'deposit' // 入金
  | 'withdrawal' // 出金
  | 'payment' // 支払い
  | 'receive'; // 受け取り

// サポートされる暗号通貨
export type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'XMR';

// P2P取引でサポートされる通貨
export type P2PCurrency = 'USD' | 'JPY' | 'EUR';

// 取引手段のタイプ
export type TransactionMethod = 'crypto' | 'wallet' | 'p2p';

// 出金先アドレスの型
export interface WithdrawalAddress {
  BTC: string;
  ETH: string;
  USDT: string;
}

// 基本取引データ型（型安全）
export interface BaseTransactionItem {
  id: string;
  type: TransactionType;
  amount: number; // 常にUSD
  currency: 'USD'; // 固定
  description: string;
  timestamp: Date | string;
  status: 'completed' | 'pending' | 'failed';
  // 取引手段
  method: TransactionMethod;
  // サブスクリプション・コンテンツ関連（ウォレット残高使用時）
  relatedUser?: {
    id: string;
    username: string;
    displayName: string;
    profileImageId?: string;
  };
  // サービス・コンテンツ情報（ウォレット残高使用時）
  serviceInfo?: {
    name: string;
    url: string;
    type: 'subscription' | 'content';
  };
  // P2P取引情報
  p2pDetails?: {
    currency: P2PCurrency;
    amount: number;
    exchangeRate: number;
  };
}

// 暗号通貨入金取引
export interface CryptoDepositTransaction extends BaseTransactionItem {
  type: 'deposit';
  method: 'crypto';
  cryptoDetails: {
    amount: number;
    currency: CryptoCurrency;
  };
}

// 暗号通貨出金取引
export interface CryptoWithdrawalTransaction extends BaseTransactionItem {
  type: 'withdrawal';
  method: 'crypto';
  cryptoDetails: {
    amount: number;
    currency: CryptoCurrency;
    address: string;
  };
}

// ウォレット残高使用取引（サブスクリプション・コンテンツ購入）
export interface WalletTransaction extends BaseTransactionItem {
  type: 'payment' | 'receive'; // 支払い・受け取り
  method: 'wallet';
  relatedUser?: {
    id: string;
    username: string;
    displayName: string;
    profileImageId?: string;
  };
  serviceInfo?: {
    name: string;
    url: string;
    type: 'subscription' | 'content';
  };
}

// P2P取引
export interface P2PTransaction extends BaseTransactionItem {
  type: 'deposit' | 'withdrawal' | 'payment' | 'receive'; // 全4パターン対応
  method: 'p2p';
  p2pDetails: {
    currency: P2PCurrency;
    amount: number;
    exchangeRate: number;
  };
}

// 統合取引型
export type TransactionItem =
  | CryptoDepositTransaction
  | CryptoWithdrawalTransaction
  | WalletTransaction
  | P2PTransaction;

export interface TransactionTableProps {
  transactions: TransactionItem[];
  onTransactionClick?: (transaction: TransactionItem) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  initialPageSize?: number;
}

// テーブルカラム定義を作成する関数
const createColumns = (): ColumnDef<TransactionItem>[] => [
  {
    accessorKey: 'type',
    header: () => <div className={TABLE_CELL_STYLES.header}>取引種別</div>,
    cell: ({ row }: { row: Row<TransactionItem> }) => {
      const type = row.original.type;
      const typeInfo = {
        deposit: {
          icon: ArrowDown,
          label: '入金',
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/20',
        },
        withdrawal: {
          icon: ArrowUp,
          label: '出金',
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/20',
        },
        payment: {
          icon: Send,
          label: '支払い',
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-100 dark:bg-orange-900/20',
        },
        receive: {
          icon: Download,
          label: '受け取り',
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900/20',
        },
      }[type] || {
        icon: ArrowDown,
        label: '取引',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-900/20',
      };

      const IconComponent = typeInfo.icon;

      return (
        <div className={TABLE_CELL_STYLES.container}>
          <div
            className={`flex items-center justify-center rounded-full transition-colors duration-200 h-4 w-4 ${typeInfo.bg}`}
          >
            <IconComponent className={`h-3 w-3 ${typeInfo.color}`} />
          </div>
          <span className={TABLE_CELL_STYLES.secondaryText}>{typeInfo.label}</span>
        </div>
      );
    },
    size: 80,
  },
  {
    accessorKey: 'details',
    header: () => <div className={TABLE_CELL_STYLES.header}>詳細</div>,
    cell: ({ row }: { row: Row<TransactionItem> }) => {
      const transaction = row.original;
      const { method, relatedUser } = transaction;

      return (
        <div className={TABLE_CELL_STYLES.container}>
          {/* 暗号通貨の場合 */}
          {method === 'crypto' &&
            transaction.cryptoDetails &&
            transaction.type === 'withdrawal' && (
              <>
                <div className={TABLE_CELL_STYLES.primaryText}>暗号通貨</div>
                <Link
                  to={`/wallet/withdraw/crypto/history/${transaction.id}`}
                  className='text-primary hover:text-primary/80 underline text-xs'
                  onClick={e => e.stopPropagation()}
                >
                  #{transaction.id.slice(-8)}
                </Link>
              </>
            )}
          {method === 'crypto' && transaction.cryptoDetails && transaction.type === 'deposit' && (
            <>
              <div className={TABLE_CELL_STYLES.primaryText}>暗号通貨</div>
              <Link
                to={`/wallet/deposit/crypto/history/${transaction.id}`}
                className='text-primary hover:text-primary/80 underline text-xs'
                onClick={e => e.stopPropagation()}
              >
                #{transaction.id.slice(-8)}
              </Link>
            </>
          )}

          {/* ウォレット残高の場合（サブスクリプション・コンテンツ購入） */}
          {method === 'wallet' && (
            <>
              {/* サービス情報がある場合は表示 */}
              {transaction.serviceInfo && (
                <div className={TABLE_CELL_STYLES.primaryText}>
                  <a
                    href={transaction.serviceInfo.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 underline flex items-center justify-center gap-1'
                    onClick={e => e.stopPropagation()}
                  >
                    {transaction.serviceInfo.name}
                    <ExternalLink className='h-3 w-3' />
                  </a>
                </div>
              )}

              {/* ユーザー情報は必ず表示（支払い・受け取りの場合） */}
              {transaction.relatedUser ? (
                <div className='flex items-center justify-center gap-1.5'>
                  <UserAvatar
                    username={transaction.relatedUser.username}
                    displayName={transaction.relatedUser.displayName}
                    profileImageId={transaction.relatedUser.profileImageId}
                    size='xs'
                  />
                  <span className='text-xs text-muted-foreground'>
                    @{transaction.relatedUser.username}
                  </span>
                </div>
              ) : (
                <div className='flex items-center justify-center gap-1.5'>
                  <UserAvatar
                    username='unknown'
                    displayName='Unknown User'
                    profileImageId={undefined}
                    size='xs'
                  />
                  <span className='text-xs text-muted-foreground'>@unknown</span>
                </div>
              )}
            </>
          )}

          {/* P2P取引の場合 */}
          {method === 'p2p' && transaction.p2pDetails && (
            <>
              <div className={TABLE_CELL_STYLES.primaryText}>交換レート</div>
              <div className={TABLE_CELL_STYLES.secondaryText}>
                1 USD = {transaction.p2pDetails.exchangeRate.toFixed(2)}{' '}
                {transaction.p2pDetails.currency}
              </div>
            </>
          )}

          {/* その他の場合 */}
          {!(
            (method === 'crypto' && transaction.cryptoDetails) ||
            (method === 'wallet' && relatedUser) ||
            (method === 'p2p' && transaction.p2pDetails)
          ) && <div className={TABLE_CELL_STYLES.secondaryText}>-</div>}
        </div>
      );
    },
    minSize: 180,
  },
  {
    accessorKey: 'amount',
    header: () => <div className={TABLE_CELL_STYLES.header}>金額(USD)</div>,
    cell: ({ row }: { row: Row<TransactionItem> }) => {
      const amount = row.original.amount;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(Math.abs(amount));
      const sign = amount >= 0 ? '+' : '-';
      const colorClass =
        amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

      return (
        <div className={TABLE_CELL_STYLES.container}>
          <div className={`font-mono tabular-nums text-base font-medium ${colorClass}`}>
            {sign}
            {formattedAmount}
          </div>
          <div className='flex items-center justify-center'>
            <CurrencyIcon currency='USD' size='sm' variant='currency' iconOnly={false} />
          </div>
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'timestamp',
    header: () => <div className={TABLE_CELL_STYLES.header}>取引日時</div>,
    cell: ({ row }: { row: Row<TransactionItem> }) => {
      const date = new Date(row.original.timestamp);
      const formattedDate = date
        .toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .replace(/\//g, '/');
      const formattedTime = date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return (
        <div className={TABLE_CELL_STYLES.container}>
          <div className={TABLE_CELL_STYLES.primaryText}>{formattedDate}</div>
          <div className={TABLE_CELL_STYLES.secondaryText}>{formattedTime}</div>
        </div>
      );
    },
    size: 90,
  },
];

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onTransactionClick,
  isLoading = false,
  error = null,
  emptyMessage = 'ウォレット取引履歴がありません',
  initialPageSize: _initialPageSize = 10,
}) => {
  const { t } = useTranslation('translation');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo(() => createColumns(), []);

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10, // パフォーマンス最適化のため初期ページサイズを制限
      },
    },
    defaultColumn: {
      minSize: 50,
      size: 150,
      maxSize: 500,
    },
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-destructive'>
        <AlertCircle className='h-8 w-8 mb-2' />
        <div className='text-sm font-medium'>{t('errors.generic')}</div>
        <div className='text-xs'>{error}</div>
      </div>
    );
  }

  return (
    <div className='w-full space-y-4'>
      {/* TODO: Implement filtering UI if needed */}
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TransactionItem>) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<TransactionItem, unknown>) => (
                  <TableHead
                    key={header.id}
                    className='bg-muted/50 px-2 py-2 text-xs font-semibold text-foreground text-center'
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </tr>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<TransactionItem>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onTransactionClick?.(row.original)}
                  className='cursor-pointer transition-colors hover:bg-muted/50 h-12'
                >
                  {row.getVisibleCells().map((cell: Cell<TransactionItem, unknown>) => (
                    <TableCell
                      key={cell.id}
                      className='p-2 align-middle text-center'
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredRowModel().rows.length}件中{' '}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}
          件を表示
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className='h-4 w-4' />
            <span>前へ</span>
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span>次へ</span>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};
