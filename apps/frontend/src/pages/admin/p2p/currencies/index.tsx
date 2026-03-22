import React, { useState } from 'react';
import {
  useAdminFiatCurrenciesQuery,
  useCreateFiatCurrencyMutation,
  useUpdateFiatCurrencyMutation,
} from '@libark/graphql-client';
import { Loader2, Plus, Edit2, Check, X, Globe, Power } from 'lucide-react';

import { Header } from '@/components/molecules/Header';
import { Button } from '@/components/atoms/button';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { cn } from '@/lib/utils';

const AdminP2PCurrenciesPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminFiatCurrenciesQuery({
    fetchPolicy: 'network-only',
  });

  const [createCurrency, { loading: isCreating }] = useCreateFiatCurrencyMutation({
    onCompleted: () => {
      toast.success('通貨を追加しました');
      setIsAddModalOpen(false);
      setNewCurrency({ code: '', name: '', symbol: '' });
      refetch();
    },
    onError: err => {
      toast.error(`追加に失敗しました: ${err.message}`);
    },
  });

  const [updateCurrency, { loading: isUpdating }] = useUpdateFiatCurrencyMutation({
    onCompleted: () => {
      toast.success('更新しました');
      setEditingId(null);
      refetch();
    },
    onError: err => {
      toast.error(`更新に失敗しました: ${err.message}`);
    },
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', symbol: '' });

  const currencies = data?.fiatCurrencies || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) {
      toast.error('全ての項目を入力してください');
      return;
    }
    createCurrency({
      variables: {
        input: {
          code: newCurrency.code.toUpperCase(),
          name: newCurrency.name,
          symbol: newCurrency.symbol,
          isActive: true,
        },
      },
    });
  };

  const handleUpdate = (id: string) => {
    updateCurrency({
      variables: {
        input: {
          id,
          name: editValues.name,
          symbol: editValues.symbol,
        },
      },
    });
  };

  const toggleActive = (id: string, currentStatus: boolean) => {
    updateCurrency({
      variables: {
        input: {
          id,
          isActive: !currentStatus,
        },
      },
    });
  };

  const startEditing = (currency: any) => {
    setEditingId(currency.id);
    setEditValues({ name: currency.name, symbol: currency.symbol });
  };

  if (loading && currencies.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4'>
        <p className='text-destructive font-medium'>エラーが発生しました: {error.message}</p>
        <Button onClick={() => refetch()}>再試行</Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-background'>
      <Header
        title='法定通貨管理'
        variant='x-style'
        headingLevel='h2'
        showBorder={true}
        rightAction={
          <Button onClick={() => setIsAddModalOpen(true)} className='gap-2'>
            <Plus className='w-4 h-4' />
            通貨追加
          </Button>
        }
      />

      <div className='flex-1 overflow-auto p-6'>
        <div className='max-w-5xl mx-auto'>
          <div className='bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-muted/30 border-b border-border/40'>
                    <th className='text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      コード
                    </th>
                    <th className='text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      名称
                    </th>
                    <th className='text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      記号
                    </th>
                    <th className='text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      ステータス
                    </th>
                    <th className='text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {currencies.map(currency => (
                    <tr key={currency.id} className='hover:bg-muted/10 transition-colors group'>
                      <td className='p-4'>
                        <div className='flex items-center gap-2'>
                          <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                            <Globe className='w-4 h-4' />
                          </div>
                          <span className='font-bold text-foreground'>{currency.code}</span>
                        </div>
                      </td>
                      <td className='p-4'>
                        {editingId === currency.id ? (
                          <Input
                            value={editValues.name}
                            onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                            className='max-w-[200px]'
                          />
                        ) : (
                          <span className='text-sm text-foreground'>{currency.name}</span>
                        )}
                      </td>
                      <td className='p-4'>
                        {editingId === currency.id ? (
                          <Input
                            value={editValues.symbol}
                            onChange={e => setEditValues({ ...editValues, symbol: e.target.value })}
                            className='max-w-[100px]'
                          />
                        ) : (
                          <span className='text-sm font-mono text-foreground'>
                            {currency.symbol}
                          </span>
                        )}
                      </td>
                      <td className='p-4'>
                        <Badge
                          variant={currency.isActive ? 'success' : 'secondary'}
                          className='capitalize'
                        >
                          {currency.isActive ? '有効' : '無効'}
                        </Badge>
                      </td>
                      <td className='p-4 text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          {editingId === currency.id ? (
                            <>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10'
                                onClick={() => handleUpdate(currency.id)}
                                disabled={isUpdating}
                              >
                                <Check className='w-4 h-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                                onClick={() => setEditingId(null)}
                              >
                                <X className='w-4 h-4' />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 w-8 p-0 text-muted-foreground hover:text-primary'
                                onClick={() => startEditing(currency)}
                              >
                                <Edit2 className='w-4 h-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                className={cn(
                                  'h-8 w-8 p-0',
                                  currency.isActive
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-success hover:text-success'
                                )}
                                onClick={() => toggleActive(currency.id, currency.isActive)}
                                disabled={isUpdating}
                                title={currency.isActive ? '無効にする' : '有効にする'}
                              >
                                <Power className='w-4 h-4' />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currencies.length === 0 && (
                    <tr>
                      <td colSpan={5} className='p-8 text-center text-muted-foreground'>
                        登録されている法定通貨はありません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 追加モーダル */}
      {isAddModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <div className='bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border/40 overflow-hidden animate-in fade-in zoom-in duration-200'>
            <div className='p-6'>
              <h3 className='text-xl font-bold text-foreground mb-6'>新しい法定通貨を追加</h3>
              <form onSubmit={handleCreate} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='code'>通貨コード (3文字)</Label>
                  <Input
                    id='code'
                    placeholder='例: THB'
                    maxLength={3}
                    value={newCurrency.code}
                    onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value })}
                    className='uppercase'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='name'>通貨名</Label>
                  <Input
                    id='name'
                    placeholder='例: タイ・バーツ'
                    value={newCurrency.name}
                    onChange={e => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='symbol'>記号</Label>
                  <Input
                    id='symbol'
                    placeholder='例: ฿'
                    value={newCurrency.symbol}
                    onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  />
                </div>
                <div className='flex gap-3 mt-8'>
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1'
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button type='submit' className='flex-1' disabled={isCreating}>
                    {isCreating ? <Loader2 className='w-4 h-4 animate-spin' /> : '追加する'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminP2PCurrenciesPage;
