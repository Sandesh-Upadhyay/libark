import { useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { P2POfferInfoFragment, P2PPaymentMethodType } from '@libark/graphql-client';
import { useAvailableP2POffersQuery, P2POfferSortField, SortOrder } from '@libark/graphql-client'; // Added missing imports for GraphQL query and enums

import { UserAvatar } from '@/components/molecules/UserAvatar';
import { Button } from '@/components/atoms/button';
import { formatCurrency } from '@/lib/utils/currencyUtils';

import { P2POfferCard } from '../molecules/P2POfferCard';
import { useP2PFilters } from '../../../p2p/hooks/useP2PFilters';
import { P2PFilterBar } from '../../../p2p/components/P2PFilterBar';
import {
  PAYMENT_METHOD_LABELS,
  FALLBACK_EXCHANGE_RATES, // Added
} from '../../../p2p/constants/p2pConstants';




export interface P2POfferTableProps {
  onBuyClick?: (offer: P2POfferInfoFragment) => void;
  className?: string;
}

export function P2POfferTable({ onBuyClick, className = '' }: P2POfferTableProps) {
  // P2Pフィルターフック（URL同期）
  const { filters } = useP2PFilters();

  // ページサイズ
  const pageSize = 10;

  // オファー取得
  const { data, loading, error, fetchMore } = useAvailableP2POffersQuery({
    variables: {
      fiatCurrency: filters.fiatCurrency,
      paymentMethod:
        filters.paymentMethod === 'all' ? undefined : (filters.paymentMethod as P2PPaymentMethodType),
      amountUsd: filters.amountUsd,
      first: pageSize,
      orderBy: {
        field: filters.sortBy === 'rate' ? P2POfferSortField.Rate :
               filters.sortBy === 'minAmount' ? P2POfferSortField.MinAmount :
               P2POfferSortField.MaxAmount,
        order: filters.sortOrder === 'desc' ? SortOrder.Desc : SortOrder.Asc,
      }
    },
    notifyOnNetworkStatusChange: true,
  });

  const connection = data?.availableP2POffers;
  const offers = useMemo(() => connection?.edges.map(edge => edge.node) || [], [connection]);
  const hasNextPage = connection?.pageInfo.hasNextPage;
  const endCursor = connection?.pageInfo.endCursor;

  // もっと読む (Append logic)
  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || !endCursor) return;

    fetchMore({
      variables: {
        after: endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          availableP2POffers: {
            ...fetchMoreResult.availableP2POffers,
            edges: [
              ...prev.availableP2POffers.edges,
              ...fetchMoreResult.availableP2POffers.edges,
            ],
          },
        };
      },
    });
  }, [fetchMore, hasNextPage, endCursor]);

  // テーブルカラム定義
  const columns = useMemo(
    () => [
      {
        accessorKey: 'seller',
        header: '売り手',
        cell: ({ row }: { row: any }) => {
          const seller = row.original.seller;
          return (
            <div className='flex items-center gap-3'>
              <UserAvatar
                size="sm"
                username={seller?.username}
                displayName={seller?.displayName ?? undefined}
                profileImageId={seller?.profileImageId ?? undefined}
              />
              <div>
                <div className='font-medium'>@{seller?.username || 'unknown'}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'rate',
        header: 'レート',
        cell: ({ row }: { row: any }) => {
          const offer = row.original;
          const rate =
            (FALLBACK_EXCHANGE_RATES[offer.fiatCurrency] || 1) * (1 + Number(offer.exchangeRateMargin) / 100);

          return (
            <div className='font-medium'>
              {formatCurrency(rate, { currency: offer.fiatCurrency })} / USD
            </div>
          );
        },
      },
      {
        accessorKey: 'amountRange',
        header: '対応金額',
        cell: ({ row }: { row: any }) => {
          const offer = row.original;
          return (
            <div>
              <div className='font-medium'>
                {formatCurrency(Number(offer.minAmountUsd), { currency: offer.fiatCurrency })} 〜 {formatCurrency(Number(offer.maxAmountUsd), { currency: offer.fiatCurrency })}
              </div>
              <div className='text-xs text-muted-foreground'>
                {formatCurrency(Number(offer.minAmountUsd), { currency: 'USD' })} 〜 {formatCurrency(Number(offer.maxAmountUsd), { currency: 'USD' })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: '支払い方法',
        cell: ({ row }: { row: any }) => {
          const offer = row.original;
          return (
            <div className='flex flex-wrap gap-1'>
              <span className='px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground'>
                {PAYMENT_METHOD_LABELS[offer.paymentMethod] || offer.paymentMethod}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'action',
        header: 'アクション',
        cell: ({ row }: { row: any }) => {
          const offer = row.original;
          return (
            <Button size='sm' onClick={() => onBuyClick?.(offer)} className='w-full sm:w-auto'>
              購入する
            </Button>
          );
        },
      },
    ],
    [onBuyClick]
  );

  // テーブルインスタンス
  const table = useReactTable({
    data: offers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* フィルターバー */}
      <P2PFilterBar />

      {/* デスクトップ: テーブル形式 */}
      <div className='hidden md:block border rounded-lg overflow-hidden bg-card'>
        <table className='w-full'>
          <thead className='bg-muted/50 border-b'>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.column.id}
                    className='px-4 py-3 text-left text-sm font-medium text-muted-foreground'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className='divide-y divide-border'>
            {offers.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className='px-4 py-12 text-center text-muted-foreground'
                >
                  利用可能なオファーが見つかりませんでした
                </td>
              </tr>
            ) : (
              offers.map(offer => (
                <tr
                  key={offer.id}
                  className='hover:bg-muted/30 transition-colors cursor-pointer'
                  onClick={() => onBuyClick?.(offer)}
                >
                  {/* 各セルは columns 定義に従う */}
                  {table.getRowModel().rows.find(r => r.original.id === offer.id)?.getVisibleCells().map(cell => (
                    <td key={cell.id} className='px-4 py-4'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* モバイル: カード形式 */}
      <div className='md:hidden space-y-4'>
        {offers.length === 0 && !loading ? (
          <div className='text-center py-12 text-muted-foreground bg-card border rounded-lg'>
            利用可能なオファーが見つかりませんでした
          </div>
        ) : (
          offers.map(offer => (
            <P2POfferCard
              key={offer.id}
              offer={offer}
              requestedAmount={filters.amountUsd}
              fiatCurrency={filters.fiatCurrency}
              onSelect={onBuyClick}
              buttonText='購入する'
            />
          ))
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className='p-4 text-center text-destructive bg-destructive/10 rounded-lg border border-destructive/20'>
          データの読み込みに失敗しました。再試行してください。
        </div>
      )}

      {/* もっと見るボタン */}
      {hasNextPage && (
        <div className='flex justify-center pt-4'>
          <Button
            variant='outline'
            size='lg'
            onClick={handleLoadMore}
            loading={loading}
            className='min-w-[200px]'
          >
            オファーをもっと読み込む
          </Button>
        </div>
      )}

      {/* 読み込み中表示（初回・追加） */}
      {loading && offers.length === 0 && (
        <div className='flex justify-center py-12'>
          <div role="status" className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      )}
    </div>
  );
}
