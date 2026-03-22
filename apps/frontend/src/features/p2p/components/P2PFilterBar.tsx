import { useState } from 'react';
import { X, Search, SlidersHorizontal } from 'lucide-react';


import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Badge } from '@/components/atoms/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { formatCurrency } from '@/lib/utils/currencyUtils';

import { PAYMENT_METHOD_OPTIONS, CURRENCY_OPTIONS, SORT_OPTIONS } from '../constants/p2pConstants';
import { useP2PFilters } from '../hooks/useP2PFilters';


export function P2PFilterBar() {
  const { filters, setFilters, draftAmount, updateAmountDebounced, clearFilters } = useP2PFilters();
  const [isExpanded, setIsExpanded] = useState(false);

  // アクティブなフィルターのカウント（通貨とソートは除外）
  const activeCount = [
    filters.paymentMethod !== 'all',
    filters.amountUsd !== undefined,
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0;

  return (
    <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6'>
      <div className='container py-4'>
        {/* メイン行: 簡易検索 + 拡張ボタン */}
        <div className='flex flex-col sm:flex-row items-center gap-4'>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='number'
              placeholder='購入希望金額 (USD)...'
              className='pl-9'
              value={draftAmount}
              onChange={(e) => updateAmountDebounced(e.target.value)}
            />
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <Select
              value={filters.fiatCurrency}
              onValueChange={(val) => setFilters({ fiatCurrency: val })}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='通貨' />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              className='relative'
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className='mr-2 h-4 w-4' />
              フィルター
              {activeCount > 0 && (
                <Badge variant='secondary' className='ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground'>
                  {activeCount}
                </Badge>
              )}
            </Button>

            {hasFilters && (
              <Button variant='ghost' size='sm' onClick={clearFilters} className='hidden md:flex'>
                リセット
              </Button>
            )}
          </div>

          <div className='hidden lg:flex items-center gap-2 ml-auto'>
            <span className='text-sm text-muted-foreground'>ソート:</span>
            <Select
              value={filters.sortBy}
              onValueChange={(val: any) => setFilters({ sortBy: val })}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 拡張フィルター領域 */}
        {isExpanded && (
          <div className='mt-4 pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>支払い方法</label>
                <Select
                  value={filters.paymentMethod}
                  onValueChange={(val: any) => setFilters({ paymentMethod: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 必要に応じて追加のフィルター（国、評価など）を将来的に追加可能 */}
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' size='sm' onClick={() => setIsExpanded(false)}>
                閉じる
              </Button>
              {hasFilters && (
                <Button variant='ghost' size='sm' onClick={clearFilters}>
                  フィルターをクリア
                </Button>
              )}
            </div>
          </div>
        )}

        {/* アクティブなフィルター表示（モバイル/デスクトップ共通） */}
        {hasFilters && (
          <div className='flex flex-wrap gap-2 mt-4'>
            {filters.paymentMethod !== 'all' && (
              <Badge variant='outline' className='pl-2 flex items-center gap-1'>
                支払い方法: {PAYMENT_METHOD_OPTIONS.find(o => o.value === filters.paymentMethod)?.label}
                <X className='h-3 w-3 cursor-pointer hover:text-primary' onClick={() => setFilters({ paymentMethod: 'all' })} />
              </Badge>
            )}
            {filters.amountUsd !== undefined && (
              <Badge variant='outline' className='pl-2 flex items-center gap-1'>
                金額: {formatCurrency(filters.amountUsd, { currency: 'USD' })}
                <X className='h-3 w-3 cursor-pointer hover:text-primary' onClick={() => setFilters({ amountUsd: undefined })} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
